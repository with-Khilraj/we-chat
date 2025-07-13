const Message = require("../models/Message");
const redisClient = require("./redisClient");

const getChatHistory = async (roomId, limit = 40, skip = 0) => {

  try {
    const cacheKey = `chat:${roomId}:${skip}:${limit}`;

    // try to fetch from redis
    const cachedMessages = await redisClient.get(cacheKey);
    if (cachedMessages) {
      console.log(`Cache hit for ${cacheKey}`);
      return JSON.parse(cachedMessages);
    }

    // If not in cache, fetch from database(MongoDB)
    console.log(`Cache miss for ${cacheKey}, querying database(MongoDB)`);
    const messages = await Message.find({ roomId })
      .sort({ createdAt: -1 })
      .skipt(Number(skip))
      .limit(Number(limit))
      .lean();

    // Store in cache with a TTL (example: 5 minutes)
    await redisClient.setex(cacheKey, 300, JSON.stringify(messages));
    console.log(`Cached message for ${cacheKey}`);

    return messages;
  } catch (error) {
    console.error('Error in getChatHistory:', error);
    // Fallback to MongoDB without caching on error
    return await Message.find({ roomId })
      .sort({ createdAt: 1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .lean();
  }
};

// Invalidate cache when a new message is sent or edited
const invalidateChatCache = async (roomId) => {
  try{
    const keys = await redisClient.keys(`chat:${roomId}:*`);
    if(keys.length > 0) {
      await redisClient.del(keys);
      console.log(`Invalidate cache for room ${roomId}`);
    }
  } catch(err) {
    console.error('Error invalidating cache:', err);
  }
};

module.exports = { getChatHistory, invalidateChatCache };