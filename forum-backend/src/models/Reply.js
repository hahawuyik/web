module.exports = (sequelize, DataTypes) => {
  const Reply = sequelize.define('Reply', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    content: { type: DataTypes.TEXT, allowNull: false },
    user_id: DataTypes.INTEGER,
    post_id: DataTypes.INTEGER,
    quote_reply_id: DataTypes.INTEGER,
    like_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    dislike_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    status: { type: DataTypes.ENUM('normal', 'deleted'), defaultValue: 'normal' }, 
    assistant_id: DataTypes.INTEGER,
    is_ai_reply: { type: DataTypes.BOOLEAN, defaultValue: false },
    parent_reply_id: DataTypes.INTEGER
  }, {
    tableName: 'replies',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  // 注意：所有关联关系已在 models/index.js 中定义，此处不再重复
  return Reply;
};