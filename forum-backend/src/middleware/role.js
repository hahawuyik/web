module.exports = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ msg: '未认证' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ msg: '权限不足，需要角色：' + allowedRoles.join(' 或 ') });
    }
    next();
  };
};