const { User, Post, Reply, Report } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

exports.getStats = async (req, res) => {
  const todayStart = moment().startOf('day').toDate();
  const todayPosts = await Post.count({ where: { created_at: { [Op.gte]: todayStart } } });
  const newUsers = await User.count({ where: { created_at: { [Op.gte]: todayStart } } });
  const pendingReports = await Report.count({ where: { status: 'pending' } });
  const totalPosts = await Post.count();
  const totalUsers = await User.count();
  res.json({ todayPosts, newUsers, pendingReports, totalPosts, totalUsers });
};