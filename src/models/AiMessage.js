module.exports = (sequelize, DataTypes) => {
  const AiMessage = sequelize.define('AiMessage', {
    conversation_id: DataTypes.INTEGER,
    role: DataTypes.ENUM('user', 'assistant'),
    content: DataTypes.TEXT,
    created_at: DataTypes.DATE
  }, {
    tableName: 'ai_messages',
    timestamps: false,
    underscored: true
  });
  return AiMessage;
};