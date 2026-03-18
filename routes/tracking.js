const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');

// Public Tracking Page
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('userId', 'name phone');

    if (!order) {
      return res.status(404).render('error', {
        message: 'Order not found',
        error: {}
      });
    }

    // Get related products for suggestions
    const orderCategories = order.items.map(item => item.category);
    const suggestions = await Product.find({
      category: { $in: orderCategories },
      isActive: true,
      _id: { $nin: order.items.map(i => i.productId) }
    }).limit(4);

    // Format timeline
    const timeline = order.trackingTimeline.map(t => ({
      status: t.status,
      time: t.time,
      note: t.note,
      updatedBy: t.updatedBy,
      isActive: true
    }));

    // Add pending statuses
    const allStatuses = ['Pending', 'Approved', 'Packing', 'En-Route', 'Delivered'];
    const currentStatusIndex = allStatuses.indexOf(order.status);

    res.render('tracking/index', {
      title: `Track Order ${order.orderNumber} - Fresh Harvest Grocery`,
      order,
      timeline,
      suggestions,
      allStatuses,
      currentStatusIndex
    });
  } catch (error) {
    console.error('Tracking page error:', error);
    res.status(500).render('error', {
      message: 'Failed to load tracking information',
      error: {}
    });
  }
});

// API - Get Order Status
router.get('/api/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      success: true,
      orderNumber: order.orderNumber,
      status: order.status,
      timeline: order.trackingTimeline,
      lastUpdated: order.updatedAt
    });
  } catch (error) {
    console.error('Tracking API error:', error);
    res.status(500).json({ error: 'Failed to get order status' });
  }
});

module.exports = router;
