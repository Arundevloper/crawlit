const { crawlAmazon, getCachedProducts } = require('../services/amazon.service');
const { crawlAmazonDeals, getCachedDeals } = require('../services/amazonDeals.service');
const { getCachedFlipkart } = require('../services/flipkart.service');
const { parseRangeParams, filterByPriceRange, parseDiscountPct } = require('../utils/price');
const { isBrandedProduct } = require('../config/brands');
const { computeBadges } = require('../utils/badges');
const { isKidsClothing, isMobilePhone, isHardwareTool } = require('../config/exclusions');

const MIN_DISCOUNT = 30;

function titleWords(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

// Variants of one product (colors, sizes, pack counts) have distinct URLs/ASINs
// but near-identical titles. The first 8 significant words identify the product,
// so "SMOWKLY Casual Trousers ... (Black)" and "... (Beige)" collapse to one.
function prefixSignature(product) {
  const words = titleWords(product.title);
  return words.length ? words.slice(0, 8).join(' ') : null;
}

// The prefix alone misses variants whose distinguishing word comes early —
// "Home Decor Vanilla ... Diffuser" vs "Home Decor Arabian Jasmine ... Diffuser"
// share only two leading words. Those still agree on brand, store and MRP.
function brandPriceSignature(product) {
  const words = titleWords(product.title);
  const mrp = String(product.mrp || '').replace(/[^0-9]/g, '');
  if (words.length < 2 || !mrp) return null;
  return `${words.slice(0, 2).join(' ')}|${mrp}|${product.store || ''}`;
}

// Collapses each group to its best-discounted member; products the key
// cannot identify pass through untouched rather than being dropped.
function dedupeBy(products, keyFn) {
  const best = new Map();
  const unkeyed = [];
  for (const p of products) {
    const key = keyFn(p);
    if (!key) {
      unkeyed.push(p);
      continue;
    }
    const existing = best.get(key);
    if (!existing || (p.discountPct || 0) > (existing.discountPct || 0)) {
      best.set(key, p);
    }
  }
  return [...best.values(), ...unkeyed];
}

function dedupeVariants(products) {
  return dedupeBy(dedupeBy(products, prefixSignature), brandPriceSignature);
}

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
    const [deals, searchProducts, flipkart] = await Promise.all([
      getCachedDeals(),
      getCachedProducts(),
      getCachedFlipkart(),
    ]);
    if (!deals && !searchProducts && !flipkart) {
      return res.status(404).json({ error: 'No cached deals yet. Call GET /api/amazon/deals/refresh first.' });
    }

    // Merge all sources: the Amazon deals page (labeled "hot-deals"), the
    // per-category Amazon searches, and the per-category Flipkart searches.
    const normalize = (p, fallbackCategory) => ({
      ...p,
      store: p.store || 'Amazon',
      discountPct: parseDiscountPct(p.discountPct ?? p.discount),
      category: p.category || fallbackCategory,
    });

    const merged = [
      ...(deals || []).map((p) => normalize(p, 'hot-deals')),
      ...(searchProducts || []).map((p) => normalize(p, 'other')),
      ...(flipkart || []).map((p) => normalize(p, 'other')),
    ];

    const seen = new Set();
    const deduped = merged.filter((p) => {
      if (!p.url || seen.has(p.url)) return false;
      seen.add(p.url);
      return true;
    });

    const range = parseRangeParams(req.query);
    let filtered = dedupeVariants(filterByPriceRange(deduped, range))
      .filter((p) => p.discountPct !== null && p.discountPct > MIN_DISCOUNT)
      .filter((p) => isBrandedProduct(p.title, p.category))
      .filter((p) => !isKidsClothing(p.title))
      .filter((p) => !isMobilePhone(p.title))
      .filter((p) => !isHardwareTool(p.title))
      // "mobile" and "tools" are retired categories. Some of their products
      // carry no matchable pattern — a handset titled only "itel Ace 3 Shine"
      // — so rows already crawled are excluded by category until they age
      // out of the freshness window.
      .filter((p) => !['mobile', 'tools'].includes(p.category));

    if (req.query.category) {
      filtered = filtered.filter((p) => p.category === req.query.category);
    }
    if (req.query.store) {
      filtered = filtered.filter((p) => p.store === req.query.store);
    }

    filtered.sort((a, b) => new Date(b.firstSeenAt) - new Date(a.firstSeenAt));

    const withBadges = filtered.map((p) => ({ ...p, badges: computeBadges(p) }));

    res.json({ minDiscount: MIN_DISCOUNT, count: withBadges.length, products: withBadges });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProducts, refreshProducts, getDeals, refreshDeals, getHighDiscountDeals };
