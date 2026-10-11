function titleWords(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

// Variants of one product (colors, sizes, pack counts) have distinct URLs/ASINs
// but near-identical titles. The first 8 significant words identify the product,
// so "SMOWKLY Casual Trousers ... (Black)" and "... (Beige)" collapse to one.
function prefixSignature(title) {
  const words = titleWords(title);
  return words.length ? words.slice(0, 8).join(' ') : null;
}

module.exports = { titleWords, prefixSignature };
