const router = require('express').Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/role')(['admin']);
const adminController = require('../controllers/adminController');
const dashboardController = require('../controllers/dashboardController');
const {Op} = require('sequelize');
router.use(auth, admin);
const upload = require('../middleware/upload');

// 仪表盘
router.get('/dashboard/stats', dashboardController.getStats);

// 用户管理
router.get('/users', adminController.getAllUsers);
router.put('/users/role', adminController.updateUserRole);
router.put('/users/ban/:userId', adminController.banUser);

// 帖子管理
router.post('/posts/manage', adminController.managePost);
// 回复管理
router.delete('/replies/:replyId', adminController.deleteReply);

// 举报管理
router.get('/reports', adminController.getReports);
router.post('/reports/handle', adminController.handleReport);

// 版块管理
router.post('/forums', adminController.createForum);
router.put('/forums/:id', adminController.updateForum);
router.delete('/forums/:id', adminController.deleteForum);

router.post('/upload/cover', upload.single('cover'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: '请上传图片文件' });
  }
  const url = `${req.protocol}://${req.get('host')}/uploads/cover/${req.file.filename}`;
  res.json({ url });
});

// 系统设置
router.get('/settings', adminController.getSystemSettings);
router.put('/settings', adminController.updateSystemSettings);


// 帖子管理列表
router.get('/posts', adminController.getPostsList);
// 回复管理列表
router.get('/replies', adminController.getRepliesList);

// 公告管理
router.post('/announcement', adminController.publishAnnouncement);
router.get('/announcements', adminController.getAnnouncements);

// 批量站内信
router.post('/messages', adminController.sendBatchMessage);



module.exports = router;