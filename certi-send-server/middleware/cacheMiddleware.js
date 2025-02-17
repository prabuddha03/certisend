// middleware/cacheMiddleware.js
const CacheService = require('../services/cacheService');

exports.cacheMiddleware = (duration) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    
    const cachedData = await CacheService.get(key);
    
    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData,
        fromCache: true
      });
    }

    // Modify res.json to cache the response
    const originalJson = res.json;
    res.json = function(data) {
      if (data.success) {
        CacheService.set(key, data.data, duration);
      }
      originalJson.call(this, data);
    };

    next();
  };
};