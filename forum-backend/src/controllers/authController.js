const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { Op } = require('sequelize');

exports.register = async (req, res) => {
  const { username, email, mobile, password } = req.body;
  if (!username || !password) return res.status(400).json({ msg: '用户名和密码不能为空' });
  const exist = await User.findOne({ where: { [Op.or]: [{ email }, { mobile }, { username }] } });
  if (exist) return res.status(400).json({ msg: '用户名、邮箱或手机号已被注册' });
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    username, email, mobile, password_hash: hashed,
    avatar: '/uploads/default-avatar.png'
  });
  res.status(201).json({ id: user.id, username: user.username, email: user.email });
};

exports.login = async (req, res) => {
  const { account, password } = req.body;
  const user = await User.findOne({
    where: { [Op.or]: [{ email: account }, { mobile: account }, { username: account }] }
  });
  if (!user) return res.status(401).json({ msg: '账号不存在' });
  if (user.status === 'banned') return res.status(401).json({ msg: '账号已被封禁' });
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ msg: '密码错误' });

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

  // 动态计算等级
  const level = Math.floor(user.points / 10) + 1;

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      avatar: user.avatar,
      points: user.points,
      level: level   // 使用动态等级
    }
  });
};

exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findByPk(req.user.id);
  const valid = await bcrypt.compare(oldPassword, user.password_hash);
  if (!valid) return res.status(400).json({ msg: '原密码错误' });
  const hashed = await bcrypt.hash(newPassword, 10);
  await user.update({ password_hash: hashed });
  res.json({ msg: '密码修改成功' });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(404).json({ msg: '邮箱未注册' });
  // 实际项目中应发送重置密码邮件，这里简化为返回重置 token（生产环境需保存至数据库并限时）
  const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ msg: '请使用以下 token 重置密码', resetToken });
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hashed = await bcrypt.hash(newPassword, 10);
    await User.update({ password_hash: hashed }, { where: { id: decoded.id } });
    res.json({ msg: '密码重置成功' });
  } catch (err) {
    res.status(400).json({ msg: '无效或过期的重置令牌' });
  }
};