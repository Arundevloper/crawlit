const { getDb } = require('../config/db');
const { upsertProducts, findRecent } = require('../utils/upsert');
const { tagAmazonProducts } = require('../utils/affiliate');
const { isBrandedProduct } = require('../config/brands');
const { isKidsClothing, isMobilePhone, isHardwareTool, isPestControl } = require('../config/exclusions');

const COLLECTION = 'amazon_products';

async function crawlAmazon(query = 'laptop', limit = 10, category = null) {
  const { PlaywrightCrawler, RequestQueue } = await import('crawlee');
  const products = [];

  // Unique queue per run: Crawlee's shared "default" queue would otherwise mark
  // this query's URLs as already handled on repeat runs (e.g. the scheduled refresh),
  // causing later runs in the same process to silently scrape nothing.
  const requestQueue = await RequestQueue.open(`amazon-products-${Date.now()}`);

  const crawler = new PlaywrightCrawler({
    requestQueue,
    maxRequestsPerCrawl: limit + 1,
    async requestHandler({ request, page, log }) {
      if (request.label === 'PRODUCT') {
        await page.waitForTimeout(1500);

        const data = await page.evaluate(() => {
          const text = (sel) => document.querySelector(sel)?.textContent?.trim().replace(/\s+/g, ' ') || null;

          let price = null;
          let discount = null;
          const label = text('#apex-pricetopay-accessibility-label');
          if (label) {
            const priceMatch = label.match(/₹[\d,]+(?:\.\d+)?/);
            if (priceMatch) price = priceMatch[0];
            const discountMatch = label.match(/(\d+)\s*percent savings/);
            if (discountMatch) discount = `${discountMatch[1]}% off`;
          }
          if (!price) {
            const candidates = [...document.querySelectorAll('.a-price .a-offscreen')]
              .filter((el) => !el.closest('[id^="CardInstance"]'));
            price = candidates[0]?.textContent?.trim() || null;
          }

          return {
            title: text('#productTitle'),
            price,
            mrp: text('.basisPrice .a-offscreen'),
            discount,
            rating: document.querySelector('#acrPopover')?.getAttribute('title') || null,
            reviews: text('#acrCustomerReviewText'),
            image: document.querySelector('#landingImage')?.getAttribute('src') || null,
          };
        });

        log.info(`Scraped: ${data.title} — ${data.price}`);
        products.push({ ...data, url: request.loadedUrl });
        return;
      }

      const asins = await page.evaluate((max) => {
        const found = [...document.querySelectorAll('[data-asin]')]
          .map((el) => el.getAttribute('data-asin'))
          .filter(Boolean);
        return [...new Set(found)].slice(0, max);
      }, limit);

      log.info(`Found ${asins.length} products for "${query}"`);
      await crawler.addRequests(
        asins.map((asin) => ({ url: `https://www.amazon.in/dp/${asin}`, label: 'PRODUCT' })),
      );
    },
  });

  await crawler.run([{ url: `https://www.amazon.in/s?k=${encodeURIComponent(query)}`, label: 'SEARCH' }]);
  await requestQueue.drop();

  const validProducts = products.filter((p) => {
    if (!p || !p.title || !p.url) return false;
    const cat = category || p.category;
    if (!isBrandedProduct(p.title, cat)) return false;
    if (isKidsClothing(p.title)) return false;
    if (isMobilePhone(p.title)) return false;
    if (isHardwareTool(p.title)) return false;
    if (isPestControl(p.title)) return false;
    return true;
  });

  const docs = validProducts.map((p) => ({ ...p, store: 'Amazon', ...(category ? { category } : {}) }));
  if (docs.length) {
    tagAmazonProducts(docs);
    await upsertProducts(getDb().collection(COLLECTION), docs, 'url');
  }

  return docs;
}

async function getCachedProducts() {
  const products = await findRecent(getDb().collection(COLLECTION));
  return products.length ? products : null;
}

module.exports = { crawlAmazon, getCachedProducts };
