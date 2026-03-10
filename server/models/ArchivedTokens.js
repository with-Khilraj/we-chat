const mongoose = require('mongoose');

const ArchivedTokensSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token:     { type: String, required: true },
  expiry:    { type: Date, required: true },
  revoked:   { type: Boolean, default: false },
  archivedAt: { type: Date, default: Date.now }, // when it was moved to archive
}, { timestamps: true });

ArchivedTokensSchema.index({ archivedAt: 1 }); // For cleanup/$lt queries

module.exports = mongoose.model('ArchivedToken', ArchivedTokensSchema);