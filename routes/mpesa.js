const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const { processCallback } = require('../utils/mpesa');
const { sendOrderNotificationToAdmin } = require('../utils/whatsapp');
const { sendOrderReceipt } = require('../utils/email');

// M-Pesa Callback (Public endpoint)
router.post('/callback', async (req, res) => {
  try {
    console.log('M-Pesa Callback received:', JSON.stringify(req.body, null, 2));

    const callbackResult = await processCallback(req.body);

    if (callbackResult.success) {
      // Find order by checkout request ID
      const order = await Order.findOne({
        'mpesaData.checkoutRequestId': callbackResult.checkoutRequestId
      });

      if (order) {
        // Update order
        order.mpesaData = {
          receiptCode: callbackResult.mpesaReceiptNumber,
          transactionDate: callbackResult.transactionDate,
          amount: callbackResult.amount,
          phoneNumber: callbackResult.phoneNumber
        };
        order.status = 'Pending';
        order.trackingTimeline.push({
          status: 'Payment Received',
          note: `M-Pesa Receipt: ${callbackResult.mpesaReceiptNumber}`,
          updatedBy: 'System'
        });

        await order.save();

        // Deduct coins if used
        if (order.coinsUsed > 0) {
          const user = await User.findById(order.userId);
          user.walletCoins -= order.coinsUsed;
          await user.save();
        }

        // Notify admin via WhatsApp
        const user = await User.findById(order.userId);
        await sendOrderNotificationToAdmin(order, user);

        // Send receipt email
        await sendOrderReceipt(user, order);

        console.log(`Order ${order.orderNumber} payment confirmed`);
      }
    }

    // Always return success to M-Pesa
    res.json({
      ResultCode: 0,
      ResultDesc: 'Success'
    });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    // Still return success to prevent retries
    res.json({
      ResultCode: 0,
      ResultDesc: 'Success'
    });
  }
});

// Query Payment Status (for polling)
router.get('/query/:checkoutRequestId', async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;
    
    const order = await Order.findOne({ 'mpesaData.checkoutRequestId': checkoutRequestId });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      success: true,
      status: order.status,
      receiptCode: order.mpesaData?.receiptCode,
      orderId: order._id
    });
  } catch (error) {
    console.error('Query payment status error:', error);
    res.status(500).json({ error: 'Failed to query status' });
  }
});

module.exports = router;
