const { User, Post, Reply, Forum, Report, OperationLog, sequelize, Announcement, Notification, AiAssistant } = require('../models');
const { Op } = require('sequelize');

// ==================== 用户管理 ====================
exports.getAllUsers = async (req, res) => {
  const { keyword = '' } = req.query;
  const where = {};
  if (keyword) {
    where[Op.or] = [
      { username: { [Op.like]: `%${keyword}%` } },
      { email: { [Op.like]: `%${keyword}%` } },
      { mobile: { [Op.like]: `%${keyword}%` } }
    ];
  }
  const users = await User.findAll({
    where,
    attributes: { exclude: ['password_hash'] },
    order: [['created_at', 'DESC']]
  });
  res.json(users);
};
exports.updateUserRole = async (req, res) => {
  const { userId, role } = req.body;
  if (!['user', 'moderator', 'admin'].includes(role)) return res.status(400).json({ msg: '无效角色' });
  await User.update({ role }, { where: { id: userId } });
  await OperationLog.create({ admin_id: req.user.id, action: '修改用户角色', target_type: 'user', target_id: userId, detail: `新角色=${role}` });
  res.json({ msg: '角色已更新' });
};
exports.banUser = async (req, res) => {
  const { userId } = req.params;
  const user = await User.findByPk(userId);
  if (!user) return res.status(404).json({ msg: '用户不存在' });
  const newStatus = user.status === 'active' ? 'banned' : 'active';
  await user.update({ status: newStatus });
  await OperationLog.create({ admin_id: req.user.id, action: newStatus === 'banned' ? '封禁用户' : '解封用户', target_type: 'user', target_id: userId });
  res.json({ msg: `用户已${newStatus === 'banned' ? '封禁' : '解封'}` });
};

// ==================== 帖子管理（置顶/加精/锁定/删除/移动） ====================
exports.managePost = async (req, res) => {
  const { postId, action, value } = req.body;
  const post = await Post.findByPk(postId);
  if (!post) return res.status(404).json({ msg: '帖子不存在' });
  switch (action) {
    case 'top': await post.update({ is_top: value }); break;
    case 'essence':
      const oldEssence = post.is_essence;
      await post.update({ is_essence: value });
      if (!oldEssence && value) {
        await User.increment('points', { by: 10, where: { id: post.user_id } });
      } else if (oldEssence && !value) {
        await User.decrement('points', { by: 10, where: { id: post.user_id } });
      }
      break;
    case 'lock': await post.update({ is_locked: value }); break;
    case 'delete': await post.update({ status: 'deleted' }); break;
    case 'move': await post.update({ forum_id: value }); break;
    default: return res.status(400).json({ msg: '无效操作' });
  }
  await OperationLog.create({ admin_id: req.user.id, action: `帖子${action}`, target_type: 'post', target_id: postId, detail: JSON.stringify({ value }) });
  res.json({ msg: '操作成功' });
};

// ==================== 回复管理 ====================
exports.deleteReply = async (req, res) => {
  const reply = await Reply.findByPk(req.params.replyId);
  if (!reply) return res.status(404).json({ msg: '回复不存在' });
  await reply.update({ status: 'deleted' });
  await Post.decrement('reply_count', { where: { id: reply.post_id } });
  await OperationLog.create({ admin_id: req.user.id, action: '删除回复', target_type: 'reply', target_id: req.params.replyId });
  res.json({ msg: '回复已删除' });
};

// ==================== 举报管理 ====================
exports.getReports = async (req, res) => {
  const { status = 'pending', page = 1, limit = 20, keyword = '' } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const where = { status };
  if (keyword) {
    where.reason = { [Op.like]: `%${keyword}%` };
  }
  const { count, rows } = await Report.findAndCountAll({
    where,
    include: [{ model: User, as: 'reporter', attributes: ['id', 'username'] }],
    order: [['created_at', 'DESC']],
    offset,
    limit: parseInt(limit)
  });

  const enrichedReports = await Promise.all(rows.map(async (report) => {
    const reportData = report.toJSON();
    if (report.target_type === 'post') {
      const post = await Post.findByPk(report.target_id, { attributes: ['id', 'title', 'content'] });
      reportData.target_content = post ? `【帖子】${post.title}` : '帖子已不存在';
    } else if (report.target_type === 'reply') {
      const reply = await Reply.findByPk(report.target_id, {
        attributes: ['id', 'content'],
        include: [{ model: Post, as: 'post', attributes: ['id', 'title'] }]  // 关键：使用 as: 'post'
      });
      if (reply) {
        const postTitle = reply.post?.title || '已删除';
        reportData.target_content = `【回复】“${reply.content.substring(0, 100)}” (所属帖子: ${postTitle})`;
      } else {
        reportData.target_content = '回复已不存在';
      }
    }
    return reportData;
  }));

  res.json({ total: count, data: enrichedReports, page: parseInt(page), limit: parseInt(limit) });
};

exports.handleReport = async (req, res) => {
  const { reportId, action } = req.body;
  const report = await Report.findByPk(reportId);
  if (!report) return res.status(404).json({ msg: '举报不存在' });
  if (action === 'approve') {
    if (report.target_type === 'post') {
      await Post.update({ status: 'deleted' }, { where: { id: report.target_id } });
    } else if (report.target_type === 'reply') {
      const reply = await Reply.findByPk(report.target_id);
      if (reply) {
        await reply.update({ status: 'deleted' });
        await Post.decrement('reply_count', { where: { id: reply.post_id } });
      }
    }
    // 如果数据库表没有 handled_by / handled_at 字段，请注释下面两行
    await report.update({ status: 'approved' /*, handled_by: req.user.id, handled_at: new Date() */ });
  } else if (action === 'reject') {
    await report.update({ status: 'rejected' /*, handled_by: req.user.id, handled_at: new Date() */ });
  } else {
    return res.status(400).json({ msg: '无效操作' });
  }
  await OperationLog.create({ admin_id: req.user.id, action: `处理举报 ${action}`, target_type: report.target_type, target_id: report.target_id });
  res.json({ msg: '举报已处理' });
};

// ==================== 版块管理 ====================
exports.createForum = async (req, res) => {
  const { name, description, cover_image, moderator_id, sort_order } = req.body;
  const forum = await Forum.create({ name, description, cover_image, moderator_id, sort_order });
  res.status(201).json(forum);
};
exports.updateForum = async (req, res) => {
  const forum = await Forum.findByPk(req.params.id);
  if (!forum) return res.status(404).json({ msg: '版块不存在' });
  await forum.update(req.body);
  res.json(forum);
};
exports.deleteForum = async (req, res) => {
  await Forum.destroy({ where: { id: req.params.id } });
  res.json({ msg: '版块已删除' });
};

// ==================== 帖子列表（管理员） ====================
exports.getPostsList = async (req, res) => {
  const { page = 1, limit = 20, keyword = '', forum_id, status = 'normal' } = req.query;
  const where = {};
  if (status !== 'all') where.status = status;
  if (forum_id) where.forum_id = forum_id;
  if (keyword) {
    where[Op.or] = [
      { title: { [Op.like]: `%${keyword}%` } },
      { content: { [Op.like]: `%${keyword}%` } }
    ];
  }
  const { count, rows } = await Post.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    offset: (parseInt(page) - 1) * parseInt(limit),
    limit: parseInt(limit),
    include: [
      { model: User, as: 'author', attributes: ['id', 'username', 'avatar'] },
      { model: Forum, attributes: ['id', 'name'] }
    ]
  });
  res.json({ total: count, data: rows, page: parseInt(page), limit: parseInt(limit) });
};

// ==================== 回复列表（管理员） ====================
exports.getRepliesList = async (req, res) => {
  const { page = 1, limit = 20, keyword = '', post_id } = req.query;
  const where = { status: { [Op.ne]: 'deleted' } };
  if (post_id) where.post_id = post_id;
  if (keyword) {
    where.content = { [Op.like]: `%${keyword}%` };
  }
  const { count, rows } = await Reply.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    offset: (parseInt(page) - 1) * parseInt(limit),
    limit: parseInt(limit),
    include: [
      { model: User, as: 'author', attributes: ['id', 'username', 'avatar'] },
      { model: Post, as: 'post', attributes: ['id', 'title'] }
    ]
  });
  res.json({ total: count, data: rows, page: parseInt(page), limit: parseInt(limit) });
};

// ==================== 系统设置（简化版，如需完整请自行扩展） ====================
exports.getSystemSettings = async (req, res) => {
  res.json({
    siteName: '我的论坛',
    siteLogo: '',
    siteIcp: '',
    registerEnabled: true,
    postReview: false,
    sensitiveWords: ''
  });
};
exports.updateSystemSettings = async (req, res) => {
  res.json({ msg: '设置已保存' });
};

// ==================== 公告管理 ====================
exports.publishAnnouncement = async (req, res) => {
  const { title, content, target = 'all' } = req.body;
  if (!title || !content) return res.status(400).json({ msg: '标题和内容不能为空' });
  const announcement = await Announcement.create({
    title,
    content,
    target,
    created_by: req.user.id,
    published_at: new Date()
  });
  res.status(201).json(announcement);
};
exports.getAnnouncements = async (req, res) => {
  const announcements = await Announcement.findAll({ order: [['published_at', 'DESC']] });
  res.json(announcements);
};

// ==================== 批量站内信 ====================
exports.sendBatchMessage = async (req, res) => {
  const { userIds, content } = req.body;
  if (!userIds || !content) return res.status(400).json({ msg: '用户ID列表和内容不能为空' });
  const ids = userIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
  if (ids.length === 0) return res.status(400).json({ msg: '有效的用户ID不能为空' });
  const notifications = ids.map(user_id => ({ user_id, type: 'system', content, is_read: false }));
  await Notification.bulkCreate(notifications);
  res.json({ msg: `已向 ${ids.length} 位用户发送站内信` });
};

// ==================== 以下为 AI 助手管理（如需使用请保留） ====================
exports.list = async (req, res) => {
  const assistants = await AiAssistant.findAll({ where: { status: 1 }, order: [['id', 'ASC']] });
  res.json(assistants);
};
exports.create = async (req, res) => {
  const { name, system_prompt, model_type, is_default, personality, knowledge_base, avatar } = req.body;
  if (!name || !system_prompt) return res.status(400).json({ msg: '名称和系统提示词不能为空' });
  const assistant = await AiAssistant.create({
    name, avatar: avatar || '', personality, system_prompt,
    knowledge_base: knowledge_base || {}, model_type: model_type || 'qwen',
    is_default: is_default || false, status: 1, created_at: new Date()
  });
  res.status(201).json(assistant);
};
exports.update = async (req, res) => {
  const assistant = await AiAssistant.findByPk(req.params.id);
  if (!assistant) return res.status(404).json({ msg: '助手不存在' });
  await assistant.update(req.body);
  res.json(assistant);
};
exports.delete = async (req, res) => {
  const assistant = await AiAssistant.findByPk(req.params.id);
  if (!assistant) return res.status(404).json({ msg: '助手不存在' });
  await assistant.destroy();
  res.json({ msg: '删除成功' });
};