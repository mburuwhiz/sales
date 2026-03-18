const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Shop Page - All Products
router.get('/', async (req, res) => {
  try {
    const { category, page = 1, limit = 12 } = req.query;
    
    let query = { isActive: true };
    if (category && category !== 'all') {
      query.category = category;
    }

    const skip = (page - 1) * limit;
    
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    // Get all categories for filter
    const categories = ['Vegetables', 'Fruits', 'Cereals', 'Dairy & Eggs', 'Spices'];

    res.render('shop/index', {
      title: 'Shop - Fresh Harvest Grocery',
      products,
      categories,
      selectedCategory: category || 'all',
      currentPage: parseInt(page),
      totalPages,
      totalProducts
    });
  } catch (error) {
    console.error('Shop page error:', error);
    res.render('shop/index', {
      title: 'Shop - Fresh Harvest Grocery',
      products: [],
      categories: [],
      selectedCategory: 'all',
      currentPage: 1,
      totalPages: 1,
      totalProducts: 0
    });
  }
});

// Product Detail (API for modal)
router.get('/product/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Product detail error:', error);
    res.status(500).json({ error: 'Failed to load product' });
  }
});

// Get Products by Category (API)
router.get('/api/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ 
      category, 
      isActive: true 
    }).limit(20);
    
    res.json(products);
  } catch (error) {
    console.error('Category API error:', error);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

// Get All Products (API for cart suggestions)
router.get('/api/all', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).select('_id name price images category');
    res.json(products);
  } catch (error) {
    console.error('All products API error:', error);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

module.exports = router;
