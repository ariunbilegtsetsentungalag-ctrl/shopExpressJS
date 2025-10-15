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

// Migration function
const migrateUserProfiles = async () => {
  try {
    console.log('🔄 Starting user profile migration...');
    
    // Find all users that might have profile data in the old format
    const users = await User.find({
      $or: [
        { firstName: { $exists: true, $ne: '' } },
        { lastName: { $exists: true, $ne: '' } },
        { phone: { $exists: true, $ne: '' } },
        { 'address.aimag': { $exists: true, $ne: '' } },
        { dateOfBirth: { $exists: true } },
        { gender: { $exists: true, $ne: '' } }
      ]
    });

    console.log(`📊 Found ${users.length} users with profile data to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        // Check if profile already exists
        let profile = await Profile.findOne({ userId: user._id });
        
        if (profile) {
          console.log(`⏭️  Skipping user ${user.username} - Profile already exists`);
          skippedCount++;
          continue;
        }

        // Create new profile with migrated data
        const profileData = {
          userId: user._id,
          personalInfo: {
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            phone: user.phone || '',
            dateOfBirth: user.dateOfBirth || null,
            gender: user.gender || '',
            avatar: user.avatar || ''
          },
          address: {
            aimag: user.address?.aimag || '',
            duuregSum: user.address?.duuregSum || '',
            horoo: user.address?.horoo || '',
            detailedAddress: user.address?.detailedAddress || user.address?.detailedInfo || '',
            zipCode: user.address?.zipCode || ''
          },
          preferences: {
            language: 'mn',
            currency: 'MNT',
            notifications: {
              email: true,
              sms: false,
              promotions: true
            }
          }
        };

        // Create the profile
        profile = new Profile(profileData);
        await profile.save();

        // Update user to reference the new profile
        user.profile = profile._id;
        
        // Clear old profile fields from user (optional - for cleanup)
        user.firstName = undefined;
        user.lastName = undefined;
        user.phone = undefined;
        user.address = undefined;
        user.avatar = undefined;
        user.dateOfBirth = undefined;
        user.gender = undefined;
        user.profileCompleted = undefined;

        await user.save();

        console.log(`✅ Migrated profile for user: ${user.username}`);
        migratedCount++;

      } catch (error) {
        console.error(`❌ Error migrating user ${user.username}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migratedCount} users`);
    console.log(`⏭️  Skipped (already exists): ${skippedCount} users`);
    console.log(`❌ Errors: ${errorCount} users`);
    console.log('🎉 Migration completed!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📴 Database connection closed');
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  require('dotenv').config();
  
  connectDB().then(() => {
    migrateUserProfiles();
  });
}

module.exports = { migrateUserProfiles };