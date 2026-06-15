module.exports = (sequelize, DataTypes) => {
  const AiConversation = sequelize.define('AiConversation', {
    user_id: DataTypes.INTEGER,
    assistant_id: DataTypes.INTEGER,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  }, {
    tableName: 'ai_conversations',
    timestamps: false,
    underscored: true
  });
  return AiConversation;
};