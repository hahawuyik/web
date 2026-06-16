const router = require('express').Router();
const auth = require('../middleware/auth');
const testController = require('../controllers/psychologicalTestController');

router.use(auth); // 所有测试接口需登录

router.get('/questions/:testType', testController.getTestQuestions);
router.post('/submit', testController.submitTest);
router.get('/history', testController.getTestHistory);

module.exports = router;