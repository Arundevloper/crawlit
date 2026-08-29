// Kids' clothing is filtered out of the feed. Toys, school supplies and baby
// care (diapers, lotions) are NOT clothing and stay — a blanket "kids" keyword
// block would remove those too.

const KID_TERMS = [
  'kid', 'kids', 'baby', 'babies', 'infant', 'infants', 'toddler', 'toddlers',
  'newborn', 'child', 'children', 'boys', 'girls', 'junior', 'nursery',
];

const APPAREL_TERMS = [
  'clothes', 'clothing', 'apparel', 'garment', 'outfit',
  't-shirt', 'tshirt', 't shirt', 'shirt', 'top', 'tops', 'blouse',
  'pyjama', 'pajama', 'nightwear', 'nightsuit', 'sleepwear',
  'dress', 'frock', 'gown', 'skirt', 'lehenga', 'saree', 'kurta', 'kurti',
  'ethnic wear', 'sherwani', 'dhoti',
  'jeans', 'trouser', 'trousers', 'pant', 'pants', 'shorts', 'legging',
  'leggings', 'dungaree', 'jumpsuit', 'romper', 'onesie', 'bodysuit',
  'sweatshirt', 'hoodie', 'jacket', 'sweater', 'cardigan', 'blazer',
  'waistcoat', 'coat', 'innerwear', 'vest', 'costume', 'uniform',
];

// Words that mean the item is not clothing even though an apparel word
// appears in the title — "diaper pants", "baby powder", a toy dress-up set.
const NOT_CLOTHING_TERMS = [
  'diaper', 'diapers', 'nappy', 'wipes', 'lotion', 'shampoo', 'soap',
  'cream', 'powder', 'oil', 'bottle', 'feeding', 'toy', 'toys', 'puzzle',
  'cycle', 'tricycle', 'scooter', 'stroller', 'walker', 'hanger', 'detergent',
  // Dress-up / pretend-play toys describe clothing but are not clothing.
  'dress-up', 'dressup', 'pretend', 'playset', 'play set', 'diy', 'craft',
  'magnetic', 'board game', 'sticker',
];

function hasTerm(text, terms) {
  return terms.some((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(text);
  });
}

function isKidsClothing(title) {
  if (!title) return false;
  const text = String(title).toLowerCase();
  if (!hasTerm(text, KID_TERMS)) return false;
  if (!hasTerm(text, APPAREL_TERMS)) return false;
  return !hasTerm(text, NOT_CLOTHING_TERMS);
}

module.exports = { isKidsClothing, KID_TERMS, APPAREL_TERMS };
