const { PsychologicalTest, TestResult } = require('../models');

function getResultLevel(testType, rawScore, standardScore) {
  if (testType === 'SAS') {
    if (standardScore < 50) return '正常';
    if (standardScore < 60) return '轻度焦虑';
    if (standardScore < 70) return '中度焦虑';
    return '重度焦虑';
  } else {
    if (rawScore < 53) return '正常';
    if (rawScore < 63) return '轻度抑郁';
    if (rawScore < 73) return '中度抑郁';
    return '重度抑郁';
  }
}

exports.getTestQuestions = async (req, res) => {
  const { testType } = req.params;
  if (!['SAS', 'SDS'].includes(testType)) {
    return res.status(400).json({ msg: '测试类型无效' });
  }
  const questions = await PsychologicalTest.findAll({
    where: { test_type: testType },
    order: [['question_number', 'ASC']],
    attributes: ['id', 'question_number', 'question_text', 'option_scores']
  });
  res.json(questions);
};

exports.submitTest = async (req, res) => {
  const { testType, answers } = req.body;
  if (!['SAS', 'SDS'].includes(testType) || !answers || answers.length !== 20) {
    return res.status(400).json({ msg: '请完整回答所有20个问题' });
  }
  const questions = await PsychologicalTest.findAll({ where: { test_type: testType } });
  const questionMap = new Map(questions.map(q => [q.question_number, q]));
  
  let totalScore = 0;
  const answerRecord = {};
  for (let ans of answers) {
    const q = questionMap.get(ans.questionNumber);
    if (!q) continue;
    let score = q.option_scores[ans.optionKey];
    if (q.reverse_score) score = 5 - score; // 因为选项分1-4，反向时变为4-1
    totalScore += score;
    answerRecord[ans.questionNumber] = ans.optionKey;
  }
  
  let standardScore = totalScore;
  if (testType === 'SAS') {
    standardScore = Math.round(totalScore * 1.25);
  }
  const resultLevel = getResultLevel(testType, totalScore, standardScore);
  
  const testResult = await TestResult.create({
    user_id: req.user.id,
    test_type: testType,
    score: totalScore,
    standard_score: standardScore,
    result_level: resultLevel,
    answers: answerRecord
  });
  
  const adviceMap = {
    '正常': '您的情绪状态良好，请继续保持积极心态。',
    '轻度焦虑': '您可能有一些情绪困扰，建议多与人沟通，尝试放松训练。',
    '轻度抑郁': '您可能有一些情绪困扰，建议多与人沟通，尝试放松训练。',
    '中度焦虑': '情绪困扰较明显，建议寻求专业心理咨询帮助。',
    '中度抑郁': '情绪困扰较明显，建议寻求专业心理咨询帮助。',
    '重度焦虑': '情绪问题严重，请尽快联系心理医生或危机干预热线。',
    '重度抑郁': '情绪问题严重，请尽快联系心理医生或危机干预热线。'
  };
  
  res.json({
    id: testResult.id,
    score: totalScore,
    standardScore,
    resultLevel,
    advice: adviceMap[resultLevel] || '请保持关注自己的情绪健康。'
  });
};

exports.getTestHistory = async (req, res) => {
  const { testType } = req.query;
  const where = { user_id: req.user.id };
  if (testType) where.test_type = testType;
  const history = await TestResult.findAll({
    where,
    order: [['created_at', 'DESC']],
    attributes: ['id', 'test_type', 'score', 'standard_score', 'result_level', 'created_at']
  });
  res.json(history);
};