const { AiConversation, AiMessage, AiAssistant } = require('../models');
const aiService = require('../services/aiService');

// 获取当前用户的所有会话（每个助手一个会话）
exports.getConversations = async (req, res) => {
  try {
    const convs = await AiConversation.findAll({
      where: { user_id: req.user.id },
      include: [{ model: AiAssistant, as: 'assistant', attributes: ['id', 'name', 'avatar'] }],
      order: [['updated_at', 'DESC']]
    });
    res.json(convs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '获取会话失败' });
  }
};

// 获取某个会话的历史消息
exports.getMessages = async (req, res) => {
  const { conversationId } = req.params;
  const conv = await AiConversation.findOne({
    where: { id: conversationId, user_id: req.user.id }
  });
  if (!conv) return res.status(404).json({ msg: '会话不存在' });
  const messages = await AiMessage.findAll({
    where: { conversation_id: conversationId },
    order: [['created_at', 'ASC']]
  });
  res.json(messages);
};

// 发送消息（支持自动创建会话）
exports.sendMessage = async (req, res) => {
  const { conversationId, assistantId, content } = req.body;
  if (!content) return res.status(400).json({ msg: '消息内容不能为空' });

  let conv;
  if (conversationId) {
    conv = await AiConversation.findOne({ where: { id: conversationId, user_id: req.user.id } });
    if (!conv) return res.status(403).json({ msg: '无权访问该会话' });
  } else {
    if (!assistantId) return res.status(400).json({ msg: '缺少 assistantId' });
    const assistant = await AiAssistant.findByPk(assistantId);
    if (!assistant) return res.status(404).json({ msg: 'AI助手不存在' });
    conv = await AiConversation.create({
      user_id: req.user.id,
      assistant_id: assistantId,
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  // 保存用户消息
  await AiMessage.create({
    conversation_id: conv.id,
    role: 'user',
    content: content,
    created_at: new Date()
  });

  // 获取历史消息（最近10条，保留上下文）
  const historyMessages = await AiMessage.findAll({
    where: { conversation_id: conv.id },
    order: [['created_at', 'ASC']],
    limit: 10
  });
  const history = historyMessages.map(m => ({ role: m.role, content: m.content }));

  const assistant = await AiAssistant.findByPk(conv.assistant_id);
  // 调用 AI 服务
  const aiReply = await aiService.callRoleAssistant(assistant, content, history);

  // 保存 AI 回复
  const aiMessage = await AiMessage.create({
    conversation_id: conv.id,
    role: 'assistant',
    content: aiReply,
    created_at: new Date()
  });

  // 更新会话更新时间
  await conv.update({ updated_at: new Date() });

  res.json({
    reply: aiReply,
    messageId: aiMessage.id,
    conversationId: conv.id
  });
};