const rateLimiter = require('express-rate-limit');

const passwordResetLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 60 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many password reset attempts. Please try again in an hour.'
});

module.exports = { passwordResetLimiter };