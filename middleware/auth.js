const User = require('../models/User');

const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  req.flash('error', 'Please log in to access this page');
  res.redirect('/login');
};

const requireCompleteProfile = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      req.flash('error', 'Please log in to access this page');
      return res.redirect('/login');
    }

    const user = await User.findById(req.session.userId);

    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/login');
    }

    // Check if profile is complete
    if (!user.isProfileComplete()) {
      req.flash('error', 'Please complete your profile before making purchases');
      return res.redirect('/profile?redirect=' + encodeURIComponent(req.originalUrl));
    }

    next();
  } catch (error) {
    console.error('Profile check error:', error);
    req.flash('error', 'Error checking profile status');
    res.redirect('/profile');
  }
};

module.exports = {
  isAuthenticated,
  requireCompleteProfile
};