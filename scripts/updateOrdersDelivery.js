require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');

const dbURI = process.env.CONNECTION_STRING;

async function updateOrdersWithDeliveryInfo() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(dbURI);
    console.log('Connected to MongoDB');

    // Get all orders
    const orders = await Order.find();
    
    if (orders.length === 0) {
      console.log('No orders found to update');
      return;
    }

    console.log(`Found ${orders.length} orders to update`);

    for (let order of orders) {
      // Calculate estimated delivery date (14 days from order date)
      const estimatedDeliveryDate = new Date(order.orderDate);
      estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 14);

      // Determine delivery status based on order age
      const daysSinceOrder = Math.floor((Date.now() - order.orderDate) / (1000 * 60 * 60 * 24));
      let deliveryStatus;
      
      if (daysSinceOrder < 1) {
        deliveryStatus = 'Processing';
      } else if (daysSinceOrder < 3) {
        deliveryStatus = 'Shipped';
      } else if (daysSinceOrder < 14) {
        deliveryStatus = 'Delivering';
      } else {
        deliveryStatus = 'Delivered';
      }

      // Generate a tracking number
      const trackingNumber = 'TRK' + Math.random().toString(36).substr(2, 9).toUpperCase();

      // Update the order
      await Order.updateOne(
        { _id: order._id },
        {
          $set: {
            deliveryStatus: deliveryStatus,
            estimatedDeliveryDate: estimatedDeliveryDate,
            trackingNumber: trackingNumber
          }
        }
      );

      console.log(`Updated order ${order._id.toString().slice(-8)} - Status: ${deliveryStatus}`);
    }

    console.log('✅ All orders updated successfully!');
  } catch (error) {
    console.error('❌ Error updating orders:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

updateOrdersWithDeliveryInfo();