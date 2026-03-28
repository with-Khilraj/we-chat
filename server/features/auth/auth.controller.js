const authService = require("./auth.service");
const asyncHandler = require("../../common/utils/asyncHandler");
const { AUTH_CONSTANTS } = require("../../common/config/constants");

/**
 * Cookie Configuration Helper
 */
const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  });

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, // 15 mins
  });
};

const clearAuthCookies = (res) => {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };
  res.clearCookie("refreshToken", options);
  res.clearCookie("accessToken", options);
};

/**
 * Auth Controller Handlers
 */
const signup = asyncHandler(async (req, res) => {
  const result = await authService.signup(req.body);
  res.status(201).json({
    success: true,
    message: "Please check your email to verify your account",
    email: result.email,
  });
});

const verifyOTP = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.verifyOTP(req.body);
  setAuthCookies(res, accessToken, refreshToken);
  res.status(200).json({
    success: true,
    message: "Email verified successfully",
    accessToken,
    user: { id: user._id, email: user.email, username: user.username },
  });
});

const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);
  setAuthCookies(res, accessToken, refreshToken);
  res.status(200).json({
    success: true,
    message: "Login Successful",
    user: { id: user._id, email: user.email, username: user.username },
  });
});

const refreshToken = asyncHandler(async (req, res) => {
  const oldToken = req.cookies.refreshToken;
  const { accessToken, newRefreshToken } = await authService.refreshToken(oldToken);
  setAuthCookies(res, accessToken, newRefreshToken);
  res.status(200).json({ success: true, accessToken });
});

const logout = asyncHandler(async (req, res) => {
  const oldToken = req.cookies.refreshToken;
  await authService.logout(oldToken);
  clearAuthCookies(res);
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  res.status(200).json({
    success: true,
    message: "If an account exists, a reset link was sent.",
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  await authService.resetPassword(token, password);
  res.status(200).json({
    success: true,
    message: "Password reset successful. You can now log in.",
  });
});

module.exports = {
  signup,
  verifyOTP,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
};
