const { createClient } = require('redis');

let redisClient = null;

const connectRedis = async () => {
  // Skip Redis entirely if REDIS_URL is not configured
  if (!process.env.REDIS_URL) {
    console.log('ℹ️  Redis not configured — running without cache (set REDIS_URL to enable)');
    return;
  }

  try {
    redisClient = createClient({ url: process.env.REDIS_URL });

    // Suppress all errors so Redis never crashes the app
    redisClient.on('error', () => { /* silent — cache disabled */ });
    redisClient.on('connect', () => console.log('✅ Redis connected'));

    await redisClient.connect();
  } catch {
    console.warn('⚠️  Redis unavailable — cache disabled');
    redisClient = null;
  }
};

const getRedis = () => redisClient;

const cacheGet = async (key) => {
  if (!redisClient?.isReady) return null;
  try {
    const val = await redisClient.get(key);
    return val ? JSON.parse(val) : null;
  } catch { return null; }
};

const cacheSet = async (key, value, ttlSeconds = 300) => {
  if (!redisClient?.isReady) return;
  try { await redisClient.setEx(key, ttlSeconds, JSON.stringify(value)); } catch { /* silent */ }
};

const cacheDel = async (key) => {
  if (!redisClient?.isReady) return;
  try { await redisClient.del(key); } catch { /* silent */ }
};

module.exports = { connectRedis, getRedis, cacheGet, cacheSet, cacheDel };
