require('dotenv').config({
  path: process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development'
});

module.exports = {
  frontendUrl: process.env.FRONTEND_URL,
}