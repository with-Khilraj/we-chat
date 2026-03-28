const rateLimiter = require('express-rate-limit');

const loginLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 login attempts per windowMs

  handler: (req, res) => {
    const now = Date.now();
    const retryAfterMs = req.rateLimit.resetTime - now;

    res.status(429).json({
      error: "rate_limit",
      message: "Too many login attempts. Please try again after 15 minutes.",
      retryAfter: retryAfterMs > 0 ? retryAfterMs : 900000
    });
  }
});

module.exports = loginLimiter;
