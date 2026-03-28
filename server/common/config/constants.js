// Authentication & Account Lockout
const AUTH_CONSTANTS = {
  MAX_FAILED_ATTEMPTS: 5,
  LOCK_DURATION_MS: 15 * 60 * 1000, // 15 minutes
  OTP_TTL_SECONDS: 2 * 60, // 2 minutes
  RESET_PASSWORD_TOKEN_TTL_SECONDS: 10 * 60, // 10 minutes
  REFRESH_TOKEN_EXPIRY_DAYS: 7,
  ACCESS_TOKEN_EXPIRY: "15m",
};

// Chat & Presence
const CHAT_CONSTANTS = {
  CHAT_TTL: 24 * 60 * 60, // 24 hours in seconds
  CACHE_SIZE: 30, // Maximum messages cached per room
  PRESENCE_TTL: 24 * 60 * 60, // 24 hours in seconds
  ACTIVE_TAB_TTL: 24 * 60 * 60, // 24 hours in seconds
};

module.exports = {
  AUTH_CONSTANTS,
  CHAT_CONSTANTS,
};
