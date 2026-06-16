const router = require('express').Router();
const auth = require('../middleware/auth');
const favoriteController = require('../controllers/favoriteController');

router.post('/:postId', auth, favoriteController.toggleFavorite);
router.get('/', auth, favoriteController.getFavorites);
router.delete('/:id', auth, favoriteController.removeFavorite);  // 新增：根据收藏记录ID删除

module.exports = router;