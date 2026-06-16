module.exports = (sequelize, DataTypes) => {
  const TestResult = sequelize.define('TestResult', {
    user_id: DataTypes.INTEGER,
    test_type: DataTypes.ENUM('SAS', 'SDS'),
    score: DataTypes.INTEGER,
    standard_score: DataTypes.INTEGER,
    result_level: DataTypes.STRING(50),
    answers: DataTypes.JSON
  }, {
    tableName: 'test_results',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  return TestResult;
};