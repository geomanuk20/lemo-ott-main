const Redis = (() => {
  try {
    return require('ioredis');
  } catch (err) {
    console.warn('[REDIS WARNING] ioredis module not found. Redis caching will operate in bypass mode.');
    return null;
  }
})();

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = process.env.REDIS_PORT || 6379;
const redisUrl = process.env.REDIS_URL;

let redis = null;
let isConnected = false;

if (Redis) {
  try {
    const config = redisUrl || {
      host: redisHost,
      port: Number(redisPort),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 2000,
    };

    redis = new Redis(config);

    redis.on('connect', () => {
      isConnected = true;
      console.log('[REDIS] ✅ Successfully connected to Redis server');
    });

    redis.on('error', (err) => {
      if (isConnected) {
        console.error('[REDIS ERROR] Connection issue:', err.message);
      }
      isConnected = false;
    });

    redis.on('close', () => {
      isConnected = false;
    });
  } catch (err) {
    console.error('[REDIS INIT ERROR]', err.message);
    redis = null;
    isConnected = false;
  }
}

/**
 * Get cached data from Redis. Returns null if key not found or Redis unavailable.
 * @param {string} key
 * @returns {Promise<any|null>}
 */
const getCache = async (key) => {
  if (!redis || !isConnected) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error(`[REDIS GET ERROR] Key: ${key}:`, err.message);
    return null;
  }
};

/**
 * Set cached data in Redis with TTL (in seconds).
 * @param {string} key
 * @param {any} data
 * @param {number} ttlSeconds - default 300s (5 minutes)
 * @returns {Promise<boolean>}
 */
const setCache = async (key, data, ttlSeconds = 300) => {
  if (!redis || !isConnected) return false;
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
    return true;
  } catch (err) {
    console.error(`[REDIS SET ERROR] Key: ${key}:`, err.message);
    return false;
  }
};

/**
 * Clear Redis keys matching a pattern (e.g., 'movies:*').
 * @param {string} pattern
 * @returns {Promise<boolean>}
 */
const clearCachePattern = async (pattern) => {
  if (!redis || !isConnected) return false;
  try {
    let cursor = '0';
    let totalKeysCleared = 0;
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys && keys.length > 0) {
        await redis.del(...keys);
        totalKeysCleared += keys.length;
      }
    } while (cursor !== '0');
    if (totalKeysCleared > 0) {
      console.log(`[REDIS CACHE INVALIDATED] Cleared ${totalKeysCleared} key(s) for pattern: ${pattern}`);
    }
    return true;
  } catch (err) {
    console.error(`[REDIS CLEAR PATTERN ERROR] Pattern: ${pattern}:`, err.message);
    return false;
  }
};

module.exports = {
  redis,
  getCache,
  setCache,
  clearCachePattern,
  isRedisAvailable: () => Boolean(redis && isConnected),
};
