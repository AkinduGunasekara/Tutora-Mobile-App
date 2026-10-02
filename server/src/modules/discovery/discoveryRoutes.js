const express = require('express');
const router = express.Router();
const protect = require('../../middleware/auth');
const {
  searchTutors,
  getTutorProfile,
  getSubjects,
  getTutorReviews,
  createReview,
  createCustomSessionRequest,
  getCustomSessionRequests,
} = require('./discoveryController');

router.get('/search', protect, searchTutors);
router.get('/tutor/:id', protect, getTutorProfile);
router.get('/subjects', protect, getSubjects);
router.get('/tutor/:id/reviews', protect, getTutorReviews);
router.post('/tutor/:id/reviews', protect, createReview);
router.post('/custom-session', protect, createCustomSessionRequest);
router.get('/custom-session', protect, getCustomSessionRequests);

module.exports = router;
