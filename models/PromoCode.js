const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  description: {
    type: String,
    required: true,
    maxlength: 200
  },
  discountType: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(value) {
        if (this.discountType === 'percentage') {
          return value <= 100;
        }
        return true;
      },
      message: 'Percentage discount cannot exceed 100%'
    }
  },
  minimumOrderAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  maximumDiscountAmount: {
    type: Number,
    default: null,
    min: 0
  },
  expiryDate: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    default: null,
    min: 1
  },
  usedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  excludedCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
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

// Middleware to update updatedAt field
promoCodeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to check if promo code is valid
promoCodeSchema.methods.isValid = function() {
  const now = new Date();
  
  // Check if active
  if (!this.isActive) {
    return { valid: false, message: 'Promo code is not active' };
  }
  
  // Check expiry
  if (now > this.expiryDate) {
    return { valid: false, message: 'Promo code has expired' };
  }
  
  // Check usage limit
  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    return { valid: false, message: 'Promo code usage limit exceeded' };
  }
  
  return { valid: true, message: 'Promo code is valid' };
};

// Method to calculate discount amount
promoCodeSchema.methods.calculateDiscount = function(orderAmount, cartItems = []) {
  const validation = this.isValid();
  if (!validation.valid) {
    return { discount: 0, message: validation.message };
  }
  
  // Check minimum order amount
  if (orderAmount < this.minimumOrderAmount) {
    return { 
      discount: 0, 
      message: `Minimum order amount of $${this.minimumOrderAmount.toFixed(2)} required` 
    };
  }
  
  let discount = 0;
  
  if (this.discountType === 'percentage') {
    discount = (orderAmount * this.discountValue) / 100;
  } else {
    discount = this.discountValue;
  }
  
  // Apply maximum discount limit
  if (this.maximumDiscountAmount && discount > this.maximumDiscountAmount) {
    discount = this.maximumDiscountAmount;
  }
  
  // Ensure discount doesn't exceed order amount
  if (discount > orderAmount) {
    discount = orderAmount;
  }
  
  return {
    discount: Math.round(discount * 100) / 100, // Round to 2 decimal places
    message: 'Discount applied successfully'
  };
};

// Method to increment usage count
promoCodeSchema.methods.incrementUsage = async function() {
  this.usedCount += 1;
  await this.save();
};

// Static method to find valid promo code
promoCodeSchema.statics.findValidCode = async function(code) {
  const promoCode = await this.findOne({ 
    code: code.toUpperCase(),
    isActive: true 
  });
  
  if (!promoCode) {
    return { valid: false, message: 'Invalid promo code' };
  }
  
  const validation = promoCode.isValid();
  if (!validation.valid) {
    return validation;
  }
  
  return { valid: true, promoCode: promoCode };
};

module.exports = mongoose.model('PromoCode', promoCodeSchema);