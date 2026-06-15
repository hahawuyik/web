require('dotenv').config();
const app = require('./src/app');
const { sequelize } = require('./src/models');
const redis = require('./src/config/redis');
const seed = require('./src/seeders/initialData');  // 注意路径：你的文件在 src/seed/initialData.js

require('./src/jobs/weeklyReport');  // 启动定时任务

const PORT = process.env.PORT || 3000;

// 测试 Redis 连接
redis.ping().then(() => console.log('Redis connected')).catch(err => console.error('Redis error:', err));

// 同步数据库并执行种子数据
sequelize.sync({ alter: true }).then(async () => {
  console.log('Database synced');
  await seed();  // 执行初始化（创建版块和管理员）
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Database sync failed:', err);
});