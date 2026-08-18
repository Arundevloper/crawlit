const express = require('express');
const {
  getProducts,
  refreshProducts,
  getDeals,
  refreshDeals,
  getHighDiscountDeals,
} = require('../controllers/amazon.controller');

const router = express.Router();

router.get('/', getProducts);
router.get('/refresh', refreshProducts);
router.get('/deals', getDeals);
router.get('/deals/refresh', refreshDeals);
router.get('/deals/high-discount', getHighDiscountDeals);

module.exports = router;
