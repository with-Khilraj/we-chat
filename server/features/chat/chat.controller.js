const chatService = require("./chat.service");
const asyncHandler = require("../../common/utils/asyncHandler");

/**
 * Chat Controller Handlers
 */

const sendMessage = asyncHandler(async (req, res) => {
  const message = await chatService.sendMessage(req.user.id, req.body, req.file);

  // Socket emission
  const io = req.app.get("io");
  if (io) {
    io.emit("new_message", {
      ...message,
      message: message.content || message.fileUrl, // Legacy compatibility
    });
  }

  res.status(201).json({ success: true, message });
});

const getChatMessages = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { limit, before } = req.query;
  const result = await chatService.getMessagesByRoomId(roomId, limit, before);
  res.status(200).json(result);
});

const updateMessageStatus = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { status } = req.body;
  const message = await chatService.updateMessageStatus(messageId, status);

  const io = req.app.get("io");
  if (io) {
    io.emit("message-status-updated", {
      messageId: message._id,
      status: message.status,
    });
  }

  res.status(200).json({ success: true, message });
});

const updateBulkStatus = asyncHandler(async (req, res) => {
  const { messageIds, status, roomId } = req.body;
  const updatedCount = await chatService.updateBulkStatus(messageIds, status, roomId);

  const io = req.app.get("io");
  if (io) {
    io.emit("message-status-updated-bulk", { messageIds, status });
  }

  res.status(200).json({ success: true, updatedCount });
});

const addReaction = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const message = await chatService.addReaction(messageId, req.user.id, emoji);

  const io = req.app.get("io");
  if (io) {
    io.emit("message-reaction-updated", {
      messageId: message._id,
      reactions: message.reactions,
      roomId: message.roomId,
    });
  }

  res.status(200).json({ success: true, message });
});

const removeReaction = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const message = await chatService.removeReaction(messageId, req.user.id);

  const io = req.app.get("io");
  if (io) {
    io.emit("message-reaction-updated", {
      messageId: message._id,
      reactions: message.reactions,
      roomId: message.roomId,
    });
  }

  res.status(200).json({ success: true, message });
});

const getRecentConversations = asyncHandler(async (req, res) => {
  const recentMessages = await chatService.getRecentMessages(req.user.id);
  res.set("Cache-Control", "no-store");
  res.status(200).json({ success: true, recentMessages });
});

module.exports = {
  sendMessage,
  getChatMessages,
  updateMessageStatus,
  updateBulkStatus,
  addReaction,
  removeReaction,
  getRecentConversations,
};
