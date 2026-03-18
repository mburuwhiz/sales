const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/auth');

router.get('/', isAdmin, adminController.dashboard);
router.get('/orders', isAdmin, adminController.getOrders);
router.post('/orders/update', isAdmin, adminController.updateOrder);

router.get('/products', isAdmin, adminController.getProducts);
router.post('/products/add', isAdmin, adminController.addProduct);

router.get('/emails', isAdmin, adminController.getEmailsView);
router.post('/emails/broadcast', isAdmin, adminController.sendBroadcast);

router.get('/settings/whatsapp', isAdmin, adminController.whatsappSettings);

module.exports = router;
