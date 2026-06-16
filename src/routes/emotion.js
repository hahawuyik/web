const router = require('express').Router();
const emotionController = require('../controllers/emotionController');
router.get('/today-stats', emotionController.getTodayEmotionStats);
router.get('/weekly-trend', emotionController.getWeeklyTrend);
router.get('/global-stats', emotionController.getGlobalEmotionStats);
module.exports = router;