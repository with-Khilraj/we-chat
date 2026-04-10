const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    lastActive: { type: Date, default: null },
    bio: { type: String, default: "" },
    avatar: { type: String, default: "" },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
