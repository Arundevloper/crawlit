function notFound(req, res, next) {
  res.status(404).json({ error: `Not found - ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;

  // Log before responding: without this, production failures are invisible.
  const line = `[error] ${req.method} ${req.originalUrl} -> ${status}: ${err.message}`;
  if (status >= 500) console.error(line, err.stack);
  else console.warn(line);

  // If the response has already started, the only correct action is to hand
  // the error to Express, which destroys the socket. Writing again throws.
  if (res.headersSent) return next(err);

  // Internal error text can leak paths and query structure, so only messages
  // attached to deliberate 4xx errors are echoed back to the client.
  const message = status < 500 ? err.message : 'Internal Server Error';
  res.status(status).json({ error: message });
}

module.exports = { notFound, errorHandler };
