const fs = require('fs');
let content = fs.readFileSync('utils/whatsapp.js', 'utf8');

// The original useMongoAuthState returns a state object that copies data.creds by value (if object reference)
// Better to return the data object reference or provide an update function.

const searchAuth = `  return {
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
  };`;

const replaceAuth = `  return {
    state: data,
    saveCreds: async () => {
      await writeData(data);
    }
  };`;

content = content.replace(searchAuth, replaceAuth);
fs.writeFileSync('utils/whatsapp.js', content);
