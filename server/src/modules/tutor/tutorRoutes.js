const express = require('express');
const protect = require('../../middleware/auth');
const {
  getDashboard,
  getCalendar,
  getAvailability,
  updateAvailability,
  getAvailableSlots,
  getRequests,
  getRequest,
  acceptCustomRequest,
  declineCustomRequest,
  proposeAlternative,
  getSessionDetails,
  requestReschedule,
  withdrawReschedule,
  cancelSession,
  getEarnings,
  getReviews,
  getConversations,
} = require('./tutorController');

const router = express.Router();

const requireTutor = (req, res, next) => {
  if (req.user?.role !== 'tutor') {
    return res.status(403).json({ message: 'Tutor account required' });
  }
  next();
};

router.use(protect, requireTutor);

router.get('/dashboard',       getDashboard);
router.get('/calendar',        getCalendar);
router.get('/availability',    getAvailability);
router.put('/availability',    updateAvailability);
router.get('/available-slots', getAvailableSlots);

router.get('/requests',                         getRequests);
router.get('/requests/:kind/:id',               getRequest);
router.patch('/requests/custom/:id/accept',     acceptCustomRequest);
router.patch('/requests/custom/:id/decline',    declineCustomRequest);
router.patch('/requests/:kind/:id/propose',     proposeAlternative);

router.get('/sessions/:bookingId',              getSessionDetails);
router.post('/sessions/:bookingId/reschedule',  requestReschedule);
router.delete('/sessions/:bookingId/reschedule', withdrawReschedule);
router.patch('/sessions/:bookingId/cancel',     cancelSession);

router.get('/earnings',      getEarnings);
router.get('/reviews',       getReviews);
router.get('/conversations', getConversations);

module.exports = router;
