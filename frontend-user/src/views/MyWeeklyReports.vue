// userController.js
exports.getWeeklyReports = async (req, res) => {
  const reports = await WeeklyReport.findAll({
    where: { user_id: req.user.id },
    order: [['week_start', 'DESC']]
  });
  res.json(reports);
};
// routes/users.js 添加
router.get('/weekly-reports', auth, userController.getWeeklyReports);