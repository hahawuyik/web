const { Post, User, Forum, Reply, EmotionLog, Notification ,AiAssistant} = require('../models');
const { Op } = require('sequelize');
const sensitiveFilter = require('../services/sensitiveFilter');
const aiService = require('../services/aiService');

exports.getPostsByForum = async (req, res) => {
  const { forumId } = req.params;
  const { sort = 'latest', page = 1, limit = 20 } = req.query;
  let order;
  switch (sort) {
    case 'latest_reply': order = [['is_top', 'DESC'], ['updated_at', 'DESC']]; break;
    case 'most_view': order = [['is_top', 'DESC'], ['view_count', 'DESC']]; break;
    default: order = [['is_top', 'DESC'], ['created_at', 'DESC']];
  }
  const where = { forum_id: forumId, status: 'normal' };
  const posts = await Post.findAndCountAll({
    where,
    order,
    offset: (page - 1) * limit,
    limit: parseInt(limit),
    include: [{ model: User, as: 'author', attributes: ['id', 'username', 'avatar'] },
              {model: EmotionLog, as: 'emotion_log', attributes: ['category']}
  ]
  });

    // 匿名化处理
  const currentUserId = req.user ? req.user.id : null;
  posts.rows = anonymizePosts(posts.rows, currentUserId);

  res.json(posts);
};

exports.getPostDetail = async (req, res) => {
  const post = await Post.findByPk(req.params.id, {
    include: [
      { model: User, as: 'author', attributes: ['id', 'username', 'avatar', 'signature'] }
    ]
  });
  if (!post || post.status === 'deleted') return res.status(404).json({ msg: '帖子不存在' });

  // 查询所有回复（不包括已删除）
  const allReplies = await Reply.findAll({
    where: { post_id: post.id, status: 'normal' },
    include: [
      { model: User, as: 'author', attributes: ['id', 'username', 'avatar'] },
      { model: AiAssistant, as: 'assistant', attributes: ['id', 'name', 'avatar'] }
    ],
    order: [['created_at', 'ASC']]
  });

  // 组装成树：顶级（parent_reply_id IS NULL）和它的 children
  const replyMap = new Map();
  const topReplies = [];

  allReplies.forEach(reply => {
    reply.dataValues.children = [];
    replyMap.set(reply.id, reply);
  });

  allReplies.forEach(reply => {
    if (reply.parent_reply_id && replyMap.has(reply.parent_reply_id)) {
      const parent = replyMap.get(reply.parent_reply_id);
      parent.dataValues.children.push(reply);
    } else {
      topReplies.push(reply);
    }
  });

  // 将树挂到 post 对象
  post.dataValues.replyTree = topReplies;

  // 增加阅读数
  await post.increment('view_count');

    // 在返回前进行匿名化
  const currentUserId = req.user ? req.user.id : null;
  const anonymizedPost = anonymizePost(post, currentUserId);

  res.json(anonymizedPost);
};

exports.createPost = async (req, res) => {
  const { title, content } = req.body;
  console.log('收到发帖请求：', { title, content });
  if (!title || !content) {
    return res.status(400).json({ msg: '标题和内容不能为空' });
  }

  // 1. 恶意过滤（假设 aiService.contentModeration 已实现）
  const moderation = await aiService.contentModeration(title + content);
  console.log('内容审核结果：', moderation);
  if (!moderation.passed) {
    return res.status(400).json({ msg: `内容违规：${moderation.reason}` });
  }

  // 2. 并行调用 AI：主题分类 + 情绪分析
  const [category, sentimentResult] = await Promise.all([
    aiService.categorizePost(title, content),          // 返回 7 类之一
    aiService.sentimentAnalysis(title + '。' + content)               // 返回 { sentiment, score }
  ]);

  // 3. 根据分类名称查找对应的板块 ID
  let forum = await Forum.findOne({ where: { name: category } });
  let forumId;
  if (!forum) {
    // fallback: 查找“其他碎碎念”板块，若没有则取第一个板块
    forum = await Forum.findOne({ where: { name: '其他碎碎念' } });
    if (!forum) {
      const firstForum = await Forum.findOne();
      forumId = firstForum ? firstForum.id : null;
    } else {
      forumId = forum.id;
    }
  } else {
    forumId = forum.id;
  }

  // 4. 创建帖子（使用自动确定的 forum_id）
  const post = await Post.create({
    title,
    content: sensitiveFilter.filter(content),
    user_id: req.user.id,
    forum_id: forumId,
    is_anonymous: req.body.is_anonymous || false,  // 是否匿名发帖
  });

  // 5. 保存情绪日志（包括主题分类）
  await EmotionLog.create({
    post_id: post.id,
    user_id: req.user.id,
    sentiment: sentimentResult.sentiment,
    score: sentimentResult.score,
    category: category,          // 主题分类，用于前端展示标签
    created_at: new Date()
  });

  // 6. 积分增加
  await req.user.increment('points', { by: 5 });

  // 7. AI 自动回复（10分钟后若无回复）
// 在创建帖子之后，积分增加之前，处理 AI 主动回复
let usedAssistant = null;
if (req.body.ai_assistant_id) {
  usedAssistant = await AiAssistant.findByPk(req.body.ai_assistant_id);
  if (usedAssistant && usedAssistant.status) {
    // 立即生成 AI 回复
    const aiReply = await aiService.callRoleAssistant(usedAssistant, title + '\n' + content);
    if (aiReply) {
      await Reply.create({
        content: `🤖 ${usedAssistant.name}：${aiReply}`,
        user_id: 5,                 // 你的 AI 用户 ID
        post_id: post.id,
        assistant_id: usedAssistant.id,
        is_ai_reply: true
      });
      // 更新帖子记录选择的助手
      await post.update({ ai_assistant_id: usedAssistant.id });
    }
  }
}

// 修改定时器逻辑（兜底）
if (!req.body.ai_assistant_id) {
  setTimeout(async () => {
    const replyCount = await Reply.count({ where: { post_id: post.id } });
    if (replyCount === 0) {
      const defaultAssistant = await aiService.getDefaultAssistant();
      if (defaultAssistant) {
        const aiReply = await aiService.callRoleAssistant(defaultAssistant, title + '\n' + content);
        if (aiReply) {
          await Reply.create({
            content: `🤖 ${defaultAssistant.name}：${aiReply}`,
            user_id: 5,
            post_id: post.id,
            assistant_id: defaultAssistant.id,
            is_ai_reply: true
          });
          await Notification.create({
            user_id: req.user.id,
            type: 'system',
            content: `你的树洞收到了 ${defaultAssistant.name} 的温暖回复，快去看看吧~`,
            related_id: post.id
          });
        }
      }
    }
  }, 10 * 60 * 1000);
}


  res.status(201).json(post);

};

exports.updatePost = async (req, res) => {
  const post = await Post.findByPk(req.params.id);
  if (!post) return res.status(404).json({ msg: '帖子不存在' });
  if (post.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ msg: '只能编辑自己的帖子' });
  }
  const { title, content } = req.body;
  await post.update({ title, content: sensitiveFilter.filter(content) });
  res.json({ msg: '帖子更新成功' });
};

exports.deletePost = async (req, res) => {
  const post = await Post.findByPk(req.params.id);
  if (!post) return res.status(404).json({ msg: '帖子不存在' });
  if (post.user_id !== req.user.id && !['admin', 'moderator'].includes(req.user.role)) {
    return res.status(403).json({ msg: '无权限删除' });
  }
  await post.update({ status: 'deleted' });
  res.json({ msg: '帖子已删除' });
};

// 后台管理操作
exports.topPost = async (req, res) => {
  const post = await Post.findByPk(req.params.id);
  await post.update({ is_top: !post.is_top });
  res.json({ msg: '置顶状态已更改' });
};
exports.essencePost = async (req, res) => {
  const post = await Post.findByPk(req.params.id);
  await post.update({ is_essence: !post.is_essence });
  res.json({ msg: '加精状态已更改' });
};
exports.lockPost = async (req, res) => {
  const post = await Post.findByPk(req.params.id);
  await post.update({ is_locked: !post.is_locked });
  res.json({ msg: '锁定状态已更改' });
};

// 获取全站最新帖子（不限版块）
// postController.js 中替换原来的 getLatestPosts 函数
exports.getLatestPosts = async (req, res) => {
  let { sort = 'latest', page = 1, limit = 20 } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);
  
  let order;
  switch (sort) {
    case 'latest_reply':
      order = [['updated_at', 'DESC']];
      break;
    case 'most_view':
      order = [['view_count', 'DESC']];
      break;
    case 'latest':
    default:
      order = [['created_at', 'DESC']];
      break;
  }
  
  const where = { status: 'normal' };
  const posts = await Post.findAndCountAll({
    where,
    order,
    offset: (page - 1) * limit,
    limit,
    include: [
      { model: User, as: 'author', attributes: ['id', 'username', 'avatar'] },
      { model: EmotionLog, as: 'emotion_log', attributes: ['category'] }
    ]
  });
  
  const currentUserId = req.user ? req.user.id : null;
  const anonymizedRows = anonymizePosts(posts.rows, currentUserId);
  
  res.json({
    rows: anonymizedRows,
    count: posts.count,
    page,
    limit
  });
};

// 随机获取一个帖子
exports.getRandomPost = async (req, res) => {
  try {
    // 查询条件：只获取正常状态的帖子
    const where = { status: 'normal' };
    
    // 可选：根据查询参数过滤板块
    if (req.query.forum_id) {
      where.forum_id = req.query.forum_id;
    }
    
    // 获取符合条件的帖子总数
    const count = await Post.count({ where });
    
    // 没有帖子时返回错误
    if (count === 0) {
      return res.status(404).json({ 
        success: false, 
        msg: '暂无帖子' 
      });
    }
    
    // 生成随机偏移量（从 0 到 count-1）
    const randomOffset = Math.floor(Math.random() * count);
    
    // 获取随机帖子，同时关联作者信息和情绪标签
    const randomPost = await Post.findOne({
      where,
      offset: randomOffset,
      include: [
        { 
          model: User, 
          as: 'author', 
          attributes: ['id', 'username', 'avatar', 'signature'] 
        },
        { 
          model: EmotionLog, 
          as: 'emotion_log', 
          attributes: ['category', 'sentiment', 'score'] 
        }
      ]
    });
    
    // 返回结果
    const currentUserId = req.user ? req.user.id : null;
    const anonymizedPost = anonymizePost(randomPost, currentUserId);
    res.json({
      success: true,
      data: anonymizedPost
    });
      
  } catch (error) {
    console.error('获取随机帖子失败:', error);
    res.status(500).json({ 
      success: false, 
      msg: '服务器错误',
      error: error.message 
    });
  }
};

// 处理匿名帖子：如果帖子是匿名且当前用户不是作者，则替换作者信息为匿名占位
function anonymizePost(post, currentUserId) {
  if (!post) return post;
  // 将 currentUserId 和 post.user_id 都转为数字进行比较
  const isAuthor = currentUserId && Number(currentUserId) === Number(post.user_id);
  
  if (post.is_anonymous && !isAuthor) {
    // 替换作者信息
    if (post.author) {
      // 直接修改属性（确保响应 JSON 时生效）
      post.author.username = '匿名用户';
      post.author.avatar = '/anonymous-avatar.png';
      post.author.id = null;
      if (post.author.signature !== undefined) post.author.signature = null;
    } else {
      // 如果没有 include author，手动创建一个 author 对象挂载
      post.dataValues.author = {
        id: null,
        username: '匿名用户',
        avatar: '/anonymous-avatar.png'
      };
    }
  }
  return post;
}

// 批量处理
function anonymizePosts(posts, currentUserId) {
  if (!posts) return posts;
  if (Array.isArray(posts)) {
    return posts.map(post => anonymizePost(post, currentUserId));
  }
  return anonymizePost(posts, currentUserId);
}