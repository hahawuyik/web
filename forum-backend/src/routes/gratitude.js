const router = require('express').Router();
const auth = require('../middleware/auth');
const gratitudeController = require('../controllers/gratitudeController');

router.use(auth);

router.get('/categories', gratitudeController.getCategories);
router.post('/submit', gratitudeController.submitPractice);
router.get('/history', gratitudeController.getPracticeHistory);

module.exports = router;