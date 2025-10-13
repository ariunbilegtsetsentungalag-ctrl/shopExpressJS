const { isAuthenticated } = require('./auth');


const isAdminOrProductManager = (req, res, next) => {
  if (req.session.user && 
      (req.session.user.role === 'admin' || req.session.user.role === 'product_manager')) {
    next();
  } else {
    req.flash('error', 'You do not have permission to access this area');
    res.redirect('/shop');
  }
};


const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') {
    next();
  } else {
    req.flash('error', 'Admin access required');
    res.redirect('/shop');
  }
};


const hasPermission = (permission) => {
  return (req, res, next) => {
    if (req.session.user && 
        (req.session.user.permissions?.includes(permission) || req.session.user.role === 'admin')) {
      next();
    } else {
      req.flash('error', 'You do not have permission to perform this action');
      res.redirect('/shop');
    }
  };
};

module.exports = {
  isAuthenticated,
  isAdminOrProductManager,
  isAdmin,
  hasPermission
};