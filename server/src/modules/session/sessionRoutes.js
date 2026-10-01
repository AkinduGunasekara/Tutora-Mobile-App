const express = require('express');
const router  = express.Router();
const protect = require('../../middleware/auth');

const {
  getUserSessions,
  createSession,
  getSession,
  confirmPayment,
  startSession,
  addMessage,
  addFile,
  completeSession,
  saveCodeSnapshot,
} = require('./sessionController');

// /my must come before /:id so Express doesn't treat "my" as an ID
router.get('/my',                    protect, getUserSessions);
router.post('/',                     protect, createSession);
router.get('/:id',                   protect, getSession);
router.patch('/:id/confirm-payment', protect, confirmPayment);
router.patch('/:id/start',           protect, startSession);
router.post('/:id/message',          protect, addMessage);
router.post('/:id/file',             protect, addFile);
router.patch('/:id/complete',        protect, completeSession);
router.post('/:id/code',             protect, saveCodeSnapshot);

module.exports = router;
