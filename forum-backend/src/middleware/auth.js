const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: '未提供认证令牌' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user || user.status === 'banned') {
      return res.status(401).json({ msg: '用户不存在或已被封禁' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ msg: '无效的令牌' });
  }
};