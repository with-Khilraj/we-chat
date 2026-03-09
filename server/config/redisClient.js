const Redis = require('ioredis');

// If REDIS_URL is set (Upstash / Redis Cloud / production), use it.
// Otherwise, fall back to local Redis (development).
const redisClient = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL)       // Cloud / Upstash
  : new Redis({                             // Local
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT || 6379,
    });

redisClient.on('connect', () => {
  console.log(`[Redis] Connected (${process.env.REDIS_URL ? 'cloud' : 'local'})`);
});

redisClient.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

redisClient.on('reconnecting', () => {
  console.warn('[Redis] Reconnecting...');
});

module.exports = redisClient;
