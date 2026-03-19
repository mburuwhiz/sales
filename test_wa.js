const { useMongoAuthState } = require('./utils/whatsapp');
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const { state, saveCreds } = await useMongoAuthState('test_session');
    state.creds = { test: true };
    await saveCreds();
    console.log('Saved');
    process.exit(0);
  })
  .catch(console.error);
