module.exports = (sequelize, DataTypes) => {
  const Favorite = sequelize.define('Favorite', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: DataTypes.INTEGER,
    post_id: DataTypes.INTEGER
  }, {
    tableName: 'favorites',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [{ unique: true, fields: ['user_id', 'post_id'] }]
  });

  // 添加关联定义
  Favorite.associate = function(models) {
    Favorite.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Favorite.belongsTo(models.Post, { foreignKey: 'post_id', as: 'post' });
  };

  return Favorite;
};