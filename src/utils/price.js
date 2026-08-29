function parsePrice(value) {
  if (!value) return null;
  const num = Number(String(value).replace(/[₹,\s]/g, ''));
  return Number.isFinite(num) ? num : null;
}

function parseRangeParams(query) {
  const minPrice = query.minPrice !== undefined ? Number(query.minPrice) : null;
  const maxPrice = query.maxPrice !== undefined ? Number(query.maxPrice) : null;
  const minMrp = query.minMrp !== undefined ? Number(query.minMrp) : null;
  const maxMrp = query.maxMrp !== undefined ? Number(query.maxMrp) : null;
  return {
    minPrice: Number.isFinite(minPrice) ? minPrice : null,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : null,
    minMrp: Number.isFinite(minMrp) ? minMrp : null,
    maxMrp: Number.isFinite(maxMrp) ? maxMrp : null,
  };
}

function filterByFieldRange(products, field, min, max) {
  if (min === null && max === null) return products;
  return products.filter((p) => {
    const value = parsePrice(p[field]);
    if (value === null) return false;
    if (min !== null && value < min) return false;
    if (max !== null && value > max) return false;
    return true;
  });
}

function filterByPriceRange(products, { minPrice, maxPrice, minMrp, maxMrp }) {
  const byPrice = filterByFieldRange(products, 'price', minPrice ?? null, maxPrice ?? null);
  return filterByFieldRange(byPrice, 'mrp', minMrp ?? null, maxMrp ?? null);
}

function parseDiscountPct(discount) {
  if (typeof discount === 'number') return discount;
  if (!discount) return null;
  const m = String(discount).match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
}

module.exports = { parsePrice, parseRangeParams, filterByPriceRange, parseDiscountPct };
