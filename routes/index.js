const express = require('express');
const healthRoutes = require('./health.routes');
const crawlRoutes = require('./crawl.routes');
const productsRoutes = require('./products.routes');
const amazonRoutes = require('./amazon.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/crawl', crawlRoutes);
router.use('/products', productsRoutes);
router.use('/amazon', amazonRoutes);

module.exports = router;
