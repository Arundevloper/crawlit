require('dotenv').config();

const app = require('./app');
const { port, env } = require('./config/config');
const { connectDB } = require('./config/db');

async function start() {
  await connectDB();

  if (true) {
    const { scheduleRefreshJobs } = require('./queues/refresh.queue');
    const { startRefreshWorker } = require('./queues/refresh.worker');

    startRefreshWorker();
    await scheduleRefreshJobs();
    console.log('Crawl workers started (production mode)');
  } else {
    console.log('Scraping disabled (local/dev mode) — set NODE_ENV=production to enable');
  }

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});