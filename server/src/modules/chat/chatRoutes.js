const express    = require('express');
const router     = express.Router();
const protect    = require('../../middleware/auth');
const {
  getOrCreate,
  listConversations,
  getConversation,
  sendMessage,
  deleteConversation,
} = require('./chatController');

router.post('/',                    protect, getOrCreate);
router.get('/',                     protect, listConversations);
router.get('/:id',                  protect, getConversation);
router.post('/:id/message',         protect, sendMessage);
router.delete('/:id',               protect, deleteConversation);

module.exports = router;
