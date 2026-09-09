const express = require('express');
const { siteUrl } = require('../config/config');
const { getCachedDeals } = require('../services/amazonDeals.service');
const { getCachedProducts } = require('../services/amazon.service');
const { getCachedFlipkart } = require('../services/flipkart.service');
const { getCachedMyntra } = require('../services/myntra.service');
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
    const [deals, products, flipkart, myntra] = await Promise.all([
      getCachedDeals(),
      getCachedProducts(),
      getCachedFlipkart(),
      getCachedMyntra(),
    ]);

    const items = [...(deals || []), ...(products || []), ...(flipkart || []), ...(myntra || [])]
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
    <description>Products with more than ${MIN_DISCOUNT}% off, tracked across Amazon, Flipkart and Myntra.</description>
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
    const [deals, products, flipkart, myntra] = await Promise.all([
      getCachedDeals(), getCachedProducts(), getCachedFlipkart(), getCachedMyntra(),
    ]);

    const statics = ['/', '/about.html', '/contact.html', '/privacy.html', '/terms.html', '/disclaimer.html']
      .map((u) => `  <url><loc>${siteUrl}${u}</loc><changefreq>${u === '/' ? 'hourly' : 'monthly'}</changefreq><priority>${u === '/' ? '1.0' : '0.5'}</priority></url>`);

    // Resolve each product to its deal-page path by hostname, not by pattern
    // alone: an unanchored /itm.../ match would mislabel a Myntra slug that
    // happens to contain "itm". Newest deals first, deduped, capped well under
    // the 50,000-URL sitemap limit.
    const candidates = new Map();
    for (const p of [...(deals || []), ...(products || []), ...(flipkart || []), ...(myntra || [])]) {
      if (!p.url) continue;
      let host = '';
      try { host = new URL(p.url).hostname; } catch (err) { continue; }
      let path = null;
      if (/myntra\.com$/i.test(host)) {
        const m = p.url.match(/\/(\d{5,})\/buy/i);
        if (m) path = `/deal/myntra/${m[1]}`;
      } else if (/flipkart\.com$/i.test(host)) {
        const m = p.url.match(/itm([a-z0-9]+)/i);
        if (m) path = `/deal/flipkart/${m[1]}`;
      } else if (/amazon\./i.test(host)) {
        const m = p.url.match(/\/dp\/([A-Z0-9]{8,})/i);
        if (p.asin) path = `/deal/amazon/${p.asin}`;
        else if (m) path = `/deal/amazon/${m[1]}`;
      }
      if (!path) continue;
      const t = new Date(p.firstSeenAt || 0).getTime();
      if (!candidates.has(path) || candidates.get(path) < t) candidates.set(path, t);
    }
    const dealUrls = [...candidates.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 45000)
      .map(([path]) => `  <url><loc>${siteUrl}${path}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...statics, ...dealUrls].join('\n')}\n</urlset>\n`;
    res.type('application/xml').set('Cache-Control', 'public, max-age=1800').send(xml);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
