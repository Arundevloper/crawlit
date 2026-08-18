function notFound(req, res, next) {
  res.status(404).json({ error: `Not found - ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
}

module.exports = { notFound, errorHandler };
