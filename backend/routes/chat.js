const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

// GET /api/chat/conversations - Get all conversations
router.get('/conversations', auth, chatController.getConversations);

// GET /api/chat/messages/:otherUserId - Get messages with a user
router.get('/messages/:otherUserId', auth, chatController.getMessages);

// POST /api/chat/send - Send a message
router.post('/send', auth, chatController.sendMessage);

// GET /api/chat/unread - Get unread message count
router.get('/unread', auth, chatController.getUnreadCount);

module.exports = router;
