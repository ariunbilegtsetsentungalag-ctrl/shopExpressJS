const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Personal Information
  personalInfo: {
    firstName: {
      type: String,
      trim: true,
      maxlength: 50
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: 50
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          return !v || /^[+]?[\d\s()-]+$/.test(v);
        },
        message: 'Invalid phone number format'
      }
    },
    dateOfBirth: {
      type: Date,
      validate: {
        validator: function(v) {
          return !v || v <= new Date();
        },
        message: 'Date of birth cannot be in the future'
      }
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', ''],
      default: ''
    },
    avatar: {
      type: String,
      default: ''
    }
  },

  // Mongolian Address Information
  address: {
    aimag: {
      type: String,
      trim: true,
      enum: [
        '', 'Улаанбаатар хот', 'Архангай аймаг', 'Баян-Өлгий аймаг', 'Баянхонгор аймаг',
        'Булган аймаг', 'Говь-Алтай аймаг', 'Говьсүмбэр аймаг', 'Дархан-Уул аймаг',
        'Дорноговь аймаг', 'Дорнод аймаг', 'Дундговь аймаг', 'Завхан аймаг',
        'Орхон аймаг', 'Өвөрхангай аймаг', 'Өмнөговь аймаг', 'Сүхбаатар аймаг',
        'Сэлэнгэ аймаг', 'Төв аймаг', 'Увс аймаг', 'Ховд аймаг',
        'Хөвсгөл аймаг', 'Хэнтий аймаг'
      ],
      default: ''
    },
    duuregSum: {
      type: String,
      trim: true,
      maxlength: 100,
      default: ''
    },
    horoo: {
      type: String,
      trim: true,
      maxlength: 50,
      default: ''
    },
    detailedAddress: {
      type: String,
      trim: true,
      maxlength: 200,
      default: ''
    },
    zipCode: {
      type: String,
      trim: true,
      maxlength: 10,
      validate: {
        validator: function(v) {
          return !v || /^\d{4,6}$/.test(v);
        },
        message: 'Zip code must be 4-6 digits'
      },
      default: ''
    }
  },

  // Preferences and Settings
  preferences: {
    language: {
      type: String,
      enum: ['en', 'mn'],
      default: 'mn'
    },
    currency: {
      type: String,
      enum: ['MNT', 'USD'],
      default: 'MNT'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      },
      promotions: {
        type: Boolean,
        default: true
      }
    }
  },

  // Profile Status
  completionStatus: {
    isComplete: {
      type: Boolean,
      default: false
    },
    completedSections: {
      personalInfo: {
        type: Boolean,
        default: false
      },
      address: {
        type: Boolean,
        default: false
      },
      preferences: {
        type: Boolean,
        default: false
      }
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Methods to check completion status
profileSchema.methods.checkPersonalInfoComplete = function() {
  return !!(
    this.personalInfo.firstName &&
    this.personalInfo.lastName &&
    this.personalInfo.phone
  );
};

profileSchema.methods.checkAddressComplete = function() {
  return !!(
    this.address.aimag &&
    this.address.duuregSum &&
    (this.address.aimag !== 'Улаанбаатар хот' || this.address.horoo) // Horoo required only for Ulaanbaatar
  );
};

profileSchema.methods.checkPreferencesComplete = function() {
  return !!(
    this.preferences.language &&
    this.preferences.currency
  );
};

profileSchema.methods.calculateCompletionPercentage = function() {
  let completed = 0;
  const total = 3;

  if (this.checkPersonalInfoComplete()) completed++;
  if (this.checkAddressComplete()) completed++;
  if (this.checkPreferencesComplete()) completed++;

  return Math.round((completed / total) * 100);
};

// Pre-save hook to update completion status
profileSchema.pre('save', function(next) {
  this.completionStatus.completedSections.personalInfo = this.checkPersonalInfoComplete();
  this.completionStatus.completedSections.address = this.checkAddressComplete();
  this.completionStatus.completedSections.preferences = this.checkPreferencesComplete();
  
  this.completionStatus.completionPercentage = this.calculateCompletionPercentage();
  this.completionStatus.isComplete = this.completionStatus.completionPercentage === 100;
  
  this.updatedAt = Date.now();
  next();
});

// Static method to find or create profile
profileSchema.statics.findOrCreateByUserId = async function(userId) {
  let profile = await this.findOne({ userId });
  
  if (!profile) {
    profile = new this({ 
      userId,
      preferences: {
        language: 'mn',
        currency: 'MNT',
        notifications: {
          email: true,
          sms: false,
          promotions: true
        }
      }
    });
    await profile.save();
  }
  
  return profile;
};

// Indexes for performance
profileSchema.index({ userId: 1 });
profileSchema.index({ 'completionStatus.isComplete': 1 });
profileSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Profile', profileSchema);