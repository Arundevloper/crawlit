const fs = require('fs/promises');
const path = require('path');

const SITEMAP_URL = 'https://www.dealsspy.in/sitemap/deals-sitemap.xml';
const OUTPUT_FILE = path.join(__dirname, '../../data/dealsspy-products.json');

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
      const price = $('.row.prices .price').first().text().trim();
      const mrp = $('.row.prices .mrp').first().text().replace('MRP:', '').trim();
      const discount = $('.row.prices .discount').first().text().trim();
      const store = $('.ds-store-action .store img').first().attr('alt') || null;
      const image = $('meta[property="og:image"]').attr('content') || null;

      log.info(`Scraped: ${title} — ${price}`);
      products.push({ title, price, mrp, discount, store, image, url: request.loadedUrl });
    },
  });

  const seedUrls = await getSeedUrls(limit);
  await crawler.run(seedUrls);

  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(products, null, 2));

  return products;
}

async function getCachedProducts() {
  try {
    const raw = await fs.readFile(OUTPUT_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

module.exports = { crawlDealsspy, getCachedProducts };
