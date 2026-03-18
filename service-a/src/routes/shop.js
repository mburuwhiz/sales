const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const { isUser } = require('../middleware/auth');

router.get('/', shopController.getShop);
router.post('/checkout', isUser, shopController.checkout);
router.get('/checkout', isUser, (req, res) => res.render('pages/checkout'));

module.exports = router;
