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

module.exports = { withAmazonTag, tagAmazonProducts };
