const express = require('express');
const router  = express.Router();
const protect = require('../../middleware/auth');
const {
  createPayment,
  getPayment,
  getPaymentBySession,
  verifyPayment,
  cancelPayment,
} = require('./paymentController');

router.post('/',                      protect, createPayment);
router.get('/session/:sessionId',     protect, getPaymentBySession);
router.get('/:id',                    protect, getPayment);
router.patch('/:id/verify',           protect, verifyPayment);
router.delete('/:id',                 protect, cancelPayment);

module.exports = router;
