const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const mongoose = require("mongoose");
const multer = require("multer");
const verifyAccessToken = require("../middlewares/authMiddleware");
const getChatHistory = require("../service/chatService");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// send message
router.post("/", verifyAccessToken, upload.single('file'), async (req, res) => {
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
    const newMessage = new Message({
      roomId,
      senderId: req.user.id,
      receiverId,
      content: messageType === "text" ? content : null,
      messageType,
      fileUrl,
      fileName,
      fileSize,
      fileType,
      duration,
      caption,
      status,
      lastMessageTimestamp: new Date(),
      createdAt: new Date(),
    });
    const savedMessage = await newMessage.save();

    //emit 'new_message' event whenever a new message is sent (for real-time updates)
    const io = req.app.get("io");
    if (io) {
      io.emit("new_message", {
        receiverId: receiverId,
        senderId: req.user.id,
        content: content,
        message: content || fileUrl,
        messageType: savedMessage.messageType,
        fileType: savedMessage.fileType,
        lastMessageTimestamp: savedMessage.lastMessageTimestamp,
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
});





// validate ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
}

// update the specific message status
router.put('/:messageId/status', verifyAccessToken, async (req, res) => {
  const { messageId } = req.params;  // messageId is a string here not OjbectId


  // Validate messageId is a valid ObjectId
  if(!isValidObjectId(messageId)) {
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
});


// to update the status of multiple messages at once
router.put('/status/bulk', verifyAccessToken, async (req, res) => {
  const { messageIds, status } = req.body;

  // Validate all messageIds are valid ObjectIds
  if (!Array.isArray(messageIds) || messageIds.some((id) => !isValidObjectId(id))) {
    return res.status(400).json({ error: "Invalid messagesIds" });
  }

  // only allow 'seen' status updates
  if (status !== 'seen') {
    return res.status(400).json({ error: "Invalid status. Only 'seen' is allowed." });
  }

  try {
    const result = await Message.updateMany(
      { _id: {$in: messageIds }},
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
})


// get the recent message of all users
router.get("/recent-messages", verifyAccessToken, async (req, res) => {
  //  IDs are stored as ObjectId in the database, we need to ensure that the loggedInUserId
  // is passed as ObjectId (not a string) in the aggregation pipeline for matching.

  try {
    // Ensure that the logged-in user ID is converted to ObjectId
    const loggedInUserId = new mongoose.Types.ObjectId(req.user.id);
    // console.log("LoggedInUser ID:::", typeof loggedInUserId);

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
          // thumbnailUrl: { $first: "$thumbnailUrl" },
          lastMessageTimestamp: { $first: "$lastMessageTimestamp" }, // Get the most recent timestamp
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
          _id: 0, // Exclude default MongoDB ID
          receiverId: "$_id",
          senderId: 1,
          username: "$userInfo.username",
          message: 1,
          fileUrl: 1,
          fileType: 1,
          messageType: 1,
          // thumbnailUrl: 1,
          lastMessageTimestamp: 1,
        },
      },
      {
        $sort: { lastMessageTimestamp: -1 }, // Optional: Sort conversations by most recent message
      },
    ]);

    res.status(200).json({ recentMessages });
  } catch (error) {
    console.error("Error fetching recent messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// get all messages between two users using 'roomId'
router.get("/:roomId", verifyAccessToken, async (req, res) => {
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
});

// GET ALL MESSAGES BETWEEN TWO USERS USING 'receiverId'
// router.get("/:receiverId", verifyAccessToken, async (req, res) => {
//   const { receiverId } = req.params;

//   try {
//     const messages = await Message.find({
//       // $or is used to find messages where:
//       // The logged-in user sent the message to the receiver.
//       // The logged-in user received the message from the receiver.
//       $or: [
//         { senderId: req.user.id, receiverId },
//         { senderId: receiverId, receiverId: req.user.id },
//       ],
//     }).sort({ createdAt: 1 }); // sort messages in ascending order
//     res.status(200).json({ messages });
//   } catch (error) {
//     console.error("Error fetching messages:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

module.exports = router;
