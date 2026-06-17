const { User, Notification, Post, Reply, WeeklyReport, EmotionLog, Vote } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

exports.getProfile = async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password_hash'] }
  });
  if (!user) return res.status(404).json({ msg: '用户不存在' });
  const userData = user.toJSON();
  userData.level = Math.floor(userData.points / 10) + 1;
  res.json(userData);
};

exports.updateProfile = async (req, res) => {
  const { signature, bio } = req.body;
  await req.user.update({ signature, bio });
  res.json({ msg: '资料更新成功' });
};

exports.updateAvatar = async (req, res) => {
  if (!req.file) return res.status(400).json({ msg: '请上传图片文件' });
  const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;
  await req.user.update({ avatar: avatarUrl });
  res.json({ msg: '头像更新成功', avatar: avatarUrl });
};

exports.getNotifications = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const notifications = await Notification.findAndCountAll({
    where: { user_id: req.user.id },
    order: [['created_at', 'DESC']],
    offset: (page - 1) * limit,
    limit: parseInt(limit)
  });
  res.json(notifications);
};

exports.markNotificationRead = async (req, res) => {
  await Notification.update({ is_read: true }, { where: { id: req.params.id, user_id: req.user.id } });
  res.json({ msg: '已标记为已读' });
};

// 获取我的帖子统计数据
exports.getMyPostsStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const where = { user_id: userId, status: { [Op.ne]: 'deleted' } };

    const totalPosts = await Post.count({ where });
    const totalViews = (await Post.sum('view_count', { where })) || 0;
    const totalLikes = (await Post.sum('like_count', { where })) || 0;

    // 总评论数：该用户所有帖子的回复数总和
    const postIds = (await Post.findAll({ where, attributes: ['id'] })).map(p => p.id);
    let totalComments = 0;
    if (postIds.length) {
      totalComments = await Reply.count({ where: { post_id: { [Op.in]: postIds }, status: 'normal' } });
    }

    res.json({ totalPosts, totalViews, totalLikes, totalComments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '服务器错误' });
  }
};

// 获取我的帖子列表（支持分页、标题搜索、状态筛选、时间范围）
exports.getMyPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    let { page = 1, limit = 10, keyword = '', status = '', startDate = '', endDate = '' } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    const where = { user_id: userId, status: { [Op.ne]: 'deleted' } };

    if (keyword) {
      where.title = { [Op.like]: `%${keyword}%` };
    }

    if (status === 'top') {
      where.is_top = true;
    } else if (status === 'essence') {
      where.is_essence = true;
    } else if (status === 'deleted') {
      where.status = 'deleted';
    } else if (status === 'normal') {
      where.status = 'normal';
    }

    if (startDate) {
      where.created_at = { [Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      where.created_at = { ...where.created_at, [Op.lte]: new Date(endDate + ' 23:59:59') };
    }

    const { count, rows } = await Post.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      offset,
      limit,
      attributes: ['id', 'title', 'content', 'created_at', 'view_count', 'like_count', 'reply_count', 'forum_id', 'is_top', 'is_essence', 'status']
    });

    res.json({ rows, count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '服务器错误' });
  }
};

// 获取我的回复列表（支持分页、内容搜索）- 修复版
exports.getMyReplies = async (req, res) => {
  try {
    const userId = req.user.id;
    let { page = 1, limit = 10, keyword = '' } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    const where = { user_id: userId, status: 'normal' };
    if (keyword) {
      where.content = { [Op.like]: `%${keyword}%` };
    }

    // 1. 查询回复列表（不关联帖子）
    const { count, rows } = await Reply.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      offset,
      limit,
      attributes: ['id', 'content', 'created_at', 'post_id']
    });

    // 2. 收集所有帖子 ID，批量查询帖子
    const postIds = [...new Set(rows.map(r => r.post_id).filter(id => id != null))];
    let postMap = {};
    if (postIds.length) {
      const posts = await Post.findAll({
        where: { id: postIds },
        attributes: ['id', 'title']
      });
      postMap = posts.reduce((map, p) => { map[p.id] = p; return map; }, {});
    }

    // 3. 格式化返回数据
    const formattedRows = rows.map(reply => ({
      id: reply.id,
      content: reply.content,
      created_at: reply.created_at,
      postId: reply.post_id,
      postTitle: postMap[reply.post_id]?.title || '帖子已删除'
    }));

    res.json({ rows: formattedRows, count });
  } catch (err) {
    console.error('getMyReplies error:', err);
    res.status(500).json({ msg: '服务器错误' });
  }
};

// 修改密码
// 修改密码
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ msg: '原密码和新密码不能为空' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ msg: '新密码长度至少6位' });
    }

    const user = await User.findByPk(userId);
    // 注意：数据库字段为 password_hash
    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ msg: '原密码错误' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await user.update({ password_hash: hashed });

    res.json({ msg: '密码修改成功，请重新登录' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '服务器错误' });
  }
};

exports.getWeeklyReports = async (req, res) => {
  try {
    const reports = await WeeklyReport.findAll({
      where: { user_id: req.user.id },
      order: [['week_start', 'DESC']]
    });
    res.json(reports);
  } catch (error) {
    console.error('getWeeklyReports error:', error);
    res.status(500).json({ message: '获取周报失败' });
  }
};

// 手动生成当周易情绪周报（自然周，周一至周日）
// 手动生成最近7天（滑动窗口）的情绪周报
exports.generateWeeklyReportNow = async (req, res) => {
  try {
    const userId = req.user.id;
    const force = req.query.force === 'true'; // 是否强制重新生成

    // 计算最近7天（包含今天）
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6); // 往前推6天（共7天）
    startDate.setHours(0, 0, 0, 0);

    const startStr = startDate.toISOString().slice(0, 10);
    const endStr = endDate.toISOString().slice(0, 10);

    // 1. 检查是否已存在相同日期范围的周报（防止重复生成）
    const { WeeklyReport, EmotionLog, Post } = require('../models');
    const existingReport = await WeeklyReport.findOne({
      where: {
        user_id: userId,
        week_start: startStr,
        week_end: endStr,
      },
    });

    if (existingReport && !force) {
      // 已存在且不强制刷新，直接返回已有内容
      return res.status(200).json({
        msg: '最近7天周报已存在，如需重新生成请使用 force=true 参数',
        trend: existingReport.summary,
        encouragement: existingReport.encouragement,
        report: existingReport,
      });
    }

    // 2. 查询最近7天的情绪日志
    const logs = await EmotionLog.findAll({
      where: {
        user_id: userId,
        created_at: { [Op.between]: [startDate, endDate] },
      },
    });

    if (logs.length === 0) {
      return res.status(400).json({ msg: '最近7天没有发帖，无法生成周报' });
    }

    // 3. 获取对应的帖子内容（用于AI分析）
    const postIds = logs.map((l) => l.post_id);
    const posts = await Post.findAll({
      where: { id: postIds },
      attributes: ['id', 'title', 'content'],
    });
    const postMap = {};
    posts.forEach((p) => (postMap[p.id] = p));

    const postList = logs.map((log) => {
      const post = postMap[log.post_id];
      return {
        title: post?.title || '',
        content: post?.content || '',
      };
    });

    // 4. 调用AI生成周报内容
    const aiService = require('../services/aiService');
    const { trend, encouragement } = await aiService.generateWeeklyReport(
      req.user.username,
      postList
    );

    // 5. 存储或更新周报
    if (existingReport) {
      await existingReport.update({
        summary: trend,
        encouragement,
      });
    } else {
      await WeeklyReport.create({
        user_id: userId,
        week_start: startDate,
        week_end: endDate,
        summary: trend,
        encouragement,
        created_at: new Date(),
      });
    }

    res.json({
      msg: '周报生成成功',
      trend,
      encouragement,
      startDate: startStr,
      endDate: endStr,
    });
  } catch (error) {
    console.error('手动生成周报失败:', error);
    res.status(500).json({ msg: '生成失败', error: error.message });
  }

};

// 获取用户指定日期范围内的每日情绪分布（用于前端图表）
exports.getEmotionTimeline = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;

    // 明确指定本地时区（例如 UTC+8），避免日期偏移
    const start = new Date(startDate + 'T00:00:00+08:00');
    const end = new Date(endDate + 'T23:59:59+08:00');

    const logs = await EmotionLog.findAll({
      where: {
        user_id: userId,
        created_at: { [Op.between]: [start, end] }
      },
      attributes: ['sentiment', 'score', 'created_at']
    });

    // 生成日期范围（基于字符串，避免时区问题）
    const dayRange = [];
    let current = new Date(start);
    while (current <= end) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      dayRange.push(dateStr);
      current.setDate(current.getDate() + 1);
    }

    // 初始化 Map
    const dateMap = new Map();
    dayRange.forEach(date => {
      dateMap.set(date, { positive: 0, negative: 0, neutral: 0, avgScore: 0, count: 0 });
    });

    // 统计日志
    logs.forEach(log => {
      const dateStr = log.created_at.toISOString().slice(0,10);
      const entry = dateMap.get(dateStr);
      if (entry) {
        if (log.sentiment === 'positive') entry.positive++;
        else if (log.sentiment === 'negative') entry.negative++;
        else if (log.sentiment === 'neutral') entry.neutral++;
        entry.avgScore += log.score;
        entry.count++;
      }
    });

    // 计算平均分
    for (let [date, data] of dateMap.entries()) {
      if (data.count > 0) data.avgScore = data.avgScore / data.count;
    }

    // 构建返回结果
    const result = dayRange.map(date => ({
      date,
      positive: dateMap.get(date).positive,
      negative: dateMap.get(date).negative,
      neutral: dateMap.get(date).neutral,
      avgScore: dateMap.get(date).avgScore
    }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '获取情绪时间线失败' });
  }
};