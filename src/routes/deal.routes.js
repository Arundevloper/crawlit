const express = require('express');
const { getDb } = require('../config/db');
const { siteUrl } = require('../config/config');
const { parseDiscountPct, parsePrice } = require('../utils/price');

const router = express.Router();

function esc(value) {
  return String(value == null ? '' : value).replace(/[<>&'"]/g, (c) => (
    { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&#39;', '"': '&quot;' }[c]
  ));
}

// Look the product up by the identifier already present in its URL: the ASIN
// for Amazon, the itm id for Flipkart. No new fields or re-crawl required.
async function findDeal(store, id) {
  const db = getDb();
  const safeId = String(id).replace(/[^A-Za-z0-9]/g, '');
  if (!safeId) return null;

  if (store === 'amazon') {
    return (
      (await db.collection('amazon_deals').findOne({ asin: safeId })) ||
      (await db.collection('amazon_products').findOne({ url: new RegExp(`/dp/${safeId}(?:[/?]|$)`) }))
    );
  }
  if (store === 'flipkart') {
    return db.collection('flipkart_products').findOne({ url: new RegExp(`itm${safeId}(?:[/?]|$)`, 'i') });
  }
  return null;
}

function renderDealPage(product, store, id) {
  const discount = parseDiscountPct(product.discountPct ?? product.discount);
  const price = parsePrice(product.price);
  const mrp = parsePrice(product.mrp);
  const saving = price !== null && mrp !== null && mrp > price ? Math.round(mrp - price) : null;
  const target = product.affiliateUrl || product.url;
  const canonical = `${siteUrl}/deal/${store}/${id}`;
  const storeName = product.store || (store === 'flipkart' ? 'Flipkart' : 'Amazon');

  // Product structured data: this is what lets the page appear as a rich
  // result rather than a plain blue link.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    url: canonical,
    ...(product.image ? { image: product.image } : {}),
    ...(product.rating ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: String(product.rating).match(/[\d.]+/)?.[0],
        bestRating: '5',
        ratingCount: String(product.reviews || '1').replace(/[^0-9]/g, '') || '1',
      },
    } : {}),
    ...(price !== null ? {
      offers: {
        '@type': 'Offer',
        price: String(price),
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        url: canonical,
        seller: { '@type': 'Organization', name: storeName },
      },
    } : {}),
  };

  const description = `${product.title} — ${product.price}${mrp ? ` (was ${product.mrp})` : ''}${discount ? `, ${discount}% off` : ''} on ${storeName}.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="${esc(description.slice(0, 300))}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:site_name" content="DealMint">
<meta property="og:type" content="product">
<meta property="og:title" content="${esc(product.title)}">
<meta property="og:description" content="${esc(description.slice(0, 300))}">
<meta property="og:url" content="${esc(canonical)}">
${product.image ? `<meta property="og:image" content="${esc(product.image)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/svg+xml" href="/dealmint-icon.svg">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#6d28d9">
<link rel="stylesheet" href="/assets/site.css">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<title>${esc(product.title.slice(0, 65))} — DealMint</title>
<style>
  .deal-grid { display: grid; grid-template-columns: 320px 1fr; gap: 28px; align-items: start; }
  .deal-media { background: #fff; border: 1px solid var(--border); border-radius: 14px; padding: 16px; text-align: center; }
  .deal-media img { max-width: 100%; height: auto; }
  .deal-price { font-size: 2.1rem; font-weight: 800; letter-spacing: -0.02em; }
  .deal-mrp { text-decoration: line-through; color: #9ca3af; margin-left: 10px; font-size: 1rem; }
  .deal-off { display: inline-block; background: linear-gradient(135deg,#e11d48,#dc2626); color: #fff; font-weight: 800; font-size: 0.85rem; padding: 4px 10px; border-radius: 6px; margin-left: 10px; }
  .deal-save { color: #047857; font-weight: 700; margin-top: 6px; }
  .deal-meta { color: var(--text-muted); font-size: 0.88rem; margin-top: 14px; }
  @media (max-width: 720px) { .deal-grid { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<header class="site-header">
  <div class="header-inner">
    <a class="brand" href="/" aria-label="DealMint home">
      <span class="logo-badge"><img src="/dealmint-icon.svg" alt="" width="34" height="34"></span>
      <span class="brand-text">
        <span class="brand-name">Deal<span class="accent">Mint</span></span>
        <span class="tagline">deal tracking, all in one place</span>
      </span>
    </a>
    <nav class="header-nav"><a class="nav-link" href="/">All Deals</a></nav>
  </div>
</header>

<main>
  <span class="page-eyebrow">${esc(storeName)}${product.category ? ` &middot; ${esc(product.category)}` : ''}</span>
  <h1 style="font-size:1.5rem;line-height:1.35">${esc(product.title)}</h1>

  <div class="deal-grid" style="margin-top:20px">
    <div class="deal-media">
      ${product.image ? `<img src="${esc(product.image)}" alt="${esc(product.title.slice(0, 80))}" referrerpolicy="no-referrer" loading="lazy">` : '<span class="muted">No image available</span>'}
    </div>
    <div>
      <div class="card-panel">
        <div>
          <span class="deal-price">${esc(product.price || '')}</span>
          ${product.mrp ? `<span class="deal-mrp">${esc(product.mrp)}</span>` : ''}
          ${discount ? `<span class="deal-off">${discount}% OFF</span>` : ''}
        </div>
        ${saving ? `<div class="deal-save">You save ₹${saving.toLocaleString('en-IN')}</div>` : ''}
        <div class="contact-row" style="margin-top:16px">
          <a class="btn" href="${esc(target)}" target="_blank" rel="nofollow sponsored noopener">Grab this deal on ${esc(storeName)} →</a>
        </div>
        <p class="deal-meta">
          ${product.rating ? `Rated ${esc(String(product.rating).match(/[\d.]+/)?.[0] || '')} out of 5. ` : ''}
          Price last checked ${product.lastSeenAt ? new Date(product.lastSeenAt).toLocaleString('en-IN') : 'recently'}.
        </p>
      </div>
      <div class="callout">
        Prices change frequently. Always confirm the final price on ${esc(storeName)} before buying &mdash; see our <a href="/disclaimer.html">disclaimer</a>.
      </div>
      <p class="muted"><a href="/">&larr; Back to all deals</a></p>
    </div>
  </div>
</main>

<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <a class="footer-logo" href="/" aria-label="DealMint home">
        <span class="logo-badge footer-badge"><img src="/dealmint-icon.svg" alt="" width="28" height="28"></span>
        <span class="brand-name">Deal<span class="accent">Mint</span></span>
      </a>
      <span class="footer-desc">Tracking the best discounts across Amazon and Flipkart.</span>
    </div>
    <div class="footer-links">
      <span class="col-title">Explore</span>
      <a href="/">All Deals</a>
      <a href="/about.html">About Us</a>
      <a href="/contact.html">Contact Us</a>
    </div>
    <div class="footer-links">
      <span class="col-title">Legal</span>
      <a href="/privacy.html">Privacy Policy</a>
      <a href="/terms.html">Terms of Service</a>
      <a href="/disclaimer.html">Disclaimer</a>
    </div>
  </div>
  <div class="footer-bottom">
    <span>&copy; 2026 dealmint.in. All rights reserved.</span>
    <span>Prices &amp; availability are subject to change on the seller's site.</span>
  </div>
</footer>
</body>
</html>`;
}

router.get('/deal/:store/:id', async (req, res, next) => {
  try {
    const store = String(req.params.store).toLowerCase();
    const product = await findDeal(store, req.params.id);

    if (!product) {
      // Deals expire. Tell crawlers not to keep the page rather than 200ing
      // on an empty shell.
      return res.status(404).type('html').send(
        '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">'
        + '<meta name="robots" content="noindex"><title>Deal not found — DealMint</title>'
        + '<link rel="stylesheet" href="/assets/site.css"></head><body><main>'
        + '<h1>This deal is no longer available</h1>'
        + '<p class="lede">It may have expired or sold out.</p>'
        + '<p><a class="btn" href="/">See current deals</a></p></main></body></html>',
      );
    }

    res.type('html').set('Cache-Control', 'public, max-age=300').send(renderDealPage(product, store, req.params.id));
  } catch (err) {
    next(err);
  }
});

module.exports = { router, findDeal };
