const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const axios = require('axios');
const AuthState = require('../models/AuthState');

let sock = null;

async function connectToWhatsApp() {
  const { useMongoDBAuthState } = require('./mongoAuthState');
  const auth = await useMongoDBAuthState();

  sock = makeWASocket({
    auth: auth.state,
    printQRInTerminal: true,
    logger: pino({ level: 'silent' })
  });

  sock.ev.on('creds.update', auth.saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log('QR Code generated');
    }
    if (connection === 'open') {
      console.log('opened connection');
      const adminPhone = process.env.ADMIN_PHONE || '+254712345678';
      const successMessage = `✅ *FRESH HARVEST SERVER CONNECTED*`;
      try {
        await sock.sendMessage(adminPhone.replace('+', '') + '@s.whatsapp.net', { text: successMessage });
      } catch (e) {
        console.log('Could not send initial message to admin');
      }
    }
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      const is401 = (lastDisconnect.error)?.output?.statusCode === 401;
      console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);

      if (shouldReconnect && !is401) {
        connectToWhatsApp();
      } else {
         console.log('URGENT: WhatsApp Session Disconnected. Alerting Admin.');
         try {
           await axios.post(process.env.MAILER_MICROSERVICE_URL, {
             apiKey: process.env.MICROSERVICE_API_KEY,
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
    } else if (connection === 'open') {
      console.log('opened connection');
    }
  });
}

async function sendMessage(to, message) {
  if (!sock) await connectToWhatsApp();
  const id = to.replace('+', '') + '@s.whatsapp.net';
  await sock.sendMessage(id, { text: message });
}

module.exports = {
  connectToWhatsApp,
  sendMessage
};
