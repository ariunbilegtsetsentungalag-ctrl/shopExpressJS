require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const dbURI = process.env.CONNECTION_STRING;

async function updateProfileCompletion() {
  try {
    await mongoose.connect(dbURI, {
      dbName: 'App'
    });
    console.log('Connected to MongoDB...');

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to update`);

    let updatedCount = 0;

    for (const user of users) {
      // Check if profile is complete and update
      const wasComplete = user.profileCompleted;
      await user.save(); // This will trigger the pre-save hook to update profileCompleted

      if (user.profileCompleted !== wasComplete) {
        updatedCount++;
        console.log(`Updated user: ${user.username} - Profile Complete: ${user.profileCompleted}`);
      }
    }

    console.log(`\nProfile completion status updated for ${updatedCount} users`);
    console.log('Migration completed successfully!');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

updateProfileCompletion();
