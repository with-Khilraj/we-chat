const mongoose = require('mongoose');

const RefreshTokensSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true },
  expiry: { type: Date, required: true },
  revoked: { type: Boolean, default: false },
}, { timestamps: true });

RefreshTokensSchema.index({ expiry: 1 });  // For $lt queries
RefreshTokensSchema.index({ revoked: 1 }); // For boolean filter

module.exports = mongoose.model("RefreshToken", RefreshTokensSchema);