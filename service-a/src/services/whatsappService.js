const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const axios = require('axios');
const qrcode = require('qrcode-terminal');
const AuthState = require('../models/AuthState');

let sock = null;
let isConnected = false;

async function connectToWhatsApp() {
  const { useMongoDBAuthState } = require('./mongoAuthState');
  const auth = await useMongoDBAuthState();

  sock = makeWASocket({
    auth: auth.state,
    logger: pino({ level: 'silent' })
  });

  sock.ev.on('creds.update', auth.saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log('QR Code generated. Please scan below:');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'open') {
      console.log('opened connection');
      isConnected = true;
      const adminPhone = process.env.ADMIN_PHONE || '+254712345678';
      const successMessage = `✅ *FRESH HARVEST SERVER CONNECTED*`;
      try {
        await sock.sendMessage(adminPhone.replace('+', '') + '@s.whatsapp.net', { text: successMessage });
      } catch (e) {
        console.log('Could not send initial message to admin');
      }
    }
    if (connection === 'close') {
      isConnected = false;
      const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      const is401 = (lastDisconnect.error)?.output?.statusCode === 401;
      console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);

      if (shouldReconnect && !is401) {
        setTimeout(connectToWhatsApp, 3000); // Wait 3s before reconnecting to prevent 405 loop
      } else {
         console.log('URGENT: WhatsApp Session Disconnected. Alerting Admin.');
         try {
           await axios.post(process.env.MAILER_MICROSERVICE_URL, {
             apiKey: process.env.MAILER_API_KEY,
             action: 'custom_broadcast',
             variables: {
               subject: 'URGENT: WhatsApp Session Disconnected',
               rawHtml: '<h2>WhatsApp Disconnected</h2><p>URGENT: WhatsApp Session Disconnected. Please log into the dashboard and re-scan the QR code.</p>',
               recipients: [process.env.ADMIN_EMAIL || 'admin@freshharvest.app']
             }
           });
         } catch(e) {
           console.error('Failed to notify admin of disconnect via Service B', e.message);
         }
      }
    }
  });
}

async function sendMessage(to, message) {
  if (!sock) await connectToWhatsApp();
  if (!isConnected || !sock.user || !sock.user.id) {
    console.warn('WhatsApp Socket is not fully connected or initialized yet. Retrying in 2 seconds...');
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        if (isConnected && sock && sock.user && sock.user.id) {
           const id = to.replace('+', '') + '@s.whatsapp.net';
           try {
             await sock.sendMessage(id, { text: message });
             resolve();
           } catch(e) {
             reject(e);
           }
        } else {
           reject(new Error('WhatsApp socket failed to initialize user ID in time.'));
        }
      }, 2000);
    });
  }
  const id = to.replace('+', '') + '@s.whatsapp.net';
  await sock.sendMessage(id, { text: message });
}

module.exports = {
  connectToWhatsApp,
  sendMessage
};
