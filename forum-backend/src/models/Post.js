module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define('Post', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(200), allowNull: false },
    content: DataTypes.TEXT('medium'),
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    forum_id: { type: DataTypes.INTEGER, allowNull: false },
    view_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    like_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    reply_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    is_top: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_essence: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_locked: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_anonymous: { type: DataTypes.BOOLEAN, defaultValue: false },
    status: { type: DataTypes.ENUM('normal', 'deleted', 'pending'), defaultValue: 'normal' },
    dislike_count: { type: DataTypes.INTEGER, defaultValue: 0 }
  }, {
    tableName: 'posts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return Post;
};