const jwt = require('jsonwebtoken');
const User = require('./User');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  phone: user.phone,
  university: user.university,
  degree: user.degree,
  year: user.year,
  studentId: user.studentId,
  bio: user.bio,
  subjects: user.subjects,
  qualifications: user.qualifications,
  hourlyRate: user.hourlyRate,
  onlineSessions: user.onlineSessions,
  faceToFaceSessions: user.faceToFaceSessions,
  isVerified: user.isVerified,
  createdAt: user.createdAt,
});

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password, role });

    res.status(201).json({
      token: generateToken(user._id),
      user: publicUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      token: generateToken(user._id),
      user: publicUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(publicUser(user));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTutors = async (req, res) => {
  try {
    const tutors = await User.find({ role: 'tutor' })
      .select('name bio subjects hourlyRate isVerified avatar')
      .lean();
    res.json(tutors);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const allowed = [
      'name', 'phone', 'university', 'degree', 'year', 'studentId',
      'bio', 'subjects', 'qualifications', 'hourlyRate',
      'onlineSessions', 'faceToFaceSessions',
    ];
    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.json(publicUser(user));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
