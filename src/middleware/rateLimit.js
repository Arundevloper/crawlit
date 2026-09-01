// Small in-memory limiter. Enough to stop one client from triggering an
// unbounded number of headless-browser crawls; it is per-process, so a
// multi-instance deployment would want a Redis-backed limiter instead.
function rateLimit({ windowMs = 60_000, max = 5, message = 'Too many requests, please slow down.' } = {}) {
  const hits = new Map();

  // Drop expired buckets periodically so the map cannot grow without bound.
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (now > entry.resetAt) hits.delete(key);
    }
  }, windowMs).unref();

  return (req, res, next) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || now > entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ error: message, retryAfter });
    }

    return next();
  };
}

module.exports = { rateLimit, _sweepHandle: null };
