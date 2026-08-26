const { Queue } = require('bullmq');
const { connection } = require('../config/redis');
const { refreshIntervalMs } = require('../config/config');

const QUEUE_NAME = 'refresh';

const refreshQueue = new Queue(QUEUE_NAME, { connection });

const JOBS = [
  { name: 'amazon-products', data: { query: 'laptop', limit: 10 } },
  { name: 'amazon-deals', data: { limit: 150 } },
  { name: 'dealsspy-products', data: { limit: 100 } },
];

async function scheduleRefreshJobs() {
  for (const job of JOBS) {
    await refreshQueue.upsertJobScheduler(
      job.name,
      { every: refreshIntervalMs },
      { name: job.name, data: job.data },
    );
  }
  console.log(`Scheduled ${JOBS.length} refresh jobs every ${refreshIntervalMs / 1000}s`);
}

module.exports = { refreshQueue, scheduleRefreshJobs, QUEUE_NAME };
