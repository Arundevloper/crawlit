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

// Phone accessories are wanted; the handsets themselves are not.
const PHONE_ACCESSORY_TERMS = [
  'case', 'cover', 'pouch', 'tempered glass', 'screen guard', 'screen protector',
  'charger', 'cable', 'adapter', 'holder', 'stand', 'mount', 'ring', 'skin',
  'earphone', 'earbud', 'headphone', 'powerbank', 'power bank', 'selfie',
];

// Computers quote memory and storage the same way handsets do
// ("(16GB DDR4, 512GB SSD)"), so they need an explicit exemption.
const COMPUTER_TERMS = [
  'laptop', 'notebook', 'chromebook', 'macbook', 'thinkpad', 'ideapad',
  'ssd', 'hdd', 'ddr4', 'ddr5', 'lpddr4', 'lpddr5', 'processor', 'graphics',
  'windows', 'desktop', 'monitor',
];

function isMobilePhone(title) {
  if (!title) return false;
  const text = String(title).toLowerCase();

  if (hasTerm(text, PHONE_ACCESSORY_TERMS)) return false;
  if (hasTerm(text, COMPUTER_TERMS)) return false;

  // Explicit wording.
  if (/\bsmart\s?phone\b/i.test(text)) return true;
  if (/\b(keypad|feature|mobile)\s+phone\b/i.test(text)) return true;

  // Retail convention for handsets: "(Black, 256 GB)", "(Green, 64 GB)".
  if (/\([^)]*,\s*\d+\s*gb[^)]*\)/i.test(text)) return true;

  // "6GB RAM, 128GB ROM" / "8GB RAM 256GB Storage" — capacity pairs. Requires
  // both halves so a laptop's lone "8GB LPDDR5 RAM" is not swept up.
  if (/\d+\s*gb\s*ram\b/i.test(text) && /\d+\s*gb\s*(rom|storage)\b/i.test(text)) return true;

  // "(4GB+128GB)" style, used heavily by budget handsets.
  if (/\b\d+\s*gb\s*\+\s*\d+\s*gb\b/i.test(text)) return true;

  return false;
}

// Hardware tools. Kept deliberately narrow: "grinder" also means juicer/mixer
// grinders and coffee machines, and "drill" appears in "No Drill" wall shelves,
// so those words are only trusted alongside an unambiguous guard.
const TOOL_TERMS = [
  'tool kit', 'toolkit', 'hand tool', 'power tool', 'wrench', 'spanner',
  'screwdriver', 'socket set', 'plier', 'pliers', 'die grinder',
  'impact drill', 'drill machine', 'drill bit', 'hacksaw', 'chisel',
  'measuring tape', 'allen key', 'ratchet',
];

const NOT_TOOL_TERMS = [
  'juicer', 'mixer', 'coffee', 'kitchen', 'no drill', 'adhesive', 'shelf',
  'makeup', 'hair', 'nail', 'garden', 'toy', 'kids',
];

function isHardwareTool(title) {
  if (!title) return false;
  const text = String(title).toLowerCase();
  if (hasTerm(text, NOT_TOOL_TERMS)) return false;
  return hasTerm(text, TOOL_TERMS);
}

function isKidsClothing(title) {
  if (!title) return false;
  const text = String(title).toLowerCase();
  if (!hasTerm(text, KID_TERMS)) return false;
  if (!hasTerm(text, APPAREL_TERMS)) return false;
  return !hasTerm(text, NOT_CLOTHING_TERMS);
}

module.exports = { isKidsClothing, isMobilePhone, isHardwareTool, KID_TERMS, APPAREL_TERMS };
