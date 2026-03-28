const { z } = require("zod");

// signup Schema
const signupSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be under 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^\+?[0-9\s-]{10,}$/, "Invalid phone number format"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

// login Schema
const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// otp Schema
const otpSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

// forgotPassword Schema
const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

// resetPassword Schema
const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
});

module.exports = {
  signupSchema,
  loginSchema,
  otpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
