const fs = require('fs');
let content = fs.readFileSync('utils/whatsapp.js', 'utf8');

// The writeData function inside useMongoAuthState needs to be made available,
// OR we can just use writeData inside useMongoAuthState directly when state.creds is changed.
// Actually, saveCreds in useMongoAuthState does:
/*
    saveCreds: async () => {
      await writeData({
        creds: data.creds,
        keys: data.keys
      });
    }
*/
// If we modify state.creds (which refers to data.creds), then saveCreds will write it.

const checkState = content.includes('return {\n    state: {\n      creds: data.creds,\n      keys: data.keys\n    },');
console.log('checkState:', checkState);
