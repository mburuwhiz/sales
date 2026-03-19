const fs = require('fs');
let content = fs.readFileSync('routes/whatsapp.js', 'utf8');

const searchInitialize = `const {
  initializeWhatsApp,
  getConnectionStatus,
  disconnectWhatsApp,
  sendWhatsAppMessage
} = require('../utils/whatsapp');`;

const replaceInitialize = `const {
  initializeWhatsApp,
  getConnectionStatus,
  disconnectWhatsApp,
  sendWhatsAppMessage,
  useMongoAuthState
} = require('../utils/whatsapp');`;

content = content.replace(searchInitialize, replaceInitialize);

const searchConnect = `// Initialize/Connect WhatsApp
router.post('/connect', isAdmin, async (req, res) => {
  try {
    await initializeWhatsApp();
    res.json({ success: true, message: 'WhatsApp initialization started' });
  } catch (error) {
    console.error('WhatsApp connect error:', error);
    res.status(500).json({ error: 'Failed to connect' });
  }
});`;

const replaceConnect = `// Initialize/Connect WhatsApp
router.post('/connect', isAdmin, async (req, res) => {
  try {
    const { externalSessionId } = req.body;

    if (externalSessionId) {
      // Parse the custom SUHAIL session ID format
      const match = externalSessionId.match(/ewo.*/);
      if (match) {
        const base64Data = match[0];
        try {
          const decodedData = Buffer.from(base64Data, 'base64').toString('utf-8');
          const parsedData = JSON.parse(decodedData);

          // The parsedData usually contains creds.json and other keys
          // Format it to match our MongoDB structure
          const creds = parsedData['creds.json'] || parsedData.creds || parsedData;

          // Extract keys if they exist in the payload
          const keys = parsedData.keys || {};
          // remove creds.json from the rest if we are treating the rest as keys
          if (parsedData['creds.json']) {
              for (const k in parsedData) {
                  if (k !== 'creds.json' && k !== 'keys') {
                      keys[k] = parsedData[k];
                  }
              }
          }

          const { state, saveCreds } = await useMongoAuthState('fresh_harvest_session');

          // Overwrite the state with the imported session
          state.creds = creds;
          // Keep existing keys or merge if needed
          Object.assign(state.keys, keys);

          await saveCreds();

          console.log('Successfully injected external session ID credentials');
        } catch (e) {
          console.error('Failed to parse external session ID:', e);
          return res.status(400).json({ error: 'Invalid session ID format' });
        }
      } else {
         return res.status(400).json({ error: 'Session ID does not contain valid base64 payload' });
      }
    }

    await initializeWhatsApp();
    res.json({ success: true, message: 'WhatsApp initialization started' });
  } catch (error) {
    console.error('WhatsApp connect error:', error);
    res.status(500).json({ error: 'Failed to connect' });
  }
});`;

content = content.replace(searchConnect, replaceConnect);
fs.writeFileSync('routes/whatsapp.js', content);
console.log('patched routes/whatsapp.js');
