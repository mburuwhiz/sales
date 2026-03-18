const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Settings = require('../models/Settings');
const { isUser, isVerified } = require('../middleware/auth');
const { sendOrderNotificationToAdmin } = require('../utils/whatsapp');
const { sendOrderReceipt } = require('../utils/email');

// Checkout Page
router.get('/', isUser, isVerified, async (req, res) => {
  try {
    const cart = req.session.cart || [];
    
    if (cart.length === 0) {
      return res.redirect('/shop');
    }

    const user = await User.findById(req.session.user._id);
    const settings = await Settings.findOne() || new Settings();

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Check if user can redeem coins
    const canRedeemCoins = user.walletCoins >= settings.minCoinsToRedeem;
    const maxDiscount = Math.floor(user.walletCoins / settings.coinValue) * settings.coinValue;

    res.render('checkout/index', {
      title: 'Checkout - Fresh Harvest Grocery',
      cart,
      subtotal,
      user,
      settings,
      canRedeemCoins,
      maxDiscount,
      error: null
    });
  } catch (error) {
    console.error('Checkout page error:', error);
    res.render('checkout/index', {
      title: 'Checkout - Fresh Harvest Grocery',
      cart: [],
      subtotal: 0,
      user: req.session.user,
      settings: {},
      canRedeemCoins: false,
      maxDiscount: 0,
      error: 'Failed to load checkout'
    });
  }
});

// Process Checkout - Create Order
router.post('/process', isUser, isVerified, async (req, res) => {
  try {
    const { landmark, building, receiverPhone, useCoins, lat, lng } = req.body;
    const cart = req.session.cart || [];

    if (cart.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const user = await User.findById(req.session.user._id);
    const settings = await Settings.findOne() || new Settings();

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discountAmount = 0;
    let coinsUsed = 0;

    if (useCoins === 'on' && user.walletCoins >= settings.minCoinsToRedeem) {
      const maxCoins = Math.floor(subtotal / settings.coinValue) * settings.coinValue;
      coinsUsed = Math.min(user.walletCoins, maxCoins);
      discountAmount = coinsUsed * settings.coinValue;
    }

    const finalAmount = subtotal - discountAmount;

    // Generate order number
    const orderNumber = 'FH-' + Date.now().toString(36).toUpperCase();

    // Create order with Pending Payment status
    const order = new Order({
      userId: user._id,
      orderNumber,
      items: cart.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      })),
      totalAmount: subtotal,
      discountAmount,
      coinsUsed,
      finalAmount,
      status: 'Pending Payment',
      deliveryData: {
        landmark,
        building,
        receiverPhone,
        coords: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null
      }
    });

    await order.save();

    // Return order details for manual payment
    res.json({
      success: true,
      orderId: order._id,
      orderNumber,
      finalAmount,
      mpesaNumber: settings.mpesaNumber,
      mpesaName: settings.mpesaName
    });
  } catch (error) {
    console.error('Checkout process error:', error);
    res.status(500).json({ error: 'Failed to process checkout' });
  }
});

// Confirm Payment
router.post('/confirm-payment', isUser, isVerified, async (req, res) => {
  try {
    const { orderId, mpesaCode } = req.body;

    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update order with payment details
    order.mpesaData = {
      receiptCode: mpesaCode,
      transactionDate: new Date()
    };
    order.status = 'Pending';
    order.trackingTimeline.push({
      status: 'Payment Received',
      note: `M-Pesa Code: ${mpesaCode}`,
      updatedBy: 'Customer'
    });

    await order.save();

    // Deduct coins if used
    if (order.coinsUsed > 0) {
      const user = await User.findById(order.userId);
      user.walletCoins -= order.coinsUsed;
      await user.save();
    }

    // Clear cart
    req.session.cart = [];

    // Notify admin via WhatsApp
    const user = await User.findById(order.userId);
    await sendOrderNotificationToAdmin(order, user);

    // Send receipt email
    await sendOrderReceipt(user, order);

    res.json({
      success: true,
      message: 'Payment confirmed. Order is pending approval.',
      orderId: order._id
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

module.exports = router;
