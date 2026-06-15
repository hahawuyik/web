const router = require('express').Router();
const auth = require('../middleware/auth');
const aiChatController = require('../controllers/aiChatController');

router.use(auth); // 所有对话都需要登录

router.get('/conversations', aiChatController.getConversations);
router.get('/messages/:conversationId', aiChatController.getMessages);
router.post('/send', aiChatController.sendMessage);

module.exports = router;