const isUser = async (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  const User = require('../models/User');
  const user = await User.findById(req.session.userId);
  if (!user.isEmailVerified || !user.isPhoneVerified) {
     return res.status(403).send('Please verify email and phone before proceeding.');
  }
  req.user = user;
  next();
};

const isAdmin = async (req, res, next) => {
  if (req.session.role !== 'admin') {
    req.session.destroy();
    return res.redirect('/admin/login');
  }
  next();
};

module.exports = { isUser, isAdmin };
