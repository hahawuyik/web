const router = require('express').Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/role')(['admin']);
const aiAssistantController = require('../controllers/aiAssistantController');

router.get('/', aiAssistantController.list);
router.post('/', auth, admin, aiAssistantController.create);
router.put('/:id', auth, admin, aiAssistantController.update);
router.delete('/:id', auth, admin, aiAssistantController.delete);

module.exports = router;