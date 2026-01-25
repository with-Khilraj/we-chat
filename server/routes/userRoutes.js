const express = require("express");
const userController = require("../controllers/userController");
const verifyAccessToken = require("../middlewares/authMiddleware");
const passwordResetLimiter = require('../middlewares/passwordResetLimiter');
const router = express.Router();


const validate = require('../middlewares/validate');
const { signupSchema } = require('../schemas/authSchema');

// Signup Route
router.post("/signup", validate(signupSchema), userController.signup);

// verify OTP route
router.post("/verify-otp", userController.verifyOTP);

// Login Route
router.post("/login", userController.login);

// Resend OTP Route
router.post("/resend-otp", userController.resendOTP);

// Forgot Password Route
router.post("/forgot-password", passwordResetLimiter, userController.forgotPassword);

// check username availability route
router.get("/check-username", userController.checkUsername);

// validate reset token route 
router.get('/reset-password/:token/validate', userController.validateResetTokenRoute);

// finalize reset token route route
router.post('/reset-password/finalize', userController.finalizeResetTokenRoute);

// Reset Password Route
router.post('/reset-password/:token', userController.resetPassword);

// Token Refresh Route with "token rotation" strategy
router.post("/refresh", userController.refreshToken);

// Logout Route
router.post("/logout", userController.logout);

// fetch logged-in user profile (must be before /:id)
router.get("/profile", verifyAccessToken, userController.getProfile);

// Fetch all users except the logged-in user (must be before /:id)
router.get("/all", verifyAccessToken, userController.getAllUsers);

// Fetch single user details via id (protected route)
router.get("/:id", verifyAccessToken, userController.getUserById);

module.exports = router;
