const { runCrawl } = require('../services/crawler.service');

async function getCrawlDemo(req, res, next) {
  try {
    const startUrl = req.query.url || 'https://crawlee.dev';
    const maxRequests = Number(req.query.max) || 10;
    const results = await runCrawl([startUrl], maxRequests);
    res.json({ startUrl, count: results.length, results });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCrawlDemo };
