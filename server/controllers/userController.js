const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const RefreshToken = require("../models/refreshTokens");
const { sendVerificationOTP, sendResetPasswordEmail } = require('../service/emailConfig')
const config = require('../config');
const crypto = require('crypto');

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

// Generate  6 digits OTP 
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// helper function to validate reset token
const validateResetToken = async (token) => {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ resetPasswordToken: hashedToken });

    if (!user) {
        return { status: "Invalid" };
    }

    if (user.resetPasswordExpires < Date.now()) {
        return { status: "Expired" };
    }

    return { status: "Valid", user };
};

// helper function: finalize password reset token
const finalizePasswordResetToken = async (token) => {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({ resetPasswordToken: hashedToken });

    if (!user) {
        return; // silently return if user not found
    }

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
};

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

        // Generate email verification token for Email Verification only
        const otp = generateOTP();

        // Create a new user
        const newUser = new User({
            email,
            username,
            phone,
            password: hashedPassword,
            emailverificationOTP: otp,
            OTPExprires: Date.now() + 2 * 60 * 1000, // valid for 2 minutes
            isEmailVerified: false,
        });

        await newUser.save();

        try {
            await sendVerificationOTP(email, otp);
            res.status(201).json({
                message: "Please check your email to verify your account",
                email: email
            });
        } catch (error) {
            // email failed -> delete the created user
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
        const user = await User.findOne({
            email,
            // emailverificationOTP: otp,
            // OTPExprires: { $gt: Date.now() }
        });

        // Find the user by email only
        if (!user) {
            return res.status(400).json({ error: "User not found to verify OTP" });
        }

        // Check if OTP is expired
        if (!user.OTPExprires || user.OTPExprires < Date.now()) {
            return res.status(400).json({ error: "OTP has expired. Please request a new one." });
        }

        // Check if OTP is incorrect
        if (user.emailverificationOTP !== otp) {
            return res.status(400).json({ error: "Invalid verification code. Please try again." });
        }

        // update user verification status
        user.isEmailVerified = true;
        user.emailverificationOTP = undefined;
        user.OTPExprires = undefined;

        await user.save();

        // Generate tokens for automatic login
        const { accessToken, refreshToken } = generateToken(user);

        // save refresh token to database
        const refreshTokenEntry = new RefreshToken({
            userId: user._id,
            token: refreshToken,
            expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // which is basically 7 days expiry
        });

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
        // find user by email
        const user = await User.findOne({ email });

        // check if email is verified
        if (!user.isEmailVerified) {
            return res.status(401).json({
                error: "Please verify your email first"
            })
        }

        // check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid password" });
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

        const otp = generateOTP();

        // update user with new OTP
        user.emailverificationOTP = otp;
        user.OTPExprires = Date.now() + 2 * 60 * 1000; // valid for 10 minutes
        await user.save();

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

        // Validate email
        if (!email || !email.trim()) {
            return res.status(400).json({ error: 'Email is required' });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // apply anti-timing base delay 300-600ms
        await new Promise(resolve => {
            setTimeout(resolve, 300 + Math.random() * 300)
        });

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        // generate token only if user exist
        if (user) {
            // generate one time (unique) password reset token
            const resetToken = crypto.randomBytes(32).toString('hex');

            // hash token before saving to database
            const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

            user.resetPasswordToken = hashedToken;
            user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // token valid for 10 minutes
            await user.save();

            const resetURL = `${config.frontendUrl}/reset-password/${resetToken}`;

            try {
                await sendResetPasswordEmail(email, resetURL);
            } catch (emailError) {
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;
                await user.save();
                return res.status(500).json({ error: "Failed to send password reset email" });
            }
        }

        res.status(200).json({
            message: 'If a user with this email exists, you will receive a password reset link shortly.'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: "Error processing your request" });
    }
};

exports.validateResetTokenRoute = async (req, res) => {
    try {
        const { token } = req.params;
        const result = await validateResetToken(token);

        if (result.status === 'Valid') {
            return res.status(200).json({ valid: true });
        }


        return res.status(200).json({
            valid: false,
            error: result.status === 'Expired'
                ? "TOKEN_EXPIRED"
                : "INVALID_TOKEN"
        });
    } catch (error) {
        console.error('Error validating reset token:', error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.finalizeResetTokenRoute = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(200).json({ success: true }); // still return true to prevent token fishing
        }

        await finalizePasswordResetToken(token);
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error finalizing reset token:', error);
        res.status(200).json({ success: true }); // still return true to prevent token fishing
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

        const user = result.user;

        // udate password and clear token
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ message: "Password reset successful. You can now log in with your new password." });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: "Error resetting your password" });
    }
};

exports.refreshToken = async (req, res) => {
    const refreshToken = req.cookies.refreshToken; // Retrieve refresh token from cookies

    if (!refreshToken) {
        return res.status(401).json({ error: "Unauthorized. Refresh token not found!" });
    }

    try {

        // Verify the refresh token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        // Find the refresh token in the database
        const tokenEntry = await RefreshToken.findOne({ token: refreshToken });

        if (!tokenEntry || tokenEntry.revoked) {
            return res.status(403).json({ error: "Invalid or expired refresh token" });
        }

        if (new Date(tokenEntry.expiry) <= new Date()) {
            return res.status(403).json({ error: "Refresh token expired. Please login again." })
        }

        // Generate a new refresh token and access token
        const { accessToken, refreshToken: newRefreshToken } = generateToken({ _id: decoded.id });


        // Revoke the old refresh token and save the new one
        tokenEntry.revoked = true;
        await tokenEntry.save();

        // Save the new refresh token in the database
        await RefreshToken.create({
            token: newRefreshToken,
            expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        });

        // // Generate a new access token
        // const accessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
        //   expiresIn: "20m", // Short lifespan for access token
        // });

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
    console.log("Cookkies:::::", req.cookies)
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(400).json({ error: "Refresh token missing" });
    }

    try {
        // mark the token as revoked
        await RefreshToken.findOneAndUpdate(
            { token: refreshToken },
            { revoked: true }
        );

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
        const users = await User.find({ _id: { $ne: req.user.id } }).select("-password");
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

        const user = await User.findById(req.params.id).select("-password");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json({ user });
    } catch (error) {
        console.error("Error fetching user information:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
