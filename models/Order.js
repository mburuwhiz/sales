const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    price: Number,
    quantity: Number,
    image: String
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  coinsUsed: {
    type: Number,
    default: 0
  },
  finalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Packing', 'En-Route', 'Delivered', 'Cancelled', 'Pending Payment'],
    default: 'Pending Payment'
  },
  deliveryData: {
    landmark: {
      type: String,
      required: true
    },
    building: {
      type: String,
      required: true
    },
    receiverPhone: {
      type: String,
      required: true
    },
    coords: {
      lat: Number,
      lng: Number
    }
  },
  mpesaData: {
    receiptCode: String,
    transactionDate: Date,
    amount: Number,
    phoneNumber: String
  },
  trackingTimeline: [{
    status: {
      type: String,
      required: true
    },
    time: {
      type: Date,
      default: Date.now
    },
    note: String,
    updatedBy: {
      type: String,
      default: 'Admin'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Order', orderSchema);
