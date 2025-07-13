const redis = require('redis');

// Create Redis client
const redisClient = redis.createClient({
  url: 'redis://localhost:6379', // Default Redis URL
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) return new Error("Max retries reached");
      return Math.min(retries * 100, 3000); 
    },
  },
});

// Handle connection errors
redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

// Handle successful connection
redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

// Handle reconnection
redisClient.on('reconnecting', () => {
  console.log('Reconnecting to Redis...');
});

// Connect to Redis
async function connectRedis() {
  try {
    await redisClient.connect();
    console.log("Redis client connected");
  } catch (err) {
    console.error('Redis connection failed:', err);
  }
};

connectRedis();

module.exports = {redisClient, connectRedis};