const express = require('express');
const router = express.Router();
const { WeeklyReport } = require('../models');
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');

// 获取当前用户的周报列表
router.get('/my', auth, async (req, res) => {
  try {
    const reports = await WeeklyReport.findAll({
      where: { user_id: req.user.id },
      order: [['week_start', 'DESC']]
    });
    res.json(reports);
  } catch (error) {
    console.error('getWeeklyReports error:', error);
    res.status(500).json({ message: '获取周报失败' });
  }
});

router.post('/generate', auth, userController.generateWeeklyReportNow);
router.get('/emotion-timeline', auth, userController.getEmotionTimeline);

module.exports = router;