const mongoose = require('mongoose');
const Conversation = require('./Conversation');
const User = require('../auth/User');

// ── Helper ─────────────────────────────────────────────────────────────────
const isParticipant = (conv, userId) =>
  String(conv.student._id ?? conv.student) === String(userId) ||
  String(conv.tutor._id   ?? conv.tutor)   === String(userId);

// ── CREATE / GET-OR-CREATE ──────────────────────────────────────────────────
// POST /api/chat/conversations   { tutorId }
// Student only — finds or creates a conversation with the given tutor
exports.getOrCreate = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can start conversations' });
    }
    const { tutorId } = req.body;
    if (!tutorId || !mongoose.isValidObjectId(tutorId)) {
      return res.status(400).json({ message: 'Valid tutorId is required' });
    }
    const tutor = await User.findOne({ _id: tutorId, role: 'tutor' });
    if (!tutor) return res.status(404).json({ message: 'Tutor not found' });

    let conv = await Conversation.findOne({ student: req.user.id, tutor: tutorId })
      .populate('student', 'name')
      .populate('tutor',   'name subjects hourlyRate');

    if (!conv) {
      conv = await Conversation.create({ student: req.user.id, tutor: tutorId });
      conv = await Conversation.findById(conv._id)
        .populate('student', 'name')
        .populate('tutor',   'name subjects hourlyRate');
    }

    res.status(200).json(conv);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── READ — list ────────────────────────────────────────────────────────────
// GET /api/chat/conversations
// Student → all tutors + conversation state
// Tutor   → only conversations where they appear
exports.listConversations = async (req, res) => {
  try {
    if (req.user.role === 'tutor') {
      // Tutor: return only conversations they're part of
      const convs = await Conversation.find({ tutor: req.user.id })
        .populate('student', 'name')
        .populate('tutor',   'name subjects hourlyRate')
        .sort({ lastMessageAt: -1, updatedAt: -1 });
      return res.json(convs);
    }

    // Student: return all tutors, each with existing conversation if any
    const [tutors, convs] = await Promise.all([
      User.find({ role: 'tutor' }).select('name subjects hourlyRate isVerified').lean(),
      Conversation.find({ student: req.user.id })
        .populate('tutor', 'name subjects hourlyRate')
        .sort({ lastMessageAt: -1, updatedAt: -1 }),
    ]);

    const convByTutor = {};
    convs.forEach((c) => { convByTutor[String(c.tutor._id)] = c; });

    const result = tutors.map((t) => ({
      tutor:        t,
      conversation: convByTutor[String(t._id)] ?? null,
    }));

    return res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── READ — single conversation + messages ──────────────────────────────────
// GET /api/chat/conversations/:id
exports.getConversation = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    const conv = await Conversation.findById(req.params.id)
      .populate('student', 'name')
      .populate('tutor',   'name subjects hourlyRate')
      .populate('messages.sender', 'name');

    if (!conv) return res.status(404).json({ message: 'Conversation not found' });
    if (!isParticipant(conv, req.user.id)) {
      return res.status(403).json({ message: 'Not authorised' });
    }

    // Mark unread messages as read
    let changed = false;
    conv.messages.forEach((m) => {
      if (!m.read && String(m.sender._id ?? m.sender) !== String(req.user.id)) {
        m.read = true;
        changed = true;
      }
    });
    if (changed) await conv.save();

    res.json(conv);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── UPDATE — send message ──────────────────────────────────────────────────
// POST /api/chat/conversations/:id/message   { text }
exports.sendMessage = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const conv = await Conversation.findById(req.params.id);
    if (!conv) return res.status(404).json({ message: 'Conversation not found' });
    if (!isParticipant(conv, req.user.id)) {
      return res.status(403).json({ message: 'Not authorised' });
    }

    conv.messages.push({ sender: req.user.id, text: text.trim() });
    conv.lastMessage   = text.trim().slice(0, 80);
    conv.lastMessageAt = new Date();
    await conv.save();

    // Return just the new message (populated)
    const updated = await Conversation.findById(conv._id)
      .populate('messages.sender', 'name');
    const newMsg = updated.messages[updated.messages.length - 1];

    res.status(201).json(newMsg);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── DELETE ─────────────────────────────────────────────────────────────────
// DELETE /api/chat/conversations/:id
exports.deleteConversation = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    const conv = await Conversation.findById(req.params.id);
    if (!conv) return res.status(404).json({ message: 'Conversation not found' });
    if (!isParticipant(conv, req.user.id)) {
      return res.status(403).json({ message: 'Not authorised' });
    }
    await conv.deleteOne();
    res.json({ message: 'Conversation deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
