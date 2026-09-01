const express = require('express');
const {
  getProducts,
  refreshProducts,
  getDeals,
  refreshDeals,
  getHighDiscountDeals,
} = require('../controllers/amazon.controller');

const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();

// Refresh endpoints each spin up a headless browser, so they are throttled
// far harder than the read-only cache endpoints.
const crawlLimit = rateLimit({ windowMs: 5 * 60_000, max: 3, message: 'Refresh is rate limited. Try again in a few minutes.' });

router.get('/', getProducts);
router.get('/refresh', crawlLimit, refreshProducts);
router.get('/deals', getDeals);
router.get('/deals/refresh', crawlLimit, refreshDeals);
router.get('/deals/high-discount', getHighDiscountDeals);

module.exports = router;
