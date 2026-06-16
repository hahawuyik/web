const bcrypt = require('bcryptjs');
const { Forum, User } = require('../models');

async function seed() {
  // 创建版块
  const forums = [
    { name: '内娱', description: '讨论国内娱乐新闻', sort_order: 1 },
    { name: '古人', description: '历史人物与古代文化', sort_order: 2 },
    { name: '冷知识', description: '有趣且不为人知的知识', sort_order: 3 }
  ];
  for (const forum of forums) {
    await Forum.findOrCreate({ where: { name: forum.name }, defaults: forum });
  }
  
  // 创建管理员账号（如果不存在）
  const adminExists = await User.findOne({ where: { username: 'xxs' } });
  if (!adminExists) {
    const hashed = await bcrypt.hash('xxs123', 10);
    await User.create({
      username: 'xxs',
      email: 'xxs@example.com',
      password_hash: hashed,
      role: 'admin',
      avatar: '/uploads/default-avatar.png'
    });
    console.log('管理员账号已创建: xxs / xxs123');
  }
}

module.exports = seed;