const axios = require('axios');

// Send email via Service B (Mailer Microservice)
const sendEmail = async ({ to, subject, template, variables = {}, rawHtml = null }) => {
  try {
    const payload = {
      apiKey: process.env.MICROSERVICE_API_KEY,
      action: rawHtml ? 'custom_broadcast' : template,
      recipientEmail: to,
      recipientName: variables.name || 'Customer',
      variables: variables
    };

    if (rawHtml) {
      payload.rawHtml = rawHtml;
    }

    const response = await axios.post(
      process.env.MAILER_MICROSERVICE_URL,
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log(`Email sent to ${to}:`, response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Email send error:', error.message);
    return { success: false, error: error.message };
  }
};

// Send welcome email
const sendWelcomeEmail = async (user) => {
  return await sendEmail({
    to: user.email,
    subject: 'Welcome to Fresh Harvest Grocery!',
    template: 'welcome',
    variables: {
      name: user.name,
      verificationLink: `${process.env.CLIENT_URL}/auth/verify-email?token=${user.emailVerificationToken}`
    }
  });
};

// Send order receipt
const sendOrderReceipt = async (user, order) => {
  return await sendEmail({
    to: user.email,
    subject: `Order Confirmation - ${order.orderNumber}`,
    template: 'receipt',
    variables: {
      name: user.name,
      orderId: order.orderNumber,
      amount: `KSH ${order.finalAmount}`,
      items: order.items,
      trackingLink: `${process.env.CLIENT_URL}/track/${order._id}`
    }
  });
};

// Send tracking update email
const sendTrackingUpdateEmail = async (user, order, update) => {
  return await sendEmail({
    to: user.email,
    subject: `Order Update - ${order.orderNumber}`,
    template: 'tracking',
    variables: {
      name: user.name,
      orderId: order.orderNumber,
      status: update.status,
      note: update.note || '',
      trackingLink: `${process.env.CLIENT_URL}/track/${order._id}`
    }
  });
};

// Send broadcast email (admin function)
const sendBroadcastEmail = async (emails, subject, rawHtml) => {
  const results = [];
  
  for (const email of emails) {
    const result = await sendEmail({
      to: email,
      subject: subject,
      rawHtml: rawHtml
    });
    results.push({ email, ...result });
  }
  
  return results;
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendOrderReceipt,
  sendTrackingUpdateEmail,
  sendBroadcastEmail
};
