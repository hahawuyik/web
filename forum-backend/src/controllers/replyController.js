const { Reply, Post, Notification, User, AiAssistant } = require('../models');
const sensitiveFilter = require('../services/sensitiveFilter');
const aiService = require('../services/aiService');

exports.createReply = async (req, res) => {
  const { content, quoteReplyId , parentReplyId } = req.body;
  const post = await Post.findByPk(req.params.postId);
  if (!post) return res.status(404).json({ msg: '帖子不存在' });
  if (post.is_locked) return res.status(403).json({ msg: '帖子已锁定，无法回复' });

  // ✅ 1. 恶意内容审核（与帖子相同逻辑）
  const moderation = await aiService.contentModeration(content);
  if (!moderation.passed) {
    return res.status(400).json({ msg: moderation.reason });
  }

  // 2. 敏感词替换（审核通过后再替换）
  const filteredContent = sensitiveFilter.filter(content);

  // 确定最终的 parent_reply_id（限制最多二级嵌套）
  let finalParentId = null;
  if (parentReplyId) {
    const parentReply = await Reply.findByPk(parentReplyId);
    if (parentReply) {
      // 如果父回复已经有父回复（即已经是二级），则新回复也挂在祖父上（平铺）
      finalParentId = parentReply.parent_reply_id || parentReply.id;
    }
  }

  // 3. 创建回复
  const reply = await Reply.create({
    content: filteredContent,
    user_id: req.user.id,
    post_id: req.params.postId,
    quote_reply_id: quoteReplyId || null,
    parent_reply_id: finalParentId || null
  });

  // 4. 重新查询带上作者信息（用于前端实时显示）
  const newReply = await Reply.findByPk(reply.id, {
    include: [{ model: User, as: 'author', attributes: ['id', 'username', 'avatar'] }]
  });

  await post.increment('reply_count');

  await req.user.increment('points', { by: 1 });
  

  // 5. 通知楼主
  if (post.user_id !== req.user.id) {
    await Notification.create({
      user_id: post.user_id,
      type: 'reply',
      content: `${req.user.username} 回复了您的帖子《${post.title}》`,
      related_id: reply.id
    });
  }

  // 6. 通知被引用者 & 如果是引用AI回复则触发AI再回复
  if (quoteReplyId) {
    const quotedReply = await Reply.findByPk(quoteReplyId, { 
      include: [
        { model: User, as: 'author' },
        { model: AiAssistant, as: 'assistant' }  // 注意需要关联
      ] 
    });
    
    if (quotedReply && quotedReply.assistant) {
      // 这是用户回复了一条AI回复 → 触发AI继续对话
      // 构建对话历史：先获取该AI回复之前的上下文（简化：只取当前这条AI回复和用户的新消息）
      // 更完善的做法：向上追溯直到用户原始提问，这里简单取最后两条。
      const assistant = quotedReply.assistant;
      const userMessage = content;
      // 获取原始用户问题（即触发这条AI回复的那条用户消息）
      // 方法：找到这条AI回复的父回复（quote_reply_id），如果父回复是用户，则取其内容。
      let parentUserMessage = '';
      if (quotedReply.quote_reply_id) {
        const parentReply = await Reply.findByPk(quotedReply.quote_reply_id);
        if (parentReply && !parentReply.is_ai_reply) {
          parentUserMessage = parentReply.content;
        }
      }
      const history = [];
      if (parentUserMessage) {
        history.push({ role: 'user', content: parentUserMessage });
        history.push({ role: 'assistant', content: quotedReply.content.replace(/^🤖\s*\S+：/, '') }); // 去掉前缀
      }
      history.push({ role: 'user', content: userMessage });
      
      // 异步调用AI，不阻塞主回复响应
      aiService.callRoleAssistant(assistant, userMessage, history).then(aiReply => {
        if (aiReply) {
          Reply.create({
            content: `🤖 ${assistant.name}：${aiReply}`,
            user_id: 5,
            post_id: req.params.postId,
            assistant_id: assistant.id,
            is_ai_reply: true,
            quote_reply_id: reply.id   // 指向用户的这条回复
          });
        }
      }).catch(err => console.error('AI对话回复失败', err));
      
    } else if (quotedReply && quotedReply.user_id !== req.user.id) {
      // 普通用户被引用，只发通知
      await Notification.create({
        user_id: quotedReply.user_id,
        type: 'reply',
        content: `${req.user.username} 引用了您的回复`,
        related_id: reply.id
      });
    }
  }

  // 检测 @ 触发
const atMatch = content.match(/@(\S+)/);
if (atMatch) {
  const assistantName = atMatch[1];
  const assistant = await AiAssistant.findOne({ where: { name: assistantName, status: 1 } });
  if (assistant) {
    // 异步响应，不阻塞原回复返回
    aiService.callRoleAssistant(assistant, content).then(aiReply => {
      if (aiReply) {
        Reply.create({
          content: `🤖 ${assistant.name}：${aiReply}`,
          user_id: 5,
          post_id: req.params.postId,
          assistant_id: assistant.id,
          is_ai_reply: true
        });
      }
    }).catch(err => console.error('AI回复失败', err));
  }
}

  res.status(201).json(newReply); // 返回带作者信息的新回复
};

exports.deleteReply = async (req, res) => {
  const reply = await Reply.findByPk(req.params.id);
  if (!reply) return res.status(404).json({ msg: '回复不存在' });
  if (reply.user_id !== req.user.id && !['admin', 'moderator'].includes(req.user.role)) {
    return res.status(403).json({ msg: '无权限删除' });
  }
  await reply.update({ status: 'deleted' });
  await Post.decrement('reply_count', { where: { id: reply.post_id } });
  res.json({ msg: '回复已删除' });
};