const { parsePrice } = require('./price');

const HOT_DISCOUNT = 70;
// A "lowest price" claim is shown to shoppers as a statement of fact, so it
// needs real evidence: several distinct observed prices, not one data point
// that is trivially its own minimum.
const MIN_POINTS_FOR_LOWEST = 3;

function computeBadges(product) {
  const badges = [];
  const current = product.priceValue ?? parsePrice(product.price);
  const history = Array.isArray(product.priceHistory) ? product.priceHistory : [];
  const prices = history.map((h) => h.price).filter((n) => typeof n === 'number');

  if ((product.discountPct ?? 0) >= 85) {
    badges.push({ key: 'steal', label: '🤯 STEAL DEAL' });
  } else if ((product.discountPct ?? 0) >= HOT_DISCOUNT) {
    badges.push({ key: 'hot', label: '🔥 HOT DEAL' });
  }

  if (current !== null && prices.length >= 2) {
    const previous = prices[prices.length - 2];
    if (typeof previous === 'number' && current < previous) {
      const pct = Math.round(((previous - current) / previous) * 100);
      if (pct >= 1) badges.push({ key: 'drop', label: `⚡ PRICE DROP ${pct}%` });
    }
  }

  if (current !== null && prices.length >= MIN_POINTS_FOR_LOWEST && current <= Math.min(...prices)) {
    // Scoped to what we have actually observed — we cannot see prices from
    // before this crawler started tracking the product.
    badges.push({ key: 'lowest', label: '📉 LOWEST YET' });
  }

  return badges;
}

module.exports = { computeBadges, HOT_DISCOUNT };
