require('dotenv').config();

const app = require('./app');
const { port } = require('./config/config');
const { connectDB } = require('./config/db');
const { scheduleRefreshJobs } = require('./queues/refresh.queue');
const { startRefreshWorker } = require('./queues/refresh.worker');

async function start() {
  await connectDB();
  startRefreshWorker();
  await scheduleRefreshJobs();

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});