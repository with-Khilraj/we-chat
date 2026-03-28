const express = require("express");
const router = express.Router();
const userController = require("./user.controller");
const verifyAccessToken = require("../../common/middlewares/authMiddleware");

// All user routes are protected by default for now
router.use(verifyAccessToken);

// Get current user profile
router.get("/profile", userController.getProfile);

// Get all verified users except requester
router.get("/all", userController.getUsers);

// Check username availability
router.get("/check-username", userController.checkUsername);

// Get specific user profile
router.get("/:id", userController.getUser);

module.exports = router;
