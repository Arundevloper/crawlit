const express = require('express');
const path = require('path');
const cors = require('cors');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { basicAuth } = require('./middleware/basicAuth');
const { createDashboardRouter, BASE_PATH } = require('./queues/dashboard');
const { adminUser, adminPass } = require('./config/config');
const feedRoutes = require('./routes/feed.routes');
const { router: dealRoutes } = require('./routes/deal.routes');

const app = express();

// Security headers. Written directly rather than pulling in helmet, since the
// set needed here is small and the CSP has to allow the merchant image CDNs
// the product cards hotlink from.
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), interest-cohort=()',
    'Content-Security-Policy': [
      "default-src 'self'",
      // The deals page ships its styles and logic inline.
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      // Product photos are hotlinked from the merchants' own CDNs.
      "img-src 'self' data: https://m.media-amazon.com https://images-na.ssl-images-amazon.com https://rukminim1.flixcart.com https://rukminim2.flixcart.com",
      "connect-src 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join('; '),
  });
  next();
});

const PUBLIC_DIR = path.join(__dirname, '../public');

// The deals API is safe to read cross-origin; the rest of the app is not,
// so CORS is scoped to /api rather than applied globally.
app.use('/api', cors({ methods: ['GET'] }));
app.use(express.json());

// The deals page lives at "/". Registered before express.static so the old
// .html path redirects instead of being served as a second, duplicate URL.
// 302 rather than 301: browsers cache a permanent redirect indefinitely,
// which is painful to undo while the URL structure is still settling.
app.get('/discounts.html', (req, res) => res.redirect(302, '/'));

// RSS feed of the newest deals, served from the same cache as the site.
app.use('/', feedRoutes);

// Server-rendered product pages: the deals list is client-rendered, so these
// are what search engines can actually index.
app.use('/', dealRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'discounts.html'));
});

app.use(
  express.static(PUBLIC_DIR, {
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
  basicAuth({ user: adminUser, pass: adminPass, realm: 'DealMint queues' }),
  createDashboardRouter(),
);

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
