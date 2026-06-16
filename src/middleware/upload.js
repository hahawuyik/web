// backend/src/middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/';
    if (file.fieldname === 'avatar') {
      folder += 'avatars';
    } else if (file.fieldname === 'cover') {
      folder += 'cover';
    } else {
      folder += 'others';
    }
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const prefix = file.fieldname === 'avatar' ? 'avatar' : 'cover';
    cb(null, `${prefix}-${req.user.id}-${unique}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) cb(null, true);
  else cb(new Error('仅支持图片格式 (jpeg, jpg, png, gif)'), false);
};

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.AVATAR_MAX_SIZE) || 2 * 1024 * 1024 },
  fileFilter
});

module.exports = upload;