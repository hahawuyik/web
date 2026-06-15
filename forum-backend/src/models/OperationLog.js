module.exports = (sequelize, DataTypes) => {
  const OperationLog = sequelize.define('OperationLog', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    admin_id: DataTypes.INTEGER,
    action: DataTypes.STRING(100),
    target_type: DataTypes.STRING(50),
    target_id: DataTypes.INTEGER,
    detail: DataTypes.TEXT,
    ip: DataTypes.STRING(45)
  }, {
    tableName: 'operation_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  return OperationLog;
};