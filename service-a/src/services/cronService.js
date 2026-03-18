const cron = require('node-cron');
const Order = require('../models/Order');
const axios = require('axios');

const initCronJobs = () => {
  // Run every 12 hours
  cron.schedule('0 */12 * * *', async () => {
    try {
      console.log('Running abandoned cart cron job...');
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

      const abandonedOrders = await Order.find({
        status: 'Pending Payment',
        createdAt: { $lt: twoHoursAgo }
      }).populate('userId', 'email name');

      for (let order of abandonedOrders) {
        if (order.userId && order.userId.email) {
          try {
            await axios.post(process.env.MAILER_MICROSERVICE_URL, {
              apiKey: process.env.MICROSERVICE_API_KEY,
              action: 'abandoned_cart',
              recipientEmail: order.userId.email,
              recipientName: order.userId.name,
              variables: {
                cartLink: `${process.env.CLIENT_URL}/checkout`
              }
            });
            console.log(`Abandoned cart email sent to ${order.userId.email}`);
          } catch (err) {
            console.error(`Failed to send abandoned cart email to ${order.userId.email}`, err.message);
          }
        }
      }
    } catch (err) {
      console.error('Error in abandoned cart cron job', err);
    }
  });
};

module.exports = { initCronJobs };
