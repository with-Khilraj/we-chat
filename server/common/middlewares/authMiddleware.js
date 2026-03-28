const jwt = require('jsonwebtoken');

const verifyAccessToken = (req, res, next) => {
  const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach user info to request by decoding
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    res.status(401).json({ error: "Unauthorized" });
  }
};

module.exports = verifyAccessToken;