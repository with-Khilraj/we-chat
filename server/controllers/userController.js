const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const RefreshToken = require("../models/refreshTokens");
const { sendVerificationOTP, sendResetPasswordEmail } = require('../service/emailConfig')
const config = require('../config/config');
const crypto = require('crypto');
const redisClient = require('../config/redisClient');


// Generate Access and Refresh Token - For Authentication
const generateToken = (user) => {
    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "5h",
    });
    const refreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
    );

    return { accessToken, refreshToken };
};

// blaclist refresh token key helper
const blacklistKey = (token) => `blacklist:${token}`;

// OTP TTL
const OTP_TTL_SECONDS = 2 * 60; // 2 minutes

// Reset Password Token TTL
const RESET_PASSWORD_TOKEN_TTL_SECONDS = 10 * 60; // 10 minutes

// Generate  6 digits OTP 
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Redis key helper - keeps key naming consistent across all functions
const otpKey = (userId) => `otp:${userId}`;

// Redis key helper for password reset tokens
const resetTokenKey = (hashedToken) => `reset:${hashedToken}`;

// helper function: validate reset token
const validateResetToken = async (token) => {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // fetch userId from Redis using hashed token
    const userId = await redisClient.get(resetTokenKey(hashedToken));

    if (!userId) {
        return { status: "Invalid" };
    }

    const user = await User.findById(userId);

    if (!user) {
        return { status: "Invalid" };
    }

    return { status: "Valid", user, hashedToken };
}

// helper function: finalize password reset token
const finalizePasswordResetToken = async (hashedToken) => {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // just delete the Redis key — no need to hit MongoDB since we don't store anything there
    await redisClient.del(resetTokenKey(hashedToken));
}


exports.signup = async (req, res) => {
    const { email, username, phone, password } = req.body;

    if (!email || !username || !phone || !password) {
        return res.status(400).json({ message: "Please enter all the fields" });
    }

    if (!password || password.length < 5) {
        return res.status(400).json({ error: "Password must be at least 5 characters" });
    }


    try {
        // check if email already exits
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email already registered!" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = new User({
            email,
            username,
            phone,
            password: hashedPassword,
            // emailverificationOTP: otp,
            // OTPExprires: Date.now() + 2 * 60 * 1000, // valid for 2 minutes
            isEmailVerified: false,
        });

        await newUser.save();

        // Generate OTP and store in Redis with TTL
        const otp = generateOTP();
        await redisClient.set(otpKey(newUser._id), otp, 'EX', OTP_TTL_SECONDS);

        // ADD THIS
        console.log('Saved Redis key:', otpKey(newUser._id), '| OTP:', otp);

        try {
            await sendVerificationOTP(email, otp);
            res.status(201).json({
                message: "Please check your email to verify your account",
                email: email
            });
        } catch (error) {
            // email failed -> delete the created user and clean up Redis key
            await User.findByIdAndDelete(newUser._id);
            console.error("Email send failed:", error);
            res.status(500).json({ error: "Failed to send verification email." });
        }
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ error: "Failed to sign up. Please try again." });
    }
};

exports.checkUsername = async (req, res) => {
    const { username } = req.query;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(200).json({ available: false });
        } else {
            return res.status(200).json({ available: true });
        }
    } catch (error) {
        console.error("Error checking username:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });

        // ADD THESE TWO LINES
        console.log('Looking up Redis key:', otpKey(user._id));
        console.log('Stored OTP:', await redisClient.get(otpKey(user._id)));

        if (!user) {
            return res.status(400).json({ error: "User not found to verify OTP" });
        }

        // fetch OTP from Redis - Return null if expired or never set
        const storedOTP = await redisClient.get(otpKey(user._id));

        if (!storedOTP) {
            return res.status(400).json({ error: "OTP has expired. Please request a new one." });
        }

        if (storedOTP !== otp) {
            return res.status(400).json({ error: "Invalid verification code. Please try again." });
        }

        // OPT is valid - delete automatically (one-time-use)
        await redisClient.del(otpKey(user._id));

        // update user verification status
        user.isEmailVerified = true;
        await user.save();

        // Generate tokens for automatic login
        const { accessToken, refreshToken } = generateToken(user);

        // save refresh token to database
        const refreshTokenEntry = new RefreshToken({
            userId: user._id,
            token: refreshToken,
            expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // which is basically 7 days expiry
        });
        await refreshTokenEntry.save();

        // set refresh token as an HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            sameSite: "strict",
            secure: true,
        });

        res.status(200).json({
            message: "Email verified successfully",
            accessToken,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
            }
        })

    } catch (error) {
        console.error("Verification OTP error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    // validate email and password
    if (!email || !password) {
        return res.status(400).json({ error: "Please fill the required field" });
    }

    try {
        const normalizedEmail = email.toLowerCase().trim();

        // find user by email
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // 1. check password first - ALWAYS
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // 2. check if email is verified - ONLY if password is correct
        if (!user.isEmailVerified) {
            return res.status(401).json({
                error: "Please verify your email first",
                isUnverified: true,
                email: user.email
            });
        }

        // Logic to generate Aceess or Refresh Token
        const { accessToken, refreshToken } = generateToken(user);

        // save refresh token to database
        const refreshTokenEntry = new RefreshToken({
            userId: user._id,
            token: refreshToken,
            expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // which is basically 7 days expiry
        });

        await refreshTokenEntry.save();

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
        });

        res.status(200).json({
            message: "Login Successful",
            accessToken,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
            }
        });

    } catch (error) {
        console.log("Error while login:", error);
        res.status(500).json({ error: "Internal server" });
    }
};

exports.resendOTP = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email, isEmailVerified: false });

        if (!user) {
            return res.status(404).json({ error: "User not found or already verified" });
        }

        // generate new OTP and overwrite existing Redis key (resets TTL too)
        const otp = generateOTP();
        await redisClient.set(otpKey(user._id), otp, 'EX', OTP_TTL_SECONDS);

        // update user with new OTP
        // user.emailverificationOTP = otp;
        // user.OTPExprires = Date.now() + 2 * 60 * 1000; // valid for 10 minutes
        // await user.save();

        // send new OTP
        await sendVerificationOTP(email, otp);

        res.status(200).json({
            message: "New OTP sent successfully",
            email: email,
        })
    } catch (error) {
        console.error("Error while resending OTP:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !email.trim()) {
            return res.status(400).json({ error: "Email is required" });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

        // apply anti-timing base delay 300-600ms - prevents user enumeration
        await new Promise(resolve => {
            setTimeout(resolve, 300 + Math.random() * 300);
        });

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (user) {
            // generate one time (unique) password reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

            // store hashed token -> userId in Redis with TTL (no need to save in MongoDB)
            await redisClient.set(resetTokenKey(hashedToken), user._id.toString(), 'EX', RESET_PASSWORD_TOKEN_TTL_SECONDS);

            const resetURL = `${config.frontendUrl}/reset-password/${resetToken}`;

            try {
                await sendResetPasswordEmail(email, resetURL);
            } catch (emailError) {
                // email failed - delete the Redis key imediately
                await redisClient.del(resetTokenKey(hashedToken));
                return res.status(500).json({ error: "Failed to send password reset email" });
            }
        }

        // always return success response to prevent email enumeration
        res.status(200).json({ message: "If a user with this account exits, you will receive a password reset link shortly." });
    } catch (error) {
        console.error("Error in forgot password route:", error.message);
        return res.status(500).json({ error: "Error processing forgot password request" });
    }
}

exports.validateResetTokenRoute = async (req, res) => {
    try {
        const { token } = req.params;
        const result = await validateResetToken(token);

        if (result.status === 'Valid') {
            res.status(200).json({ valid: true, message: "Reset token is valid" });
        }

        return res.status(400).json({
            valid: false,
            error: result.status === 'Expired' ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
        });

    } catch (error) {
        console.error("Error validating reset token route:", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}

exports.finalizeResetTokenRoute = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(200).json({ success: true }); // treat missing token as already finalized to prevent enumeration
        }

        await finalizePasswordResetToken(token);
        return res.status(200).json({ success: true, message: "Reset token finalized successfully" });
    } catch (error) {
        console.error("Error finalizing reset token route:", error.message);
        return res.status(200).json({ success: true }); // still return success to prevent token fishing
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { password, confirmPassword } = req.body;
        const { token } = req.params;

        if (!password || password.length < 5) {
            return res.status(400).json({ error: "Password must be at least 5 characters" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: "Passwords do not match" });
        }

        const result = await validateResetToken(token);

        if (result.status === 'Invalid') {
            return res.status(400).json({ error: "INVALID_TOKEN" });
        }

        if (result.status === 'Expired') {
            return res.status(400).json({ error: "TOKEN_EXPIRED" });
        }

        const { user, hashedToken } = result;

        // Update password
        user.password = await bcrypt.hash(password, 10);
        await user.save();

        // Delete reset token from Redis — one-time use
        await redisClient.del(resetTokenKey(hashedToken));

        res.status(200).json({ message: "Password reset successful. You can now log in with your new password." });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: "Error resetting your password" });
    }
}

exports.refreshToken = async (req, res) => {
    const refreshToken = req.cookies.refreshToken; // Retrieve refresh token from cookies

    if (!refreshToken) {
        return res.status(401).json({ error: "Unauthorized. Refresh token not found!" });
    }

    try {

        // check if the token is blacklisted (revoked)
        const isBlacklisted = await redisClient.get(blacklistKey(refreshToken));
        if (isBlacklisted) {
            return res.status(403).json({ error: "Invalid or expired refresh token" });
        }

        // Verify the refresh token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        // / DB is used only to fetch expiry for TTL calculation
        const tokenEntry = await RefreshToken.findOne({ token: refreshToken }).select('expiry');

        if (!tokenEntry) {
            return res.status(403).json({ error: "Invalid or expired refresh token" });
        }

        if (new Date(tokenEntry.expiry) <= new Date()) {
            return res.status(403).json({ error: "Refresh token expired. Please login again." })
        }

        // Generate a new refresh token and access token
        const { accessToken, refreshToken: newRefreshToken } = generateToken({ _id: decoded.id });

        // Blacklist the old refresh token in Redis with an expiry matching the original token's remaining time
        const remainingTTL = Math.floor((new Date(tokenEntry.expiry) - new Date()) / 1000);
        if (remainingTTL > 0) {
            await redisClient.set(blacklistKey(refreshToken), "1", 'EX', remainingTTL);
        }


        // Delete the old refresh token from DB and save the new one
        await RefreshToken.findByIdAndDelete(tokenEntry._id);
        await RefreshToken.create({
            userId: decoded.id,
            token: newRefreshToken,
            expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        });

        // Set the new refresh token as an HTTP-only secure cookie
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
        });

        // Send the new access token
        res.status(200).json({ accessToken });

    } catch (error) {
        console.error("Error in refresh token route:", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};

exports.logout = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(400).json({ error: "Refresh token missing" });
    }

    try {
        const tokenEntry = await RefreshToken.findOne({ token: refreshToken })
            .select('expiry');

        if (tokenEntry) {
            // Blacklist in Redis — Redis owns revocation, not MongoDB
            const remainingTTL = Math.floor((new Date(tokenEntry.expiry) - Date.now()) / 1000);
            if (remainingTTL > 0) {
                await redisClient.set(blacklistKey(refreshToken), '1', 'EX', remainingTTL);
            }

            // mark the token as revoked
            await RefreshToken.findByIdAndUpdate(tokenEntry._id, { revoked: true });
        }

        // clear the refresh token cookie
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });

        res.status(200).json({ message: "Logout successfully" });
    } catch (error) {
        console.error("Error during logout:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.getProfile = async (req, res) => {
    // console.log("USER ID::::: ", req.user.id);
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ user });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({
            _id: { $ne: req.user.id },
            isEmailVerified: true
        }).select("-password");

        res.status(200).json({ users });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const mongoose = require('mongoose');

        // Validate that the ID is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid user ID format" });
        }

        // Only allow fetching verified users, or the requester fetching their own profile
        const query = { _id: req.params.id };
        if (req.params.id !== req.user.id.toString()) {
            query.isEmailVerified = true;
        }

        const user = await User.findOne(query).select("-password");
        if (!user) {
            return res.status(404).json({ error: "User not found or unverified" });
        }
        res.status(200).json({ user });
    } catch (error) {
        console.error("Error fetching user information:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
