const config = require('../config/config');

const API_URL = 'https://ekaro-api.affiliaters.in/api/converter/public';
const MIN_DELAY_MS = 1100; // ~54 req/min, safely under the 60/min limit
const RETRY_DELAY_MS = 62_000; // back off 62s on 429

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Convert a single product URL to an EarnKaro affiliate link.
 * Returns the affiliate URL string on success, or null on failure.
 */
async function convertLink(originalUrl) {
  const token = config.earnKaroApiToken;
  if (!token) {
    console.warn('[EarnKaro] No API token configured — skipping link conversion');
    return null;
  }

  const body = JSON.stringify({
    deal: originalUrl,
    convert_option: config.earnKaroConvertOption || 'convert_only',
  });

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    if (res.status === 429) {
      console.warn('[EarnKaro] Rate limited — will retry after backoff');
      return 'RATE_LIMITED';
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.warn(`[EarnKaro] API error ${res.status}: ${text}`);
      return null;
    }

    const data = await res.json();
    if (data.success === 1 && data.data) {
      return data.data;
    }

    console.warn('[EarnKaro] Unexpected response:', JSON.stringify(data));
    return null;
  } catch (err) {
    console.error('[EarnKaro] Request failed:', err.message);
    return null;
  }
}

/**
 * Enrich an array of product objects with `affiliateUrl`.
 * Processes sequentially with rate-limit-safe delays.
 * Products that already have an affiliateUrl are skipped.
 */
async function convertLinks(products) {
  const token = config.earnKaroApiToken;
  if (!token) {
    console.warn('[EarnKaro] No API token — skipping all conversions');
    return products;
  }

  const toConvert = products.filter((p) => p.url && !p.affiliateUrl);
  if (!toConvert.length) return products;

  console.log(`[EarnKaro] Converting ${toConvert.length} link(s)…`);

  let converted = 0;
  for (const product of toConvert) {
    const result = await convertLink(product.url);

    if (result === 'RATE_LIMITED') {
      console.log(`[EarnKaro] Backing off ${RETRY_DELAY_MS / 1000}s…`);
      await sleep(RETRY_DELAY_MS);
      // Retry once after backoff
      const retry = await convertLink(product.url);
      if (retry && retry !== 'RATE_LIMITED') {
        product.affiliateUrl = retry;
        converted++;
      }
    } else if (result) {
      product.affiliateUrl = result;
      converted++;
    }

    // Respect rate limit between calls
    await sleep(MIN_DELAY_MS);
  }

  console.log(`[EarnKaro] Converted ${converted}/${toConvert.length} links`);
  return products;
}

module.exports = { convertLink, convertLinks };
