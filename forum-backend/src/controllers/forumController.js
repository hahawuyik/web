const { Forum } = require('../models');

exports.getForums = async (req, res) => {
  const forums = await Forum.findAll({ order: [['sort_order', 'ASC']] });
  res.json(forums);
};

exports.getForumById = async (req, res) => {
  const forum = await Forum.findByPk(req.params.id);
  if (!forum) return res.status(404).json({ msg: '版块不存在' });
  res.json(forum);
};

exports.createForum = async (req, res) => {
  try {
    const { name, description, cover_image, sort_order = 0, moderator_id } = req.body;
    if (!name) return res.status(400).json({ msg: '版块名称不能为空' });
    const forum = await Forum.create({ 
      name, 
      description, 
      cover_image,   // 新增
      sort_order,
      moderator_id 
    });
    res.status(201).json(forum);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '创建失败' });
  }
};

exports.updateForum = async (req, res) => {
  try {
    const forum = await Forum.findByPk(req.params.id);
    if (!forum) return res.status(404).json({ msg: '版块不存在' });
    const { name, description, cover_image, sort_order, moderator_id } = req.body;
    await forum.update({ 
      name, 
      description, 
      cover_image,   // 新增
      sort_order,
      moderator_id 
    });
    res.json(forum);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '更新失败' });
  }
};

exports.deleteForum = async (req, res) => {
  try {
    const forum = await Forum.findByPk(req.params.id);
    if (!forum) return res.status(404).json({ msg: '版块不存在' });
    await forum.destroy();
    res.json({ msg: '删除成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '删除失败' });
  }
};