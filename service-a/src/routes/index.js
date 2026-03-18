const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

router.get('/login', (req, res) => res.render('pages/login'));
router.get('/register', (req, res) => res.render('pages/register'));
router.get('/admin/login', (req, res) => res.render('admin/login'));

router.get('/track/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.productId');
    if (!order) return res.status(404).send('Order not found');
    res.render('pages/track', { order });
  } catch (err) {
    res.status(500).send('Error loading tracking page');
  }
});

module.exports = router;
