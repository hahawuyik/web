const { AiAssistant } = require('../models');

exports.list = async (req, res) => {
  const assistants = await AiAssistant.findAll({ where: { status: 1 } });
  res.json(assistants);
};

exports.create = async (req, res) => {
  const assistant = await AiAssistant.create(req.body);
  res.status(201).json(assistant);
};

exports.update = async (req, res) => {
  const assistant = await AiAssistant.findByPk(req.params.id);
  if (!assistant) return res.status(404).json({ msg: '助手不存在' });
  await assistant.update(req.body);
  res.json(assistant);
};

exports.delete = async (req, res) => {
  const assistant = await AiAssistant.findByPk(req.params.id);
  if (!assistant) return res.status(404).json({ msg: '助手不存在' });
  await assistant.destroy();
  res.json({ msg: '删除成功' });
};