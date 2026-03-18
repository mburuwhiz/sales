const mongoose = require('mongoose');

const whatsappSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  creds: {
    type: Object,
    required: true
  },
  keys: {
    type: Object,
    default: {}
  },
  isConnected: {
    type: Boolean,
    default: false
  },
  adminPhone: {
    type: String,
    default: null
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('WhatsappSession', whatsappSessionSchema);
