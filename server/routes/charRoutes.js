const express = require('express');
const verifyAccessToken = require('../middlewares/authMiddleware');
const Message = require('../models/Message');
const router = express.Router();


// Add message Reaction
router.put('/:messageId/reaction', verifyAccessToken, async(req, res) => {
  try {
    const { messageId } = req.params;
    const { reaction } = req.body;

    const message = await Message.findByIdAndUpdate(
      messageId,
      { reaction },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ error: 'Message not found '});
    }

    // Emit reaction event to socket
    const io = req.app.get('io');
    io.to(message.roomId).emit('Message-reaction', {
      messageId: message._id,
      reaction: message.reaction
    });

    res.json(message);
  } catch (error) {
    console.error('Error updating message reaction:', error);
    res.status(500).json({ error: 'Internal Server error' });
  }
});


// Add message edit endpoint
router.put('/:messageId', verifyAccessToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    const message = await Message.findByIdAndUpdate(
      messageId,
      { content, edited: true },
      { new: true }
    );

    if (!message) {
      res.status(404).json({ error: 'Message not found' });
    }

    // Emit edit event to socket.IO
    const io = req.app.get('io');
    io.to(message.roomId).emit('message-edited', {
      messageId: message._id,
      content: message.content
    });

    res.json(message);
  } catch (error) {
    console.error('Error while editing message:', error);
    res.status(500).json({ error: 'Internal server error'});
  };
});


module.exports = router;