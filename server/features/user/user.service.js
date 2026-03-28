const User = require("./user.model");
const ApiError = require("../../common/utils/ApiError");
const redisClient = require("../../common/config/redisClient");
const mongoose = require("mongoose");

class UserService {
  // Get current user profile
  async getProfile(userId) {
    const user = await User.findById(userId).select("-password");
    if (!user) throw new ApiError(404, "User not found");
    return user;
  }

  // Get specific user by ID
  async getUserById(targetId, requesterId) {
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      throw new ApiError(400, "Invalid user ID format");
    }

    const query = { _id: targetId };
    // Only allow fetching verified users, unless it's the requester's own profile
    if (targetId.toString() !== requesterId.toString()) {
      query.isEmailVerified = true;
    }

    const user = await User.findOne(query).select("-password");
    if (!user) throw new ApiError(404, "User not found or unverified");
    return user;
  }

  // Get all verified users except the requester
  async getAllUsers(requesterId) {
    return await User.find({
      _id: { $ne: requesterId },
      isEmailVerified: true,
    }).select("-password");
  }

  // Check if a username is available
  async isUsernameAvailable(username) {
    const existingUser = await User.findOne({ username: username.trim() });
    return !existingUser;
  }

  // Update user status in Redis
  async updatePresence(userId, status) {
    const key = `presence:${userId}`;
    const data = {
      status, // 'online' or 'offline'
      lastActive: new Date().toISOString(),
    };
    await redisClient.set(key, JSON.stringify(data));
    
    // Also update DB for persistent record
    await User.findByIdAndUpdate(userId, { lastActive: new Date() });
    return data;
  }

  // Get user status from Redis
  async getPresence(userId) {
    const data = await redisClient.get(`presence:${userId}`);
    return data ? JSON.parse(data) : { status: "offline", lastActive: null };
  }
}

module.exports = new UserService();
