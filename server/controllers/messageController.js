const Message = require("../models/Message");
const mongoose = require("mongoose");
const chatService = require("../service/chatService");

// Validate UUID instead of ObjectId
const isValidUUID = (id) => {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[4][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(id);
};

exports.sendMessage = async (req, res) => {
    const {
        // _id, ---- old way
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
    } = req.body;

    console.log("Request Body:", req.body);
    console.log("Uploaded file:", req.file)

    // Validate receiverId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
        return res.status(400).json({ error: "Invalid receiverId" });
    }

    // Handle file upload
    const fileUrl = req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}` : null;

    //  Validate required fields based on messageType
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
            // _id: _id || undefined, ---- old way
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
            lastMessageTimestamp: new Date(),
            createdAt: new Date(),
        });

        const newMessage = new Message(messageData);
        const savedMessage = await newMessage.save();

        //emit 'new_message' event whenever a new message is sent (for real-time updates)
        const io = req.app.get("io");
        if (io) {
            io.emit("new_message", {
                _id: savedMessage._id,
                receiverId: receiverId,
                senderId: req.user.id,
                content: content,
                message: content || fileUrl,
                messageType: savedMessage.messageType,
                fileType: savedMessage.fileType,
                lastMessageTimestamp: savedMessage.lastMessageTimestamp,
                stauts: savedMessage.status,
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

exports.updateMessageStatus = async (req, res) => {
    const { messageId } = req.params;  // messageId is a string here not OjbectId


    if (!isValidUUID(messageId)) {
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
    const { messageIds, status } = req.body;

    // Validate all messageIds are valid UUIDs
    if (!Array.isArray(messageIds) || messageIds.some((id) => !isValidUUID(id))) {
        return res.status(400).json({ error: "Invalid messagesIds" });
    }

    // only allow 'seen' status updates
    if (status !== 'seen') {
        return res.status(400).json({ error: "Invalid status. Only 'seen' is allowed." });
    }

    try {
        const result = await Message.updateMany(
            { _id: { $in: messageIds } },  // works with strings
            { status }
        );

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

exports.getMessagesByRoomId = async (req, res) => {
    try {
        const { roomId } = req.params;

        // normal way to get the chats
        const messages = await Message.find({ roomId }).sort({ createdAt: 1 });

        // using caching
        // const messages = await getChatHistory(roomId);

        res.status(200).json({ messages });
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
