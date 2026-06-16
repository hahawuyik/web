const { Post, User } = require('../models');
const { Op } = require('sequelize');

exports.search = async (req, res) => {
  try {
    // 兼容前端传递的 q 参数，也保留 keyword 参数
    const keyword = req.query.q || req.query.keyword;
    const { type = 'all', forumId, startDate, endDate, page = 1, limit = 20 } = req.query;

    if (!keyword || keyword.trim() === '') {
      return res.json({ rows: [], count: 0 });
    }

    const where = { status: 'normal' };
    if (forumId) where.forum_id = forumId;

    // 处理时间范围
    if (startDate && endDate) {
      where.created_at = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    } else if (startDate) {
      where.created_at = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      where.created_at = { [Op.lte]: new Date(endDate) };
    }

    let results;
    if (type === 'title') {
      where.title = { [Op.like]: `%${keyword}%` };
      results = await Post.findAndCountAll({
        where,
        include: [{ model: User, as: 'author', attributes: ['id', 'username', 'avatar'] }],
        offset: (parseInt(page) - 1) * parseInt(limit),
        limit: parseInt(limit),
        order: [['created_at', 'DESC']]
      });
    } else if (type === 'author') {
      const users = await User.findAll({
        where: { username: { [Op.like]: `%${keyword}%` } },
        attributes: ['id']
      });
      const userIds = users.map(u => u.id);
      if (userIds.length === 0) {
        // 没有匹配的用户，直接返回空结果
        return res.json({ rows: [], count: 0 });
      }
      where.user_id = { [Op.in]: userIds };
      results = await Post.findAndCountAll({
        where,
        include: [{ model: User, as: 'author', attributes: ['id', 'username', 'avatar'] }],
        offset: (parseInt(page) - 1) * parseInt(limit),
        limit: parseInt(limit),
        order: [['created_at', 'DESC']]
      });
    } else { // all: 搜索标题和内容
      where[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { content: { [Op.like]: `%${keyword}%` } }
      ];
      results = await Post.findAndCountAll({
        where,
        include: [{ model: User, as: 'author', attributes: ['id', 'username', 'avatar'] }],
        offset: (parseInt(page) - 1) * parseInt(limit),
        limit: parseInt(limit),
        order: [['created_at', 'DESC']]
      });
    }

    // 返回前端期望的格式：{ rows, count }
    res.json({
      rows: results.rows,
      count: results.count
    });
  } catch (error) {
    console.error('搜索错误:', error);
    res.status(500).json({ msg: '搜索失败', error: error.message });
  }
};