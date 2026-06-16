const { GratitudePractice } = require('../models');
const aiService = require('../services/aiService');

exports.getCategories = (req, res) => {
  res.json([
    '身边人的小温暖', '自己的进步', '生活小美好', '小成就',
    '大自然', '意外惊喜', '精神充电', '苦难中的收获', '其他'
  ]);
};

exports.submitPractice = async (req, res) => {
  const { category, description } = req.body;
  if (!category || !description) {
    return res.status(400).json({ msg: '请填写完整信息' });
  }
  let aiFeedback = '感谢您的分享，愿您继续发现生活中的美好。';
  try {
    const prompt = `用户分享了一件感恩的事情：分类【${category}】，内容：${description}。请以温暖、鼓励的口吻给出简短的反馈（50字以内），肯定用户的感恩之心。`;
    if (aiService.callQwen) {
      const reply = await aiService.callQwen([{ role: 'user', content: prompt }]);
      if (reply) aiFeedback = reply;
    }
  } catch (err) {
    console.error('AI反馈生成失败', err);
  }
  const record = await GratitudePractice.create({
    user_id: req.user.id,
    category,
    description,
    ai_feedback: aiFeedback
  });
  res.json({ id: record.id, aiFeedback });
};

exports.getPracticeHistory = async (req, res) => {
  const records = await GratitudePractice.findAll({
    where: { user_id: req.user.id },
    order: [['created_at', 'DESC']],
    attributes: ['id', 'category', 'description', 'ai_feedback', 'created_at']
  });
  res.json(records);
};