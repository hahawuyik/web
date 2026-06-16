const router = require('express').Router();
const auth = require('../middleware/auth');
const reportController = require('../controllers/reportController');

// 提交举报（需要登录）
router.post('/', auth, reportController.createReport);

module.exports = router;