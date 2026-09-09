const { Worker } = require('bullmq');
const { connection } = require('../config/redis');
const { QUEUE_NAME } = require('./refresh.queue');
const { crawlAmazon } = require('../services/amazon.service');
const { crawlAmazonDeals } = require('../services/amazonDeals.service');
const { crawlFlipkart } = require('../services/flipkart.service');
const { crawlMyntra } = require('../services/myntra.service');

function resolveHandler(jobName) {
  if (jobName === 'amazon-deals') return (data) => crawlAmazonDeals(data?.limit);
  if (jobName.startsWith('amazon-search:')) return (data) => crawlAmazon(data?.query, data?.limit, data?.category);
  if (jobName.startsWith('flipkart-search:')) return (data) => crawlFlipkart(data?.query, data?.limit, data?.category);
  if (jobName.startsWith('myntra-search:')) return (data) => crawlMyntra(data?.query, data?.limit, data?.category);
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
    // Two at a time: the full Amazon + Flipkart sweep does not fit the refresh
    // interval sequentially. Each job drives its own headless browser.
    { connection, concurrency: 2 },
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
