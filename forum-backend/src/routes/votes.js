const router = require('express').Router();
const auth = require('../middleware/auth');
const voteController = require('../controllers/voteController');

// 投票（点赞/点踩）
router.post('/', auth, voteController.vote);

// 获取用户对某个目标的投票状态
router.get('/status', auth, voteController.getUserVoteStatus);

module.exports = router;