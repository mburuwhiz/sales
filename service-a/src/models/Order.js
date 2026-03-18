const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Pending Payment', 'Approved', 'Packing', 'En-Route', 'Delivered'],
    default: 'Pending'
  },
  deliveryData: {
    landmark: String,
    building: String,
    receiverPhone: String,
    coords: {
      lat: Number,
      lng: Number
    }
  },
  mpesaData: {
    receiptCode: String,
    transactionDate: Date,
    amount: Number
  },
  trackingTimeline: [{
    status: String,
    time: { type: Date, default: Date.now },
    note: String,
    updatedBy: { type: String, default: 'Admin' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
