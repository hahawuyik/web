const router = require('express').Router();
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');

// 获取通知列表
router.get('/', auth, userController.getNotifications);

// 标记单个通知为已读
router.put('/:id/read', auth, userController.markNotificationRead);

module.exports = router;