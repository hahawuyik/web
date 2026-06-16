module.exports = (sequelize, DataTypes) => {
  const Report = sequelize.define('Report', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    reporter_id: DataTypes.INTEGER,
    target_type: { type: DataTypes.ENUM('post', 'reply'), allowNull: false },
    target_id: DataTypes.INTEGER,
    reason: DataTypes.STRING(255),
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
    handled_by: DataTypes.INTEGER,
    handled_at: DataTypes.DATE
  }, {
    tableName: 'reports',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  return Report;
};