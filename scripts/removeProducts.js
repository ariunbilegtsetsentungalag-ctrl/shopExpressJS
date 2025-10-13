const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

// List of products to remove
const productsToRemove = [
    'Hooded Sweatshirt',
    'Wool Scarf',
    'Leather Belt',
    'Jump Rope',
    'Scented Candle Set',
    'Designer Handbag',
    'Sports Water Bottle',
    'Wireless Mouse',
    'Portable Umbrella',
    'Throw Blanket',
    'Ceramic Coffee Mug Set',
    'USB-C Power Bank'
];

async function removeProducts() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.CONNECTION_STRING, {
            dbName: 'App'
        });
        console.log('Connected to MongoDB...');

        console.log('Products to remove:', productsToRemove);
        console.log('Starting product removal...\n');

        let removedCount = 0;
        let notFoundCount = 0;

        for (const productName of productsToRemove) {
            try {
                const result = await Product.findOneAndDelete({ 
                    name: { $regex: new RegExp('^' + productName + '$', 'i') }
                });
                
                if (result) {
                    console.log(`✅ Removed: "${productName}" (ID: ${result._id})`);
                    removedCount++;
                } else {
                    console.log(`❌ Not found: "${productName}"`);
                    notFoundCount++;
                }
            } catch (error) {
                console.error(`❌ Error removing "${productName}":`, error.message);
                notFoundCount++;
            }
        }

        console.log('\n📊 Summary:');
        console.log(`✅ Successfully removed: ${removedCount} products`);
        console.log(`❌ Not found/errors: ${notFoundCount} products`);
        console.log(`📦 Total processed: ${productsToRemove.length} products`);

        // Verify remaining products
        const remainingProducts = await Product.find().select('name').lean();
        console.log(`\n📋 Remaining products in database: ${remainingProducts.length}`);
        
        if (remainingProducts.length > 0 && remainingProducts.length <= 10) {
            console.log('Remaining products:');
            remainingProducts.forEach(product => {
                console.log(`- ${product.name}`);
            });
        }

    } catch (error) {
        console.error('❌ Script error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    }
}

// Run the script
removeProducts().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});