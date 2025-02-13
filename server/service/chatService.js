const Message = require("../models/Message");
const redisClient = require("./redisClient");

const getChatHistory = async (roomId) => {
  const cacheKey = `chat:${roomId}`;

  try {
    // Check cache first
    const cachedMessages = await redisClient.get(cacheKey);
    if (cachedMessages) {
      return JSON.parse(cachedMessages);
    }

    // If not in cache, fetch from database
    console.log('Cache miss: Fetching message from database');
    const messages = await Message.find({ roomId }).sort({ createdAt: -1 })
      .limit(100);

    // Store in cache with a TTL (example: 5 minutes)
    await redisClient.setex(cacheKey, 300, JSON.stringify(messages));

    return messages;
  } catch (error) {
    console.error('Error in getChatHistory:', error);
    throw error; 
  }
};

module.exports = getChatHistory;