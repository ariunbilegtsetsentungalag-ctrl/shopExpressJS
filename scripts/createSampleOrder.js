require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

const dbURI = process.env.CONNECTION_STRING;

async function createSampleOrder() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(dbURI);
    console.log('Connected to MongoDB');

    // Find a user (assuming there's at least one user)
    const user = await User.findOne();
    if (!user) {
      console.log('No user found. Please create a user first.');
      return;
    }

    // Find some products
    const products = await Product.find().limit(3);
    if (products.length === 0) {
      console.log('No products found. Please seed products first.');
      return;
    }

    // Calculate estimated delivery date (14 days from now)
    const estimatedDeliveryDate = new Date();
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 14);
    
    // Generate tracking number
    const trackingNumber = 'TRK' + Math.random().toString(36).substr(2, 9).toUpperCase();

    // Create sample order
    const sampleOrder = new Order({
      userId: user._id,
      products: products.slice(0, 2).map(product => ({
        productId: product._id,
        name: product.name,
        price: product.basePrice || 29.99,
        quantity: Math.floor(Math.random() * 3) + 1
      })),
      totalAmount: products.slice(0, 2).reduce((sum, product) => 
        sum + (product.basePrice || 29.99) * (Math.floor(Math.random() * 3) + 1), 0),
      deliveryStatus: 'Delivering', // Set to "Delivering" to show the delivery info
      estimatedDeliveryDate: estimatedDeliveryDate,
      trackingNumber: trackingNumber
    });

    await sampleOrder.save();
    
    console.log('✅ Sample order created successfully!');
    console.log(`Order ID: ${sampleOrder._id}`);
    console.log(`Status: ${sampleOrder.deliveryStatus}`);
    console.log(`Tracking: ${sampleOrder.trackingNumber}`);
    console.log(`Estimated Delivery: ${sampleOrder.estimatedDeliveryDate.toDateString()}`);
    
  } catch (error) {
    console.error('❌ Error creating sample order:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

createSampleOrder();