const userService = require("./user.service");
const asyncHandler = require("../../common/utils/asyncHandler");

// Get current logged-in user profile
const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user.id);
  res.status(200).json({ success: true, user });
});

// Get specific user by ID
const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id, req.user.id);
  res.status(200).json({ success: true, user });
});

// Get all verified users except requester
const getUsers = asyncHandler(async (req, res) => {
  const users = await userService.getAllUsers(req.user.id);
  res.status(200).json({ success: true, users });
});

// Check username availability
const checkUsername = asyncHandler(async (req, res) => {
  const { username } = req.query;
  const available = await userService.isUsernameAvailable(username);
  res.status(200).json({ success: true, available });
});

module.exports = {
  getProfile,
  getUser,
  getUsers,
  checkUsername,
};
