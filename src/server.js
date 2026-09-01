require('dotenv').config();

const app = require('./app');
const { port, env } = require('./config/config');
const { connectDB } = require('./config/db');

async function start() {
  await connectDB();

  if (env === 'production') {
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

// A rejection escaping a crawl callback would otherwise kill the process with
// no explanation. Log it and keep serving; the next scheduled run retries.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason instanceof Error ? reason.stack : reason);
});

// An uncaught exception leaves the process in an undefined state, so here we
// do exit — but only after logging, and letting the manager restart cleanly.
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err.stack || err);
  process.exit(1);
});

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});