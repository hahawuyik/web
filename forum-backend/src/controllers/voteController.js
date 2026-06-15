const { UserVote, Post, Reply, User } = require('../models'); // 导入 User

exports.vote = async (req, res) => {
  const { targetType, targetId, voteType } = req.body;
  if (!['post', 'reply'].includes(targetType)) return res.status(400).json({ msg: '无效的目标类型' });
  if (!['like', 'dislike'].includes(voteType)) return res.status(400).json({ msg: '无效的投票类型' });

  const existing = await UserVote.findOne({
    where: { user_id: req.user.id, target_type: targetType, target_id: targetId }
  });

  // 获取内容作者ID
  let authorId = null;
  if (targetType === 'post') {
    const post = await Post.findByPk(targetId);
    if (!post) return res.status(404).json({ msg: '帖子不存在' });
    authorId = post.user_id;
  } else {
    const reply = await Reply.findByPk(targetId);
    if (!reply) return res.status(404).json({ msg: '回复不存在' });
    authorId = reply.user_id;
  }

  // 处理旧投票的影响（计数回滚 + 积分回滚如果撤销的是点赞）
  if (existing) {
    // 删除旧投票记录
    await existing.destroy();
    // 根据旧的投票类型减少对应计数
    if (existing.vote_type === 'like') {
      if (targetType === 'post') await Post.decrement('like_count', { where: { id: targetId } });
      else await Reply.decrement('like_count', { where: { id: targetId } });
      // 撤销点赞：作者减1分
      if (authorId && authorId !== req.user.id) { // 不能给自己点赞加分，这里去掉自己给自己点赞的加分逻辑（可选）
        await User.decrement('points', { by: 1, where: { id: authorId } });
      }
    } else if (existing.vote_type === 'dislike') {
      if (targetType === 'post') await Post.decrement('dislike_count', { where: { id: targetId } });
      else await Reply.decrement('dislike_count', { where: { id: targetId } });
      // 点踩不扣分，所以无需操作积分
    }
  }

  // 新增新投票（如果不是取消操作）
  await UserVote.create({
    user_id: req.user.id,
    target_type: targetType,
    target_id: targetId,
    vote_type: voteType
  });

  // 根据新投票类型增加对应计数和积分
  if (voteType === 'like') {
    if (targetType === 'post') await Post.increment('like_count', { where: { id: targetId } });
    else await Reply.increment('like_count', { where: { id: targetId } });
    // 给作者加1分（不能给自己加分，且作者存在）
    if (authorId && authorId !== req.user.id) {
      await User.increment('points', { by: 1, where: { id: authorId } });
    }
  } else if (voteType === 'dislike') {
    if (targetType === 'post') await Post.increment('dislike_count', { where: { id: targetId } });
    else await Reply.increment('dislike_count', { where: { id: targetId } });
    // 点踩不扣分
  }

  // 返回最新计数
  let updatedTarget = null;
  if (targetType === 'post') {
    updatedTarget = await Post.findByPk(targetId, { attributes: ['like_count', 'dislike_count'] });
  } else {
    updatedTarget = await Reply.findByPk(targetId, { attributes: ['like_count', 'dislike_count'] });
  }

  res.json({
    msg: '投票成功',
    like_count: updatedTarget.like_count,
    dislike_count: updatedTarget.dislike_count
  });
};

exports.getUserVoteStatus = async (req, res) => {
  const { targetType, targetId } = req.query;
  const vote = await UserVote.findOne({
    where: { user_id: req.user.id, target_type: targetType, target_id: targetId }
  });
  res.json({ voted: !!vote, voteType: vote ? vote.vote_type : null });
};