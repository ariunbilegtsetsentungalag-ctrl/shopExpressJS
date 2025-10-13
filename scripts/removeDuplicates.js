require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const dbURI = process.env.CONNECTION_STRING;

// Remove duplicate products and the test product
const productsToRemoveByName = [
    'Classic Cotton T-Shirt', // Keep only one
    'Slim Fit Jeans',         // Keep only one 
    'Denim Jacket',           // Keep only one
    'Running Sneakers',       // Keep only one
    'Leather Boots',          // Keep only one
    'Canvas Casual Shoes',    // Keep only one
    'High Heels',             // Keep only one
    'Designer Sunglasses',    // Keep only one
    'Memory Foam Pillow',     // Keep only one
    'Wall Art Canvas',        // Keep only one
    'Wireless Headphones',    // Keep only one
    'Smart Watch',            // Keep only one
    'Portable Bluetooth Speaker', // Keep only one
    'Yoga Mat',               // Keep only one
    'Resistance Bands Set',   // Keep only one
    'Adjustable Dumbbells',   // Keep only one
    'Reusable Shopping Bags', // Keep only one
    'Travel Luggage Tag',     // Keep only one
    'Phone Stand',            // Keep only one
    'Desk Organizer',         // Keep only one
    'Luxury Wal5'             // Remove test product
];

async function removeDuplicateProducts() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(dbURI, { dbName: 'App' });
        console.log('Connected to MongoDB\n');

        console.log('🔍 Finding duplicate products...');
        
        for (const productName of productsToRemoveByName) {
            // Find all products with this name
            const products = await Product.find({ name: productName }).sort({ createdAt: 1 });
            
            if (products.length > 1) {
                // Keep the first one, remove the rest
                console.log(`📦 Found ${products.length} copies of "${productName}"`);
                
                for (let i = 1; i < products.length; i++) {
                    await Product.findByIdAndDelete(products[i]._id);
                    console.log(`   ✅ Removed duplicate #${i} (ID: ${products[i]._id})`);
                }
            } else if (products.length === 1 && productName === 'Luxury Wal5') {
                // Remove the test product entirely
                await Product.findByIdAndDelete(products[0]._id);
                console.log(`   ✅ Removed test product "${productName}" (ID: ${products[0]._id})`);
            } else if (products.length === 0) {
                console.log(`   ❌ No products found with name "${productName}"`);
            } else {
                console.log(`   ℹ️  Only one "${productName}" found - keeping it`);
            }
        }

        // Show final count
        const remainingCount = await Product.countDocuments();
        console.log(`\n📊 Total products remaining: ${remainingCount}`);
        
    } catch (error) {
        console.error('❌ Database error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    }
}

removeDuplicateProducts();