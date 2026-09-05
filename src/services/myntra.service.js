const { getDb } = require('../config/db');
const { upsertProducts, findRecent } = require('../utils/upsert');
const { convertLinks } = require('./earnkaro.service');
const { isBrandedProduct } = require('../config/brands');
const { isKidsClothing, isMobilePhone, isHardwareTool, isPestControl } = require('../config/exclusions');

const COLLECTION = 'myntra_products';

// Myntra rejects the default headless fingerprint at the connection level
// (ERR_HTTP2_PROTOCOL_ERROR). It loads normally once the automation flag is
// off, navigator.webdriver is hidden and the client-hint headers look like a
// real Chrome on Windows.
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function searchUrl(query) {
  const q = String(query).trim();
  const slug = q.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `https://www.myntra.com/${slug}?rawQuery=${encodeURIComponent(q)}`;
}

async function crawlMyntra(query = 'tshirts', limit = 10, category = null) {
  const { chromium } = await import('playwright');

  const browser = await chromium.launch({
    args: ['--disable-blink-features=AutomationControlled'],
  });
  let products = [];

  try {
    const context = await browser.newContext({
      userAgent: USER_AGENT,
      locale: 'en-IN',
      viewport: { width: 1366, height: 768 },
      extraHTTPHeaders: {
        'Accept-Language': 'en-IN,en;q=0.9',
        'Sec-CH-UA': '"Chromium";v="124", "Google Chrome";v="124"',
        'Sec-CH-UA-Mobile': '?0',
        'Sec-CH-UA-Platform': '"Windows"',
      },
    });
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });
    const page = await context.newPage();

    const url = searchUrl(query);
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

    // Cards render client-side; wait for them rather than a fixed delay. A
    // query with no results simply times out here and yields an empty list.
    const found = await page
      .waitForSelector('li.product-base', { timeout: 20000 })
      .then(() => true)
      .catch(() => false);
    if (!found) {
      console.warn(`[myntra] no products rendered for "${query}"`);
      return [];
    }
    await page.waitForTimeout(1500);

    products = await page.evaluate((max) => {
      // Myntra prints prices as "Rs. 579". The rest of the app parses "₹579",
      // so normalise here and every downstream filter keeps working.
      const rupees = (text) => {
        const m = String(text || '').match(/[\d,]+(?:\.\d+)?/);
        return m ? `₹${m[0]}` : null;
      };
      const txt = (el, sel) => el.querySelector(sel)?.textContent?.trim() || '';

      const out = [];
      for (const card of document.querySelectorAll('li.product-base')) {
        const brand = txt(card, '.product-brand');
        const name = txt(card, '.product-product');
        const href = card.querySelector('a[href]')?.getAttribute('href') || '';
        if (!name || !href) continue;

        // Only cards near the top have their <img> rendered; the rest are
        // virtualised. With a small per-query limit that covers what we take.
        const img = card.querySelector('img');
        const priceText = rupees(txt(card, '.product-discountedPrice'));
        const mrpText = rupees(txt(card, '.product-strike'));
        // Myntra shows either "(55% OFF)" or an absolute "(Rs. 3616 OFF)".
        // Deriving the percentage from price and MRP is correct in both cases;
        // the label is only a fallback when MRP is absent.
        const num = (t) => Number(String(t || '').replace(/[^\d.]/g, ''));
        const priceNum = num(priceText);
        const mrpNum = num(mrpText);
        const labelText = txt(card, '.product-discountPercentage');
        let discountPct = null;
        if (mrpNum > 0 && priceNum > 0 && mrpNum > priceNum) {
          discountPct = Math.round(((mrpNum - priceNum) / mrpNum) * 100);
        } else if (/%/.test(labelText)) {
          discountPct = parseInt(labelText.replace(/\D/g, ''), 10);
        }
        const ratingText = card.querySelector('.product-ratingsContainer')?.textContent || '';
        const ratingMatch = ratingText.match(/(\d(?:\.\d)?)/);
        const reviewsMatch = ratingText.replace(ratingMatch?.[0] || '', '').match(/([\d,]+)/);

        out.push({
          // Brand lives in its own element on Myntra; prepend it so the brand
          // gate and the brand+MRP variant dedupe see it in the title.
          title: `${brand} ${name}`.trim(),
          brand: brand || null,
          price: priceText,
          mrp: mrpText,
          discountPct,
          rating: ratingMatch ? ratingMatch[1] : null,
          reviews: reviewsMatch ? reviewsMatch[1] : null,
          image: img?.getAttribute('src') || null,
          url: `https://www.myntra.com/${href.replace(/^\/+/, '')}`,
        });
        if (out.length >= max) break;
      }
      return out;
    }, limit);
  } finally {
    await browser.close().catch(() => {});
  }

  // Same junk filters as the other stores.
  const validProducts = products.filter((p) => {
    if (!p || !p.title || !p.url || !p.price) return false;
    const cat = category || p.category;
    if (!isBrandedProduct(p.title, cat)) return false;
    if (isKidsClothing(p.title)) return false;
    if (isMobilePhone(p.title)) return false;
    if (isHardwareTool(p.title)) return false;
    if (isPestControl(p.title)) return false;
    return true;
  });

  const docs = validProducts.map((p) => ({ ...p, store: 'Myntra', ...(category ? { category } : {}) }));

  if (docs.length) {
    await convertLinks(docs);
    await upsertProducts(getDb().collection(COLLECTION), docs, 'url');
  }
  console.log(`[myntra] "${query}" -> ${docs.length}/${products.length} kept`);

  return docs;
}

async function getCachedMyntra() {
  const products = await findRecent(getDb().collection(COLLECTION));
  return products.length ? products : null;
}

module.exports = { crawlMyntra, getCachedMyntra, searchUrl };
