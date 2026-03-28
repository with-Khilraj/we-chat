const express = require("express");
const router = express.Router();
const chatController = require("./chat.controller");
const verifyAccessToken = require("../../common/middlewares/authMiddleware");
const { upload, uploadErrorHandler } = require("../../common/middlewares/upload");
const validate = require("../../common/middlewares/validate");
const {
  sendMessageSchema,
  updateStatusSchema,
  bulkStatusSchema,
  reactionSchema,
} = require("./chat.schema");

// Apply auth middleware to all chat routes
router.use(verifyAccessToken);

/**
 * Message Routes
 */

// Send message (handles text and media)
router.post(
  "/send",
  upload.single("file"),
  uploadErrorHandler,
  validate(sendMessageSchema),
  chatController.sendMessage
);

// Get messages for a specific room (with pagination)
router.get("/room/:roomId", chatController.getChatMessages);

// Update single message status (e.g., mark as seen)
router.patch("/status/:messageId", validate(updateStatusSchema), chatController.updateMessageStatus);

// Update bulk message status
router.post("/status/bulk", validate(bulkStatusSchema), chatController.updateBulkStatus);

// Get recent conversations for the current user
router.get("/recent", chatController.getRecentConversations);

/**
 * Reaction Routes
 */

// Add/Update reaction to a message
router.post("/reaction/:messageId", validate(reactionSchema), chatController.addReaction);

// Remove reaction from a message
router.delete("/reaction/:messageId", chatController.removeReaction);

module.exports = router;
