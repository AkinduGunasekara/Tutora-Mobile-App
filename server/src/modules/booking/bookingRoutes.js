const express = require('express');
const protect = require('../../middleware/auth');
const {
  createBooking,
  listBookings,
  cancelBooking,
  rescheduleBooking,
} = require('./bookingController');

const router = express.Router();

router.post('/', protect, createBooking);
router.get('/', protect, listBookings);
router.patch('/:id/cancel', protect, cancelBooking);
router.patch('/:id/reschedule', protect, rescheduleBooking);

module.exports = router;
