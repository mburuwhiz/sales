const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');
const { verifyMicroservice } = require('../middleware/auth');

// Create Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
  port: process.env.BREVO_SMTP_PORT || 587,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS
  }
});

router.post('/send-email', verifyMicroservice, async (req, res) => {
  try {
    const { action, recipientEmail, recipientName, variables } = req.body;

    let htmlContent = '';
    let subject = '';

    const fromName = process.env.DEFAULT_FROM_NAME || 'FRESH HARVEST';
    const fromEmail = process.env.DEFAULT_FROM_EMAIL || 'orders@freshharvest.app';
    const replyToEmail = process.env.REPLY_TO_EMAIL || 'admin@freshharvest.app';

    if (action === 'verify_email') {
      subject = 'Verify Your Email - Fresh Harvest Grocery';
      htmlContent = await ejs.renderFile(path.join(__dirname, '../views/emails/welcome.ejs'), variables);
    } else if (action === 'order_approved') {
      subject = 'Your Order Has Been Approved!';
      htmlContent = await ejs.renderFile(path.join(__dirname, '../views/emails/receipt.ejs'), variables);
    } else if (action === 'abandoned_cart') {
      subject = 'Did you forget something? - Fresh Harvest';
      htmlContent = await ejs.renderFile(path.join(__dirname, '../views/emails/abandoned.ejs'), variables);
    } else if (action === 'custom_broadcast') {
      subject = variables.subject || 'Special Offer from Fresh Harvest';
      htmlContent = variables.rawHtml;
      // Handle multiple recipients for broadcast

      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: variables.recipients.join(', '), // Nodemailer accepts a comma-separated list
        replyTo: replyToEmail,
        subject: subject,
        html: htmlContent
      };

      await transporter.sendMail(mailOptions);
      return res.status(200).json({ message: 'Broadcast sent' });
    }

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: recipientEmail,
      replyTo: replyToEmail,
      subject: subject,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Brevo Email Error:', error);
    res.status(500).json({ message: 'Error sending email' });
  }
});

module.exports = router;
