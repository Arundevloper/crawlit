const { amazonAssociateTag } = require('../config/config');

// EarnKaro does not carry Amazon, so Amazon links are monetised the way the
// Associates programme expects: by appending the tracking tag to the URL.
// Flipkart links keep going through the EarnKaro converter.
function withAmazonTag(url, tag = amazonAssociateTag) {
  if (!url || !tag) return null;

  let parsed;
  try {
    parsed = new URL(url);
  } catch (err) {
    return null;
  }

  if (!/(^|\.)amazon\.(in|com)$/i.test(parsed.hostname)) return null;
  if (parsed.searchParams.get('tag') === tag) return url;

  parsed.searchParams.set('tag', tag);
  return parsed.toString();
}

// Adds `affiliateUrl` to Amazon products. Returns the same array so it can be
// dropped into a crawl pipeline; products keep their original `url` untouched.
function tagAmazonProducts(products) {
  if (!amazonAssociateTag) return products;
  for (const product of products) {
    if (product.affiliateUrl) continue;
    const tagged = withAmazonTag(product.url);
    if (tagged) product.affiliateUrl = tagged;
  }
  return products;
}

// A product's affiliate link never changes, but converting one costs a
// rate-limited EarnKaro call. Copy links already stored for these products so
// only products new to the collection go through the converter.
async function reuseStoredAffiliateLinks(collection, products) {
  const urls = products.filter((p) => p.url && !p.affiliateUrl).map((p) => p.url);
  if (!urls.length) return products;

  const stored = await collection
    .find({ url: { $in: urls }, affiliateUrl: { $type: 'string' } }, { projection: { _id: 0, url: 1, affiliateUrl: 1 } })
    .toArray();
  const byUrl = new Map(stored.map((s) => [s.url, s.affiliateUrl]));
  for (const product of products) {
    if (!product.affiliateUrl && byUrl.has(product.url)) product.affiliateUrl = byUrl.get(product.url);
  }
  return products;
}

module.exports = { withAmazonTag, tagAmazonProducts, reuseStoredAffiliateLinks };
