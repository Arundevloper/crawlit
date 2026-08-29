// Flipkart and Amazon flood footwear and watch searches with unbranded or
// white-label listings ("LOIS CARON", "5DTY", "Analog Watch - For Men").
// For these categories we only surface recognised brands.

const WATCH_BRANDS = [
  'titan', 'sonata', 'fastrack', 'casio', 'timex', 'fossil', 'citizen', 'seiko',
  'tissot', 'daniel wellington', 'michael kors', 'armani', 'emporio armani',
  'tommy hilfiger', 'guess', 'police', 'diesel', 'hugo boss', 'skagen',
  'maxima', 'hmt', 'helix', 'giordano', 'swiss military', 'rolex', 'omega',
  'tag heuer', 'rado', 'g-shock', 'edifice', 'anne klein', 'kenneth cole',
  // smart watches
  'noise', 'boat', 'fire-boltt', 'fireboltt', 'amazfit', 'garmin', 'apple',
  'samsung', 'oneplus', 'realme', 'redmi', 'xiaomi', 'huawei', 'honor',
  'pebble', 'boult', 'ptron', 'zebronics', 'beatxp', 'dizo', 'crossbeats',
];

const FOOTWEAR_BRANDS = [
  'nike', 'adidas', 'puma', 'reebok', 'skechers', 'sketchers', 'asics',
  'new balance', 'under armour', 'fila', 'converse', 'vans', 'crocs',
  'timberland', 'birkenstock', 'clarks', 'hush puppies', 'woodland',
  'bata', 'campus', 'sparx', 'relaxo', 'paragon', 'liberty', 'action',
  'lakhani', 'abros', 'bourge', 'asian', 'centrino', 'mochi', 'metro',
  'khadim', 'red tape', 'redtape', 'lee cooper', 'duke', 'provogue',
  'us polo', 'u.s. polo', 'levis', "levi's", 'wildcraft', 'decathlon',
  'columbus', 'sega', 'furo', 'roadster', 'hrx', 'allen solly',
  'louis philippe', 'van heusen', 'peter england', 'aldo', 'steve madden',
];

// Categories that require a recognised brand, and the list that applies.
const BRAND_GATED = {
  watch: WATCH_BRANDS,
  shoes: FOOTWEAR_BRANDS,
  sandals: FOOTWEAR_BRANDS,
};

function isBrandedProduct(title, category) {
  const brands = BRAND_GATED[category];
  if (!brands) return true; // category is not gated
  if (!title) return false;

  const text = String(title).toLowerCase();
  return brands.some((brand) => {
    // Whole-word match so "asian" does not match "caucasian" and
    // "boat" does not match "boating".
    const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(text);
  });
}

module.exports = { isBrandedProduct, BRAND_GATED, WATCH_BRANDS, FOOTWEAR_BRANDS };
