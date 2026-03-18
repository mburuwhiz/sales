const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Settings = require('../models/Settings');
const NeedHelp = require('../models/NeedHelp');
const { isAdmin } = require('../middleware/auth');
const { uploadToCloudinary } = require('../middleware/upload');
const { sendTrackingUpdate } = require('../utils/whatsapp');
const { sendTrackingUpdateEmail, sendBroadcastEmail } = require('../utils/email');

// Admin Login Page
router.get('/login', (req, res) => {
  if (req.session.user && req.session.user.role === 'admin') {
    return res.redirect('/admin');
  }
  res.render('admin/login', {
    title: 'Admin Login - Fresh Harvest Grocery',
    error: null,
    message: null
  });
});

// Admin Login POST
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check if username matches
    if (username !== process.env.ADMIN_USERNAME) {
      return res.render('admin/login', {
        title: 'Admin Login - Fresh Harvest Grocery',
        error: 'Invalid username or password',
        message: null
      });
    }

    // Check if password matches
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.render('admin/login', {
        title: 'Admin Login - Fresh Harvest Grocery',
        error: 'Invalid username or password',
        message: null
      });
    }

    // Create admin session
    req.session.user = {
      _id: 'admin',
      name: 'Administrator',
      email: 'admin@freshharvest.app',
      role: 'admin'
    };

    // Save session before redirect
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.render('admin/login', {
          title: 'Admin Login - Fresh Harvest Grocery',
          error: 'Session error. Please try again.',
          message: null
        });
      }
      res.redirect('/admin');
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.render('admin/login', {
      title: 'Admin Login - Fresh Harvest Grocery',
      error: 'An error occurred. Please try again.',
      message: null
    });
  }
});

// Admin Dashboard
router.get('/', isAdmin, async (req, res) => {
  try {
    // Get statistics
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ 
      status: { $in: ['Pending', 'Pending Payment'] }
    });
    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalUsers = await User.countDocuments({ role: 'user' });

    // Get recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name phone');

    // Get sales data for chart (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          status: { $nin: ['Cancelled', 'Pending Payment'] }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$finalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.render('admin/dashboard', {
      title: 'Admin Dashboard - Fresh Harvest Grocery',
      stats: {
        totalOrders,
        pendingOrders,
        totalProducts,
        totalUsers
      },
      recentOrders,
      salesData
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.render('admin/dashboard', {
      title: 'Admin Dashboard - Fresh Harvest Grocery',
      stats: {},
      recentOrders: [],
      salesData: []
    });
  }
});

// Products Management
router.get('/products', isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, category } = req.query;
    
    let query = {};
    if (category) query.category = category;

    const skip = (page - 1) * limit;
    
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    const categories = ['Vegetables', 'Fruits', 'Cereals', 'Dairy & Eggs', 'Spices'];

    res.render('admin/products', {
      title: 'Products - Admin Dashboard',
      products,
      categories,
      selectedCategory: category || '',
      currentPage: parseInt(page),
      totalPages
    });
  } catch (error) {
    console.error('Products page error:', error);
    res.render('admin/products', {
      title: 'Products - Admin Dashboard',
      products: [],
      categories: [],
      currentPage: 1,
      totalPages: 1
    });
  }
});

// Add Product Page
router.get('/products/add', isAdmin, (req, res) => {
  const categories = ['Vegetables', 'Fruits', 'Cereals', 'Dairy & Eggs', 'Spices'];
  
  res.render('admin/product-form', {
    title: 'Add Product - Admin Dashboard',
    product: null,
    categories,
    error: null
  });
});

// Add Product POST
router.post('/products/add', isAdmin, async (req, res) => {
  try {
    const { name, category, price, stockQty, description, imageBase64 } = req.body;

    // Upload image to Cloudinary
    let imageUrl = '';
    if (imageBase64) {
      imageUrl = await uploadToCloudinary(imageBase64, 'fresh_harvest/products');
    }

    const product = new Product({
      name,
      category,
      price: parseFloat(price),
      stockQty: parseInt(stockQty),
      description,
      images: imageUrl ? [imageUrl] : []
    });

    await product.save();

    res.redirect('/admin/products');
  } catch (error) {
    console.error('Add product error:', error);
    const categories = ['Vegetables', 'Fruits', 'Cereals', 'Dairy & Eggs', 'Spices'];
    res.render('admin/product-form', {
      title: 'Add Product - Admin Dashboard',
      product: req.body,
      categories,
      error: 'Failed to add product'
    });
  }
});

// Edit Product Page
router.get('/products/edit/:id', isAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    const categories = ['Vegetables', 'Fruits', 'Cereals', 'Dairy & Eggs', 'Spices'];

    res.render('admin/product-form', {
      title: 'Edit Product - Admin Dashboard',
      product,
      categories,
      error: null
    });
  } catch (error) {
    console.error('Edit product page error:', error);
    res.redirect('/admin/products');
  }
});

// Edit Product POST
router.post('/products/edit/:id', isAdmin, async (req, res) => {
  try {
    const { name, category, price, stockQty, description, imageBase64 } = req.body;

    const product = await Product.findById(req.params.id);

    product.name = name;
    product.category = category;
    product.price = parseFloat(price);
    product.stockQty = parseInt(stockQty);
    product.description = description;

    // Upload new image if provided
    if (imageBase64 && !imageBase64.includes('cloudinary.com')) {
      const imageUrl = await uploadToCloudinary(imageBase64, 'fresh_harvest/products');
      product.images = [imageUrl];
    }

    await product.save();

    res.redirect('/admin/products');
  } catch (error) {
    console.error('Edit product error:', error);
    const categories = ['Vegetables', 'Fruits', 'Cereals', 'Dairy & Eggs', 'Spices'];
    res.render('admin/product-form', {
      title: 'Edit Product - Admin Dashboard',
      product: { ...req.body, _id: req.params.id },
      categories,
      error: 'Failed to update product'
    });
  }
});

// Delete Product
router.post('/products/delete/:id', isAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Delete product error:', error);
    res.redirect('/admin/products');
  }
});

// Orders Management
router.get('/orders', isAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    let query = {};
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name phone email');

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    const statuses = ['Pending Payment', 'Pending', 'Approved', 'Packing', 'En-Route', 'Delivered', 'Cancelled'];

    res.render('admin/orders', {
      title: 'Orders - Admin Dashboard',
      orders,
      statuses,
      selectedStatus: status || '',
      currentPage: parseInt(page),
      totalPages
    });
  } catch (error) {
    console.error('Orders page error:', error);
    res.render('admin/orders', {
      title: 'Orders - Admin Dashboard',
      orders: [],
      statuses: [],
      currentPage: 1,
      totalPages: 1
    });
  }
});

// Order Detail Page
router.get('/orders/:id', isAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name phone email');

    if (!order) {
      return res.redirect('/admin/orders');
    }

    const statuses = ['Pending', 'Approved', 'Packing', 'En-Route', 'Delivered', 'Cancelled'];

    res.render('admin/order-detail', {
      title: `Order ${order.orderNumber} - Admin Dashboard`,
      order,
      statuses
    });
  } catch (error) {
    console.error('Order detail error:', error);
    res.redirect('/admin/orders');
  }
});

// Update Order Status
router.post('/orders/:id/update-status', isAdmin, async (req, res) => {
  try {
    const { status, note } = req.body;

    const order = await Order.findById(req.params.id).populate('userId');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update status
    order.status = status;
    order.trackingTimeline.push({
      status,
      note: note || '',
      updatedBy: 'Admin'
    });

    await order.save();

    // Send notifications
    const user = order.userId;
    
    // WhatsApp notification
    await sendTrackingUpdate(user.phone, order, { status, note });
    
    // Email notification
    await sendTrackingUpdateEmail(user, order, { status, note });

    // Award coins if delivered
    if (status === 'Delivered') {
      const settings = await Settings.findOne() || new Settings();
      if (order.finalAmount >= settings.minPurchaseForCoins) {
        user.walletCoins += settings.coinsPerPurchase;
        await user.save();
      }
    }

    res.json({ success: true, message: 'Status updated' });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Settings Page
router.get('/settings', isAdmin, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }

    res.render('admin/settings', {
      title: 'Settings - Admin Dashboard',
      settings,
      message: null
    });
  } catch (error) {
    console.error('Settings page error:', error);
    res.render('admin/settings', {
      title: 'Settings - Admin Dashboard',
      settings: {},
      message: { type: 'error', text: 'Failed to load settings' }
    });
  }
});

// Update Settings
router.post('/settings', isAdmin, async (req, res) => {
  try {
    const { 
      minPurchaseForCoins, 
      coinsPerPurchase, 
      minCoinsToRedeem, 
      coinValue,
      mpesaNumber,
      mpesaName
    } = req.body;

    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings();
    }

    settings.minPurchaseForCoins = parseFloat(minPurchaseForCoins);
    settings.coinsPerPurchase = parseInt(coinsPerPurchase);
    settings.minCoinsToRedeem = parseInt(minCoinsToRedeem);
    settings.coinValue = parseFloat(coinValue);
    settings.mpesaNumber = mpesaNumber;
    settings.mpesaName = mpesaName;

    await settings.save();

    res.render('admin/settings', {
      title: 'Settings - Admin Dashboard',
      settings,
      message: { type: 'success', text: 'Settings updated successfully!' }
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.render('admin/settings', {
      title: 'Settings - Admin Dashboard',
      settings: req.body,
      message: { type: 'error', text: 'Failed to update settings' }
    });
  }
});

// WhatsApp Settings Page
router.get('/settings/whatsapp', isAdmin, (req, res) => {
  res.render('admin/whatsapp-settings', {
    title: 'WhatsApp Settings - Admin Dashboard'
  });
});

// Email Broadcast Page
router.get('/emails', isAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('email name');
    
    res.render('admin/emails', {
      title: 'Email Broadcast - Admin Dashboard',
      users,
      message: null
    });
  } catch (error) {
    console.error('Emails page error:', error);
    res.render('admin/emails', {
      title: 'Email Broadcast - Admin Dashboard',
      users: [],
      message: { type: 'error', text: 'Failed to load users' }
    });
  }
});

// Send Broadcast Email
router.post('/emails/broadcast', isAdmin, async (req, res) => {
  try {
    const { subject, htmlContent, recipientType } = req.body;

    let recipients = [];
    
    if (recipientType === 'all') {
      const users = await User.find({ role: 'user' }).select('email');
      recipients = users.map(u => u.email);
    } else if (recipientType === 'verified') {
      const users = await User.find({ 
        role: 'user',
        isEmailVerified: true 
      }).select('email');
      recipients = users.map(u => u.email);
    }

    // Send via Service B
    const results = await sendBroadcastEmail(recipients, subject, htmlContent);

    const users = await User.find({ role: 'user' }).select('email name');
    
    res.render('admin/emails', {
      title: 'Email Broadcast - Admin Dashboard',
      users,
      message: { 
        type: 'success', 
        text: `Broadcast sent to ${results.filter(r => r.success).length} recipients` 
      }
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    const users = await User.find({ role: 'user' }).select('email name');
    res.render('admin/emails', {
      title: 'Email Broadcast - Admin Dashboard',
      users,
      message: { type: 'error', text: 'Failed to send broadcast' }
    });
  }
});

// Help Requests
router.get('/help-requests', isAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = {};
    if (status) query.status = status;

    const requests = await NeedHelp.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email phone');

    res.render('admin/help-requests', {
      title: 'Help Requests - Admin Dashboard',
      requests,
      selectedStatus: status || ''
    });
  } catch (error) {
    console.error('Help requests error:', error);
    res.render('admin/help-requests', {
      title: 'Help Requests - Admin Dashboard',
      requests: [],
      selectedStatus: ''
    });
  }
});

// Update Help Request Status
router.post('/help-requests/:id/close', isAdmin, async (req, res) => {
  try {
    await NeedHelp.findByIdAndUpdate(req.params.id, { status: 'Closed' });
    res.redirect('/admin/help-requests');
  } catch (error) {
    console.error('Close help request error:', error);
    res.redirect('/admin/help-requests');
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

module.exports = router;
