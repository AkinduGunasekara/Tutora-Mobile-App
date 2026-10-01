const express = require('express');
const router  = express.Router();
const protect = require('../../middleware/auth');

const {
  getUserSessions,
  createSession,
  getSession,
  getSessionByBooking,
  confirmPayment,
  startSession,
  addMessage,
  addFile,
  completeSession,
  saveCodeSnapshot,
} = require('./sessionController');

// static routes must come before /:id so Express doesn't treat them as IDs
router.get('/my',                         protect, getUserSessions);
router.get('/by-booking/:bookingId',      protect, getSessionByBooking);
router.post('/',                          protect, createSession);
router.get('/:id',                        protect, getSession);
router.patch('/:id/confirm-payment', protect, confirmPayment);
router.patch('/:id/start',           protect, startSession);
router.post('/:id/message',          protect, addMessage);
router.post('/:id/file',             protect, addFile);
router.patch('/:id/complete',        protect, completeSession);
router.post('/:id/code',             protect, saveCodeSnapshot);

module.exports = router;
