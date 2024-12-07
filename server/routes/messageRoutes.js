const express = require('express');
const router = express.Router();
const Messaage = require("../models/Message");
const verifyAccessToken = require('../middlewares/authMiddleware');

// send message
router.post('/', verifyAccessToken, async (req, res) => {
  const { receiverId, content } = req.body;

  if (!receiverId || !content) {
    return res.status(400).json({ error: "All fields are required to send message"});
  }

  try {
    const newMessage = new Messaage({
      senderId: req.user.id,
      receiverId,
      content,
    });
    const savedMessage = await newMessage.save();
    res.status(201).json({ message: savedMessage});
  } catch (error) {
    console.error("Error sending message:", error)
    res.status(500).json({ error: "Internal server error" });
  }
});


// get all messages between two users
router.get('/:receiverId', verifyAccessToken, async (req, res) => {
  const { receiverId } = req.params;

  try {
    const messages = await Messaage.find({
      $or: [
        { senderId: req.user.id, receiverId },
        { senderId: receiverId, receiverId: req.user.id},
      ]
    }).sort({ createdAt: 1 });  // sort messages in ascending order
    res.status(200).json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal server error" });

  }
})