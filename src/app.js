const express = require('express');
const path = require('path');
const cors = require('cors');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { basicAuth } = require('./middleware/basicAuth');
const { createDashboardRouter, BASE_PATH } = require('./queues/dashboard');
const { adminUser, adminPass } = require('./config/config');

const app = express();

app.use(cors());
app.use(express.json());
app.use(
  express.static(path.join(__dirname, '../public'), {
    setHeaders: (res, filePath) => {
      // Force revalidation of the HTML so an edited page is never served from
      // a stale browser cache. The ETag still yields cheap 304s when unchanged.
      if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
    },
  }),
);

// Queue dashboard. Behind auth: it can retry, promote and delete jobs.
app.use(
  BASE_PATH,
  basicAuth({ user: adminUser, pass: adminPass, realm: 'CrawlIt queues' }),
  createDashboardRouter(),
);

app.use('/api', routes);

app.get('/', (req, res) => {
  res.redirect('/discounts.html');
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
