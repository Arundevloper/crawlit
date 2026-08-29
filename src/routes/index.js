const express = require('express');
const healthRoutes = require('./health.routes');
const crawlRoutes = require('./crawl.routes');
const amazonRoutes = require('./amazon.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/crawl', crawlRoutes);
router.use('/amazon', amazonRoutes);

module.exports = router;
