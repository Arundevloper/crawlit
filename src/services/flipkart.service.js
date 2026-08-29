const { getDb } = require('../config/db');
const { upsertProducts, findRecent } = require('../utils/upsert');

const COLLECTION = 'flipkart_products';

async function crawlFlipkart(query = 'earbuds', limit = 10, category = null) {
  const { chromium } = await import('playwright');

  const browser = await chromium.launch();
  let products = [];

  try {
    const page = await browser.newPage({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      locale: 'en-IN',
      viewport: { width: 1280, height: 2000 },
    });

    const url = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
    let lastErr;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        lastErr = null;
        break;
      } catch (err) {
        lastErr = err;
        await page.waitForTimeout(2000 * attempt);
      }
    }
    if (lastErr) throw lastErr;
    // Wait for product images to swap in from the CDN. Deliberately no
    // scrolling: Flipkart virtualizes images far outside the viewport back to
    // grey placeholders, so scrolling down then scraping loses the top cards.
    await page.waitForSelector('img[src*="rukminim"]', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2500);

    products = await page.evaluate((max) => {
      const exact = (el, re) =>
        [...el.querySelectorAll('div,span')]
          .map((e) => e.textContent.trim())
          .filter((t) => re.test(t));

      const REAL_IMG = 'img[src*="rukminim"]';

      // Flipkart renders several anchors per product (image, title, price all
      // link to the same href). Group by href so a product's image can be
      // found even when it sits in a different anchor from its title.
      const byHref = new Map();
      for (const a of document.querySelectorAll('a[href*="/p/"]')) {
        const href = (a.getAttribute('href') || '').split('?')[0];
        if (!href) continue;
        if (!byHref.has(href)) byHref.set(href, []);
        byHref.get(href).push(a);
      }

      const out = [];

      for (const [href, anchors] of byHref) {
        // Walk up until an ancestor actually yields a price, rather than
        // stopping at one that merely mentions "₹" somewhere in its text.
        // Flipkart's class names are obfuscated hashes that change between
        // deploys, so the card is identified by content, not by class.
        let card = anchors[0];
        let prices = [];
        for (let i = 0; i < 8 && card; i++) {
          prices = exact(card, /^₹[\d,]+$/);
          if (prices.length) break;
          card = card.parentElement;
        }
        if (!card || !prices.length) continue;

        const discounts = exact(card, /^\d+%\s*off$/i);
        const ratings = exact(card, /^\d(\.\d)?$/);

        // Look for the product photo in any anchor for this product, then in
        // the card itself. Decorative icons live on a different host, so
        // match the CDN rather than taking the first <img> in the DOM.
        let imgEl = null;
        for (const a of anchors) {
          imgEl = a.querySelector(REAL_IMG) || (a.matches(REAL_IMG) ? a : null);
          if (imgEl) break;
        }
        if (!imgEl) imgEl = card.querySelector(REAL_IMG);

        const altTitle = anchors.map((a) => a.querySelector('img')?.getAttribute('alt')?.trim()).find(Boolean);

        // Fashion listings carry no alt text and no anchor text — their brand
        // and product name sit in plain text nodes above the price. Rebuild the
        // title from the card's lines preceding the price line.
        const lines = (card.innerText || '').split('\n').map((s) => s.trim()).filter(Boolean);
        const priceLine = lines.findIndex((l) => /₹/.test(l));
        const textTitle = (priceLine > 0 ? lines.slice(0, priceLine) : [])
          .filter((l) => !/^\d(\.\d)?$/.test(l) && !/^\(?[\d,]+\)?$/.test(l) && !/^(sponsored|ad)$/i.test(l))
          .join(' ')
          .trim();

        const title = (imgEl?.getAttribute('alt') || '').trim() || altTitle || textTitle || anchors[0].textContent.trim();
        if (!title) continue;

        let image = imgEl?.getAttribute('src') || null;
        if (image && image.startsWith('//')) image = `https:${image}`;

        out.push({
          title,
          price: prices[0] || null,
          mrp: prices[1] || null,
          discountPct: discounts[0] ? parseInt(discounts[0], 10) : null,
          rating: ratings[0] || null,
          image,
          url: `https://www.flipkart.com${href}`,
        });

        if (out.length >= max) break;
      }
      return out;
    }, limit);
  } finally {
    await browser.close();
  }

  const docs = products.map((p) => ({ ...p, store: 'Flipkart', ...(category ? { category } : {}) }));
  await upsertProducts(getDb().collection(COLLECTION), docs, 'url');

  return docs;
}

async function getCachedFlipkart() {
  const products = await findRecent(getDb().collection(COLLECTION));
  return products.length ? products : null;
}

module.exports = { crawlFlipkart, getCachedFlipkart };
