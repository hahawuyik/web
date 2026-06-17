const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimiter = require('./middleware/rateLimiter');
const logger = require('./middleware/logger');

const app = express();

// 中间件
app.use(helmet()); // 安全头
app.use(cors());   // 跨域
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter.global); // 全局限流
app.use(logger);             // 请求日志

// 静态文件（头像上传目录）
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/forums', require('./routes/forums'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/replies', require('./routes/replies'));
app.use('/api/votes', require('./routes/votes'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/search', require('./routes/search'));
app.use('/api/emotion', require('./routes/emotion'));
app.use('/api/weekly-report', require('./routes/weeklyReport'));
app.use('/api/ai-assistants', require('./routes/aiAssistants'));
app.use('/api/ai-chat', require('./routes/aiChat'));
app.use('/api/gratitude', require('./routes/gratitude'));
app.use('/api/psychological-tests', require('./routes/psychologicalTests'));
app.use('/api/upload', require('./routes/upload'));
// // 404 处理
// app.use((req, res) => {
//   res.status(404).json({ msg: '路由不存在' });
// });


// ========== 托管前端打包文件 ==========
app.use(express.static(path.join(__dirname, 'dist')));

// 所有非 API 请求都返回 index.html（让 Vue Router 处理）
app.get('/*splat', (req, res) => {
  // 如果请求路径以 /api 或 /uploads 开头，说明是后端接口或上传文件，返回 404
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return res.status(404).json({ msg: '路由不存在' });
  }
  // 否则返回前端 index.html
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});
// ====================================

// 全局错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ msg: '服务器内部错误', error: err.message });
});

module.exports = app;