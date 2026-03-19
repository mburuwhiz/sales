const fs = require('fs');
let content = fs.readFileSync('routes/whatsapp.js', 'utf8');

if (!content.includes('useMongoAuthState')) {
  content = content.replace(
    /const { \n  initializeWhatsApp, \n  getConnectionStatus, \n  disconnectWhatsApp,\n  sendWhatsAppMessage \n} = require\('\.\.\/utils\/whatsapp'\);/,
    `const {
  initializeWhatsApp,
  getConnectionStatus,
  disconnectWhatsApp,
  sendWhatsAppMessage,
  useMongoAuthState
} = require('../utils/whatsapp');`
  );
  fs.writeFileSync('routes/whatsapp.js', content);
}
