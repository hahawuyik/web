const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 4000,
    dialect: 'mysql',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: true   // 生产环境必须验证证书
      }
    },
    logging: false, // 关闭 SQL 日志，开发时可改为 console.log
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 }
  }
);

module.exports = sequelize;