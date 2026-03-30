const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../user/user.model");
const RefreshToken = require("./auth.token.model");
const redisClient = require("../../common/config/redisClient");
const { AUTH_CONSTANTS } = require("../../common/config/constants");
const ApiError = require("../../common/utils/ApiError");
const { sendVerificationOTP, sendResetPasswordEmail } = require("../../common/services/emailConfig"); // Temporary path until email is moved
const config = require("../../common/config/config");

// Generate Access and Refresh Tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY,
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: `${AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY_DAYS}d`,
  });

  return { accessToken, refreshToken };
};


// Redis Key Helpers
const otpKey = (userId) => `otp:${userId}`;
const resetTokenKey = (hashedToken) => `reset:${hashedToken}`;
const blacklistKey = (token) => `blacklist:${token}`;


// Auth Service Logic
class AuthService {
  async signup({ email, username, phone, password }) {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      throw new ApiError(400, "User with this email or username already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      email,
      username,
      phone,
      password: hashedPassword,
      isEmailVerified: false,
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await redisClient.set(otpKey(newUser._id), otp, "EX", AUTH_CONSTANTS.OTP_TTL_SECONDS);

    try {
      await sendVerificationOTP(email, otp);
    } catch (error) {
      await User.findByIdAndDelete(newUser._id);
      throw new ApiError(500, "Failed to send verification email");
    }

    return { email: newUser.email };
  }

  async verifyOTP({ email, otp }) {
    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");

    const storedOTP = await redisClient.get(otpKey(user._id));
    if (!storedOTP || storedOTP !== otp) {
      throw new ApiError(400, "Invalid or expired OTP");
    }

    await redisClient.del(otpKey(user._id));
    user.isEmailVerified = true;
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id);

    await RefreshToken.create({
      userId: user._id,
      token: refreshToken,
      expiry: new Date(Date.now() + AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    });

    return { user, accessToken, refreshToken };
  }

  async login({ email, password }) {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) throw new ApiError(401, "Invalid email or password");

    if (user.lockedUntil && user.lockedUntil > Date.now()) {
      const minutesLeft = Math.ceil((user.lockedUntil - Date.now()) / 1000 / 60);
      throw new ApiError(423, `Account locked. Try again in ${minutesLeft} minutes.`);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= AUTH_CONSTANTS.MAX_FAILED_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + AUTH_CONSTANTS.LOCK_DURATION_MS);
      }
      await user.save();
      throw new ApiError(401, "Invalid email or password");
    }

    if (!user.isEmailVerified) {
      throw new ApiError(401, "Please verify your email first", [{ isUnverified: true, email: user.email }]);
    }

    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id);

    await RefreshToken.create({
      userId: user._id,
      token: refreshToken,
      expiry: new Date(Date.now() + AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    });

    return { user, accessToken, refreshToken };
  }

  async logout(refreshToken) {
    const tokenEntry = await RefreshToken.findOne({ token: refreshToken });
    if (tokenEntry) {
      const remainingTTL = Math.floor((new Date(tokenEntry.expiry) - Date.now()) / 1000);
      if (remainingTTL > 0) {
        await redisClient.set(blacklistKey(refreshToken), "1", "EX", remainingTTL);
      }
      await RefreshToken.findByIdAndDelete(tokenEntry._id);
    }
  }

  async refreshToken(oldRefreshToken) {
    if (!oldRefreshToken) {
      throw new ApiError(401, "No refresh token provided");
    }

    const isBlacklisted = await redisClient.get(blacklistKey(oldRefreshToken));
    if (isBlacklisted) throw new ApiError(403, "Token revoked");

    let decoded;
    try {
      decoded = jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
      throw new ApiError(401, "Invalid or expired refresh token");
    }

    const tokenEntry = await RefreshToken.findOne({ token: oldRefreshToken });
    if (!tokenEntry || new Date(tokenEntry.expiry) <= new Date()) {
      throw new ApiError(403, "Invalid or expired session");
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.id);

    const remainingTTL = Math.floor((new Date(tokenEntry.expiry) - Date.now()) / 1000);
    if (remainingTTL > 0) {
      await redisClient.set(blacklistKey(oldRefreshToken), "1", "EX", remainingTTL);
    }

    await RefreshToken.findByIdAndDelete(tokenEntry._id);
    await RefreshToken.create({
      userId: decoded.id,
      token: newRefreshToken,
      expiry: new Date(Date.now() + AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async forgotPassword(email) {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

      await redisClient.set(resetTokenKey(hashedToken), user._id.toString(), "EX", AUTH_CONSTANTS.RESET_PASSWORD_TOKEN_TTL_SECONDS);

      const resetURL = `${config.frontendUrl}/reset-password/${resetToken}`;
      await sendResetPasswordEmail(email, resetURL);
    }
  }

  async resetPassword(token, password) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const userId = await redisClient.get(resetTokenKey(hashedToken));

    if (!userId) throw new ApiError(400, "Invalid or expired reset token");

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    user.password = await bcrypt.hash(password, 10);
    await user.save();
    await redisClient.del(resetTokenKey(hashedToken));
  }
}

module.exports = new AuthService();
