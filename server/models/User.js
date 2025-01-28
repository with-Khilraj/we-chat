const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isOnline: { type: Boolean, default: false },
    lastActive: { type: Date, default: null },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailverificationOTP: String,
    OTPExprires: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
