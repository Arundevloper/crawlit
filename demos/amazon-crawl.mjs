import fs from 'node:fs/promises';
import { PlaywrightCrawler } from 'crawlee';

const SEARCH_QUERY = process.argv[2] || 'laptop';
const LIMIT = Number(process.argv[3]) || 10;
const OUTPUT_FILE = new URL('../../data/amazon-products.json', import.meta.url);

const products = [];

const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: LIMIT + 1,
    async requestHandler({ request, page, log }) {
        if (request.label === 'PRODUCT') {
            await page.waitForTimeout(1500);

            const data = await page.evaluate(() => {
                const text = (sel) => document.querySelector(sel)?.textContent?.trim().replace(/\s+/g, ' ') || null;

                // Amazon's buybox price + discount live together in one accessibility
                // label, e.g. "₹78,990.00 with 10 percent savings" — same idea as
                // dealsspy's single `.row.prices` segment holding price+mrp+discount.
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

        const asins = await page.evaluate((limit) => {
            const found = [...document.querySelectorAll('[data-asin]')]
                .map((el) => el.getAttribute('data-asin'))
                .filter(Boolean);
            return [...new Set(found)].slice(0, limit);
        }, LIMIT);

        log.info(`Found ${asins.length} products for "${SEARCH_QUERY}"`);
        await crawler.addRequests(
            asins.map((asin) => ({ url: `https://www.amazon.in/dp/${asin}`, label: 'PRODUCT' })),
        );
    },
});

await crawler.run([{ url: `https://www.amazon.in/s?k=${encodeURIComponent(SEARCH_QUERY)}`, label: 'SEARCH' }]);

await fs.mkdir(new URL('../../data/', import.meta.url), { recursive: true });
await fs.writeFile(OUTPUT_FILE, JSON.stringify(products, null, 2));

console.log(`Saved ${products.length} products to data/amazon-products.json`);
