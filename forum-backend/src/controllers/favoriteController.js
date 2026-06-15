const { Favorite, Post, User } = require('../models');

exports.toggleFavorite = async (req, res) => {
  const { postId } = req.params;
  const exist = await Favorite.findOne({ where: { user_id: req.user.id, post_id: postId } });
  if (exist) {
    await exist.destroy();
    res.json({ msg: '取消收藏成功', isFavorited: false });
  } else {
    await Favorite.create({ user_id: req.user.id, post_id: postId });
    res.json({ msg: '收藏成功', isFavorited: true });
  }
};

// 获取收藏列表（分页，包含帖子详情）
exports.getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    const { count, rows } = await Favorite.findAndCountAll({
      where: { user_id: userId },
      include: [{
        model: Post,
        as: 'post',
        where: { status: 'normal' },
        required: true,
        include: [{ model: User, as: 'author', attributes: ['id', 'username', 'avatar'] }]
      }],
      order: [['created_at', 'DESC']],
      offset,
      limit
    });

    res.json({ rows, count });
  } catch (error) {
    console.error('getFavorites error:', error);
    res.status(500).json({ message: '获取收藏列表失败' });
  }
};

// 删除指定收藏记录
exports.removeFavorite = async (req, res) => {
  try {
    const favoriteId = req.params.id;
    const userId = req.user.id;

    const favorite = await Favorite.findOne({ where: { id: favoriteId, user_id: userId } });
    if (!favorite) {
      return res.status(404).json({ msg: '收藏记录不存在' });
    }
    await favorite.destroy();
    res.json({ msg: '取消收藏成功' });
  } catch (error) {
    console.error('removeFavorite error:', error);
    res.status(500).json({ msg: '服务器错误' });
  }
};