require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const dbURI = process.env.CONNECTION_STRING;

async function updateDeliveryTime() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(dbURI);
    console.log('Connected to MongoDB');

    // Update all products to have deliveryTime: 14 (days)
    const result = await Product.updateMany(
      { deliveryTime: { $exists: false } }, // Only update products that don't have deliveryTime
      { $set: { deliveryTime: 14 } }
    );

    console.log(`Updated ${result.modifiedCount} products with delivery time of 14 days`);

    // Verify the update
    const totalProducts = await Product.countDocuments();
    const productsWithDelivery = await Product.countDocuments({ deliveryTime: { $exists: true } });
    
    console.log(`Total products: ${totalProducts}`);
    console.log(`Products with delivery time: ${productsWithDelivery}`);

    console.log('✅ Delivery time update completed successfully!');
  } catch (error) {
    console.error('❌ Error updating delivery time:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

updateDeliveryTime();