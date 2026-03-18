const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const NeedHelp = require('../models/NeedHelp');
const { isUser } = require('../middleware/auth');

// Account Dashboard
router.get('/', isUser, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    
    // Get recent orders
    const recentOrders = await Order.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get order statistics
    const totalOrders = await Order.countDocuments({ userId: user._id });
    const pendingOrders = await Order.countDocuments({ 
      userId: user._id, 
      status: { $in: ['Pending', 'Approved', 'Packing', 'En-Route'] }
    });

    res.render('account/index', {
      title: 'My Account - Fresh Harvest Grocery',
      user,
      recentOrders,
      totalOrders,
      pendingOrders
    });
  } catch (error) {
    console.error('Account page error:', error);
    res.render('account/index', {
      title: 'My Account - Fresh Harvest Grocery',
      user: req.session.user,
      recentOrders: [],
      totalOrders: 0,
      pendingOrders: 0
    });
  }
});

// Order History
router.get('/orders', isUser, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const skip = (page - 1) * limit;
    
    const orders = await Order.find({ userId: req.session.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalOrders = await Order.countDocuments({ userId: req.session.user._id });
    const totalPages = Math.ceil(totalOrders / limit);

    res.render('account/orders', {
      title: 'My Orders - Fresh Harvest Grocery',
      orders,
      currentPage: parseInt(page),
      totalPages,
      totalOrders
    });
  } catch (error) {
    console.error('Orders page error:', error);
    res.render('account/orders', {
      title: 'My Orders - Fresh Harvest Grocery',
      orders: [],
      currentPage: 1,
      totalPages: 1,
      totalOrders: 0
    });
  }
});

// Order Detail
router.get('/orders/:id', isUser, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.session.user._id
    });

    if (!order) {
      return res.status(404).render('error', {
        message: 'Order not found',
        error: {}
      });
    }

    res.render('account/order-detail', {
      title: `Order ${order.orderNumber} - Fresh Harvest Grocery`,
      order
    });
  } catch (error) {
    console.error('Order detail error:', error);
    res.status(500).render('error', {
      message: 'Failed to load order',
      error: {}
    });
  }
});

// Profile Page
router.get('/profile', isUser, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    
    res.render('account/profile', {
      title: 'My Profile - Fresh Harvest Grocery',
      user,
      message: null
    });
  } catch (error) {
    console.error('Profile page error:', error);
    res.render('account/profile', {
      title: 'My Profile - Fresh Harvest Grocery',
      user: req.session.user,
      message: { type: 'error', text: 'Failed to load profile' }
    });
  }
});

// Update Profile
router.post('/profile', isUser, async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    const user = await User.findById(req.session.user._id);
    
    user.name = name;
    user.phone = phone;
    
    await user.save();

    // Update session
    req.session.user.name = name;
    req.session.user.phone = phone;

    res.render('account/profile', {
      title: 'My Profile - Fresh Harvest Grocery',
      user,
      message: { type: 'success', text: 'Profile updated successfully!' }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.render('account/profile', {
      title: 'My Profile - Fresh Harvest Grocery',
      user: req.session.user,
      message: { type: 'error', text: 'Failed to update profile' }
    });
  }
});

// Change Password
router.post('/change-password', isUser, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    if (newPassword !== confirmPassword) {
      const user = await User.findById(req.session.user._id);
      return res.render('account/profile', {
        title: 'My Profile - Fresh Harvest Grocery',
        user,
        message: { type: 'error', text: 'New passwords do not match' }
      });
    }

    const user = await User.findById(req.session.user._id);
    
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.render('account/profile', {
        title: 'My Profile - Fresh Harvest Grocery',
        user,
        message: { type: 'error', text: 'Current password is incorrect' }
      });
    }

    user.password = newPassword;
    await user.save();

    res.render('account/profile', {
      title: 'My Profile - Fresh Harvest Grocery',
      user,
      message: { type: 'success', text: 'Password changed successfully!' }
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.render('account/profile', {
      title: 'My Profile - Fresh Harvest Grocery',
      user: req.session.user,
      message: { type: 'error', text: 'Failed to change password' }
    });
  }
});

// Need Help Page
router.get('/help', isUser, (req, res) => {
  res.render('account/help', {
    title: 'Need Help - Fresh Harvest Grocery',
    message: null
  });
});

// Submit Help Request
router.post('/help', isUser, async (req, res) => {
  try {
    const { subject, message } = req.body;
    
    const helpRequest = new NeedHelp({
      userId: req.session.user._id,
      subject,
      message
    });

    await helpRequest.save();

    res.render('account/help', {
      title: 'Need Help - Fresh Harvest Grocery',
      message: { type: 'success', text: 'Your request has been submitted. We will get back to you soon!' }
    });
  } catch (error) {
    console.error('Help request error:', error);
    res.render('account/help', {
      title: 'Need Help - Fresh Harvest Grocery',
      message: { type: 'error', text: 'Failed to submit request. Please try again.' }
    });
  }
});

module.exports = router;
