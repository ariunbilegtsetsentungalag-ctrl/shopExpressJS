const { body, validationResult } = require('express-validator');

exports.validateQuantity = [
  body('quantity')
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array()[0].msg);
      return res.redirect('back');
    }
    next();
  }
];

exports.validateProductId = [
  body('productId')
    .isMongoId()
    .withMessage('Invalid product ID'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array()[0].msg);
      return res.redirect('/shop');
    }
    next();
  }
];

exports.validateUserInput = [
  body('*').trim().escape(),
  (req, res, next) => {
    next();
  }
];

exports.cartRateLimit = (req, res, next) => {
  const userId = req.session.userId || req.ip;
  const key = `cart_${userId}`;
  
  if (!req.session.cartAttempts) {
    req.session.cartAttempts = {};
  }
  
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxAttempts = 20; // 20 cart operations per minute
  
  if (!req.session.cartAttempts[key]) {
    req.session.cartAttempts[key] = { count: 1, resetTime: now + windowMs };
  } else if (now > req.session.cartAttempts[key].resetTime) {
    req.session.cartAttempts[key] = { count: 1, resetTime: now + windowMs };
  } else {
    req.session.cartAttempts[key].count++;
    
    if (req.session.cartAttempts[key].count > maxAttempts) {
      req.flash('error', 'Too many cart operations. Please wait a moment.');
      return res.status(429).redirect('back');
    }
  }
  
  next();
};