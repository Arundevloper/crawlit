import fs from 'node:fs/promises';
import { CheerioCrawler } from 'crawlee';

const SITEMAP_URL = 'https://www.dealsspy.in/sitemap/deals-sitemap.xml';
const LIMIT = 100;
const OUTPUT_FILE = new URL('../../data/dealsspy-products.json', import.meta.url);

async function getSeedUrls(limit) {
    const res = await fetch(SITEMAP_URL);
    const xml = await res.text();
    const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
    return urls.slice(0, limit);
}

const products = [];

const crawler = new CheerioCrawler({
    maxConcurrency: 5,
    maxRequestsPerCrawl: LIMIT,
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
    failedRequestHandler({ request, log }) {
        log.warning(`Failed: ${request.url}`);
    },
});

const seedUrls = await getSeedUrls(LIMIT);
console.log(`Seeded ${seedUrls.length} product URLs from sitemap`);

await crawler.run(seedUrls);

await fs.mkdir(new URL('../../data/', import.meta.url), { recursive: true });
await fs.writeFile(OUTPUT_FILE, JSON.stringify(products, null, 2));

console.log(`Saved ${products.length} products to data/dealsspy-products.json`);
