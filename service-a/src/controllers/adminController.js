const Order = require('../models/Order');
const Product = require('../models/Product');
const whatsappService = require('../services/whatsappService');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.dashboard = async (req, res) => {
  res.render('admin/dashboard');
};

exports.getOrders = async (req, res) => {
  const orders = await Order.find().populate('userId', 'name phone').sort('-createdAt');
  res.render('admin/orders', { orders });
};

exports.updateOrder = async (req, res) => {
  try {
    const { orderId, status, note } = req.body;
    const order = await Order.findById(orderId).populate('userId', 'phone');

    if (!order) return res.status(404).send('Order not found');

    order.status = status;
    order.trackingTimeline.push({
      status,
      note,
      updatedBy: req.session.adminName || 'Admin'
    });

    await order.save();

    // Send WhatsApp update to user
    const message = `📦 *ORDER UPDATE*\n\nStatus: _${status}_\nNote: ${note}\n\nClick here to track: ${process.env.CLIENT_URL}/track/${order._id}\n\nOrder ID: \`${order._id}\``;

    let userPhone = order.userId.phone;
    if (userPhone.startsWith('0')) userPhone = '254' + userPhone.substring(1);
    if (!userPhone.startsWith('+')) userPhone = '+' + userPhone;

    await whatsappService.sendMessage(userPhone, message);

    res.status(200).send('Order updated successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error updating order');
  }
};

exports.getProducts = async (req, res) => {
  const products = await Product.find();
  res.render('admin/products', { products });
};

exports.addProduct = async (req, res) => {
  try {
    const { name, category, price, stockQty, description, imageBase64 } = req.body;

    let imageUrl = 'https://res.cloudinary.com/demo/image/upload/placeholder.jpg';

    if (imageBase64) {
      const uploadResponse = await cloudinary.uploader.upload(imageBase64, {
        folder: "fresh_harvest/products"
      });
      imageUrl = uploadResponse.secure_url;
    }

    const product = new Product({
      name,
      category,
      price,
      stockQty,
      description,
      images: [imageUrl]
    });

    await product.save();
    res.status(201).json({ message: 'Product added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error adding product' });
  }
};

exports.getEmailsView = (req, res) => {
  res.render('admin/emails');
};

exports.sendBroadcast = async (req, res) => {
  try {
    const { rawHtml, subject, recipients } = req.body;

    await axios.post(process.env.MAILER_MICROSERVICE_URL, {
      apiKey: process.env.MICROSERVICE_API_KEY,
      action: 'custom_broadcast',
      variables: {
        rawHtml,
        subject,
        recipients // e.g., ['user1@gmail.com', 'user2@gmail.com']
      }
    });

    res.status(200).send('Broadcast sent via Service B');
  } catch (err) {
    console.error(err);
    res.status(500).send('Broadcast failed');
  }
};

exports.whatsappSettings = (req, res) => {
  // Logic to show QR code for Baileys will go here
  res.render('admin/whatsapp');
};
