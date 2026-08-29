const path = require('path');

// Resolve .env from the project root rather than process.cwd(): process
// managers such as PM2 and systemd do not always start the app from the
// project directory, and dotenv would then silently find no file.
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI,
  mongoDbName: process.env.MONGO_DB_NAME || 'crawlit',
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  refreshIntervalMs: Number(process.env.REFRESH_INTERVAL_MS) || 15 * 60 * 1000,
};
