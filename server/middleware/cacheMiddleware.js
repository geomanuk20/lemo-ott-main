const { redis, getCache, setCache, clearCachePattern, isRedisAvailable } = require('../redisClient');

/**
 * Express middleware for Redis Caching.
 * @param {string} prefix - Key prefix (e.g. 'movies', 'sliders', 'pages')
 * @param {number} durationSeconds - Cache TTL in seconds (default: 300s / 5m)
 */
const cacheMiddleware = (prefix, durationSeconds = 300) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Bypass cache if Redis is unavailable
    if (!isRedisAvailable()) {
      res.setHeader('X-Cache', 'BYPASS-REDIS-OFFLINE');
      return next();
    }

    // Generate unique cache key based on route, query params, and admin status
    const isAdmin = Boolean(req.user?.isAdmin || req.headers['x-admin-token'] || req.headers['authorization']);
    const cacheKey = `${prefix}:${req.originalUrl || req.url}:${isAdmin ? 'admin' : 'public'}`;

    try {
      const cachedData = await getCache(cacheKey);

      if (cachedData !== null) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Content-Type', 'application/json');
        return res.json(cachedData);
      }

      // Cache MISS - intercept res.json to store the result in Redis
      res.setHeader('X-Cache', 'MISS');
      const originalJson = res.json.bind(res);

      res.json = (body) => {
        // Only cache successful 200 responses
        if (res.statusCode >= 200 && res.statusCode < 300 && body) {
          setCache(cacheKey, body, durationSeconds).catch(err => {
            console.error(`[CACHE MIDDLEWARE SET ERROR] ${cacheKey}:`, err.message);
          });
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      console.error(`[CACHE MIDDLEWARE ERROR] ${cacheKey}:`, err.message);
      next();
    }
  };
};

/**
 * Creates an Express Rate Limiter backed by Redis (or memory fallback if Redis unavailable).
 */
const createRateLimiter = ({ windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests, please try again later.' }) => {
  let rateLimit, RedisStore;
  try {
    rateLimit = require('express-rate-limit');
  } catch (err) {
    console.warn('[RATE LIMIT WARNING] express-rate-limit not found. Rate limiting bypassed.');
    return (req, res, next) => next();
  }

  try {
    const { RedisStore: RS } = require('rate-limit-redis');
    RedisStore = RS;
  } catch (err) {
    RedisStore = null;
  }

  const options = {
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: typeof message === 'string' ? { message } : message,
  };

  if (RedisStore && isRedisAvailable() && redis) {
    try {
      options.store = new RedisStore({
        sendCommand: (...args) => redis.call(...args),
      });
    } catch (storeErr) {
      console.warn('[RATE LIMIT REDIS STORE ERROR] Falling back to memory store:', storeErr.message);
    }
  }

  return rateLimit(options);
};

module.exports = {
  cacheMiddleware,
  createRateLimiter,
  invalidateCache: clearCachePattern,
};
