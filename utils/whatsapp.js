const { 
  default: makeWASocket, 
  DisconnectReason, 
  useMultiFileAuthState,
  fetchLatestBaileysVersion 
} = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const pino = require('pino');
const WhatsappSession = require('../models/WhatsappSession');

let sock = null;
let qrCodeData = null;
let connectionStatus = 'disconnected';

// Custom auth state using MongoDB
const useMongoAuthState = async (sessionId) => {
  const writeData = async (data) => {
    await WhatsappSession.findOneAndUpdate(
      { sessionId },
      { 
        creds: data.creds,
        keys: data.keys,
        updatedAt: new Date()
      },
      { upsert: true }
    );
  };

  const readData = async () => {
    const session = await WhatsappSession.findOne({ sessionId });
    if (session) {
      return {
        creds: session.creds,
        keys: session.keys || {}
      };
    }
    return null;
  };

  const removeData = async () => {
    await WhatsappSession.deleteOne({ sessionId });
  };

  let data = await readData();
  if (!data) {
    data = {
      creds: {},
      keys: {}
    };
    await writeData(data);
  }

  return {
    state: {
      creds: data.creds,
      keys: data.keys
    },
    saveCreds: async () => {
      await writeData({
        creds: data.creds,
        keys: data.keys
      });
    }
  };
};

// Initialize WhatsApp connection
const initializeWhatsApp = async () => {
  try {
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMongoAuthState('fresh_harvest_session');

    sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      auth: state,
      browser: ['Fresh Harvest Grocery', 'Chrome', '1.0.0']
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        qrCodeData = await QRCode.toDataURL(qr);
        connectionStatus = 'qr_ready';
        console.log('QR Code generated - scan to connect');
      }

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        connectionStatus = 'disconnected';
        
        // Update session status
        await WhatsappSession.findOneAndUpdate(
          { sessionId: 'fresh_harvest_session' },
          { isConnected: false }
        );

        // Send email alert to admin about disconnection
        if (lastDisconnect?.error?.output?.statusCode === 401) {
          const { sendEmail } = require('./email');
          await sendEmail({
            to: process.env.ADMIN_EMAIL || 'admin@freshharvest.app',
            subject: 'URGENT: WhatsApp Session Disconnected',
            template: 'whatsapp_disconnect'
          });
        }

        if (shouldReconnect) {
          console.log('Reconnecting...');
          setTimeout(initializeWhatsApp, 5000);
        }
      } else if (connection === 'open') {
        connectionStatus = 'connected';
        qrCodeData = null;
        
        // Update session status
        const adminJid = sock.user.id;
        await WhatsappSession.findOneAndUpdate(
          { sessionId: 'fresh_harvest_session' },
          { 
            isConnected: true,
            adminPhone: adminJid.split('@')[0]
          }
        );

        // Send confirmation message to admin
        await sendWhatsAppMessage(adminJid, 
          `*FRESH HARVEST*\n\n` +
          `✅ FRESH HARVEST SERVER CONNECTED\n\n` +
          `_Updated at ${new Date().toLocaleString()}_`
        );
        
        console.log('WhatsApp connected');
      }
    });

    sock.ev.on('creds.update', saveCreds);

  } catch (error) {
    console.error('WhatsApp initialization error:', error);
    connectionStatus = 'error';
  }
};

// Send WhatsApp message
const sendWhatsAppMessage = async (to, message) => {
  try {
    if (!sock || connectionStatus !== 'connected') {
      console.error('WhatsApp not connected');
      return false;
    }

    // Format phone number
    let formattedNumber = to.replace(/[^0-9]/g, '');
    if (!formattedNumber.startsWith('254')) {
      formattedNumber = '254' + formattedNumber.replace(/^0/, '');
    }

    const jid = `${formattedNumber}@s.whatsapp.net`;
    
    await sock.sendMessage(jid, { text: message });
    console.log(`WhatsApp message sent to ${formattedNumber}`);
    return true;
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return false;
  }
};

// Send order notification to admin
const sendOrderNotificationToAdmin = async (order, user) => {
  const session = await WhatsappSession.findOne({ sessionId: 'fresh_harvest_session' });
  if (!session || !session.adminPhone) return false;

  const adminJid = `${session.adminPhone}@s.whatsapp.net`;
  
  const message = 
    `*🚨 NEW ORDER RECEIVED*\n\n` +
    `Amount: \`KSH ${order.finalAmount}\`\n` +
    `Customer: ${user.name}\n` +
    `Phone: \`${user.phone}\`\n` +
    `Order ID: \`${order.orderNumber}\`\n\n` +
    `Please approve within 3 minutes.\n\n` +
    `_Received at ${new Date().toLocaleString()}_`;

  return await sendWhatsAppMessage(adminJid, message);
};

// Send tracking update to customer
const sendTrackingUpdate = async (phone, order, statusUpdate) => {
  const trackingLink = `${process.env.CLIENT_URL}/track/${order._id}`;
  
  const message = 
    `*📦 ORDER UPDATE*\n\n` +
    `Order: \`${order.orderNumber}\`\n` +
    `Status: *${statusUpdate.status}*\n`;
  
  if (statusUpdate.note) {
    message += `Note: \`${statusUpdate.note}\`\n`;
  }
  
  message += `\nTrack your order: ${trackingLink}\n\n` +
    `_Updated at ${new Date().toLocaleString()}_`;

  return await sendWhatsAppMessage(phone, message);
};

// Send verification code
const sendVerificationCode = async (phone, code) => {
  const message = 
    `*🌿 FRESH HARVEST GROCERY*\n\n` +
    `Your verification code is: \`${code}\`\n\n` +
    `Please enter this on the website to verify your phone.\n\n` +
    `_Valid for 10 minutes_`;

  return await sendWhatsAppMessage(phone, message);
};

// Get connection status
const getConnectionStatus = () => {
  return {
    status: connectionStatus,
    qrCode: qrCodeData
  };
};

// Disconnect WhatsApp
const disconnectWhatsApp = async () => {
  if (sock) {
    await sock.logout();
    sock = null;
    connectionStatus = 'disconnected';
  }
};

module.exports = {
  initializeWhatsApp,
  sendWhatsAppMessage,
  sendOrderNotificationToAdmin,
  sendTrackingUpdate,
  sendVerificationCode,
  getConnectionStatus,
  disconnectWhatsApp
};
