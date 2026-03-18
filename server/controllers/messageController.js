const Message = require("../models/Message");
const mongoose = require("mongoose");
const chatService = require("../service/chatService");
const redisClient = require("../config/redisClient");

// Cache constants
const CHAT_TTL = 24 * 60 * 60; // 24 hours in seconds
const CACHE_SIZE = 30;   // Maximum messages cached per room

// cache key helper
const roomCacheKey = (roomId) => `messages:${roomId}`;

// Helper: write messages to Redis cache
const cacheMessges = async (roomId, messages) => {
    const key = roomCacheKey(roomId);
    const pipeline = redisClient.pipeline();

    // clear existing cache for this room
    pipeline.del(key);

    // push messages in order (oldest => newest)
    for (const msg of messages) {
        pipeline.rpush(key, JSON.stringify(msg));
    }

    // Cap list at CACHE_SIZE (keep newest messages)
    pipeline.ltrim(key, -CACHE_SIZE, -1);

    // Set TTL for the cache
    pipeline.expire(key, CHAT_TTL);

    await pipeline.exec();
}

// HELPER: Read messages from Redis cache
const getCachedMessages = async (roomId) => {
    const key = roomCacheKey(roomId);
    const cached = await redisClient.lrange(key, 0, -1);

    if (!cached || cached.length === 0) return null;

    // refresh TTL on every cache hit
    await redisClient.expire(key, CHAT_TTL);

    // parse JSON strings back into objects
    return cached.map((msg) => JSON.parse(msg));
};

// Helper: Append a single message to cache
const appendMessageToCache = async (roomId, message) => {
    const key = roomCacheKey(roomId);

    // only append if cache already exits
    const exists = await redisClient.exists(key);
    if (!exists) return;

    const pipeline = redisClient.pipeline();
    pipeline.rpush(key, JSON.stringify(message));
    pipeline.ltrim(key, -CACHE_SIZE, -1);  // keep only last CACHE_SIZE messages
    pipeline.expire(key, CHAT_TTL);  // refresh TTL

    await pipeline.exec();
};

// Helper: Invalidate cache for a room
// Called when message status updates affect cache data
const invalidateRoomCache = async (roomId) => {
    const key = roomCacheKey(roomId);
    await redisClient.del(key);
};

exports.sendMessage = async (req, res) => {
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
        replyTo, // Get replyTo from body
    } = req.body;

    console.log("Request Body:", req.body);
    console.log("Uploaded file:", req.file)

    // Validate receiverId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
        return res.status(400).json({ error: "Invalid receiverId" });
    }

    const fileUrl = req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}` : null;

    if (!roomId || !receiverId || !messageType) {
        return res
            .status(400)
            .json({ error: "receiverId is required to send message" });
    }

    if (messageType === "text" && !content) {
        return res.status(400).json({ error: "content is required for text messages" });
    }

    if (messageType !== "text") {
        if (!fileUrl || !fileSize || !fileType) {
            return res
                .status(400)
                .json({ error: "fileUrl, fileSize, and fileType are required for non-text messages" });
        }

        if ((messageType === "file" || messageType === "photo") && !fileName) {
            return res.status(400).json({ error: "fileName is required for file messages" });
        }

        if ((messageType === "audio" || messageType === "video") && !duration) {
            return res.status(400).json({ error: "duration is required for audio and video messages" });
        }

    }

    try {
        const messageData = new Message({
            roomId,
            senderId: req.user.id,
            receiverId,
            content: messageType === "text" ? content : null,
            messageType,
            messageType,
            ...(messageType === 'text' ? { content } : {}), // Only include content for text
            ...(messageType !== 'text' && fileUrl
                ? { fileUrl, fileName, fileSize, fileType, duration }
                : {}), // Only include file fields for non-text
            caption,
            status: status || 'sent', // Default status to 'sent'
            replyTo: replyTo || null,
            lastMessageTimestamp: new Date(),
            createdAt: new Date(),
        });

        const newMessage = new Message(messageData);
        const savedMessage = await newMessage.save();

        // append new message to Redis cache (if room cache exists)
        await appendMessageToCache(roomId, savedMessage.toObject());

        //emit 'new_message' event whenever a new message is sent (for real-time updates)
        const io = req.app.get("io");
        if (io) {
            io.emit("new_message", {
                _id: savedMessage._id,
                receiverId,
                senderId: req.user.id,
                content,
                message: content || fileUrl,
                messageType: savedMessage.messageType,
                fileType: savedMessage.fileType,
                lastMessageTimestamp: savedMessage.lastMessageTimestamp,
                fileType: savedMessage.fileType,
                lastMessageTimestamp: savedMessage.lastMessageTimestamp,
                stauts: savedMessage.status,
                replyTo: savedMessage.replyTo,
            });
        } else {
            console.warn("Socket.IO instance not found");
        }

        res.status(201).json({ message: savedMessage });
    } catch (error) {
        console.error("Error sending message:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.getMessagesByRoomId = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { limit = 20, before } = req.query;
        const parsedLimit = parseInt(limit);

        // If no 'before' cursor, fetch initial batch
        if (!before) {
            // try Redis cache first
            const cached = await getCachedMessages(roomId);

            if (cached) {
                console.log(`Cache [Hit]: ${roomId}`);
                return res.status(200).json({
                    messages: cached,
                    hasMore: cached.length === parsedLimit,
                    source: 'cache',
                });
            }

            console.log(`[Cache MISS] room: ${roomId} - fetching from MongoDB`);

            // Cache miss - fetch from MongoDB
            const messages = await Message.find({ roomId })
                .sort({ createdAt: -1 })
                .limit(parsedLimit);

            const ordered = messages.reverse();

            // populate cache for next queue
            if (ordered.length > 0) {
                await cacheMessges(roomId, ordered.map((m) => m.toObject()));
            }

            // Return messages in chronological order (oldest to newest)
            return res.status(200).json({
                messages: ordered,
                hasMore: messages.length === parsedLimit,
                source: 'db',
            });
        }

        // pagination load (with 'before' cursor)
        // check if requested messages exist within cache
        const cached = await getCachedMessages(roomId);

        if (cached && cached.length > 0) {
            const beforeDate = new Date(before);

            // filter cache message older than 'before' cursor
            const olderFromCache = cached.filter((msg) => new Date(msg.createdAt) < beforeDate);

            // if we have enough messages, return them
            if (olderFromCache.length > 0) {
                console.log(`Cache HIT - pagination: ${roomId}`);
                return res.status(200).json({
                    messages: olderFromCache.slice(-parsedLimit),
                    hasMore: olderFromCache.length > parsedLimit,
                    source: 'cache',
                });
            }
        }

        // Cache doesn't have older messages — fall through to MongoDB
        console.log(`[Cache MISS - pagination] room: ${roomId} — fetching from MongoDB`);

        const messages = await Message.find({
            roomId,
            createdAt: { $lt: new Date(before) },
        })
            .sort({ createdAt: -1 })
            .limit(parsedLimit);

        return res.status(200).json({
            messages: messages.reverse(),
            hasMore: messages.length === parsedLimit,
            source: 'db',
        });


    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.updateMessageStatus = async (req, res) => {
    const { messageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
        return res.status(400).json({ error: "Invalid messageId" });
    }
    const { status } = req.body;

    // only allow 'seen' status updates
    if (status !== 'seen') {
        return res.status(400).json({ error: "Invalid status. Only 'seen' is allowed." })
    }

    try {
        const message = await Message.findByIdAndUpdate(
            messageId,
            { status },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }

        // Invalidate cache - status change must reflect on next load
        await invalidateRoomCache(message.roomId);

        // Emit status update via Socket.IO
        const io = req.app.get('io');
        if (io) {
            io.emit('message-status-updated', {
                messageId: message._id,
                status: message.status,
            });
        }

        res.status(200).json({ message });
    } catch (error) {
        console.error("Error updating message status:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


exports.updateBulkStatus = async (req, res) => {
    const { messageIds, status, roomId } = req.body;

    if (!Array.isArray(messageIds) || messageIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
        return res.status(400).json({ error: "Invalid messagesIds" });
    }

    if (status !== 'seen') {
        return res.status(400).json({ error: "Invalid status. Only 'seen' is allowed." });
    }

    try {
        const result = await Message.updateMany(
            { _id: { $in: messageIds } },  // works with strings
            { status }
        );

        // Invalidate cache if roomId provided
        if (roomId) await invalidateRoomCache(roomId);

        // Emit status update via Socket.IO
        const io = req.app.get('io');
        if (io) {
            io.emit('message-status-updated-bulk', {
                messageIds,
                status
            });
        }

        res.status(200).json({ updatedCount: result.modifiedCount });
    } catch (error) {
        console.error("Error updating messaging status:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


exports.getRecentMessages = async (req, res) => {
    try {
        const recentMessages = await chatService.getRecentMessagesService(req.user.id);
        res.status(200).json({ recentMessages });
    } catch (error) {
        console.error("Error fetching recent messages:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.addReaction = async (req, res) => {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id; // From verifyAccessToken

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
        return res.status(400).json({ error: "Invalid messageId" });
    }

    try {
        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ error: "Message not found" });

        // Check if user already reacted
        const existingReactionIndex = message.reactions.findIndex(
            (r) => r.userId.toString() === userId
        );

        if (existingReactionIndex > -1) {
            // Update existing reaction
            message.reactions[existingReactionIndex].emoji = emoji;
        } else {
            // Add new reaction
            message.reactions.push({ userId, emoji });
        }

        await message.save();

        // Invalidate cache - reaction must reflect on next load
        await invalidateRoomCache(message.roomId);

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('message-reaction-updated', {
                messageId: message._id,
                reactions: message.reactions,
                roomId: message.roomId,
            });
        }

        res.status(200).json({ message });
    } catch (error) {
        console.error("Error adding reaction:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.removeReaction = async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
        return res.status(400).json({ error: "Invalid messageId" });
    }

    try {
        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ error: "Message not found" });

        // Remove reaction
        message.reactions = message.reactions.filter(
            (r) => r.userId.toString() !== userId
        );

        await message.save();

        // Invalidate cache - reaction must reflect on next load
        await invalidateRoomCache(message.roomId);

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('message-reaction-updated', {
                messageId: message._id,
                reactions: message.reactions,
                roomId: message.roomId,
            });
        }

        res.status(200).json({ message });
    } catch (error) {
        console.error("Error removing reaction:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

