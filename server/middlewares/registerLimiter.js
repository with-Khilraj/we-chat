const rateLimiter = require('express-rate-limit');

const registerLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 60 minutes
  max: 5, // limit each IP to 5 signup attempts per windowMs

  handler: (req, res) => {
    const now = Date.now();
    const retryAfterMs = req.rateLimit.resetTime - now;

    res.status(429).json({
      error: "rate_limit",
      message: "Too many accounts created from this IP. Please try again after an hour.",
      retryAfter: retryAfterMs > 0 ? retryAfterMs : 3600000
    });
  }
});

module.exports = registerLimiter;
