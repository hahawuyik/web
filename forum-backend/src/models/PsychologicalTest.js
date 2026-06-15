module.exports = (sequelize, DataTypes) => {
  const PsychologicalTest = sequelize.define('PsychologicalTest', {
    test_type: { type: DataTypes.ENUM('SAS', 'SDS'), allowNull: false },
    question_number: { type: DataTypes.INTEGER, allowNull: false },
    question_text: { type: DataTypes.STRING(500), allowNull: false },
    option_scores: { type: DataTypes.JSON, allowNull: false },
    reverse_score: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    tableName: 'psychological_tests',
    timestamps: false,
    underscored: true
  });
  return PsychologicalTest;
};