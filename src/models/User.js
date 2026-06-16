module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      username: { type: DataTypes.STRING(50), allowNull: false, unique: { name: 'username', msg: '用户名已存在' } },
    email: { type: DataTypes.STRING(100), unique: { name: 'email', msg: '邮箱已被使用' } },
    mobile: { type: DataTypes.STRING(20), unique: { name: 'mobile', msg: '手机号已被使用' } },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    avatar: { type: DataTypes.STRING(255), defaultValue: '/uploads/default-avatar.png' },
    signature: { type: DataTypes.STRING(200) },
    bio: { type: DataTypes.TEXT },
    role: { type: DataTypes.ENUM('user', 'moderator', 'admin', 'system'), defaultValue: 'user' },
    points: { type: DataTypes.INTEGER, defaultValue: 0 },
    level: { type: DataTypes.INTEGER, defaultValue: 1 },
    status: { type: DataTypes.ENUM('active', 'banned'), defaultValue: 'active' }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return User;
};