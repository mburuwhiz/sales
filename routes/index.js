const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Home Page
router.get('/', async (req, res) => {
  try {
    // Get featured products (latest 8)
    const featuredProducts = await Product.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(8);

    // Get products by category
    const vegetables = await Product.find({ category: 'Vegetables', isActive: true }).limit(4);
    const fruits = await Product.find({ category: 'Fruits', isActive: true }).limit(4);
    const dairy = await Product.find({ category: 'Dairy & Eggs', isActive: true }).limit(4);

    res.render('index', {
      title: 'Fresh Harvest Grocery - Organic & Fresh',
      featuredProducts,
      vegetables,
      fruits,
      dairy
    });
  } catch (error) {
    console.error('Home page error:', error);
    res.render('index', {
      title: 'Fresh Harvest Grocery',
      featuredProducts: [],
      vegetables: [],
      fruits: [],
      dairy: []
    });
  }
});

// About Page
router.get('/about', (req, res) => {
  res.render('about', {
    title: 'About Us - Fresh Harvest Grocery'
  });
});

// Contact Page
router.get('/contact', (req, res) => {
  res.render('contact', {
    title: 'Contact Us - Fresh Harvest Grocery'
  });
});

// Search
router.get('/search', async (req, res) => {
  try {
    const { q, category } = req.query;
    let query = { isActive: true };

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    const products = await Product.find(query);
    
    res.render('search', {
      title: `Search: ${q || 'All Products'} - Fresh Harvest Grocery`,
      products,
      query: q || '',
      selectedCategory: category || 'all'
    });
  } catch (error) {
    console.error('Search error:', error);
    res.render('search', {
      title: 'Search - Fresh Harvest Grocery',
      products: [],
      query: '',
      selectedCategory: 'all'
    });
  }
});

module.exports = router;
