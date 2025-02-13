// const redis = require('redis');

// // Create Redis client
// const redisClient = redis.createClient({
//   url: 'redis://localhost:6379', // Default Redis URL
// });

// // Handle connection errors
// redisClient.on('error', (err) => {
//   console.error('Redis error:', err);
// });

// // Handle successful connection
// redisClient.on('connect', () => {
//   console.log('Connected to Redis');
// });

// // Connect to Redis
// redisClient.connect()
//   .then(() => console.log('Redis client connected'))
//   .catch((err) => console.error('Redis connection failed:', err));

// module.exports = redisClient;