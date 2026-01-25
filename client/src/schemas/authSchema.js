import { z } from "zod";

export const signupSchema = z.object({
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
        .min(6, "Password must be at least 6 characters")
    // .regex(/[A-Z]/, "Password must contain at least one uppercase letter") // Optional strictness
    // .regex(/[0-9]/, "Password must contain at least one number"),
});

export const loginSchema = z.object({
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});
