const path = require('path');

// Resolve .env from the project root rather than process.cwd(): process
// managers such as PM2 and systemd do not always start the app from the
// project directory, and dotenv would then silently find no file.
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Crawlee persists run state to ./storage by default. With two crawls running
// concurrently they corrupt each other's shared state files ("JSON5: invalid
// end of input"). Results are written to MongoDB directly, so the on-disk
// copy is not needed — keep it in memory and the race disappears.
process.env.CRAWLEE_PERSIST_STORAGE = process.env.CRAWLEE_PERSIST_STORAGE || 'false';

module.exports = {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI,
  mongoDbName: process.env.MONGO_DB_NAME || 'crawlit',
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  refreshIntervalMs: Number(process.env.REFRESH_INTERVAL_MS) || 15 * 60 * 1000,
  siteUrl: (process.env.SITE_URL || 'https://dealmint.in').replace(/\/$/, ''),
  adminUser: process.env.ADMIN_USER,
  adminPass: process.env.ADMIN_PASS,
  amazonAssociateTag: process.env.AMAZON_ASSOCIATE_TAG,
  earnKaroApiToken: process.env.EARNKARO_API_TOKEN,
  earnKaroConvertOption: process.env.EARNKARO_CONVERT_OPTION || 'convert_only',
};
