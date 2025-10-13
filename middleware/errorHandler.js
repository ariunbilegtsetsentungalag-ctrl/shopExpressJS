// Global error handling middleware
exports.notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

exports.errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Determine status code
  const statusCode = err.status || err.statusCode || 500;
  
  // Handle different types of errors
  let message = err.message || 'Internal Server Error';
  
  // MongoDB/Mongoose errors
  if (err.name === 'CastError') {
    message = 'Invalid ID format';
    err.status = 400;
  } else if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map(e => e.message).join(', ');
    err.status = 400;
  } else if (err.code === 11000) {
    message = 'Duplicate field value entered';
    err.status = 400;
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Something went wrong!';
  }

  // Set flash message for user-friendly errors
  if (statusCode < 500) {
    req.flash('error', message);
  }

  // Render appropriate error page
  if (statusCode === 404) {
    return res.status(404).render('404', { 
      title: 'Page Not Found',
      error: 'The page you are looking for does not exist.'
    });
  }

  // For AJAX requests, return JSON
  if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
    return res.status(statusCode).json({
      success: false,
      error: message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Redirect to appropriate page with flash message
  if (statusCode < 500 && req.get('Referer')) {
    return res.redirect('back');
  }

  // Render error page for server errors
  res.status(statusCode).render('404', {
    title: 'Error',
    error: statusCode >= 500 ? 'Internal server error' : message
  });
};

// Async error handler wrapper
exports.asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Database connection error handler
exports.handleDatabaseErrors = () => {
  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    console.log('Shutting down server due to unhandled promise rejection');
    process.exit(1);
  });

  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    console.log('Shutting down server due to uncaught exception');
    process.exit(1);
  });
};