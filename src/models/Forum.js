module.exports = (sequelize, DataTypes) => {
  const Forum = sequelize.define('Forum', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(50), allowNull: false },
    description: DataTypes.STRING(255),
    cover_image: DataTypes.STRING(255),
    moderator_id: DataTypes.INTEGER,
    sort_order: { type: DataTypes.INTEGER, defaultValue: 0 }
  }, {
    tableName: 'forums',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  return Forum;
};