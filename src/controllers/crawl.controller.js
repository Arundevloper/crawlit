const { runCrawl } = require('../services/crawler.service');
const { assertSafeCrawlUrl } = require('../utils/safeUrl');

const MAX_REQUESTS = 25;

async function getCrawlDemo(req, res, next) {
  try {
    const requested = req.query.url || 'https://crawlee.dev';

    // The target is user-supplied and goes straight into a server-side fetch,
    // so it has to be checked against an allow-list before it is used.
    const check = await assertSafeCrawlUrl(requested);
    if (!check.ok) {
      return res.status(400).json({ error: check.reason });
    }

    // Bounded so a single request cannot tie up the crawler indefinitely.
    // `?max=0` is honoured rather than silently becoming the default.
    const parsedMax = Number(req.query.max);
    const maxRequests = Number.isFinite(parsedMax) && parsedMax > 0
      ? Math.min(parsedMax, MAX_REQUESTS)
      : 10;

    const results = await runCrawl([check.url], maxRequests);
    res.json({ startUrl: check.url, count: results.length, results });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCrawlDemo };
