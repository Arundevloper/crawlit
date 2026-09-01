const express = require('express');
const { getCrawlDemo } = require('../controllers/crawl.controller');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();

router.get('/', rateLimit({ windowMs: 5 * 60_000, max: 3 }), getCrawlDemo);

module.exports = router;
