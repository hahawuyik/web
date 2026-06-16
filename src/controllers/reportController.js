const { Report } = require('../models');

exports.createReport = async (req, res) => {
  const { targetType, targetId, reason } = req.body;
  if (!['post', 'reply'].includes(targetType)) return res.status(400).json({ msg: '无效的举报类型' });
  const existing = await Report.findOne({
    where: { reporter_id: req.user.id, target_type: targetType, target_id: targetId, status: 'pending' }
  });
  if (existing) return res.status(400).json({ msg: '您已经举报过此内容，等待处理' });
  await Report.create({
    reporter_id: req.user.id,
    target_type: targetType,
    target_id: targetId,
    reason
  });
  res.status(201).json({ msg: '举报已提交' });
};