const express = require('express');
const router = express.Router();
const SibApiV3Sdk = require('sib-api-v3-sdk');
const ejs = require('ejs');
const path = require('path');
const { verifyMicroservice } = require('../middleware/auth');

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY; // Fallback to avoid error if undefined in dev
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

router.post('/send-email', verifyMicroservice, async (req, res) => {
  try {
    const { action, recipientEmail, recipientName, variables } = req.body;

    let htmlContent = '';
    let subject = '';

    if (action === 'verify_email') {
      subject = 'Verify Your Email - Fresh Harvest Grocery';
      htmlContent = await ejs.renderFile(path.join(__dirname, '../views/emails/welcome.ejs'), variables);
    } else if (action === 'order_approved') {
      subject = 'Your Order Has Been Approved!';
      htmlContent = await ejs.renderFile(path.join(__dirname, '../views/emails/receipt.ejs'), variables);
    } else if (action === 'custom_broadcast') {
      subject = variables.subject || 'Special Offer from Fresh Harvest';
      htmlContent = variables.rawHtml;
      // Handle multiple recipients for broadcast
      const toList = variables.recipients.map(email => ({ email }));

      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = htmlContent;
      sendSmtpEmail.sender = { name: 'FRESH HARVEST', email: 'orders@freshharvest.app' };
      sendSmtpEmail.to = toList;
      sendSmtpEmail.replyTo = { email: 'admin@freshharvest.app' };

      await apiInstance.sendTransacEmail(sendSmtpEmail);
      return res.status(200).json({ message: 'Broadcast sent' });
    }

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = { name: 'FRESH HARVEST', email: 'orders@freshharvest.app' };
    sendSmtpEmail.to = [{ email: recipientEmail, name: recipientName }];
    sendSmtpEmail.replyTo = { email: 'admin@freshharvest.app' };

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Brevo Email Error:', error);
    res.status(500).json({ message: 'Error sending email' });
  }
});

module.exports = router;
