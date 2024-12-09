const express = require("express");
const router = express.Router();
const Messaage = require("../models/Message");
const verifyAccessToken = require("../middlewares/authMiddleware");

// send message
router.post("/", verifyAccessToken, async (req, res) => {
  const { roomId, receiverId, content } = req.body;
  console.log("Request Body:", req.body);

  if (!receiverId || !content) {
    return res
      .status(400)
      .json({ error: "All fields are required to send message" });
  }

  try {
    const newMessage = new Messaage({
      roomId,
      senderId: req.user.id,
      receiverId,
      content,
    });
    const savedMessage = await newMessage.save();
    res.status(201).json({ message: savedMessage });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


const mongoose = require("mongoose");

router.get("/recent-messages", verifyAccessToken, async (req, res) => {

  //  IDs are stored as ObjectId in the database, we need to ensure that the loggedInUserId 
  // is passed as ObjectId (not a string) in the aggregation pipeline for matching.

  try {
    // Ensure that the logged-in user ID is converted to ObjectId
    const loggedInUserId = new mongoose.Types.ObjectId(req.user.id);
    console.log("LoggeInUser ID:::", typeof loggedInUserId);

    const recentMessages = await Messaage.aggregate([
      {
        $match: {
          $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
        },
      },
      {
        $sort: { createdAt: -1 }, // Sort messages by the most recent timestamp
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
          message: { $first: "$content" }, // Get the most recent message
          createdAt: { $first: "$createdAt" }, // Get the most recent timestamp
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
          userId: "$_id",
          username: "$userInfo.username",
          message: 1,
          createdAt: 1,
        },
      },
      {
        $sort: { createdAt: -1 }, // Optional: Sort conversations by most recent message
      },
    ]);

    res.status(200).json({ recentMessages });
    console.log("RecentMessages::::", recentMessages);
  } catch (error) {
    console.error("Error fetching recent messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// router.get("/recent-messages", verifyAccessToken, async (req, res) => {
//   try {
//     const loggedInUserId = req.user.id;
//     console.log("LoggedInUserId:::", loggedInUserId);

//     // Aggregate the latest messages for each user
//     const recentMessages = await Messaage.aggregate([
//       {
//         $match: {
//           $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
//         },
//       },
//       {
//         $sort: { createdAt: -1 }, // Sort messages by the most recent
//       },
//       // {
//       //   $group: {
//       //     _id: {
//       //       $cond: [
//       //         { $eq: ["$senderId", loggedInUserId] },
//       //         "$receiverId",
//       //         "$senderId",
//       //       ],
//       //     }, // Group by the other user
//       //     message: { $first: "$content" }, // Get the latest message content
//       //     createdAt: { $first: "$createdAt" }, // Get the latest timestamp
//       //   },
//       // },
//     ]);

//     res.status(200).json({ recentMessages }); // Send the aggregated data
//   } catch (error) {
//     console.error("Error fetching messages:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

//  BOTH OF THE ROUTE LOGIC ARE PERFECT. ONE LOGIC USE (receiverId) WHILE
// OTHER USE (roomId) TO FETCH ALL THE MESSAGES BETWEEN TWO USERS.

// get all messages between two users
router.get("/:receiverId", verifyAccessToken, async (req, res) => {
  const { receiverId } = req.params;

  try {
    const messages = await Messaage.find({
      // $or is used to find messages where:
      // The logged-in user sent the message to the receiver.
      // The logged-in user received the message from the receiver.
      $or: [
        { senderId: req.user.id, receiverId },
        { senderId: receiverId, receiverId: req.user.id },
      ],
    }).sort({ createdAt: 1 }); // sort messages in ascending order
    res.status(200).json({ messages });
    console.log("Messages fetched::::", messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// router.get("/:roomId", verifyAccessToken, async (req, res) => {
//   try {
//     const { roomId } = req.params;

//     const messages = await Messaage.find({ roomId }).sort({ createdAt: 1 });
//     res.status(200).json({ messages });
//   } catch (error) {
//     console.error("Error fetching messages:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

module.exports = router;
