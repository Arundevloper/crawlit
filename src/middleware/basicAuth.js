const crypto = require('crypto');

// Constant-time compare so a wrong password cannot be discovered by timing
// how long the comparison takes.
function safeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function basicAuth({ user, pass, realm = 'Restricted' }) {
  return (req, res, next) => {
    // Without credentials configured the route stays closed rather than open:
    // a queue dashboard can retry, delete and inspect jobs.
    if (!user || !pass) {
      return res.status(503).json({
        error: 'Dashboard is disabled. Set ADMIN_USER and ADMIN_PASS in .env to enable it.',
      });
    }

    const header = req.headers.authorization || '';
    const [scheme, encoded] = header.split(' ');

    if (scheme === 'Basic' && encoded) {
      const decoded = Buffer.from(encoded, 'base64').toString();
      const index = decoded.indexOf(':');
      const givenUser = decoded.slice(0, index);
      const givenPass = decoded.slice(index + 1);

      if (safeEqual(givenUser, user) && safeEqual(givenPass, pass)) return next();
    }

    res.set('WWW-Authenticate', `Basic realm="${realm}", charset="UTF-8"`);
    return res.status(401).send('Authentication required.');
  };
}

module.exports = { basicAuth };
