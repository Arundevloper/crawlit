const fs = require('fs/promises');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '../../data/amazon-products.json');

async function crawlAmazon(query = 'laptop', limit = 10) {
  const { PlaywrightCrawler } = await import('crawlee');
  const products = [];

  const crawler = new PlaywrightCrawler({
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

module.exports = { crawlAmazon, getCachedProducts };
