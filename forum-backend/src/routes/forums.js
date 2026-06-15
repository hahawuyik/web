const router = require('express').Router();
const forumController = require('../controllers/forumController');
const cache = require('../middleware/cache');

// 获取所有版块（带缓存）
router.get('/', cache('forums', 1), forumController.getForums);

// 获取单个版块详情
router.get('/:id', cache('forum', 1), forumController.getForumById);

module.exports = router;