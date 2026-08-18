const express = require('express');
const { getCrawlDemo } = require('../controllers/crawl.controller');

const router = express.Router();

router.get('/', getCrawlDemo);

module.exports = router;
