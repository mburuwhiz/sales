const mongoose = require('mongoose');

const authStateSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  data: { type: Object, required: true }
}, { collection: 'whatsapp_sessions' });

module.exports = mongoose.model('AuthState', authStateSchema);
