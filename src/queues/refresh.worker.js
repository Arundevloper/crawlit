const { Worker } = require('bullmq');
const { connection } = require('../config/redis');
const { QUEUE_NAME } = require('./refresh.queue');
const { crawlAmazon } = require('../services/amazon.service');
const { crawlAmazonDeals } = require('../services/amazonDeals.service');

function resolveHandler(jobName) {
  if (jobName === 'amazon-deals') return (data) => crawlAmazonDeals(data?.limit);
  if (jobName.startsWith('amazon-search:')) return (data) => crawlAmazon(data?.query, data?.limit, data?.category);
  return null;
}

function startRefreshWorker() {
  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const handler = resolveHandler(job.name);
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
