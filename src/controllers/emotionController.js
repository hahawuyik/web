const { EmotionLog, sequelize } = require('../models');
const { Op } = require('sequelize');

// 获取今日情绪统计（用于热力图）
exports.getTodayEmotionStats = async (req, res) => {
  const today = new Date();
  today.setHours(0,0,0,0);
  const stats = await EmotionLog.findAll({
    where: { created_at: { [Op.gte]: today } },
    attributes: [
      'sentiment',
      [sequelize.fn('COUNT', sequelize.col('sentiment')), 'count']
    ],
    group: ['sentiment']
  });
  const total = stats.reduce((sum, s) => sum + parseInt(s.dataValues.count), 0);
  const result = {};
  stats.forEach(s => { result[s.sentiment] = s.dataValues.count; });
  // 计算主要情绪（占比例最高）
  let dominant = 'neutral';
  let max = 0;
  for (let [sent, cnt] of Object.entries(result)) {
    if (cnt > max) { max = cnt; dominant = sent; }
  }
  // 根据主要情绪返回背景色建议
  const colorMap = {
    positive: '#94ec94',   // 浅绿
    neutral: '#e4c7c7',    // 灰
    negative: '#aed4f9',   // 浅蓝
    anxious: '#2378c4',    // 忧郁蓝
    angry: '#c54ea3',      // 浅红
    sad: '#d2d948'
  };
  const backgroundColor = colorMap[dominant] || '#13a4ac98';
  res.json({ stats: result, total, dominant, backgroundColor });
};

// 获取一周情绪趋势（用于周报图表）
exports.getWeeklyTrend = async (req, res) => {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // 周一
  startOfWeek.setHours(0,0,0,0);
  const logs = await EmotionLog.findAll({
    where: { created_at: { [Op.gte]: startOfWeek } },
    attributes: ['sentiment', 'created_at']
  });
  // 按天聚合
  const days = ['周一','周二','周三','周四','周五','周六','周日'];
  const trend = days.map((day, idx) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + idx);
    const dayLogs = logs.filter(l => new Date(l.created_at).toDateString() === date.toDateString());
    const positive = dayLogs.filter(l => l.sentiment === 'positive').length;
    const negative = dayLogs.filter(l => ['negative','anxious','angry','sad'].includes(l.sentiment)).length;
    return { day, positive, negative };
  });
  res.json(trend);
};

// emotionController.js 中添加
exports.getCategoryStats = async (req, res) => {
  const stats = await EmotionLog.findAll({
    attributes: ['category', [sequelize.fn('COUNT', sequelize.col('category')), 'count']],
    group: ['category']
  });
  res.json(stats);
};

// 获取全局情绪统计（所有帖子）
exports.getGlobalEmotionStats = async (req, res) => {
  const stats = await EmotionLog.findAll({
    attributes: [
      'sentiment',
      [sequelize.fn('COUNT', sequelize.col('sentiment')), 'count']
    ],
    group: ['sentiment']
  });
  const total = stats.reduce((sum, s) => sum + parseInt(s.dataValues.count), 0);
  const result = {};
  stats.forEach(s => { result[s.sentiment] = s.dataValues.count; });
  
  let dominant = 'neutral';
  let max = 0;
  for (let [sent, cnt] of Object.entries(result)) {
    if (cnt > max) { max = cnt; dominant = sent; }
  }
  const colorMap = {
    positive: '#94ec94',   // 浅绿
    neutral: '#e4c7c7',    // 灰
    negative: '#aed4f9',   // 浅蓝
    anxious: '#2378c4',    // 忧郁蓝
    angry: '#c54ea3',      // 浅红
    sad: '#d2d948'
  };
  const backgroundColor = colorMap[dominant] || '#13a4ac98';
  res.json({ stats: result, total, dominant, backgroundColor });
};