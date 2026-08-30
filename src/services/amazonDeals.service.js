const { getDb } = require('../config/db');
const { upsertProducts, findRecent } = require('../utils/upsert');
const { isKidsClothing, isMobilePhone, isHardwareTool, isPestControl } = require('../config/exclusions');

const COLLECTION = 'amazon_deals';
const DEALS_URL = 'https://www.amazon.in/deals';

async function crawlAmazonDeals(limit = 150) {
  const { chromium } = await import('playwright');

  const browser = await chromium.launch();
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'en-IN',
    viewport: { width: 1280, height: 2000 },
  });

  await page.goto(DEALS_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  const products = new Map();
  let stableRounds = 0;

  while (products.size < limit && stableRounds < 3) {
    const batch = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('[data-testid="product-card"]')];
      return cards.map((card) => {
        const text = card.innerText;
        const discountMatch = text.match(/(\d+)%\s*off/i);
        const priceMatch = text.match(/Deal Price:\s*(₹[\d,]+\.\d+)/);
        const mrpMatch = text.match(/M\.R\.P:\s*(₹[\d,]+\.\d+)/);
        const ratingMatch = text.match(/(\d\.\d)\s*\n?\(([\d,]+)\)/);
        const img = card.querySelector('img');
        const link = card.querySelector('a[href]');
        return {
          asin: card.getAttribute('data-asin'),
          title: img?.alt || null,
          discountPct: discountMatch ? parseInt(discountMatch[1], 10) : null,
          price: priceMatch ? priceMatch[1] : null,
          mrp: mrpMatch ? mrpMatch[1] : null,
          rating: ratingMatch ? ratingMatch[1] : null,
          reviews: ratingMatch ? ratingMatch[2] : null,
          image: img?.src || null,
          url: link?.href?.split('?')[0] || null,
        };
      });
    });

    const before = products.size;
    for (const item of batch) {
      if (item.asin) products.set(item.asin, item);
    }
    stableRounds = products.size > before ? 0 : stableRounds + 1;

    await page.mouse.wheel(0, 4000);
    await page.waitForTimeout(1500);
  }

  await browser.close();

  const validDeals = [...products.values()]
    .slice(0, limit)
    .filter((p) => {
      if (!p || !p.title) return false;
      if (p.discountPct !== null && p.discountPct < 30) return false;
      if (isKidsClothing(p.title)) return false;
      if (isMobilePhone(p.title)) return false;
      if (isHardwareTool(p.title)) return false;
      if (isPestControl(p.title)) return false;
      return true;
    });

  const result = validDeals.map((p) => ({ ...p, store: 'Amazon' }));

  if (result.length) {
    await upsertProducts(getDb().collection(COLLECTION), result, 'asin');
  }

  return result;
}

async function getCachedDeals() {
  const deals = await findRecent(getDb().collection(COLLECTION));
  return deals.length ? deals : null;
}

module.exports = { crawlAmazonDeals, getCachedDeals };
