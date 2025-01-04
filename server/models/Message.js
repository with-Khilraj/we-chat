const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true },
    
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    content: {
      type: String,
      required: true
    },
    lastMessageTimestamp: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }  // adds createdAt and updatedAt fields
);

module.exports = mongoose.model("Message", messageSchema);