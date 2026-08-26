require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI,
  mongoDbName: process.env.MONGO_DB_NAME || 'crawlit',
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  refreshIntervalMs: Number(process.env.REFRESH_INTERVAL_MS) || 15 * 60 * 1000,
};
