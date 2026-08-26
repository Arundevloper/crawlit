const { crawlDealsspy, getCachedProducts } = require('../services/dealsspy.service');
const { parseRangeParams, filterByPriceRange } = require('../utils/price');

const MIN_DISCOUNT = 40;

function parseDiscount(discount) {
  if (!discount) return null;
  const m = discount.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
}

async function getProducts(req, res, next) {
  try {
    const cached = await getCachedProducts();
    if (!cached) {
      return res.status(404).json({ error: 'No cached products yet. Call GET /api/products/refresh first.' });
    }
    const range = parseRangeParams(req.query);
    const filtered = filterByPriceRange(cached, range);
    res.json({ count: filtered.length, products: filtered });
  } catch (err) {
    next(err);
  }
}

async function refreshProducts(req, res, next) {
  try {
    const limit = Number(req.query.limit) || 100;
    const products = await crawlDealsspy(limit);
    res.json({ count: products.length, products });
  } catch (err) {
    next(err);
  }
}

async function getHighDiscountProducts(req, res, next) {
  try {
    const cached = await getCachedProducts();
    if (!cached) {
      return res.status(404).json({ error: 'No cached products yet. Call GET /api/products/refresh first.' });
    }
    const range = parseRangeParams(req.query);
    const filtered = filterByPriceRange(cached, range)
      .map((p) => ({ ...p, discountPct: parseDiscount(p.discount) }))
      .filter((p) => p.discountPct !== null && p.discountPct > MIN_DISCOUNT)
      .sort((a, b) => b.discountPct - a.discountPct);

    res.json({ minDiscount: MIN_DISCOUNT, count: filtered.length, products: filtered });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProducts, refreshProducts, getHighDiscountProducts };
