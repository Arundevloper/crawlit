const { Worker } = require('bullmq');
const { connection } = require('../config/redis');
const { QUEUE_NAME } = require('./refresh.queue');
const { crawlAmazon } = require('../services/amazon.service');
const { crawlAmazonDeals } = require('../services/amazonDeals.service');
const { crawlDealsspy } = require('../services/dealsspy.service');

const HANDLERS = {
  'amazon-products': (data) => crawlAmazon(data?.query, data?.limit),
  'amazon-deals': (data) => crawlAmazonDeals(data?.limit),
  'dealsspy-products': (data) => crawlDealsspy(data?.limit),
};

function startRefreshWorker() {
  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const handler = HANDLERS[job.name];
      if (!handler) throw new Error(`No handler for job "${job.name}"`);
      const result = await handler(job.data);
      return { count: Array.isArray(result) ? result.length : undefined };
    },
    { connection, concurrency: 1 },
  );

  worker.on('completed', (job, result) => {
    console.log(`[refresh] ${job.name} completed`, result);
  });
  worker.on('failed', (job, err) => {
    console.error(`[refresh] ${job?.name} failed:`, err.message);
  });

  return worker;
}

module.exports = { startRefreshWorker };
