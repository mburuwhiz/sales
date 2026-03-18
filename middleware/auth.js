// Check if user is logged in
const isUser = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'user') {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  res.redirect('/auth/login');
};

// Check if user is verified (email + phone)
const isVerified = async (req, res, next) => {
  if (!req.session.user) {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/auth/login');
  }
  
  const User = require('../models/User');
  const user = await User.findById(req.session.user._id);
  
  if (!user.isEmailVerified || !user.isPhoneVerified) {
    return res.redirect('/auth/verification-required');
  }
  
  next();
};

// Check if admin is logged in
const isAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  
  // Destroy session if exists but not admin
  if (req.session) {
    req.session.destroy();
  }
  
  res.redirect('/admin/login');
};

// Check if user is guest (not logged in)
const isGuest = (req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  res.redirect('/account');
};

module.exports = {
  isUser,
  isVerified,
  isAdmin,
  isGuest
};
