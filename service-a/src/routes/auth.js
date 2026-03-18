const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const cartController = require('../controllers/cartController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-phone', authController.verifyPhone);
router.get('/verify-email', authController.verifyEmail);
router.post('/sync-cart', cartController.syncCart);

module.exports = router;
