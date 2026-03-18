const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Get Cart (API)
router.get('/', (req, res) => {
  const cart = req.session.cart || [];
  res.json(cart);
});

// Add to Cart (API)
router.post('/add', async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.stockQty < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    let cart = req.session.cart || [];
    
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
      existingItem.quantity += parseInt(quantity);
    } else {
      cart.push({
        productId: product._id.toString(),
        name: product.name,
        price: product.price,
        image: product.images[0],
        quantity: parseInt(quantity),
        category: product.category
      });
    }

    req.session.cart = cart;
    
    res.json({ 
      success: true, 
      cart,
      cartCount: cart.length,
      message: 'Item added to cart'
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

// Update Cart Quantity (API)
router.put('/update', (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    let cart = req.session.cart || [];
    
    const itemIndex = cart.findIndex(item => item.productId === productId);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not in cart' });
    }

    if (quantity <= 0) {
      cart.splice(itemIndex, 1);
    } else {
      cart[itemIndex].quantity = parseInt(quantity);
    }

    req.session.cart = cart;
    
    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    res.json({ 
      success: true, 
      cart,
      cartCount: cart.length,
      subtotal
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// Remove from Cart (API)
router.delete('/remove/:productId', (req, res) => {
  try {
    const { productId } = req.params;
    
    let cart = req.session.cart || [];
    
    cart = cart.filter(item => item.productId !== productId);
    
    req.session.cart = cart;
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    res.json({ 
      success: true, 
      cart,
      cartCount: cart.length,
      subtotal
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

// Clear Cart (API)
router.delete('/clear', (req, res) => {
  req.session.cart = [];
  res.json({ success: true, message: 'Cart cleared' });
});

// Sync Cart from LocalStorage (when user logs in)
router.post('/sync', async (req, res) => {
  try {
    const { localCart } = req.body;
    
    if (!Array.isArray(localCart)) {
      return res.status(400).json({ error: 'Invalid cart data' });
    }

    // Validate products and sync with database
    const syncedCart = [];
    
    for (const item of localCart) {
      const product = await Product.findById(item.productId);
      if (product && product.isActive && product.stockQty >= item.quantity) {
        syncedCart.push({
          productId: product._id.toString(),
          name: product.name,
          price: product.price,
          image: product.images[0],
          quantity: item.quantity,
          category: product.category
        });
      }
    }

    req.session.cart = syncedCart;
    
    res.json({ 
      success: true, 
      cart: syncedCart,
      cartCount: syncedCart.length
    });
  } catch (error) {
    console.error('Cart sync error:', error);
    res.status(500).json({ error: 'Failed to sync cart' });
  }
});

module.exports = router;
