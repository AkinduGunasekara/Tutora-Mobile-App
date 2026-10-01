const express = require('express');
const protect = require('../../middleware/auth');
const {
  createBooking,
  listBookings,
  cancelBooking,
  rescheduleBooking,
  acceptBooking,
  rejectBooking,
} = require('./bookingController');

const router = express.Router();

router.post('/', protect, createBooking);
router.get('/', protect, listBookings);
router.patch('/:id/accept',     protect, acceptBooking);
router.patch('/:id/reject',     protect, rejectBooking);
router.patch('/:id/cancel',     protect, cancelBooking);
router.patch('/:id/reschedule', protect, rescheduleBooking);

module.exports = router;
