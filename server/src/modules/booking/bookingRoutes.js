const express = require('express');
const protect = require('../../middleware/auth');
const { createBooking } = require('./bookingController');

const router = express.Router();

router.post('/', protect, createBooking);

module.exports = router;
