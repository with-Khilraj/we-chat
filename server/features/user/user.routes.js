const express = require("express");
const router = express.Router();
const userController = require("./user.controller");
const verifyAccessToken = require("../../common/middlewares/authMiddleware");
const { upload, uploadErrorHandler } = require("../../common/middlewares/upload");

// All user routes are protected by default for now
router.use(verifyAccessToken);

// Get current user profile
router.get("/profile", userController.getProfile);

// Update current user profile
router.put("/profile", upload.single('avatar'), uploadErrorHandler, userController.updateProfile);

// Get all verified users except requester
router.get("/all", userController.getUsers);

// Check username availability
router.get("/check-username", userController.checkUsername);

// Get specific user profile
router.get("/:id", userController.getUser);

module.exports = router;
