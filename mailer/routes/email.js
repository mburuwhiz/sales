const express = require('express');
const router = express.Router();
const path = require('path');
const ejs = require('ejs');
const SibApiV3Sdk = require('sib-api-v3-sdk');

// Initialize Brevo API
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// Middleware to verify microservice API key
const verifyMicroservice = (req, res, next) => {
  const providedKey = req.body.apiKey || req.headers['x-api-key'];
  
  if (providedKey !== process.env.MICROSERVICE_API_KEY) {
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized - Invalid API key' 
    });
  }
  
  next();
};

// Send Email Endpoint
router.post('/send-email', verifyMicroservice, async (req, res) => {
  try {
    const { 
      action, 
      recipientEmail, 
      recipientName, 
      variables = {},
      rawHtml = null 
    } = req.body;

    let htmlContent;
    let subject;

    // Determine template and subject based on action
    switch (action) {
      case 'welcome':
        htmlContent = await renderTemplate('welcome.ejs', variables);
        subject = 'Welcome to Fresh Harvest Grocery!';
        break;
      
      case 'receipt':
        htmlContent = await renderTemplate('receipt.ejs', variables);
        subject = `Order Confirmation - ${variables.orderId}`;
        break;
      
      case 'tracking':
        htmlContent = await renderTemplate('tracking.ejs', variables);
        subject = `Order Update - ${variables.orderId}`;
        break;
      
      case 'whatsapp_disconnect':
        htmlContent = await renderTemplate('whatsapp-alert.ejs', variables);
        subject = 'URGENT: WhatsApp Session Disconnected';
        break;
      
      case 'abandoned_cart':
        htmlContent = await renderTemplate('abandoned-cart.ejs', variables);
        subject = 'Did you forget something?';
        break;
      
      case 'custom_broadcast':
        htmlContent = rawHtml;
        subject = req.body.subject || 'Fresh Harvest Update';
        break;
      
      default:
        return res.status(400).json({ 
          success: false, 
          error: 'Unknown action' 
        });
    }

    // Send email via Brevo
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = {
      name: process.env.BREVO_SENDER_NAME || 'FRESH HARVEST',
      email: process.env.BREVO_SENDER_EMAIL || 'orders@freshharvest.app'
    };
    sendSmtpEmail.to = [{ 
      email: recipientEmail, 
      name: recipientName 
    }];
    sendSmtpEmail.replyTo = {
      email: process.env.BREVO_REPLY_TO || 'admin@freshharvest.app'
    };

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);

    res.json({
      success: true,
      messageId: result.messageId,
      recipient: recipientEmail
    });

  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Broadcast Endpoint (for bulk emails)
router.post('/broadcast', verifyMicroservice, async (req, res) => {
  try {
    const { 
      recipients, 
      subject, 
      htmlContent,
      variables = {}
    } = req.body;

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Recipients array required'
      });
    }

    const results = [];

    // Send emails in batches of 50 (Brevo limit)
    const batchSize = 50;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = htmlContent;
      sendSmtpEmail.sender = {
        name: process.env.BREVO_SENDER_NAME || 'FRESH HARVEST',
        email: process.env.BREVO_SENDER_EMAIL || 'orders@freshharvest.app'
      };
      sendSmtpEmail.to = batch.map(email => ({ email }));
      sendSmtpEmail.replyTo = {
        email: process.env.BREVO_REPLY_TO || 'admin@freshharvest.app'
      };

      try {
        const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
        results.push({
          batch: Math.floor(i / batchSize) + 1,
          success: true,
          messageId: result.messageId
        });
      } catch (batchError) {
        results.push({
          batch: Math.floor(i / batchSize) + 1,
          success: false,
          error: batchError.message
        });
      }
    }

    res.json({
      success: true,
      totalRecipients: recipients.length,
      batches: results.length,
      results
    });

  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to render EJS templates
async function renderTemplate(templateName, variables) {
  const templatePath = path.join(__dirname, '..', 'views', 'emails', templateName);
  return await ejs.renderFile(templatePath, variables);
}

module.exports = router;
