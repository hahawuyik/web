const router = require('express').Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const userController = require('../controllers/userController');

router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);
router.post('/avatar', auth, upload.single('avatar'), userController.updateAvatar);
router.get('/notifications', auth, userController.getNotifications);
router.put('/notifications/:id', auth, userController.markNotificationRead);

// 我的帖子统计
router.get('/my-posts/stats', auth, userController.getMyPostsStats);
// 我的帖子列表（支持分页、筛选）
router.get('/my-posts', auth, userController.getMyPosts);
// 我的回复列表（支持分页、关键词搜索）
router.get('/my-replies', auth, userController.getMyReplies);
// 修改密码
router.post('/change-password', auth, userController.changePassword);

router.get('/gen-weekly', auth, async (req, res) => {
  const weeklyJob = require('../jobs/weeklyReport');
  res.json({ msg: '功能待实现' });
});

router.get('/emotion-timeline', auth, userController.getEmotionTimeline);

module.exports = router;