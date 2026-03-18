const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const { 
  initializeWhatsApp, 
  getConnectionStatus, 
  disconnectWhatsApp,
  sendWhatsAppMessage 
} = require('../utils/whatsapp');

// Get WhatsApp Status
router.get('/status', isAdmin, async (req, res) => {
  try {
    const status = getConnectionStatus();
    res.json(status);
  } catch (error) {
    console.error('WhatsApp status error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// Initialize/Connect WhatsApp
router.post('/connect', isAdmin, async (req, res) => {
  try {
    await initializeWhatsApp();
    res.json({ success: true, message: 'WhatsApp initialization started' });
  } catch (error) {
    console.error('WhatsApp connect error:', error);
    res.status(500).json({ error: 'Failed to connect' });
  }
});

// Disconnect WhatsApp
router.post('/disconnect', isAdmin, async (req, res) => {
  try {
    await disconnectWhatsApp();
    res.json({ success: true, message: 'WhatsApp disconnected' });
  } catch (error) {
    console.error('WhatsApp disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

// Send Test Message
router.post('/send-test', isAdmin, async (req, res) => {
  try {
    const { phone, message } = req.body;
    
    const result = await sendWhatsAppMessage(phone, message);
    
    if (result) {
      res.json({ success: true, message: 'Message sent' });
    } else {
      res.status(500).json({ error: 'Failed to send message' });
    }
  } catch (error) {
    console.error('Send test message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
