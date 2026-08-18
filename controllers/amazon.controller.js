const { crawlAmazon, getCachedProducts } = require('../services/amazon.service');
const { crawlAmazonDeals, getCachedDeals } = require('../services/amazonDeals.service');

const MIN_DISCOUNT = 40;

async function getProducts(req, res, next) {
  try {
    const cached = await getCachedProducts();
    if (!cached) {
      return res.status(404).json({ error: 'No cached products yet. Call GET /api/amazon/refresh first.' });
    }
    res.json({ count: cached.length, products: cached });
  } catch (err) {
    next(err);
  }
}

async function refreshProducts(req, res, next) {
  try {
    const query = req.query.q || 'laptop';
    const limit = Number(req.query.limit) || 10;
    const products = await crawlAmazon(query, limit);
    res.json({ query, count: products.length, products });
  } catch (err) {
    next(err);
  }
}

async function getDeals(req, res, next) {
  try {
    const cached = await getCachedDeals();
    if (!cached) {
      return res.status(404).json({ error: 'No cached deals yet. Call GET /api/amazon/deals/refresh first.' });
    }
    res.json({ count: cached.length, products: cached });
  } catch (err) {
    next(err);
  }
}

async function refreshDeals(req, res, next) {
  try {
    const limit = Number(req.query.limit) || 150;
    const products = await crawlAmazonDeals(limit);
    res.json({ count: products.length, products });
  } catch (err) {
    next(err);
  }
}

async function getHighDiscountDeals(req, res, next) {
  try {
    const cached = await getCachedDeals();
    if (!cached) {
      return res.status(404).json({ error: 'No cached deals yet. Call GET /api/amazon/deals/refresh first.' });
    }
    const filtered = cached
      .filter((p) => p.discountPct !== null && p.discountPct > MIN_DISCOUNT)
      .sort((a, b) => b.discountPct - a.discountPct);

    res.json({ minDiscount: MIN_DISCOUNT, count: filtered.length, products: filtered });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProducts, refreshProducts, getDeals, refreshDeals, getHighDiscountDeals };
