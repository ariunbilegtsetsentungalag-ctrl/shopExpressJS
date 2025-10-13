require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const User = require('../models/User');

const dbURI = process.env.CONNECTION_STRING;

const initialCategories = [
  { name: 'Clothing', description: 'Apparel and fashion items including shirts, pants, dresses, and accessories' },
  { name: 'Shoes', description: 'Footwear for all occasions including sneakers, boots, heels, and sandals' },
  { name: 'Accessories', description: 'Fashion accessories including bags, jewelry, watches, and belts' },
  { name: 'Home & Living', description: 'Home decoration and living essentials for a comfortable lifestyle' },
  { name: 'Electronics', description: 'Electronic devices and gadgets for modern living' },
  { name: 'Sports', description: 'Sports equipment and fitness gear for active lifestyles' },
  { name: 'Other', description: 'Miscellaneous items and special products' }
];

async function seedCategories() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(dbURI, { dbName: 'App' });
    console.log('Connected successfully!');

    // Find an admin user
    const adminUser = await User.findOne({ role: { $in: ['admin', 'product_manager'] } });
    if (!adminUser) {
      console.error('No admin user found. Please create one first.');
      process.exit(1);
    }

    console.log(`Using user ${adminUser.username} as category creator`);

    // Clear existing categories
    console.log('Clearing existing categories...');
    await Category.deleteMany({});

    // Add initial categories
    console.log('Adding initial categories...');
    for (const categoryData of initialCategories) {
      const category = new Category({
        ...categoryData,
        createdBy: adminUser._id
      });
      await category.save();
      console.log(`✓ Created category: ${categoryData.name}`);
    }

    console.log(`\n🎉 Successfully seeded ${initialCategories.length} categories!`);

  } catch (error) {
    console.error('Error seeding categories:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

if (require.main === module) {
  seedCategories();
}

module.exports = seedCategories;