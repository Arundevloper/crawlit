const express = require('express');
const { getProducts, refreshProducts, getHighDiscountProducts } = require('../controllers/products.controller');

const router = express.Router();

router.get('/', getProducts);
router.get('/refresh', refreshProducts);
router.get('/high-discount', getHighDiscountProducts);

module.exports = router;
