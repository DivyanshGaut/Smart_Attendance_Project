// Centralized error handler to avoid leaking stack traces in production.
// Call next(err) from controllers to reach here.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error(err);

  const status = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    message,
  });
};

module.exports =  errorHandler ;

