const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = require('express').Router();
const auth = require('../middleware/auth');

// 帖子图片存储配置
const postImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = 'uploads/post_images';
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `post-img-${req.user.id}-${unique}${path.extname(file.originalname)}`);
  }
});

// 文件过滤
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) cb(null, true);
  else cb(new Error('仅支持图片格式 (jpeg, jpg, png, gif)'), false);
};

const uploadPostImage = multer({
  storage: postImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter
});

// 上传接口
router.post('/post-image', auth, uploadPostImage.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ msg: '请选择图片' });
  const url = `/uploads/post_images/${req.file.filename}`;
  res.json({ url });
});

module.exports = router;