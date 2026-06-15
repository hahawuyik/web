const schedule = require('node-schedule');
const { User, Post, EmotionLog, WeeklyReport, Notification } = require('../models');
const aiService = require('../services/aiService');
const { Op } = require('sequelize');

// 每周一凌晨 8:00 执行
schedule.scheduleJob('0 8 * * 1', async () => {
  console.log('开始生成情绪周报...');
  const lastWeekStart = new Date();
  lastWeekStart.setDate(lastWeekStart.getDate() - lastWeekStart.getDay() - 6); // 上周一
  lastWeekStart.setHours(0,0,0,0);
  const lastWeekEnd = new Date(lastWeekStart);
  lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
  
  const users = await User.findAll({ where: { status: 'active' } });
  for (const user of users) {
    const posts = await Post.findAll({
      where: {
        user_id: user.id,
        created_at: { [Op.between]: [lastWeekStart, lastWeekEnd] }
      }
    });
    if (posts.length === 0) continue;
    
    const { trend, encouragement } = await aiService.generateWeeklyReport(user.username, posts);
    // 保存周报
    await WeeklyReport.create({
      user_id: user.id,
      week_start: lastWeekStart.toISOString().slice(0,10),
      summary: trend,
      encouragement
    });
    // 发送站内信通知用户
    await Notification.create({
      user_id: user.id,
      type: 'system',
      content: `📊 你的情绪周报已生成：${trend}\n鼓励语：${encouragement}`,
    });
  }
  console.log('周报生成完毕');
});