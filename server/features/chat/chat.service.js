const Message = require("./message.model");
const mongoose = require("mongoose");
const redisClient = require("../../common/config/redisClient");
const cloudinary = require("../../common/config/cloudinary");
const streamifier = require("streamifier");
const { CHAT_CONSTANTS } = require("../../common/config/constants");
const ApiError = require("../../common/utils/ApiError");

/**
 * Redis Cache Helpers
 */
const roomCacheKey = (roomId) => `messages:${roomId}`;

const cacheMessages = async (roomId, messages) => {
  const key = roomCacheKey(roomId);
  const pipeline = redisClient.pipeline();
  pipeline.del(key);
  for (const msg of messages) {
    pipeline.rpush(key, JSON.stringify(msg));
  }
  pipeline.ltrim(key, -CHAT_CONSTANTS.CACHE_SIZE, -1);
  pipeline.expire(key, CHAT_CONSTANTS.CHAT_TTL);
  await pipeline.exec();
};

const getCachedMessages = async (roomId) => {
  const key = roomCacheKey(roomId);
  const cached = await redisClient.lrange(key, 0, -1);
  if (!cached || cached.length === 0) return null;
  await redisClient.expire(key, CHAT_CONSTANTS.CHAT_TTL);
  return cached.map((msg) => JSON.parse(msg));
};

const appendMessageToCache = async (roomId, message) => {
  const key = roomCacheKey(roomId);
  const exists = await redisClient.exists(key);
  if (!exists) return;

  const pipeline = redisClient.pipeline();
  pipeline.rpush(key, JSON.stringify(message));
  pipeline.ltrim(key, -CHAT_CONSTANTS.CACHE_SIZE, -1);
  pipeline.expire(key, CHAT_CONSTANTS.CHAT_TTL);
  await pipeline.exec();
};

const invalidateRoomCache = async (roomId) => {
  await redisClient.del(roomCacheKey(roomId));
};

/**
 * Media Helpers
 */
const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

const getUploadOptions = (mimetype) => {
  if (mimetype.startsWith("image/")) return { resource_type: "image", folder: "chat-app/images" };
  if (mimetype.startsWith("video/")) return { resource_type: "video", folder: "chat-app/videos" };
  if (mimetype.startsWith("audio/")) return { resource_type: "video", folder: "chat-app/audio" };
  if (mimetype === "application/pdf") return { resource_type: "raw", folder: "chat-app/files" };
  throw new ApiError(400, `Unsupported file type: ${mimetype}`);
};

/**
 * Chat Service
 */
class ChatService {
  async sendMessage(senderId, data, file) {
    const {
      roomId,
      receiverId,
      content,
      messageType,
      fileName,
      fileSize,
      fileType,
      duration,
      caption,
      status,
      replyTo,
    } = data;

    let fileUrl = null;
    if (file) {
      const uploadOptions = getUploadOptions(file.mimetype);
      const result = await uploadToCloudinary(file.buffer, uploadOptions);
      fileUrl = result.secure_url;
    }

    const savedMessage = await Message.create({
      roomId,
      senderId,
      receiverId,
      messageType,
      ...(messageType === "text" ? { content } : {}),
      ...(messageType !== "text" && fileUrl ? { fileUrl, fileName, fileSize, fileType, duration } : {}),
      caption,
      status: status || "sent",
      replyTo: replyTo || null,
      lastMessageTimestamp: new Date(),
    });

    const messageObj = savedMessage.toObject();
    await appendMessageToCache(roomId, messageObj);

    return messageObj;
  }

  async getMessagesByRoomId(roomId, limit = 20, before = null) {
    const parsedLimit = parseInt(limit);

    if (!before) {
      const cached = await getCachedMessages(roomId);
      if (cached) return { messages: cached, hasMore: cached.length === parsedLimit, source: "cache" };

      const messages = await Message.find({ roomId }).sort({ createdAt: -1 }).limit(parsedLimit);
      const ordered = messages.reverse();
      if (ordered.length > 0) await cacheMessages(roomId, ordered.map((m) => m.toObject()));
      return { messages: ordered, hasMore: messages.length === parsedLimit, source: "db" };
    }

    const cached = await getCachedMessages(roomId);
    if (cached && cached.length > 0) {
      const beforeDate = new Date(before);
      const olderFromCache = cached.filter((msg) => new Date(msg.createdAt) < beforeDate);
      if (olderFromCache.length > 0) {
        return {
          messages: olderFromCache.slice(-parsedLimit),
          hasMore: olderFromCache.length > parsedLimit,
          source: "cache",
        };
      }
    }

    const messages = await Message.find({
      roomId,
      createdAt: { $lt: new Date(before) },
    })
      .sort({ createdAt: -1 })
      .limit(parsedLimit);

    return { messages: messages.reverse(), hasMore: messages.length === parsedLimit, source: "db" };
  }

  async updateMessageStatus(messageId, status) {
    const message = await Message.findByIdAndUpdate(messageId, { status }, { new: true });
    if (!message) throw new ApiError(404, "Message not found");
    await invalidateRoomCache(message.roomId);
    return message;
  }

  async updateBulkStatus(messageIds, status, roomId) {
    const result = await Message.updateMany({ _id: { $in: messageIds } }, { status });
    if (roomId) await invalidateRoomCache(roomId);
    return result.modifiedCount;
  }

  async addReaction(messageId, userId, emoji) {
    const message = await Message.findById(messageId);
    if (!message) throw new ApiError(404, "Message not found");

    const existingReactionIndex = message.reactions.findIndex((r) => r.userId.toString() === userId);
    if (existingReactionIndex > -1) {
      message.reactions[existingReactionIndex].emoji = emoji;
    } else {
      message.reactions.push({ userId, emoji });
    }

    await message.save();
    await invalidateRoomCache(message.roomId);
    return message;
  }

  async removeReaction(messageId, userId) {
    const message = await Message.findById(messageId);
    if (!message) throw new ApiError(404, "Message not found");

    message.reactions = message.reactions.filter((r) => r.userId.toString() !== userId);
    await message.save();
    await invalidateRoomCache(message.roomId);
    return message;
  }

  async getRecentMessages(userId) {
    const loggedInUserId = new mongoose.Types.ObjectId(userId);
    const recentMessages = await Message.aggregate([
      { $match: { $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }] } },
      { $sort: { lastMessageTimestamp: -1 } },
      {
        $group: {
          _id: { $cond: [{ $eq: ["$senderId", loggedInUserId] }, "$receiverId", "$senderId"] },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ["$receiverId", loggedInUserId] }, { $eq: ["$status", "sent"] }] }, 1, 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      { $match: { "userInfo.isEmailVerified": true } },
      {
        $project: {
          _id: "$lastMessage._id",
          senderId: "$lastMessage.senderId",
          receiverId: "$lastMessage.receiverId",
          message: { $ifNull: ["$lastMessage.content", "$lastMessage.fileUrl"] },
          messageType: "$lastMessage.messageType",
          lastMessageTimestamp: "$lastMessage.lastMessageTimestamp",
          status: "$lastMessage.status",
          unreadCount: 1,
          user: {
            id: "$userInfo._id",
            username: "$userInfo.username",
            email: "$userInfo.email",
          },
        },
      },
      { $sort: { lastMessageTimestamp: -1 } },
    ]);
    return recentMessages;
  }
}

module.exports = new ChatService();
