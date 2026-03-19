const fs = require('fs');
let content = fs.readFileSync('utils/whatsapp.js', 'utf8');

// Export useMongoAuthState for use in routes
content = content.replace('const useMongoAuthState = async (sessionId) => {', 'const useMongoAuthState = async (sessionId) => {');

const exportsSearch = `module.exports = {
  initializeWhatsApp,
  sendWhatsAppMessage,
  sendOrderNotificationToAdmin,
  sendTrackingUpdate,
  sendVerificationCode,
  getConnectionStatus,
  disconnectWhatsApp
};`;

const exportsReplace = `module.exports = {
  initializeWhatsApp,
  sendWhatsAppMessage,
  sendOrderNotificationToAdmin,
  sendTrackingUpdate,
  sendVerificationCode,
  getConnectionStatus,
  disconnectWhatsApp,
  useMongoAuthState
};`;

content = content.replace(exportsSearch, exportsReplace);
fs.writeFileSync('utils/whatsapp.js', content);
console.log('patched utils/whatsapp.js');
