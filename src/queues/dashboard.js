const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const { refreshQueue } = require('./refresh.queue');

const BASE_PATH = '/admin/queues';

function createDashboardRouter() {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath(BASE_PATH);

  createBullBoard({
    queues: [new BullMQAdapter(refreshQueue)],
    serverAdapter,
  });

  return serverAdapter.getRouter();
}

module.exports = { createDashboardRouter, BASE_PATH };
