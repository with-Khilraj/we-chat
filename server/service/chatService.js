const Message = require("../models/Message");
const mongoose = require("mongoose");
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
  try {
    const keys = await redisClient.keys(`chat:${roomId}:*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`Invalidate cache for room ${roomId}`);
    }
  } catch (err) {
    console.error('Error invalidating cache:', err);
  }
};

const getRecentMessagesService = async (userId) => {
  // Ensure userId is an objectId
  const loggedInUserId = new mongoose.Types.ObjectId(userId);

  const recentMessages = await Message.aggregate([
    {
      $match: {
        $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
      },
    },
    {
      $sort: { lastMessageTimestamp: -1 }, // Sort messages by the most recent timestamp
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ["$senderId", loggedInUserId] },
            "$receiverId", // If sender, group by receiverId
            "$senderId", // If receiver, group by senderId
          ],
        },
        senderId: { $first: "$senderId" },
        message: { $first: "$content" }, // Get the most recent message
        fileUrl: { $first: "$fileUrl" },
        fileType: { $first: "$fileType" },
        messageType: { $first: "$messageType" },
        lastMessage: { $first: '$$ROOT' },
        lastMessageTimestamp: { $first: "$lastMessageTimestamp" }, // Get the most recent timestamp

        unreadCount: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$receiverId', loggedInUserId] }, { $eq: ['$status', 'sent'] }] },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $lookup: {
        from: "users", // Assuming your users collection is named 'users'
        localField: "_id", // Match the grouped ID (other user's ID)
        foreignField: "_id",
        as: "userInfo",
      },
    },
    {
      $unwind: "$userInfo", // Flatten the userInfo array
    },
    {
      $project: {
        _id: '$lastMessage._id',
        senderId: '$lastMessage.senderId',
        receiverId: '$lastMessage.receiverId',
        message: {
          $ifNull: ['$lastMessage.content', '$lastMessage.fileUrl'],
        },
        messageType: '$lastMessage.messageType',
        lastMessageTimestamp: '$lastMessage.lastMessageTimestamp',
        status: '$lastMessage.status',
        user: '$user',
        unreadCount: 1,
      },
    },
    {
      $sort: { lastMessageTimestamp: -1 }, // Optional: Sort conversations by most recent message
    },
  ]);

  return recentMessages;
};

module.exports = { getChatHistory, invalidateChatCache, getRecentMessagesService };