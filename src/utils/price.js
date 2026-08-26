function parsePrice(value) {
  if (!value) return null;
  const num = Number(String(value).replace(/[₹,\s]/g, ''));
  return Number.isFinite(num) ? num : null;
}

function parseRangeParams(query) {
  const minPrice = query.minPrice !== undefined ? Number(query.minPrice) : null;
  const maxPrice = query.maxPrice !== undefined ? Number(query.maxPrice) : null;
  return {
    minPrice: Number.isFinite(minPrice) ? minPrice : null,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : null,
  };
}

function filterByPriceRange(products, { minPrice, maxPrice }) {
  if (minPrice === null && maxPrice === null) return products;
  return products.filter((p) => {
    const price = parsePrice(p.price);
    if (price === null) return false;
    if (minPrice !== null && price < minPrice) return false;
    if (maxPrice !== null && price > maxPrice) return false;
    return true;
  });
}

module.exports = { parsePrice, parseRangeParams, filterByPriceRange };
