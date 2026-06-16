module.exports = (sequelize, DataTypes) => {
  const Settings = sequelize.define('Settings', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    site_name: { type: DataTypes.STRING(100), defaultValue: '我的论坛' },
    logo: DataTypes.STRING(255),
    icp: DataTypes.STRING(50),
    register_enabled: { type: DataTypes.BOOLEAN, defaultValue: true },
    post_review: { type: DataTypes.BOOLEAN, defaultValue: false },
    sensitive_words: DataTypes.TEXT
  }, {
    tableName: 'settings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return Settings;
};