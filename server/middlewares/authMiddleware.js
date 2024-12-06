const jwt = require('jsonwebtoken');

const verifyAccessToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("Decoded print::: ", decoded);
    req.user = decoded; // attach user info to request by decoding
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token expired or invalid" });
  }
};

module.exports = verifyAccessToken;