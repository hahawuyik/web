const rateLimit = require('express-rate-limit');

// 全局限流：每 IP 100 请求/分钟
const global = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { msg: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
});

// 发帖限流：每 IP 3 次/分钟
const postCreate = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { msg: '发帖过于频繁，请稍后再试' }
});

// 登录限流：每 IP 5 次/分钟
const login = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { msg: '登录尝试过多，请稍后再试' }
});

module.exports = { global, postCreate, login };