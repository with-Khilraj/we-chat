const express = require("express");
const userController = require("../controllers/userController");
const verifyAccessToken = require("../common/middlewares/authMiddleware");
const router = express.Router();

// Status check for username availability
router.get("/check-username", userController.checkUsername);

// fetch logged-in user profile (must be before /:id)
router.get("/profile", verifyAccessToken, userController.getProfile);

// Fetch all users except the logged-in user (must be before /:id)
router.get("/all", verifyAccessToken, userController.getAllUsers);

// Fetch single user details via id (protected route)
router.get("/:id", verifyAccessToken, userController.getUserById);

module.exports = router;
