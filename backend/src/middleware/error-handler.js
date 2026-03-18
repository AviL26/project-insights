function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
}

function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  const message = status === 500 ? 'Internal server error' : err.message;
  if (status === 500) console.error(err);
  res.status(status).json({ error: message });
}

module.exports = { asyncHandler, notFoundHandler, errorHandler };
