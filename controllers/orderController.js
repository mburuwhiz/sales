const Order = require('../models/Order');
const User = require('../models/User');
const { sendEmail } = require('../utils/email');

// Check for abandoned carts and send reminder emails
const checkAbandonedCarts = async () => {
  try {
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

    const twelveHoursAgo = new Date();
    twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);

    // Find orders with Pending Payment status that are older than 2 hours
    // but haven't received a reminder in the last 12 hours
    const abandonedOrders = await Order.find({
      status: 'Pending Payment',
      createdAt: { 
        $gte: twelveHoursAgo,
        $lte: twoHoursAgo 
      },
      'trackingTimeline.status': { $ne: 'Abandoned Cart Reminder Sent' }
    }).populate('userId');

    console.log(`Found ${abandonedOrders.length} abandoned carts`);

    for (const order of abandonedOrders) {
      try {
        // Send abandoned cart email
        await sendEmail({
          to: order.userId.email,
          subject: 'Did you forget something?',
          template: 'abandoned_cart',
          variables: {
            name: order.userId.name
          }
        });

        // Mark reminder as sent
        order.trackingTimeline.push({
          status: 'Abandoned Cart Reminder Sent',
          note: 'Email reminder sent to customer',
          updatedBy: 'System'
        });

        await order.save();

        console.log(`Abandoned cart reminder sent for order ${order.orderNumber}`);
      } catch (error) {
        console.error(`Failed to send reminder for order ${order.orderNumber}:`, error);
      }
    }

    return {
      success: true,
      remindersSent: abandonedOrders.length
    };
  } catch (error) {
    console.error('Abandoned cart check error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  checkAbandonedCarts
};
