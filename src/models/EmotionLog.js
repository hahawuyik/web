// models/EmotionLog.js
module.exports = (sequelize, DataTypes) => {
  const EmotionLog = sequelize.define('EmotionLog', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    post_id: DataTypes.INTEGER,          // 关联帖子
    user_id: DataTypes.INTEGER,          // 用户ID
    sentiment: DataTypes.STRING(20),     // positive, negative, neutral, anxious, angry, sad 等
    score: DataTypes.FLOAT,              // 情感得分（0-1）
    category: DataTypes.STRING(20),      // 归类：学业、感情、就业、其他
    created_at: DataTypes.DATE
  }, { tableName: 'emotion_logs', timestamps: false });
  return EmotionLog;
};