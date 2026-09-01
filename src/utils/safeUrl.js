const dns = require('dns').promises;
const net = require('net');

// Hosts the ad-hoc /api/crawl endpoint is allowed to fetch. Without this an
// attacker can point the crawler at internal addresses — cloud metadata
// services, admin panels on localhost, anything reachable from the server.
const ALLOWED_HOSTS = [
  'amazon.in', 'www.amazon.in',
  'flipkart.com', 'www.flipkart.com',
  'crawlee.dev',
];

function isPrivateAddress(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) || // link-local, incl. cloud metadata 169.254.169.254
      (a === 100 && b >= 64 && b <= 127) // carrier-grade NAT
    );
  }
  const lower = ip.toLowerCase();
  return (
    lower === '::1' ||
    lower === '::' ||
    lower.startsWith('fc') ||
    lower.startsWith('fd') ||
    lower.startsWith('fe80')
  );
}

/**
 * Validate a user-supplied crawl target.
 * Returns { ok: true, url } or { ok: false, reason }.
 */
async function assertSafeCrawlUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch (err) {
    return { ok: false, reason: 'Not a valid URL' };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { ok: false, reason: 'Only http and https are supported' };
  }

  const host = parsed.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.includes(host)) {
    return { ok: false, reason: `Host not allowed. Permitted: ${ALLOWED_HOSTS.join(', ')}` };
  }

  // An allowed hostname could still resolve to a private address (DNS
  // rebinding), so check the resolved IPs too.
  try {
    const records = await dns.lookup(host, { all: true });
    if (records.some((r) => isPrivateAddress(r.address))) {
      return { ok: false, reason: 'Host resolves to a private address' };
    }
  } catch (err) {
    return { ok: false, reason: 'Host could not be resolved' };
  }

  return { ok: true, url: parsed.toString() };
}

module.exports = { assertSafeCrawlUrl, isPrivateAddress, ALLOWED_HOSTS };
