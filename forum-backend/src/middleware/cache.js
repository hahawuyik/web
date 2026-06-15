const redis = require('../config/redis');

module.exports = (keyPrefix, expireSeconds = 60) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next();
    const cacheKey = `${keyPrefix}:${req.originalUrl}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    } catch (err) {
      console.warn('Redis get error:', err);
    }
    const originalJson = res.json;
    res.json = function(data) {
      try {
        redis.setex(cacheKey, expireSeconds, JSON.stringify(data)).catch(console.error);
      } catch (err) {}
      originalJson.call(this, data);
    };
    next();
  };
};