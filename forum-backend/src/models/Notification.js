module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: DataTypes.INTEGER,
    type: { type: DataTypes.ENUM('reply', 'mention', 'system'), allowNull: false },
    content: DataTypes.STRING(500),
    related_id: DataTypes.INTEGER,
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  return Notification;
};