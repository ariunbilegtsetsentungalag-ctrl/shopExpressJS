const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    name: String,
    price: Number,
    quantity: Number
  }],
  totalAmount: Number,
  orderDate: {
    type: Date,
    default: Date.now
  },
  deliveryStatus: {
    type: String,
    enum: ['Processing', 'Shipped', 'Delivering', 'Delivered'],
    default: 'Processing'
  },
  estimatedDeliveryDate: {
    type: Date
  },
  trackingNumber: {
    type: String
  }
});

// Indexes for analytics queries
orderSchema.index({ userId: 1, orderDate: -1 });
orderSchema.index({ orderDate: -1 });
orderSchema.index({ 'products.productId': 1 });

module.exports = mongoose.model('Order', orderSchema);