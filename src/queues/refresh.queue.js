const { Queue } = require('bullmq');
const { connection } = require('../config/redis');
const { refreshIntervalMs } = require('../config/config');
const { CATEGORIES, MYNTRA_QUERIES } = require('../config/categories');

const QUEUE_NAME = 'refresh';
const CATEGORY_LIMIT = 3;
// Flipkart reads every product off a single search page, so a larger limit
// costs no extra page loads — unlike Amazon, which visits each product page.
const FLIPKART_LIMIT = 10;
const MYNTRA_LIMIT = 10;

const refreshQueue = new Queue(QUEUE_NAME, { connection });

const JOBS = [
  { name: 'amazon-deals', data: { limit: 150 } },
  ...CATEGORIES.map((c) => ({
    name: `amazon-search:${c.key}`,
    data: { query: c.query, limit: CATEGORY_LIMIT, category: c.key },
  })),
  ...CATEGORIES.map((c) => ({
    name: `flipkart-search:${c.key}`,
    data: { query: c.query, limit: FLIPKART_LIMIT, category: c.key },
  })),
  ...Object.entries(MYNTRA_QUERIES).flatMap(([key, queries]) =>
    [].concat(queries).map((query, i) => ({
      name: `myntra-search:${key}${i ? `:${i}` : ''}`,
      data: { query, limit: MYNTRA_LIMIT, category: key },
    })),
  ),
];

async function scheduleRefreshJobs() {
  // Prune schedulers left in Redis from removed jobs — the worker has no
  // handler for them, so they would fire and fail every cycle forever.
  const wanted = new Set(JOBS.map((j) => j.name));
  const existing = await refreshQueue.getJobSchedulers(0, 1000);
  for (const scheduler of existing) {
    if (!wanted.has(scheduler.key)) {
      await refreshQueue.removeJobScheduler(scheduler.key);
      console.log(`Removed stale refresh scheduler "${scheduler.key}"`);
    }
  }

  // Registered in parallel — sequential upserts made startup take ~15s once
  // the job list grew past a hundred entries.
  await Promise.all(
    JOBS.map((job) =>
      refreshQueue.upsertJobScheduler(
        job.name,
        { every: refreshIntervalMs },
        { name: job.name, data: job.data },
      ),
    ),
  );
  console.log(`Scheduled ${JOBS.length} refresh jobs every ${refreshIntervalMs / 1000}s`);
}

module.exports = { refreshQueue, scheduleRefreshJobs, QUEUE_NAME };
