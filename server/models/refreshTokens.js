const mongoose = require('mongoose');

const RefreshTokensSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true },
  expiry: { type: Date, required: true },
  revoked: { type: Boolean, default: false },
});

module.exports = mongoose.model("RefreshToken", RefreshTokensSchema);