require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const dbURI = process.env.CONNECTION_STRING;

async function listProducts() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(dbURI, { dbName: 'App' });
        console.log('Connected to MongoDB\n');

        console.log('📋 Current products in database:');
        console.log('=' .repeat(60));

        const products = await Product.find({}, 'name description basePrice stockQuantity').lean();
        
        if (products.length === 0) {
            console.log('❌ No products found in database.');
        } else {
            products.forEach((product, index) => {
                console.log(`${index + 1}. ${product.name}`);
                console.log(`   Price: $${product.basePrice}`);
                console.log(`   Stock: ${product.stockQuantity} units`);
                console.log(`   Description: ${product.description ? product.description.substring(0, 80) + '...' : 'No description'}`);
                console.log(`   ID: ${product._id}`);
                console.log('-'.repeat(50));
            });
            
            console.log(`\n📊 Total products: ${products.length}`);
        }
        
    } catch (error) {
        console.error('❌ Database error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    }
}

listProducts();