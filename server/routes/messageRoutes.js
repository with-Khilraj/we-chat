const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const verifyAccessToken = require("../middlewares/authMiddleware");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// send message
router.post("/", verifyAccessToken, upload.single('file'), messageController.sendMessage);

// get the recent message of all users
router.get("/recent-messages", verifyAccessToken, messageController.getRecentMessages);

// to update the status of multiple messages at once
router.put('/status/bulk', verifyAccessToken, messageController.updateBulkStatus);

// update the specific message status
router.put('/:messageId/status', verifyAccessToken, messageController.updateMessageStatus);

// get all messages between two users using 'roomId'
router.get("/:roomId", verifyAccessToken, messageController.getMessagesByRoomId);

// Add reaction to a message
router.post("/:messageId/reactions", verifyAccessToken, messageController.addReaction);

// Remove reaction from a message
router.delete("/:messageId/reactions", verifyAccessToken, messageController.removeReaction);

module.exports = router;