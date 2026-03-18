const isUser = async (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  if (req.session.userId === 'admin') {
    return res.redirect('/admin');
  }
  const User = require('../models/User');
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.session.destroy();
      return res.redirect('/login');
    }
    if (!user.isEmailVerified || !user.isPhoneVerified) {
       return res.status(403).send('Please verify email and phone before proceeding.');
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Error finding user in session:', error);
    req.session.destroy();
    return res.redirect('/login');
  }
};

const isAdmin = async (req, res, next) => {
  if (req.session.role !== 'admin') {
    req.session.destroy();
    return res.redirect('/admin/login');
  }
  next();
};

module.exports = { isUser, isAdmin };
