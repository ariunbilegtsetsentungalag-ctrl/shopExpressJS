const mongoose = require('mongoose');
const User = require('../models/User');
const Profile = require('../models/Profile');

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Test profile completion
const testProfileCompletion = async () => {
  try {
    console.log('🔍 Testing Profile Completion System...\n');

    // Find all users
    const users = await User.find().populate('profile');
    
    console.log(`📊 Found ${users.length} users\n`);

    for (const user of users) {
      console.log(`👤 User: ${user.username} (${user.email})`);
      
      if (!user.profile) {
        console.log('   ❌ No profile found - creating one...');
        const profile = await Profile.findOrCreateByUserId(user._id);
        user.profile = profile._id;
        await user.save();
        await user.populate('profile');
        console.log('   ✅ Profile created');
      }

      const profile = user.profile;
      
      console.log('   📋 Profile Status:');
      console.log(`      Personal Info Complete: ${profile.checkPersonalInfoComplete()}`);
      console.log(`      Address Complete: ${profile.checkAddressComplete()}`);
      console.log(`      Preferences Complete: ${profile.checkPreferencesComplete()}`);
      console.log(`      Overall Complete: ${profile.completionStatus.isComplete}`);
      console.log(`      Completion Percentage: ${profile.completionStatus.completionPercentage}%`);
      
      console.log('   🔍 Profile Data:');
      console.log(`      First Name: "${profile.personalInfo.firstName}"`);
      console.log(`      Last Name: "${profile.personalInfo.lastName}"`);
      console.log(`      Phone: "${profile.personalInfo.phone}"`);
      console.log(`      Aimag: "${profile.address.aimag}"`);
      console.log(`      District/Sum: "${profile.address.duuregSum}"`);
      console.log(`      Horoo: "${profile.address.horoo}"`);
      
      // Test the specific completion logic
      const personalComplete = !!(
        profile.personalInfo.firstName &&
        profile.personalInfo.lastName &&
        profile.personalInfo.phone
      );
      
      const addressComplete = !!(
        profile.address.aimag &&
        profile.address.duuregSum &&
        (profile.address.aimag !== 'Улаанбаатар хот' || profile.address.horoo)
      );
      
      const preferencesComplete = !!(
        profile.preferences.language &&
        profile.preferences.currency
      );
      
      console.log('   🧪 Manual Check:');
      console.log(`      Personal: ${personalComplete}`);
      console.log(`      Address: ${addressComplete}`);
      console.log(`      Preferences: ${preferencesComplete}`);
      
      if (personalComplete && addressComplete && preferencesComplete) {
        console.log('   ✅ Should be complete!');
      } else {
        console.log('   ❌ Missing required data');
      }
      
      console.log('   ────────────────────────────────────────\n');
    }

    console.log('🎉 Profile completion test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📴 Database connection closed');
  }
};

// Run test if this file is executed directly
if (require.main === module) {
  require('dotenv').config();
  
  connectDB().then(() => {
    testProfileCompletion();
  });
}

module.exports = { testProfileCompletion };