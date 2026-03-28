const rateLimiter = require('express-rate-limit');

const passwordResetLimiter = rateLimiter({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 5, // limit each IP to 5 requests per windowMs

  handler: (req, res) => {
    const now = Date.now();
    const retryAfterMs = req.rateLimit.resetTime - now;

    res.status(429).json({
      error: "rate_limit",
      message: "Too many attempts. Try again after 30 minutes.",
      retryAfter: retryAfterMs > 0 ? retryAfterMs : 30 * 60 * 1000
    });
  }
});

module.exports = passwordResetLimiter;