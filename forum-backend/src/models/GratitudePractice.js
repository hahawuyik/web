module.exports = (sequelize, DataTypes) => {
  const GratitudePractice = sequelize.define('GratitudePractice', {
    user_id: DataTypes.INTEGER,
    category: DataTypes.STRING(50),
    description: DataTypes.TEXT,
    ai_feedback: DataTypes.TEXT
  }, {
    tableName: 'gratitude_practices',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  return GratitudePractice;
};