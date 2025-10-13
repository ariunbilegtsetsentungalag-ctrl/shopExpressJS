const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['Clothing', 'Shoes', 'Accessories', 'Home & Living', 'Electronics', 'Sports', 'Other']
  },
  image: {
    type: String,
    required: true
  },
  images: [{
    type: String
  }],
  sizes: [{
    name: String,
    price: Number
  }],
  colors: [{
    name: String,
    code: String,
    image: String
  }],
  features: [{
    type: String
  }],
  inStock: {
    type: Boolean,
    default: true
  },
  stockQuantity: {
    type: Number,
    default: 0
  },
  deliveryTime: {
    type: Number,
    default: 14,
    min: 1,
    max: 365
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});


productSchema.virtual('productId').get(function() {
  return 'p' + this._id.toString().slice(-6);
});

// Indexes for common queries and performance
productSchema.index({ category: 1 });
productSchema.index({ createdBy: 1, createdAt: -1 });
productSchema.index({ inStock: -1, stockQuantity: -1 });
// Compound index for category + stock filtering (most common query)
productSchema.index({ category: 1, inStock: -1, stockQuantity: -1 });
// Text index for search across name and description
productSchema.index({ name: 'text', description: 'text' });
// Compound index for text search with category filter
productSchema.index({ category: 1, name: 1, description: 1 });

module.exports = mongoose.model('Product', productSchema);