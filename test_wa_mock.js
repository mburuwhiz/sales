const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

async function test() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  await mongoose.connect(uri);

  const { useMongoAuthState } = require('./utils/whatsapp');
  const { state, saveCreds } = await useMongoAuthState('test_session');
  console.log('Got state:', state);

  state.creds = { custom_session: true };
  await saveCreds();

  const WhatsappSession = mongoose.model('WhatsappSession');
  const sessionDoc = await WhatsappSession.findOne({ sessionId: 'test_session' });
  console.log('Saved to DB:', sessionDoc.creds);

  await mongoose.disconnect();
  await mongod.stop();
}

test().catch(console.error);
