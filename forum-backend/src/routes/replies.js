const router = require('express').Router({ mergeParams: true });
const auth = require('../middleware/auth');
const replyController = require('../controllers/replyController');
const rateLimiter = require('../middleware/rateLimiter');

// 创建回复（需要登录，限流）
router.post('/:postId', auth, rateLimiter.postCreate, replyController.createReply);

// 删除回复（需要登录，用户本人或管理员/版主）
router.delete('/:id', auth, replyController.deleteReply);

module.exports = router;