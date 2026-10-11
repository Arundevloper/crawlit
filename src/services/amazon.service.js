const { getDb } = require('../config/db');
const { upsertProducts, findRecent } = require('../utils/upsert');
const { tagAmazonProducts } = require('../utils/affiliate');
const { prefixSignature } = require('../utils/titles');
const { isBrandedProduct } = require('../config/brands');
const { isKidsClothing, isMobilePhone, isHardwareTool, isPestControl } = require('../config/exclusions');

const COLLECTION = 'amazon_products';
// Products whose page was already opened; entries expire after a day (TTL
// index in config/db.js). Keyed by title signature rather than ASIN so that
// every color/size variant of an opened product counts as seen too.
const SEEN_COLLECTION = 'amazon_seen';

function isWanted(title, category) {
  return (
    isBrandedProduct(title, category) &&
    !isKidsClothing(title) &&
    !isMobilePhone(title) &&
    !isHardwareTool(title) &&
    !isPestControl(title)
  );
}

// Opening a product page is the expensive part of a crawl, so only open
// results that are new: not a variant of another result, not one the filters
// would drop anyway, and not opened within the last day. Search cards carry
// "Brand | Title", enough to apply the same filters as the product page.
async function pickNewResults(results, limit, category) {
  const byKey = new Map();
  for (const { asin, title } of results) {
    const key = prefixSignature(title) || asin;
    if (byKey.has(key)) continue;
    // A card with no title (layout change) is left for the product page to judge.
    if (title && !isWanted(title, category)) continue;
    byKey.set(key, { asin, key });
  }

  const seen = await getDb()
    .collection(SEEN_COLLECTION)
    .find({ _id: { $in: [...byKey.keys()] } }, { projection: { _id: 1 } })
    .toArray();
  const seenKeys = new Set(seen.map((s) => s._id));

  return [...byKey.values()].filter((r) => !seenKeys.has(r.key)).slice(0, limit);
}

async function markSeen(keys) {
  if (!keys.length) return;
  const at = new Date();
  await getDb()
    .collection(SEEN_COLLECTION)
    .bulkWrite(keys.map((key) => ({ updateOne: { filter: { _id: key }, update: { $set: { at } }, upsert: true } })));
}

async function crawlAmazon(query = 'laptop', limit = 10, category = null) {
  const { PlaywrightCrawler, RequestQueue } = await import('crawlee');
  const products = [];
  const openedKeys = [];

  // Unique queue per run: Crawlee's shared "default" queue would otherwise mark
  // this query's URLs as already handled on repeat runs (e.g. the scheduled refresh),
  // causing later runs in the same process to silently scrape nothing.
  const requestQueue = await RequestQueue.open(`amazon-products-${Date.now()}`);

  const crawler = new PlaywrightCrawler({
    requestQueue,
    maxRequestsPerCrawl: limit + 1,
    // Everything read below is text or an attribute, so images, CSS and fonts
    // are pure download time.
    preNavigationHooks: [async ({ blockRequests }) => blockRequests({ extraUrlPatterns: ['.webp', '.woff2', '.mp4'] })],
    async requestHandler({ request, page, log }) {
      if (request.label === 'PRODUCT') {
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
        // No title means a captcha or error page; leave it unseen so the next run retries.
        if (data.title) openedKeys.push(request.userData.key);
        products.push({ ...data, asin: request.userData.asin, url: request.loadedUrl });
        return;
      }

      const results = await page.evaluate(() => {
        const cards = [...document.querySelectorAll('[data-component-type="s-search-result"][data-asin]')];
        return cards
          .map((card) => ({
            asin: card.getAttribute('data-asin'),
            title: [...card.querySelectorAll('h2')].map((h) => h.textContent.trim()).join(' ') || null,
          }))
          .filter((r) => r.asin);
      });

      const picked = await pickNewResults(results, limit, category);
      log.info(`Found ${results.length} results for "${query}", opening ${picked.length} new`);
      await crawler.addRequests(
        picked.map(({ asin, key }) => ({
          url: `https://www.amazon.in/dp/${asin}`,
          label: 'PRODUCT',
          userData: { asin, key },
        })),
      );
    },
  });

  await crawler.run([{ url: `https://www.amazon.in/s?k=${encodeURIComponent(query)}`, label: 'SEARCH' }]);
  await requestQueue.drop();
  await markSeen(openedKeys);

  const validProducts = products.filter((p) => p && p.title && p.url && isWanted(p.title, category));

  const docs = validProducts.map((p) => ({ ...p, store: 'Amazon', ...(category ? { category } : {}) }));
  if (docs.length) {
    tagAmazonProducts(docs);
    await upsertProducts(getDb().collection(COLLECTION), docs, 'url');
  }

  return docs;
}

async function getCachedProducts() {
  const products = await findRecent(getDb().collection(COLLECTION));
  // Also tagged here, not only at crawl time: products crawled before the
  // Associates tag was configured would otherwise go out untagged until re-crawled.
  return products.length ? tagAmazonProducts(products) : null;
}

module.exports = { crawlAmazon, getCachedProducts };
