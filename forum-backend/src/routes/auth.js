const router = require('express').Router();
const authController = require('../controllers/authController');
const rateLimiter = require('../middleware/rateLimiter');

router.post('/register', authController.register);
router.post('/login', rateLimiter.login, authController.login);
router.post('/change-password', require('../middleware/auth'), authController.changePassword);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;