/*

forgotPassword     → hash token → save to User document (resetPasswordToken + resetPasswordExpires)
validateResetToken → hash token → User.findOne({ resetPasswordToken }) → check expiry manually
finalizeResetToken → hash token → User.findOne → clear fields → user.save()
resetPassword      → validateResetToken → hash password → clear fields → user.save()

Problems with current approach:
  # Every token check hits MongoDB and queries by a hashed field
  # Expiry is checked manually in code instead of automatically
  # Token cleanup requires user.save() just to clear two fields
  # resetPasswordToken and resetPasswordExpires fields pollute the User document

*/


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