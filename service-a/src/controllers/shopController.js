const Order = require('../models/Order');
const Product = require('../models/Product');
const whatsappService = require('../services/whatsappService');

exports.getShop = async (req, res) => {
  try {
    const products = await Product.find({});
    res.render('pages/shop', { products });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading shop');
  }
};

exports.checkout = async (req, res) => {
  try {
    const { items, deliveryData, useCoins } = req.body;
    let totalAmount = 0;

    for (let item of items) {
      const quantity = parseInt(item.quantity, 10);
      if (isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({ message: 'Invalid item quantity' });
      }
      const product = await Product.findById(item.productId);
      if (product) totalAmount += product.price * quantity;
    }

    // Logic for coins deduction based on threshold
    const coinThreshold = process.env.COIN_REDEMPTION_THRESHOLD || 100;
    if (useCoins && req.user.walletCoins >= coinThreshold) {
      if (req.user.walletCoins >= totalAmount) {
        req.user.walletCoins -= totalAmount;
        totalAmount = 0;
      } else {
        totalAmount -= req.user.walletCoins;
        req.user.walletCoins = 0;
      }
    }

    // Logic for awarding coins if purchase exceeds minimum
    const minPurchaseForCoins = process.env.MIN_PURCHASE_FOR_COINS || 2000;
    const coinsAwarded = process.env.COINS_AWARDED_PER_QUALIFYING_PURCHASE || 50;
    if (totalAmount >= minPurchaseForCoins) {
       req.user.walletCoins += parseInt(coinsAwarded);
    }
    await req.user.save();

    const order = new Order({
      userId: req.user._id,
      items,
      totalAmount,
      deliveryData,
      status: 'Pending Payment'
    });

    await order.save();

    // Trigger M-Pesa STK Push logic here (Mocked for now)
    const mpesaSuccess = true; // Assuming STK Push was successful for this example

    if (mpesaSuccess) {
      order.status = 'Approved';
      order.mpesaData = { receiptCode: 'MOC1234567', transactionDate: new Date(), amount: totalAmount };
      await order.save();

      // Send Admin WhatsApp alert
      try {
        const adminPhone = process.env.ADMIN_PHONE || '+254712345678';
        const message = `🚨 *NEW ORDER RECEIVED*\n\nAmount: KSH ${totalAmount}\nCustomer: ${req.user.name}\n\nPlease approve within 3 minutes.\n\nOrder ID: \`${order._id}\``;
        await whatsappService.sendMessage(adminPhone, message);
      } catch (e) {
        console.error('Failed sending Admin WhatsApp alert', e);
      }

      res.status(200).json({ message: 'Order placed successfully', orderId: order._id });
    } else {
      res.status(400).json({ message: 'STK Push failed. Please pay manually to 0113 323 234 (Peter Wekulo) and paste the confirmation message below.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Checkout error' });
  }
};
