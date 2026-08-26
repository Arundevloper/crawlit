const { getDb } = require('../config/db');

const SITEMAP_URL = 'https://www.dealsspy.in/sitemap/deals-sitemap.xml';
const COLLECTION = 'dealsspy_products';

async function getSeedUrls(limit) {
  const res = await fetch(SITEMAP_URL);
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  return urls.slice(0, limit);
}

async function crawlDealsspy(limit = 100) {
  const { CheerioCrawler } = await import('crawlee');
  const products = [];

  const crawler = new CheerioCrawler({
    maxConcurrency: 5,
    maxRequestsPerCrawl: limit,
    async requestHandler({ request, $, log }) {
      const title = $('h1.product-title').text().trim();
      let price = $('.row.prices .price').first().text().trim() || null;
      const mrp = $('.row.prices .mrp').first().text().replace('MRP:', '').trim() || null;
      const discount = $('.row.prices .discount').first().text().trim() || null;
      const store = $('.ds-store-action .store img').first().attr('alt') || null;
      const image = $('meta[property="og:image"]').attr('content') || null;

      // "Flash sale" listings (e.g. "... @ ₹15999 on Flipkart Big Billion Days Sale",
      // or "... Live @ 12 AM @ 37999") use a different template with no .row.prices
      // block; the price only appears in the title, sometimes without a ₹ sign.
      if (!price) {
        const withSymbol = title.match(/₹\s?([\d,]+(?:\.\d+)?)/);
        const trailingNumber = title.match(/@\s*([\d,]{4,})\s*$/);
        const match = withSymbol || trailingNumber;
        if (match) price = `₹${match[1]}`;
      }

      log.info(`Scraped: ${title} — ${price}`);
      products.push({ title, price, mrp, discount, store, image, url: request.loadedUrl });
    },
  });

  const seedUrls = await getSeedUrls(limit);
  await crawler.run(seedUrls);

  const collection = getDb().collection(COLLECTION);
  await collection.deleteMany({});
  if (products.length) await collection.insertMany(products);

  return products;
}

async function getCachedProducts() {
  const products = await getDb()
    .collection(COLLECTION)
    .find({}, { projection: { _id: 0 } })
    .toArray();
  return products.length ? products : null;
}

module.exports = { crawlDealsspy, getCachedProducts };
