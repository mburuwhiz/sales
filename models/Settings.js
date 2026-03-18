const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  minPurchaseForCoins: {
    type: Number,
    default: 2000
  },
  coinsPerPurchase: {
    type: Number,
    default: 100
  },
  minCoinsToRedeem: {
    type: Number,
    default: 500
  },
  coinValue: {
    type: Number,
    default: 10
  },
  mpesaNumber: {
    type: String,
    default: '0113323234'
  },
  mpesaName: {
    type: String,
    default: 'Peter Wekulo'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Settings', settingsSchema);
