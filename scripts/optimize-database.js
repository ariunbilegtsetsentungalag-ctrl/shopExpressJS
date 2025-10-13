require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

const dbURI = process.env.CONNECTION_STRING;

async function optimizeDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(dbURI, { dbName: 'App' });
    console.log('✅ Connected to MongoDB Atlas\n');

    // Create indexes for Product model
    console.log('📊 Creating indexes for Product collection...');
    await Product.collection.createIndex({ category: 1 });
    await Product.collection.createIndex({ createdBy: 1, createdAt: -1 });
    await Product.collection.createIndex({ inStock: -1, stockQuantity: -1 });
    await Product.collection.createIndex({ category: 1, inStock: -1, stockQuantity: -1 });
    await Product.collection.createIndex({ name: 'text', description: 'text' });
    console.log('✅ Product indexes created\n');

    // Create indexes for Order model
    console.log('📊 Creating indexes for Order collection...');
    await Order.collection.createIndex({ userId: 1, orderDate: -1 });
    await Order.collection.createIndex({ orderDate: -1 });
    await Order.collection.createIndex({ 'products.productId': 1 });
    console.log('✅ Order indexes created\n');

    // Create indexes for User model (email/username already unique from schema)
    console.log('📊 Creating indexes for User collection...');
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ createdAt: -1 });
    console.log('✅ User indexes created (email/username already indexed from schema)\n');

    // Get index statistics
    console.log('📈 Index Statistics:');
    const productIndexes = await Product.collection.getIndexes();
    const orderIndexes = await Order.collection.getIndexes();
    const userIndexes = await User.collection.getIndexes();

    console.log(`\nProduct indexes: ${Object.keys(productIndexes).length}`);
    console.log(`Order indexes: ${Object.keys(orderIndexes).length}`);
    console.log(`User indexes: ${Object.keys(userIndexes).length}`);

    console.log('\n✅ Database optimization complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error optimizing database:', error);
    process.exit(1);
  }
}

optimizeDatabase();
