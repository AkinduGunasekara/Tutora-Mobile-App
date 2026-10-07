const User = require('../auth/User');
const Review = require('./Review');
const CustomSessionRequest = require('./CustomSessionRequest');
const { createBookingFromRequest } = require('../tutor/tutorService');
const { attachTutorStats } = require('../../shared/tutorStats');

// @desc    Search for tutors with filters
// @route   GET /api/discovery/search
// @access  Private (student)
const searchTutors = async (req, res) => {
  try {
    const {
      subject,
      minPrice,
      maxPrice,
      minRating,
      availability,
      mode,
      searchQuery,
    } = req.query;

    // Build query
    const query = {
      role: 'tutor',
      isVerified: true, // Only show verified tutors
    };

    // Filter by subject
    if (subject) {
      query.subjects = { $regex: subject, $options: 'i' };
    }

    // Filter by search query (name or bio)
    if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { bio: { $regex: searchQuery, $options: 'i' } },
      ];
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.hourlyRate = {};
      if (minPrice) query.hourlyRate.$gte = parseFloat(minPrice);
      if (maxPrice) query.hourlyRate.$lte = parseFloat(maxPrice);
    }

    // Filter by mode (online/in-person)
    if (mode === 'online') {
      query.onlineSessions = true;
    } else if (mode === 'in-person') {
      query.faceToFaceSessions = true;
    }

    // Execute query
    const tutors = await User.find(query).select('-password');

    // Filter by rating (calculated from reviews)
    let filteredTutors = tutors;
    if (minRating) {
      const minRatingValue = parseFloat(minRating);
      const tutorIds = tutors.map((t) => t._id);
      const reviews = await Review.aggregate([
        { $match: { tutor: { $in: tutorIds } } },
        {
          $group: {
            _id: '$tutor',
            averageRating: { $avg: '$rating' },
          },
        },
      ]);

      const ratingMap = {};
      reviews.forEach((r) => {
        ratingMap[r._id.toString()] = r.averageRating;
      });

      filteredTutors = tutors.filter((tutor) => {
        const avgRating = ratingMap[tutor._id.toString()] || 0;
        return avgRating >= minRatingValue;
      });
    }

    const withStats = await attachTutorStats(filteredTutors);
    res.json({
      success: true,
      count: withStats.length,
      data: withStats,
    });
  } catch (error) {
    console.error('Search tutors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching tutors',
    });
  }
};

// @desc    Get tutor profile by ID
// @route   GET /api/discovery/tutor/:id
// @access  Private
const getTutorProfile = async (req, res) => {
  try {
    const tutor = await User.findOne({
      _id: req.params.id,
      role: 'tutor',
    }).select('-password');

    if (!tutor) {
      return res.status(404).json({
        success: false,
        message: 'Tutor not found',
      });
    }

    const [withStats] = await attachTutorStats([tutor]);
    res.json({
      success: true,
      data: withStats,
    });
  } catch (error) {
    console.error('Get tutor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching tutor profile',
    });
  }
};

// @desc    Get all subjects (for filter dropdown)
// @route   GET /api/discovery/subjects
// @access  Private
const getSubjects = async (req, res) => {
  try {
    const tutors = await User.find({ role: 'tutor', isVerified: true });
    const allSubjects = tutors.flatMap((tutor) => tutor.subjects);
    const uniqueSubjects = [...new Set(allSubjects)].sort();

    res.json({
      success: true,
      data: uniqueSubjects,
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching subjects',
    });
  }
};

// @desc    Get tutor reviews
// @route   GET /api/discovery/tutor/:id/reviews
// @access  Private
const getTutorReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ tutor: req.params.id })
      .populate('student', 'name avatar')
      .sort({ createdAt: -1 });

    // Calculate rating distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalRating = 0;

    reviews.forEach((review) => {
      distribution[review.rating]++;
      totalRating += review.rating;
    });

    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    res.json({
      success: true,
      data: {
        reviews,
        averageRating: averageRating.toFixed(1),
        totalReviews: reviews.length,
        distribution,
      },
    });
  } catch (error) {
    console.error('Get tutor reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching tutor reviews',
    });
  }
};

// @desc    Create a review for a tutor
// @route   POST /api/discovery/tutor/:id/reviews
// @access  Private
const createReview = async (req, res) => {
  try {
    const { rating, comment, tags, sessionId } = req.body;

    // Check if review already exists
    const existingReview = await Review.findOne({
      tutor: req.params.id,
      student: req.user._id,
      sessionId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this session',
      });
    }

    const review = await Review.create({
      tutor: req.params.id,
      student: req.user._id,
      sessionId,
      rating,
      comment,
      tags,
    });

    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating review',
    });
  }
};

// @desc    Create custom session request
// @route   POST /api/discovery/custom-session
// @access  Private
const createCustomSessionRequest = async (req, res) => {
  try {
    const {
      tutorId,
      subject,
      preferredDate,
      preferredTime,
      duration,
      description,
      estimatedBudget,
      academicLevel,
      learningObjective,
      preferredFormat,
    } = req.body;

    const request = await CustomSessionRequest.create({
      tutor: tutorId,
      student: req.user._id,
      subject,
      preferredDate,
      preferredTime,
      duration,
      description,
      estimatedBudget,
      academicLevel: typeof academicLevel === 'string' ? academicLevel.trim() : '',
      learningObjective: typeof learningObjective === 'string' ? learningObjective.trim() : '',
      preferredFormat: ['Online', 'In-Person'].includes(preferredFormat) ? preferredFormat : '',
    });

    res.status(201).json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error('Create custom session request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating custom session request',
    });
  }
};

// @desc    Get custom session requests for a tutor
// @route   GET /api/discovery/custom-session
// @access  Private (tutor)
const getCustomSessionRequests = async (req, res) => {
  try {
    const requests = await CustomSessionRequest.find({
      tutor: req.user._id,
    })
      .populate('student', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error('Get custom session requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching custom session requests',
    });
  }
};

// @desc    Get the logged-in student's own custom session requests
// @route   GET /api/discovery/custom-session/mine
// @access  Private (student)
const getMyCustomSessionRequests = async (req, res) => {
  try {
    const requests = await CustomSessionRequest.find({ student: req.user._id })
      .populate('tutor', 'name avatar subjects hourlyRate')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Get my custom session requests error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching your requests' });
  }
};

// @desc    Student accepts or declines an alternative time proposed by the tutor
// @route   PATCH /api/discovery/custom-session/:id/respond
// @access  Private (student)
const respondToAlternative = async (req, res) => {
  try {
    const request = await CustomSessionRequest.findOne({ _id: req.params.id, student: req.user._id });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'alternative_proposed' || !request.alternative) {
      return res.status(400).json({ success: false, message: 'There is no proposed time to respond to' });
    }

    if (req.body?.accept !== true) {
      request.status = 'cancelled';
      await request.save();
      return res.json({ success: true, data: request });
    }

    // Accepting the tutor's time turns the request into a confirmed booking
    request.preferredDate = request.alternative.sessionDate;
    request.preferredTime = request.alternative.startTime;
    const booking = await createBookingFromRequest(request);
    res.json({ success: true, data: request, bookingId: booking._id });
  } catch (error) {
    console.error('Respond to alternative error:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.status ? error.message : 'Server error while responding to the proposed time',
    });
  }
};

module.exports = {
  getMyCustomSessionRequests,
  respondToAlternative,
  searchTutors,
  getTutorProfile,
  getSubjects,
  getTutorReviews,
  createReview,
  createCustomSessionRequest,
  getCustomSessionRequests,
};
