const User = require("../features/user/user.model");
const RefreshToken = require("../features/auth/auth.token.model");
const config = require("../common/config/config");
const crypto = require('crypto');
const redisClient = require('../common/config/redisClient');
const bcrypt = require("bcrypt");

// User profile and listing methods (to be moved to features/user later)
exports.checkUsername = async (req, res) => {
    const { username } = req.query;
    try {
        const existingUser = await User.findOne({ username });
        res.status(200).json({ available: !existingUser });
    } catch (error) {
        console.error("Error checking username:", error);
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
        res.set('Cache-Control', 'no-store');
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
