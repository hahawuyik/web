const router = require('express').Router();
const auth = require('../middleware/auth');
const postController = require('../controllers/postController');
const rateLimiter = require('../middleware/rateLimiter');
const cache = require('../middleware/cache');

// 公开路由（带缓存）
router.get('/latest', postController.getLatestPosts);

router.get('/random', postController.getRandomPost);
router.get('/forum/:forumId', cache('posts', 30), postController.getPostsByForum);
router.get('/:id', cache('post', 60), postController.getPostDetail);

// 需要登录
router.post('/', auth, rateLimiter.postCreate, postController.createPost);
router.put('/:id', auth, postController.updatePost);
router.delete('/:id', auth, postController.deletePost);

// 管理操作（需要版主或管理员）
router.post('/:id/top', auth, require('../middleware/role')(['admin', 'moderator']), postController.topPost);
router.post('/:id/essence', auth, require('../middleware/role')(['admin', 'moderator']), postController.essencePost);
router.post('/:id/lock', auth, require('../middleware/role')(['admin', 'moderator']), postController.lockPost);


module.exports = router;