// Flipkart and Amazon flood footwear and watch searches with unbranded or
// white-label listings ("LOIS CARON", "5DTY", "Analog Watch - For Men").
// For these categories we only surface recognised brands.

const WATCH_BRANDS = [
  'titan', 'sonata', 'fastrack', 'casio', 'timex', 'fossil', 'citizen', 'seiko',
  'tissot', 'daniel wellington', 'michael kors', 'armani', 'emporio armani',
  'tommy hilfiger', 'guess', 'police', 'diesel', 'hugo boss', 'skagen',
  'maxima', 'hmt', 'helix', 'giordano', 'swiss military', 'rolex', 'omega',
  'tag heuer', 'rado', 'g-shock', 'edifice', 'anne klein', 'kenneth cole',
  'carlington', 'daniel hechter', 'curren', 'benyar', 'naviforce',
  'raga', 'titan raga', 'baby-g', 'baby g', 'sheen', 'enticer',
  'shopoholic', 'the shopoholic', 'vyb', 'fastrack vyb', 'poze', 'sonata poze',
  // smart watches
  'noise', 'boat', 'fire-boltt', 'fireboltt', 'amazfit', 'garmin', 'apple',
  'samsung', 'oneplus', 'realme', 'redmi', 'xiaomi', 'huawei', 'honor',
  'pebble', 'boult', 'goboult', 'ptron', 'zebronics', 'beatxp', 'dizo', 'crossbeats',
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
  'solethreads', 'aquasoft', 'walkaroo', 'flite', 'fausto', 'inc.5', 'catwalk',
  'heel & buckle', 'metro shoes', 'shoetopia', 'marc loire', 'truffle collection',
  'carlton london',
];

const CLOTHING_BRANDS = [
  // Global & International Fashion Leaders
  'levis', "levi's", 'u.s. polo', 'us polo', 'uspa', 'tommy hilfiger',
  'united colors of benetton', 'ucb', 'jack & jones', 'jack&jones',
  'pepe jeans', 'pepe', 'gap', 'h&m', 'zara', 'marks & spencer',
  'calvin klein', 'superdry', 'wrangler', 'lee', 'aeropostale',
  'beverly hills polo club', 'nautica', 'gant', 'diesel', 'armani exchange',
  'fcuk', 'french connection', 'american eagle', 'puma', 'adidas', 'nike',
  'reebok', 'under armour', 'asics', 'fila',
  // Indian Premium & Formal Wear
  'louis philippe', 'van heusen', 'allen solly', 'peter england',
  'park avenue', 'raymond', 'reymonds', 'arrow', 'blackberrys',
  'colorplus', 'john players', 'cantabil', 'monte carlo', 'mufti',
  'spykar', 'flying machine', 'killer', 'numero uno', 'duke', 'provogue',
  'red tape', 'redtape',
  // Popular Casual / Fast Fashion / D2C Brands (DealsSpy)
  'hrx', 'roadster', 'wrogn', 'highlander', 'campus sutra', 'snitch',
  'bewakoof', 'powerlook', 'invictus', 'banana club', 'ketch',
  'kotty', 'noble monk', 'scott international', 'indoprimo', 'eyebogler',
  'here & now', 'here and now', 'the sv style', 'awg', 'all weather gear',
  'house & shields', 'house and shields', 'inkast', 'symbol',
  'amazon brand - symbol', 'amazon brand - inkast', 'amazon brand - house & shields',
  'dennis lingo', 'veirdo', 'tbase', 'difference of opinion', 'bullmer',
  'maniac', 'lookmark', 'hellcat', 'tripr',
  // Women's Western & Casual Wear (DealsSpy)
  'tokyo talkies', 'popwings', 'leriya fashion', 'sassafras', 'urban rock',
  'sanskrutihomes', 'appulse', 'pumpd', 'smowkly', 'wear lusso', 'barcino',
  'fyltr', 'unikan', 'karara', 'street 9', 'berrylush', 'harpa', 'athena',
  'vero moda', 'only', 'and', 'forever new', 'globus', 'faballey', 'zink london',
  'madam', 'madame', 'kraus jeans', 'cover story', 'chemistry', 'eden ivy',
  'symactive', 'myx', 'amazon brand - myx', 'amazon brand - eden ivy',
  'amazon brand - symactive',
  // Ethnic Wear (Kurtis, Sarees, Suits, Co-ords - DealsSpy)
  'libas', 'rangriti', 'varanga', 'anouk', 'jaanvi fashion', 'sangria',
  'aurelia', 'w for woman', 'biba', 'soch', 'fabindia', 'global desi',
  'indya', 'house of indya', 'vishudh', 'gerua', 'gosriki', 'ryras',
  'klosia', 'ziyaa', 'amayra', 'khushal k', 'isha fashion', 'siril',
  'yashika', 'mirchi fashion', 'svatoh', 'iyisans', 'bee m pee', 'kanishk',
  'manyavar', 'sojanya', 'kisah', 'sanwara', 'vastramay', 'anand',
  'shreekarnimfg', 'tathastu',
  // Lingerie, Loungewear & Innerwear (DealsSpy)
  'clovia', 'zivame', 'enamor', 'alyne', 'jockey', 'lux venus', 'lux cozi',
  'lux', 'amul macho', 'amul comfy', 'amul', 'rupa frontline', 'rupa',
  'dollar bigboss', 'dollar', 'vip', 'xyxx', 'damensch', 'bummer',
  'sweet dreams', 'van heusen innerwear', 'nykd', 'triumph', 'amante',
  'zelocity', 'shyaway', 'wacoal', 'pee safe', 'peesafe',
];

const JEWELRY_BRANDS = [
  'giva', 'mahi', 'sangria', 'mansiyaorange', 'voylla', 'yellow chimes',
  'zaveri pearls', 'shining diva', 'prita', 'sukkhi', 'youbella',
  'i jewels', 'peora', 'karatcart', 'atasi',
];

const AUDIO_BRANDS = [
  // Indian market leaders (Earbuds, Soundbars & Party Speakers)
  'boat', 'boult', 'goboult', 'noise', 'ptron', 'zebronics', 'mivi', 'wings',
  'govo', 'crossbeats', 'truke', 'dizo', 'bassbuds', 'portronics', 'ambrane',
  'hammer', 'leaf', 'boompods', 'toreto', 'intex', 'iball', 'obage', 'fenda',
  'f&d', 'marq', 'billion',
  // Global & Party Speaker giants (PartyBox, XBOOM, SRS)
  'jbl', 'sony', 'samsung', 'apple', 'bose', 'sennheiser', 'sonos',
  'skullcandy', 'marshall', 'harman kardon', 'harman', 'infinity', 'beats',
  'anker', 'soundcore', 'jabra', 'oneplus', 'oppo', 'realme', 'redmi',
  'xiaomi', 'nothing', 'google', 'pixel buds', 'huawei', 'honor',
  // Hi-Fi, Party & Home Theatre
  'yamaha', 'polk', 'klipsch', 'denon', 'fosi audio', 'fosi', 'tribit',
  'edifier', 'creative', 'philips', 'panasonic', 'lg', 'motorola',
  'blaupunkt', 'akai', 'sansui', 'aiwa', 'infinix', 'itel', 'lenovo',
  // Pro audio / gaming / instrument
  'akg', 'audio-technica', 'audio technica', 'shure', 'bang & olufsen',
  'b&o', 'fiio', 'soundpeats', 'hyperx', 'corsair', 'steelseries',
  'razer', 'logitech', 'ubon', 'playstation', 'fender', 'kadence',
];

const MAKEUP_BRANDS = [
  'lakme', 'lakmé', 'maybelline', "l'oreal", 'loreal', 'sugar', 'mamaearth',
  'swiss beauty', 'insight', 'faces canada', 'colorbar', 'nykaa', 'renee',
  'kay beauty', 'plum', 'biotique', 'lotus', 'myglamm', 'mac', 'm.a.c',
  'revlon', 'hudabeauty', 'huda beauty', 'chambor', 'blue heaven', 'elle 18',
  'pac', 'smashbox', 'mars', 'just herbs', 'rubis', 'typsy', 'forever52',
  'wet n wild', 'deconstruct', 'deyga', 'glamveda', 'focallure',
  'kiko milano', 'kiko', 'disguise', 'belora', 'dazller', 'miss claire',
  'elf', 'e.l.f', 'clinique', 'bobbi brown', 'estee lauder', 'estée lauder',
  'the body shop', 'innisfree', 'laneige', 'etude', 'etude house',
];

const SKINCARE_BRANDS = [
  'cerave', 'cetaphil', 'the derma co', 'derma co', 'minimalist', 'dot & key',
  'dot and key', "dr sheth's", 'dr sheths', 'plum', 'mamaearth', 'mcaffeine',
  'foxtale', 'biotique', 'himalaya', 'neutrogena', 'garnier', 'ponds', "pond's",
  'nivea', 'olay', 'vaseline', 'wow skin science', 'wow', 'lotus', 'aqualogica',
  'be bodywise', 'bodywise', 'deconstruct', 'novology', 'gabit', 'simple',
  'bioderma', 'forest essentials', 'kama ayurveda', 'sebamed', "re'equil",
  'reequil', 'chemist at play', 'wishcare', "d'you", 'pilgrim', 'deyga',
  'glamveda', 'joy', 'boroplus', 'vicco', 'medimix', 'clean & clear',
  'clean and clear', 'fair & lovely', 'glow & lovely', 'lacto calamine',
  'dettol', 'pears', 'dove', 'fiama', 'santoor', 'cinthol', 'lux',
  'lifebuoy', 'vivel', 'khadi', 'khadi natural', 'vlcc', 'the body shop',
  'innisfree', 'laneige', 'cosrx', 'beauty of joseon', 'klairs', 'benton',
  'ghar soaps', 'man matters', 'tresemme', 'head & shoulders', 'pantene',
  'loreal paris', 'sunslik', 'sunsilk', 'parachute', 'dabur', 'bajaj', 'indulekha',
  'kesh king', 'plix', 'brillare', 'hyphen', 'muuchstac', 'nat habit',
  'sesa', 'anveya', 'bare anatomy', 'love beauty & planet', 'love beauty and planet',
  'moroccanoil', 'olaplex', 'schwarzkopf',
];

const MEN_GROOMING_BRANDS = [
  'philips', 'braun', 'panasonic', 'havells', 'nova', 'mi', 'xiaomi',
  'beardo', 'the man company', 'man company', 'bombay shaving company',
  'ustraa', 'urbangabru', 'urban gabru', 'gillette', 'old spice',
  'park avenue', 'axe', 'denver', 'wild stone', 'menhood', 'zlade',
  'vega', 'brylcreem', 'set wet', 'gatsby', 'mancode', 'letsshave',
  'lets shave', 'phy', 'spruce shave club', 'mensome', 'kapiva',
  '7days', 'muuchstac', 'dr beard', 'urban yog', 'morphy richards',
  'syska', 'lifelong', 'agaro', 'wahl', 'remington', 'man matters',
];

const WOMEN_GROOMING_BRANDS = [
  'philips', 'braun', 'havells', 'panasonic', 'nova', 'vega', 'veet',
  'gillette', 'venus', 'letsshave', 'lets shave', 'bombae', 'azah',
  'urban yog', 'sanfe', 'carmesi', 'sirona', 'furr', 'flawless',
  'meditive', 'kimirica', 'morphy richards', 'syska', 'lifelong', 'agaro',
  'wahl', 'remington', 'kylie', 'carlson',
];

const PERFUME_BRANDS = [
  'wild stone', 'park avenue', 'bella vita', 'bellavita', 'fogg', 'axe',
  'denver', 'engage', 'skinn', 'titan', 'yardley', 'nivea', 'beardo',
  'the man company', 'villain', 'renee', 'plum', 'body cupid', 'layer’r',
  "layer'r", 'wottagirl', 'secret temptation', 'ajmal', 'calvin klein',
  'david off', 'davidoff', 'versace', 'jaguar', 'nautica', 'hugo boss',
  'contraband', 'embark', 'colour me', 'guess', 'armaf', 'lattafa',
  'rasasi', 'police', 'diesel', 'ferrari', 'united colors of benetton',
  'ucb', 'all good scents', 'bombay shaving company', 'ustraa', 'he',
  'cinthol', 'tommy hilfiger', 'french essence', 'envy', 'old spice',
  'carolina herrera', 'secret alchemist',
];

const BABY_CARE_BRANDS = [
  'pampers', 'huggies', 'mamy poko', 'mamypoko', "johnson's", 'johnsons',
  'himalaya', 'sebamed', 'chicco', 'mee mee', 'meemee', 'mothercare',
  'aveeno', 'mamaearth', 'pigeon', 'philips', 'avent', 'luvlap',
  'baybee', 'firstcry', 'dexbaby', "little's", 'littles', 'curatio',
  'cetaphil', 'baby dove', 'superbottoms', 'tedibar', 'softsens',
  'kidbea', 'oyo baby', 'miss & chief', 'miss and chief',
];

const ELECTRONICS_ACCESSORIES_BRANDS = [
  'anker', 'spigen', 'ambrane', 'portronics', 'boat', 'mi', 'xiaomi',
  'redmi', 'realme', 'oneplus', 'samsung', 'apple', 'belkin', 'stuffcool',
  'duracell', 'ptron', 'zebronics', 'cmf', 'nothing', 'ugreen', 'baseus',
  'amazonbasics', 'sandisk', 'hp', 'kingston', 'sony', 'panasonic', 'lenovo',
  'dell', 'logitech', 'tp-link', 'tplink', 'd-link', 'dlink', 'lapcare',
  'quantum', 'havells', 'syska', 'goldmedal', 'philips', 'wipro',
];

const ORAL_CARE_BRANDS = [
  'colgate', 'sensodyne', 'oral-b', 'oral b', 'pepsodent', 'close up',
  'closeup', 'dabur', 'meswak', 'babool', 'vicco', 'himalaya', 'parodontax',
  'perfora', 'dente91', 'glister', 'amway', 'curaprox', 'aquafresh',
  'listerine', 'patanjali',
];

const SWEETS_SNACKS_BRANDS = [
  'haldiram', "haldiram's", 'bikaji', 'bikano', 'cadbury', 'ferrero rocher',
  'amul', 'nestle', 'hershey', "hershey's", 'hersheys', 'gits', 'mtr',
  'bikanervala', 'parle', 'britannia', 'happilo', 'nutraj', 'farmley',
  'tulsi', 'solimo', 'paper boat', 'godrej', 'lays', "lay's", 'kurkure',
  'bingo', 'doritos', 'pringles', 'sunfeast', 'open secret', 'unibic',
  'toblerone', 'lindt', 'snickers', 'kitkat', 'milton', 'kellogg', "kellogg's",
];

const FANS_APPLIANCES_BRANDS = [
  'crompton', 'havells', 'orient', 'orient electric', 'usha', 'atomberg',
  'bajaj', 'polycab', 'luminous', 'v-guard', 'v guard', 'kuhl', 'panasonic',
  'anchor', 'surya', 'candes', 'philips', 'morphy richards', 'gorisen',
  'activa', 'hindware', 'singer', 'kenstar', 'finolex',
];

const LUGGAGE_BRANDS = [
  'american tourister', 'samsonite', 'safari', 'aristocrat', 'vip',
  'skybags', 'kamiliant', 'delsey', 'mokobara', 'nasher miles',
  'tommy hilfiger', 'wildcraft', 'swiss military', 'uppercase', 'clownfish',
  'lavie sport', 'travelex', 'travel point', 'puma', 'adidas', 'nike',
  'arctic fox', 'f gear', 'gear', 'fostelo', 'lenovo', 'hp', 'dell',
  'fastrack', 'provogue', 'wrogn', 'reebok', 'red tape', 'hrx',
];

const SUPPLEMENT_BRANDS = [
  'optimum nutrition', 'on', 'muscleblaze', 'as-it-is', 'asitis', 'myprotein',
  'gnc', 'fast&up', 'fast and up', 'nutrabay', 'isopure', 'dymatize',
  'bigmuscles', 'carbamide forte', 'healthkart', 'hk vitals', 'himalaya',
  'kapiva', 'boldfit', 'dr. morepen', 'dr morepen', 'dexter jackson',
  'cellucor', 'bpi sports', 'swisse', 'centrum', 'nakpro', 'avatar',
  'plantigo', 'wellcore', 'neuherbs', 'zingavita', 'truenative',
];

const MOUSE_KEYBOARD_BRANDS = [
  'logitech', 'dell', 'hp', 'razer', 'corsair', 'steelseries', 'hyperx',
  'asus', 'tuf', 'rog', 'redragon', 'ant esports', 'cosmic byte', 'zebronics',
  'portronics', 'lenovo', 'keychron', 'rapoo', 'tvs', 'iclever', 'amkette',
  'fingers', 'circle', 'epomaker', 'royal kludge', 'magegee', 'aula', 'fantech',
  'ambrane', 'quantum', 'targus', 'microsoft',
];

const GAMING_BRANDS = [
  'razer', 'logitech', 'corsair', 'steelseries', 'hyperx', 'asus', 'rog',
  'tuf', 'msi', 'ant esports', 'cosmic byte', 'redragon', 'elgato', 'powera',
  'spinbot', 'playstation', 'xbox', 'nintendo', 'thrustmaster', 'turtle beach',
  'evofox', 'amkette', 'fantech', '8bitdo', 'gamesir', 'kreo',
  'lenovo', 'dell', 'alienware', 'acer', 'predator', 'gigabyte', 'aorus',
];

const HANDBAG_BRANDS = [
  'lavie', 'zouk', 'caprese', 'baggit', 'lino perros', 'fostelo', 'allen solly',
  'van heusen', 'aldo', 'hidesign', 'da milano', 'fossil', 'tommy hilfiger',
  'guess', 'michael kors', 'calvin klein', 'puma', 'adidas', 'nike', 'exotic',
  'symbol', 'dailyobjects', 'accessorize', 'miraggio', 'chumbak', 'mango',
  'forever 21', 'clara', 'sugarush', 'zara',
];

// Categories that require a recognised brand, and the list that applies.
const BRAND_GATED = {
  watch: WATCH_BRANDS,
  smartwatch: WATCH_BRANDS,
  shoes: FOOTWEAR_BRANDS,
  sandals: FOOTWEAR_BRANDS,
  earbuds: AUDIO_BRANDS,
  speakers: AUDIO_BRANDS,
  'baby-care': BABY_CARE_BRANDS,
  makeup: MAKEUP_BRANDS,
  skincare: SKINCARE_BRANDS,
  'face-wash': SKINCARE_BRANDS,
  shampoo: SKINCARE_BRANDS,
  'soap-bodywash': SKINCARE_BRANDS,
  'hair-oil': SKINCARE_BRANDS,
  'men-grooming': MEN_GROOMING_BRANDS,
  'women-grooming': WOMEN_GROOMING_BRANDS,
  perfume: PERFUME_BRANDS,
  'electronics-accessories': ELECTRONICS_ACCESSORIES_BRANDS,
  powerbank: ELECTRONICS_ACCESSORIES_BRANDS,
  'oral-care': ORAL_CARE_BRANDS,
  sweets: SWEETS_SNACKS_BRANDS,
  snacks: SWEETS_SNACKS_BRANDS,
  fans: FANS_APPLIANCES_BRANDS,
  luggage: LUGGAGE_BRANDS,
  'health-wellness': SUPPLEMENT_BRANDS,
  gym: SUPPLEMENT_BRANDS,
  'mouse-keyboard': MOUSE_KEYBOARD_BRANDS,
  gaming: GAMING_BRANDS,
  handbag: HANDBAG_BRANDS,
  clothes: CLOTHING_BRANDS,
  'women-clothing': CLOTHING_BRANDS,
  innerwear: CLOTHING_BRANDS,
  jewelry: JEWELRY_BRANDS,
};

// Categories where the brand must appear at the beginning of the title.
// Prevents counterfeits like "Qexle OnePlus Nord Buds" or "Fuziqra T800 Ultra Smartwatch".
const STRICT_BRAND_CATEGORIES = new Set(['earbuds', 'speakers', 'smartwatch']);

// Common promotional prefixes used on e-commerce listings (e.g. "Trending Fire-Boltt...")
const PROMO_PREFIX_RE = /^(trending|new launch|all[\s-]new|latest|special edition|exclusive)\s+/i;

function isBrandedProduct(title, category) {
  const brands = BRAND_GATED[category];
  if (!brands) return true; // category is not gated
  if (!title) return false;

  let text = String(title).trim().toLowerCase();
  const isStrict = STRICT_BRAND_CATEGORIES.has(category);

  if (isStrict) {
    text = text.replace(PROMO_PREFIX_RE, '');
  }

  return brands.some((brand) => {
    const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (isStrict) {
      // Must appear at the very start of the product title (ignoring promo words)
      return new RegExp('^[^a-z0-9]*' + escaped + '([^a-z0-9]|$)', 'i').test(text);
    }
    // Whole-word match anywhere in the title
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(text);
  });
}

module.exports = {
  isBrandedProduct,
  BRAND_GATED,
  WATCH_BRANDS,
  FOOTWEAR_BRANDS,
  CLOTHING_BRANDS,
  JEWELRY_BRANDS,
  AUDIO_BRANDS,
  MAKEUP_BRANDS,
  SKINCARE_BRANDS,
  MEN_GROOMING_BRANDS,
  WOMEN_GROOMING_BRANDS,
  PERFUME_BRANDS,
  BABY_CARE_BRANDS,
  ELECTRONICS_ACCESSORIES_BRANDS,
  ORAL_CARE_BRANDS,
  SWEETS_SNACKS_BRANDS,
  FANS_APPLIANCES_BRANDS,
  LUGGAGE_BRANDS,
  SUPPLEMENT_BRANDS,
  MOUSE_KEYBOARD_BRANDS,
  GAMING_BRANDS,
  HANDBAG_BRANDS,
};

