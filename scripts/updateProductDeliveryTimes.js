require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const dbURI = process.env.CONNECTION_STRING;

async function updateProductDeliveryTimes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(dbURI);
    console.log('Connected to MongoDB');

    // Update products that don't have deliveryTime or have null deliveryTime
    const result = await Product.updateMany(
      { $or: [{ deliveryTime: { $exists: false } }, { deliveryTime: null }] },
      { $set: { deliveryTime: 14 } }
    );

    console.log(`Updated ${result.modifiedCount} products with default 14-day delivery time`);

    // Show current delivery times by category
    const deliveryStats = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          avgDeliveryTime: { $avg: '$deliveryTime' },
          minDeliveryTime: { $min: '$deliveryTime' },
          maxDeliveryTime: { $max: '$deliveryTime' },
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n📊 Delivery Times by Category:');
    deliveryStats.forEach(stat => {
      console.log(`${stat._id}: ${stat.count} products, Average: ${stat.avgDeliveryTime} days, Range: ${stat.minDeliveryTime}-${stat.maxDeliveryTime} days`);
    });

    console.log('\n✅ Product delivery times updated successfully!');
  } catch (error) {
    console.error('❌ Error updating product delivery times:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

updateProductDeliveryTimes();