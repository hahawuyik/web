// models/WeeklyReport.js
module.exports = (sequelize, DataTypes) => {
  const WeeklyReport = sequelize.define('WeeklyReport', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: DataTypes.INTEGER,
    week_start: DataTypes.DATEONLY,      // 周一日期
    week_end: DataTypes.DATEONLY,
    summary: DataTypes.TEXT,             // AI 生成的周报总结
    encouragement: DataTypes.TEXT,       // AI 鼓励语
    created_at: DataTypes.DATE
  }, { tableName: 'weekly_reports', timestamps: true });
  return WeeklyReport;
};