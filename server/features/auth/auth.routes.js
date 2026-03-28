const express = require("express");
const router = express.Router();
const authController = require("./auth.controller");
const validate = require("../../common/middlewares/validate");
const {
  signupSchema,
  loginSchema,
  otpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("./auth.schema");

// Import limiters from common middlewares (assuming they stay there for now)
const registerLimiter = require("../../common/middlewares/registerLimiter");
const loginLimiter = require("../../common/middlewares/loginLimiter");
const passwordResetLimiter = require("../../common/middlewares/passwordResetLimiter");

/**
 * Authentication Routes
 */

// Signup & OTP Verification
router.post("/signup", registerLimiter, validate(signupSchema), authController.signup);
router.post("/verify-otp", validate(otpSchema), authController.verifyOTP);

// Login & Session Management
router.post("/login", loginLimiter, validate(loginSchema), authController.login);
router.post("/refresh", authController.refreshToken);
router.post("/logout", authController.logout);

// Password Reset Flow
router.post("/forgot-password", passwordResetLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password/:token", passwordResetLimiter, validate(resetPasswordSchema), authController.resetPassword);

module.exports = router;
