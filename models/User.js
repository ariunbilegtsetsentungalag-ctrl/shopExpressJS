const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['customer', 'admin', 'product_manager'],
    default: 'customer'
  },
  permissions: {
    type: [String],
    default: []
  },
  // Profile fields
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    cityAimag: {
      type: String,
      trim: true
    },
    duuregSum: {
      type: String,
      trim: true
    },
    horooBag: {
      type: String,
      trim: true
    },
    detailedInfo: {
      type: String,
      trim: true
    }
  },
  avatar: {
    type: String, // URL to profile image
    default: ''
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', ''],
    default: ''
  },
  profileCompleted: {
    type: Boolean,
    default: false
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

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if profile is complete
userSchema.methods.isProfileComplete = function() {
  return !!(
    this.firstName &&
    this.lastName &&
    this.phone &&
    this.address &&
    this.address.street &&
    this.address.city &&
    this.address.state &&
    this.address.zipCode &&
    this.address.country
  );
};

// Pre-save hook to update profileCompleted status
userSchema.pre('save', function(next) {
  this.profileCompleted = this.isProfileComplete();
  this.updatedAt = Date.now();
  next();
});

// Indexes for performance (email and username already unique from schema)
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);