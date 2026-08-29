const { crawlAmazon, getCachedProducts } = require('../services/amazon.service');
const { crawlAmazonDeals, getCachedDeals } = require('../services/amazonDeals.service');
const { parseRangeParams, filterByPriceRange, parseDiscountPct } = require('../utils/price');

const MIN_DISCOUNT = 30;

async function getProducts(req, res, next) {
  try {
    const cached = await getCachedProducts();
    if (!cached) {
      return res.status(404).json({ error: 'No cached products yet. Call GET /api/amazon/refresh first.' });
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
    const range = parseRangeParams(req.query);
    const filtered = filterByPriceRange(cached, range);
    res.json({ count: filtered.length, products: filtered });
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
    const [deals, searchProducts] = await Promise.all([getCachedDeals(), getCachedProducts()]);
    if (!deals && !searchProducts) {
      return res.status(404).json({ error: 'No cached deals yet. Call GET /api/amazon/deals/refresh first.' });
    }

    // Merge both sources: the deals-page crawl (labeled "hot-deals") and the
    // per-category search crawls (each carrying the category it was found under).
    const fromDeals = (deals || []).map((p) => ({ ...p, category: 'hot-deals' }));
    const fromSearch = (searchProducts || []).map((p) => ({
      ...p,
      discountPct: parseDiscountPct(p.discountPct ?? p.discount),
      category: p.category || 'other',
    }));

    const seen = new Set();
    const merged = [...fromDeals, ...fromSearch].filter((p) => {
      if (!p.url || seen.has(p.url)) return false;
      seen.add(p.url);
      return true;
    });

    const range = parseRangeParams(req.query);
    let filtered = filterByPriceRange(merged, range)
      .filter((p) => p.discountPct !== null && p.discountPct > MIN_DISCOUNT);

    if (req.query.category) {
      filtered = filtered.filter((p) => p.category === req.query.category);
    }

    filtered.sort((a, b) => new Date(b.firstSeenAt) - new Date(a.firstSeenAt));

    res.json({ minDiscount: MIN_DISCOUNT, count: filtered.length, products: filtered });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProducts, refreshProducts, getDeals, refreshDeals, getHighDiscountDeals };
