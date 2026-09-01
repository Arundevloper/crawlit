const express = require('express');
const { siteUrl } = require('../config/config');
const { getCachedDeals } = require('../services/amazonDeals.service');
const { getCachedProducts } = require('../services/amazon.service');
const { getCachedFlipkart } = require('../services/flipkart.service');
const { parseDiscountPct } = require('../utils/price');

const router = express.Router();
const FEED_LIMIT = 50;
const MIN_DISCOUNT = 30;

// XML has five reserved characters; a product title containing "&" or "<"
// would otherwise produce a feed that no reader can parse.
function xmlEscape(value) {
  return String(value == null ? '' : value).replace(/[<>&'"]/g, (c) => (
    { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]
  ));
}

router.get('/feed.xml', async (req, res, next) => {
  try {
    const [deals, products, flipkart] = await Promise.all([
      getCachedDeals(),
      getCachedProducts(),
      getCachedFlipkart(),
    ]);

    const items = [...(deals || []), ...(products || []), ...(flipkart || [])]
      .map((p) => ({ ...p, discountPct: parseDiscountPct(p.discountPct ?? p.discount) }))
      .filter((p) => p.url && p.title && p.discountPct !== null && p.discountPct > MIN_DISCOUNT)
      .sort((a, b) => new Date(b.firstSeenAt) - new Date(a.firstSeenAt))
      .slice(0, FEED_LIMIT);

    const now = new Date().toUTCString();
    const entries = items
      .map((p) => {
        const saving = p.mrp ? ` (was ${p.mrp})` : '';
        const description = `${p.discountPct}% off — ${p.price}${saving} on ${p.store || 'Amazon'}`;
        return [
          '    <item>',
          `      <title>${xmlEscape(p.title)}</title>`,
          `      <link>${xmlEscape(p.url)}</link>`,
          `      <guid isPermaLink="true">${xmlEscape(p.url)}</guid>`,
          `      <description>${xmlEscape(description)}</description>`,
          `      <category>${xmlEscape(p.category || 'deals')}</category>`,
          `      <pubDate>${new Date(p.firstSeenAt || Date.now()).toUTCString()}</pubDate>`,
          '    </item>',
        ].join('\n');
      })
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>DealMint — High Discount Deals</title>
    <link>${siteUrl}/</link>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <description>Products with more than ${MIN_DISCOUNT}% off, tracked across Amazon and Flipkart.</description>
    <language>en-in</language>
    <lastBuildDate>${now}</lastBuildDate>
${entries}
  </channel>
</rss>
`;

    res.type('application/rss+xml').set('Cache-Control', 'public, max-age=300').send(xml);
  } catch (err) {
    next(err);
  }
});


// Sitemap generated from live data so newly-found deals become discoverable
// without a manual rebuild. Overrides the static public/sitemap.xml.
router.get('/sitemap.xml', async (req, res, next) => {
  try {
    const [deals, products, flipkart] = await Promise.all([
      getCachedDeals(), getCachedProducts(), getCachedFlipkart(),
    ]);

    const statics = ['/', '/about.html', '/contact.html', '/privacy.html', '/terms.html', '/disclaimer.html']
      .map((u) => `  <url><loc>${siteUrl}${u}</loc><changefreq>${u === '/' ? 'hourly' : 'monthly'}</changefreq><priority>${u === '/' ? '1.0' : '0.5'}</priority></url>`);

    const dealUrls = [];
    for (const p of [...(deals || []), ...(products || []), ...(flipkart || [])]) {
      if (!p.url) continue;
      const amazon = p.url.match(/\/dp\/([A-Z0-9]{8,})/i);
      const flip = p.url.match(/itm([a-z0-9]+)/i);
      const path = p.asin ? `/deal/amazon/${p.asin}`
        : amazon ? `/deal/amazon/${amazon[1]}`
        : flip ? `/deal/flipkart/${flip[1]}` : null;
      if (!path) continue;
      dealUrls.push(`  <url><loc>${siteUrl}${path}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`);
      if (dealUrls.length >= 5000) break; // sitemap protocol limit is 50k
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...statics, ...new Set(dealUrls)].join('\n')}\n</urlset>\n`;
    res.type('application/xml').set('Cache-Control', 'public, max-age=1800').send(xml);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
