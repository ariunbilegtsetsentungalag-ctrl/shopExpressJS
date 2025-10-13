require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');

const dbURI = process.env.CONNECTION_STRING;

async function fixOrderDeliveryDates() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(dbURI);
    console.log('Connected to MongoDB');

    // Find orders without delivery information
    const ordersToUpdate = await Order.find({
      $or: [
        { estimatedDeliveryDate: { $exists: false } },
        { estimatedDeliveryDate: null },
        { deliveryStatus: { $exists: false } },
        { deliveryStatus: null },
        { trackingNumber: { $exists: false } },
        { trackingNumber: null }
      ]
    });

    if (ordersToUpdate.length === 0) {
      console.log('All orders already have delivery information');
      return;
    }

    console.log(`Found ${ordersToUpdate.length} orders to update with delivery info`);

    for (let order of ordersToUpdate) {
      
      let estimatedDeliveryDate = order.estimatedDeliveryDate;
      if (!estimatedDeliveryDate) {
        estimatedDeliveryDate = new Date(order.orderDate);
        estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 14);
      }

      let deliveryStatus = order.deliveryStatus;
      if (!deliveryStatus) {
        const daysSinceOrder = Math.floor((Date.now() - order.orderDate) / (1000 * 60 * 60 * 24));
        if (daysSinceOrder < 1) {
          deliveryStatus = 'Processing';
        } else if (daysSinceOrder < 3) {
          deliveryStatus = 'Shipped';
        } else if (daysSinceOrder < 14) {
          deliveryStatus = 'Delivering';
        } else {
          deliveryStatus = 'Delivered';
        }
      }

      // Generate tracking number if missing
      let trackingNumber = order.trackingNumber;
      if (!trackingNumber) {
        trackingNumber = 'TRK' + Math.random().toString(36).substr(2, 9).toUpperCase();
      }

      // Update the order
      await Order.updateOne(
        { _id: order._id },
        {
          $set: {
            estimatedDeliveryDate: estimatedDeliveryDate,
            deliveryStatus: deliveryStatus,
            trackingNumber: trackingNumber
          }
        }
      );

      console.log(`✅ Updated order ${order._id.toString().slice(-8)} - Status: ${deliveryStatus}, Delivery: ${estimatedDeliveryDate.toDateString()}`);
    }

    console.log('🎉 All orders updated with delivery information!');
  } catch (error) {
    console.error('❌ Error updating orders:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

fixOrderDeliveryDates();