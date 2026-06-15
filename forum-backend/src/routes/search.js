const router = require('express').Router();
const searchController = require('../controllers/searchController');
const cache = require('../middleware/cache');

// 搜索接口（可以缓存短时间，因为搜索结果实时性要求高，也可以不缓存）
router.get('/', cache('search', 30), searchController.search);

module.exports = router;