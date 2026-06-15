module.exports = (sequelize, DataTypes) => {
  const AiAssistant = sequelize.define('AiAssistant', {
    name: DataTypes.STRING(50),
    avatar: DataTypes.STRING,
    personality: DataTypes.TEXT,
    system_prompt: DataTypes.TEXT,
    knowledge_base: DataTypes.JSON,
    model_type: DataTypes.ENUM('qwen', 'doubao', 'wenxin'),
    is_default: DataTypes.BOOLEAN,
    status: DataTypes.BOOLEAN,
    created_at: DataTypes.DATE
  }, {
    tableName: 'ai_assistants',
    timestamps: false,
    underscored: true
  });
  return AiAssistant;
};