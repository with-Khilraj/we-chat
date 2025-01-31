const mongoose = require('mongoose');
const validator = require('validator');

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
    messageType: {
      type: String,
      enum: ['text', 'file', 'audio', 'video', 'photo'],
      default: 'text'
    },
    content: {
      type: String,
      required: function() { return this.messageType === 'text' },
    },
    fileUrl: {
      type: String,
      required: function() { return this.messageType !== 'text'; },
      validate: {
        validator: function(v) {
          // skip the validation if the fileUrl is undefined or null
          if (v == null) {
            return true;
          }
          // skip validation on base64 URL
          if (typeof v === 'string' && v.startsWith('data:')) {
            return true;
          }
          // return /^https?:\/\//.test(v);
          return validator.isURL(v, { protocols: ['http', 'https'], require_protocol: true });
        },
        message: props => `${props.value} is not a valid URL`
      }
    },
    fileName: {
      type: String,
      required: function() { return this.messageType !== 'text'}
    },
    fileSize: {
      type: Number,
      required: function() { return this.messageType !== 'text';},
      min: 0,
      max: 10485760 // 10MB limit (adjust as needed)
    },
    fileType: {
      type: String,
      required: function() { return this.messageType !== 'text'; },
      enum: ['image/jpeg', 'image/png', 'video/mp4', 'audio/mpeg', 'application/pdf']
    },
    duration: {
      type: Number,
      required: function() { return this.messageType === 'audio' || this.messageType === 'video';},
      min: 0,
      max: 1800 // half hour limit (adjust as needed)
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent'
    },
    seen: {
      type: Boolean,
      default: false
    },
    caption: {
      type: String,
      required: false
    },
    lastMessageTimestamp: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }  // adds createdAt and updatedAt fields
);

// Indexes for better query performance
messageSchema.index({ roomId: 1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ receiverId: 1 });

module.exports = mongoose.model("Message", messageSchema);