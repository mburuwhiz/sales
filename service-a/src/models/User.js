const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  walletCoins: { type: Number, default: 0 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  verificationCode: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
