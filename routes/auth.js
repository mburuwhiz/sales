const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const { isGuest } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../utils/email');
const { sendVerificationCode } = require('../utils/whatsapp');

// Login Page
router.get('/login', isGuest, (req, res) => {
  res.render('auth/login', {
    title: 'Login - Fresh Harvest Grocery',
    error: null
  });
});

// Login POST
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.render('auth/login', {
        title: 'Login - Fresh Harvest Grocery',
        error: 'Invalid email or password'
      });
    }

    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.render('auth/login', {
        title: 'Login - Fresh Harvest Grocery',
        error: 'Invalid email or password'
      });
    }

    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      walletCoins: user.walletCoins
    };

    const returnTo = req.session.returnTo || '/account';
    delete req.session.returnTo;
    
    res.redirect(returnTo);
  } catch (error) {
    console.error('Login error:', error);
    res.render('auth/login', {
      title: 'Login - Fresh Harvest Grocery',
      error: 'An error occurred. Please try again.'
    });
  }
});

// Register Page
router.get('/register', isGuest, (req, res) => {
  res.render('auth/register', {
    title: 'Register - Fresh Harvest Grocery',
    error: null
  });
});

// Register POST
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    // Validation
    if (password !== confirmPassword) {
      return res.render('auth/register', {
        title: 'Register - Fresh Harvest Grocery',
        error: 'Passwords do not match'
      });
    }

    if (password.length < 6) {
      return res.render('auth/register', {
        title: 'Register - Fresh Harvest Grocery',
        error: 'Password must be at least 6 characters'
      });
    }

    // Check if email exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.render('auth/register', {
        title: 'Register - Fresh Harvest Grocery',
        error: 'Email already registered'
      });
    }

    // Check if phone exists
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.render('auth/register', {
        title: 'Register - Fresh Harvest Grocery',
        error: 'Phone number already registered'
      });
    }

    // Generate verification tokens
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const phoneVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Create user
    const user = new User({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      emailVerificationToken,
      phoneVerificationCode
    });

    await user.save();

    // Send verification email
    await sendWelcomeEmail(user);

    // Send WhatsApp verification code
    await sendVerificationCode(phone, phoneVerificationCode);

    // Auto login
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      walletCoins: user.walletCoins
    };

    res.redirect('/auth/verification-required');
  } catch (error) {
    console.error('Registration error:', error);
    res.render('auth/register', {
      title: 'Register - Fresh Harvest Grocery',
      error: 'An error occurred. Please try again.'
    });
  }
});

// Verification Required Page
router.get('/verification-required', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  
  res.render('auth/verification', {
    title: 'Verify Your Account - Fresh Harvest Grocery',
    user: req.session.user,
    emailVerified: req.session.user.isEmailVerified,
    phoneVerified: req.session.user.isPhoneVerified,
    message: null
  });
});

// Verify Email
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    
    const user = await User.findOne({ emailVerificationToken: token });
    
    if (!user) {
      return res.render('auth/verification', {
        title: 'Verify Your Account - Fresh Harvest Grocery',
        user: req.session.user,
        emailVerified: false,
        phoneVerified: req.session.user?.isPhoneVerified || false,
        message: { type: 'error', text: 'Invalid or expired verification link' }
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    await user.save();

    // Update session
    if (req.session.user) {
      req.session.user.isEmailVerified = true;
    }

    res.render('auth/verification', {
      title: 'Verify Your Account - Fresh Harvest Grocery',
      user: req.session.user,
      emailVerified: true,
      phoneVerified: user.isPhoneVerified,
      message: { type: 'success', text: 'Email verified successfully!' }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.render('auth/verification', {
      title: 'Verify Your Account - Fresh Harvest Grocery',
      user: req.session.user,
      emailVerified: false,
      phoneVerified: req.session.user?.isPhoneVerified || false,
      message: { type: 'error', text: 'An error occurred. Please try again.' }
    });
  }
});

// Verify Phone POST
router.post('/verify-phone', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }

    const user = await User.findById(req.session.user._id);
    
    if (user.phoneVerificationCode !== code) {
      return res.render('auth/verification', {
        title: 'Verify Your Account - Fresh Harvest Grocery',
        user: req.session.user,
        emailVerified: user.isEmailVerified,
        phoneVerified: false,
        message: { type: 'error', text: 'Invalid verification code' }
      });
    }

    user.isPhoneVerified = true;
    user.phoneVerificationCode = null;
    await user.save();

    req.session.user.isPhoneVerified = true;

    res.render('auth/verification', {
      title: 'Verify Your Account - Fresh Harvest Grocery',
      user: req.session.user,
      emailVerified: user.isEmailVerified,
      phoneVerified: true,
      message: { type: 'success', text: 'Phone verified successfully!' }
    });
  } catch (error) {
    console.error('Phone verification error:', error);
    res.render('auth/verification', {
      title: 'Verify Your Account - Fresh Harvest Grocery',
      user: req.session.user,
      emailVerified: req.session.user?.isEmailVerified || false,
      phoneVerified: false,
      message: { type: 'error', text: 'An error occurred. Please try again.' }
    });
  }
});

// Resend Phone Code
router.post('/resend-phone-code', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }

    const user = await User.findById(req.session.user._id);
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.phoneVerificationCode = newCode;
    await user.save();

    await sendVerificationCode(user.phone, newCode);

    res.render('auth/verification', {
      title: 'Verify Your Account - Fresh Harvest Grocery',
      user: req.session.user,
      emailVerified: user.isEmailVerified,
      phoneVerified: user.isPhoneVerified,
      message: { type: 'success', text: 'New verification code sent!' }
    });
  } catch (error) {
    console.error('Resend code error:', error);
    res.render('auth/verification', {
      title: 'Verify Your Account - Fresh Harvest Grocery',
      user: req.session.user,
      emailVerified: req.session.user?.isEmailVerified || false,
      phoneVerified: req.session.user?.isPhoneVerified || false,
      message: { type: 'error', text: 'Failed to send code. Please try again.' }
    });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
