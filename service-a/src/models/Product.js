const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ['Vegetables', 'Fruits', 'Cereals', 'Dairy & Eggs', 'Spices'],
    required: true
  },
  price: { type: Number, required: true },
  stockQty: { type: Number, required: true },
  description: { type: String, required: true },
  images: [{ type: String }] // Cloudinary URLs
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
