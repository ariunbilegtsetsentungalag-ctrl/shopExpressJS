require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');

const dbURI = process.env.CONNECTION_STRING;

// Comprehensive product data - images will be auto-assigned from existing SVGs
const productData = {
  'Clothing': [
    { name: 'Classic White T-Shirt', description: 'Premium cotton blend white t-shirt with comfortable fit', basePrice: 24.99 },
    { name: 'Denim Jacket', description: 'Vintage-style denim jacket with button closure and chest pockets', basePrice: 89.99 },
    { name: 'Cotton Hoodie', description: 'Soft cotton hoodie with drawstring hood and kangaroo pocket', basePrice: 54.99 },
    { name: 'Polo Shirt Navy', description: 'Classic navy polo shirt with collar and three-button placket', basePrice: 39.99 },
    { name: 'Striped Long Sleeve', description: 'Comfortable striped long sleeve shirt in multiple colors', basePrice: 32.99 },
    { name: 'Chino Pants', description: 'Slim-fit chino pants in khaki with belt loops and side pockets', basePrice: 49.99 },
    { name: 'Graphic Tee', description: 'Trendy graphic t-shirt with unique artwork design', basePrice: 27.99 },
    { name: 'Cardigan Sweater', description: 'Cozy knit cardigan sweater with button front closure', basePrice: 64.99 },
    { name: 'Summer Dress', description: 'Flowy summer dress with floral print and adjustable straps', basePrice: 45.99 },
    { name: 'Business Shirt', description: 'Professional button-down shirt perfect for office wear', basePrice: 42.99 },
    { name: 'Yoga Pants', description: 'Stretchy yoga pants with high waist and moisture-wicking fabric', basePrice: 38.99 },
    { name: 'Flannel Shirt', description: 'Warm flannel shirt in checkered pattern with button cuffs', basePrice: 47.99 },
    { name: 'Tank Top', description: 'Breathable tank top perfect for workouts or casual wear', basePrice: 19.99 },
    { name: 'Maxi Skirt', description: 'Elegant maxi skirt with elastic waistband and flowing design', basePrice: 41.99 },
    { name: 'Bomber Jacket', description: 'Stylish bomber jacket with ribbed cuffs and zipper closure', basePrice: 72.99 },
    { name: 'Leggings Set', description: 'Matching leggings and sports bra set for active lifestyle', basePrice: 56.99 },
    { name: 'Blazer Black', description: 'Professional black blazer with tailored fit and lapel collar', basePrice: 94.99 },
    { name: 'Shorts Denim', description: 'Classic denim shorts with distressed details and frayed hem', basePrice: 34.99 },
    { name: 'Turtleneck Sweater', description: 'Warm turtleneck sweater in soft wool blend material', basePrice: 59.99 },
    { name: 'Sundress Floral', description: 'Light and airy sundress with beautiful floral pattern', basePrice: 43.99 }
  ],
  'Shoes': [
    { name: 'Running Sneakers', description: 'Lightweight running shoes with breathable mesh upper and cushioned sole', basePrice: 89.99 },
    { name: 'Leather Boots', description: 'Genuine leather boots with lace-up design and durable rubber sole', basePrice: 124.99 },
    { name: 'Canvas Sneakers', description: 'Classic canvas sneakers in white with rubber toe cap', basePrice: 54.99 },
    { name: 'High Heels Black', description: 'Elegant black high heels perfect for formal occasions', basePrice: 79.99 },
    { name: 'Hiking Boots', description: 'Waterproof hiking boots with ankle support and grip sole', basePrice: 149.99 },
    { name: 'Ballet Flats', description: 'Comfortable ballet flats in nude color with soft insole', basePrice: 45.99 },
    { name: 'Basketball Shoes', description: 'High-top basketball shoes with air cushioning technology', basePrice: 119.99 },
    { name: 'Sandals Summer', description: 'Comfortable summer sandals with adjustable straps', basePrice: 32.99 },
    { name: 'Oxford Shoes', description: 'Classic oxford dress shoes in brown leather with lace closure', basePrice: 98.99 },
    { name: 'Slip-on Loafers', description: 'Casual slip-on loafers in navy suede with penny strap', basePrice: 67.99 },
    { name: 'Athletic Trainers', description: 'Cross-training shoes with lateral support and flexible sole', basePrice: 84.99 },
    { name: 'Ankle Boots', description: 'Stylish ankle boots with side zipper and block heel', basePrice: 92.99 },
    { name: 'Flip Flops', description: 'Comfortable flip flops with cushioned footbed and toe post', basePrice: 18.99 },
    { name: 'Work Boots Steel', description: 'Safety work boots with steel toe and slip-resistant sole', basePrice: 134.99 },
    { name: 'Espadrilles', description: 'Summer espadrilles with canvas upper and rope sole', basePrice: 48.99 },
    { name: 'Chelsea Boots', description: 'Classic chelsea boots with elastic side panels', basePrice: 108.99 },
    { name: 'Water Shoes', description: 'Quick-dry water shoes perfect for beach and pool activities', basePrice: 28.99 },
    { name: 'Dress Pumps', description: 'Professional dress pumps with pointed toe and mid heel', basePrice: 73.99 },
    { name: 'Skateboard Shoes', description: 'Durable skateboard shoes with reinforced ollie area', basePrice: 61.99 },
    { name: 'Winter Boots', description: 'Insulated winter boots with waterproof exterior and warm lining', basePrice: 142.99 }
  ],
  'Accessories': [
    { name: 'Leather Wallet', description: 'Genuine leather bifold wallet with multiple card slots', basePrice: 34.99 },
    { name: 'Silver Watch', description: 'Elegant silver watch with stainless steel band and date display', basePrice: 149.99 },
    { name: 'Designer Sunglasses', description: 'UV protection sunglasses with polarized lenses', basePrice: 89.99 },
    { name: 'Leather Belt', description: 'Classic leather belt with metal buckle in brown color', basePrice: 28.99 },
    { name: 'Baseball Cap', description: 'Adjustable baseball cap with embroidered logo', basePrice: 19.99 },
    { name: 'Silk Scarf', description: 'Luxurious silk scarf with abstract pattern in multiple colors', basePrice: 45.99 },
    { name: 'Crossbody Bag', description: 'Stylish crossbody bag with adjustable strap and zipper closure', basePrice: 67.99 },
    { name: 'Gold Necklace', description: '18k gold plated necklace with pendant charm', basePrice: 54.99 },
    { name: 'Wool Beanie', description: 'Warm wool beanie hat perfect for cold weather', basePrice: 22.99 },
    { name: 'Pearl Earrings', description: 'Classic pearl stud earrings with sterling silver posts', basePrice: 39.99 },
    { name: 'Phone Case', description: 'Protective phone case with shock absorption and clear design', basePrice: 15.99 },
    { name: 'Messenger Bag', description: 'Professional messenger bag with laptop compartment', basePrice: 78.99 },
    { name: 'Hair Accessories', description: 'Set of hair clips and headbands in assorted colors', basePrice: 12.99 },
    { name: 'Cufflinks Silver', description: 'Elegant silver cufflinks with geometric design', basePrice: 42.99 },
    { name: 'Travel Backpack', description: 'Durable travel backpack with multiple compartments', basePrice: 94.99 },
    { name: 'Reading Glasses', description: 'Stylish reading glasses with anti-blue light lenses', basePrice: 32.99 },
    { name: 'Key Chain', description: 'Leather keychain with metal ring and brand logo', basePrice: 8.99 },
    { name: 'Pocket Watch', description: 'Vintage-style pocket watch with chain and Roman numerals', basePrice: 87.99 },
    { name: 'Umbrella Compact', description: 'Compact folding umbrella with automatic open/close', basePrice: 24.99 },
    { name: 'Jewelry Box', description: 'Elegant jewelry box with velvet lining and multiple compartments', basePrice: 56.99 }
  ],
  'Home & Living': [
    { name: 'Throw Pillow Set', description: 'Set of 2 decorative throw pillows with removable covers', basePrice: 29.99 },
    { name: 'Essential Oil Diffuser', description: 'Ultrasonic aromatherapy diffuser with LED lights', basePrice: 45.99 },
    { name: 'Coffee Mug Set', description: 'Set of 4 ceramic coffee mugs in different colors', basePrice: 24.99 },
    { name: 'Wall Art Canvas', description: 'Modern abstract canvas wall art for home decoration', basePrice: 67.99 },
    { name: 'Bamboo Cutting Board', description: 'Eco-friendly bamboo cutting board with juice groove', basePrice: 19.99 },
    { name: 'LED Table Lamp', description: 'Adjustable LED desk lamp with touch control and USB port', basePrice: 38.99 },
    { name: 'Storage Basket', description: 'Woven storage basket perfect for organizing home items', basePrice: 22.99 },
    { name: 'Candle Gift Set', description: 'Set of 3 scented candles in glass jars with gift box', basePrice: 34.99 },
    { name: 'Area Rug', description: 'Soft area rug with geometric pattern for living room', basePrice: 89.99 },
    { name: 'Wall Mirror', description: 'Round wall mirror with metal frame in gold finish', basePrice: 54.99 },
    { name: 'Plant Pot Set', description: 'Set of 3 ceramic plant pots with drainage holes', basePrice: 27.99 },
    { name: 'Cookbook Stand', description: 'Adjustable bamboo cookbook stand for kitchen counter', basePrice: 16.99 },
    { name: 'Bedside Organizer', description: 'Fabric bedside organizer with multiple pockets', basePrice: 18.99 },
    { name: 'Wine Glass Set', description: 'Set of 4 elegant wine glasses for entertaining', basePrice: 32.99 },
    { name: 'Shower Curtain', description: 'Waterproof shower curtain with decorative pattern', basePrice: 21.99 },
    { name: 'Floor Cushion', description: 'Large floor cushion perfect for meditation or seating', basePrice: 43.99 },
    { name: 'Kitchen Timer', description: 'Digital kitchen timer with magnetic back and loud alarm', basePrice: 12.99 },
    { name: 'Photo Frame Set', description: 'Set of 5 photo frames in different sizes with matting', basePrice: 31.99 },
    { name: 'Desk Organizer', description: 'Wooden desk organizer with compartments for office supplies', basePrice: 25.99 },
    { name: 'Throw Blanket', description: 'Soft fleece throw blanket perfect for couch or bed', basePrice: 36.99 }
  ],
  'Electronics': [
    { name: 'Wireless Earbuds', description: 'True wireless earbuds with noise cancellation and charging case', basePrice: 129.99 },
    { name: 'Smartphone Case', description: 'Protective smartphone case with card holder and stand', basePrice: 24.99 },
    { name: 'Portable Charger', description: '10000mAh portable power bank with fast charging capability', basePrice: 34.99 },
    { name: 'Bluetooth Speaker', description: 'Waterproof Bluetooth speaker with 360-degree sound', basePrice: 79.99 },
    { name: 'Fitness Tracker', description: 'Smart fitness tracker with heart rate monitor and GPS', basePrice: 89.99 },
    { name: 'Webcam HD', description: 'Full HD webcam with auto-focus and built-in microphone', basePrice: 54.99 },
    { name: 'Gaming Mouse', description: 'Ergonomic gaming mouse with RGB lighting and programmable buttons', basePrice: 42.99 },
    { name: 'USB-C Hub', description: 'Multi-port USB-C hub with HDMI, USB 3.0, and SD card reader', basePrice: 67.99 },
    { name: 'Wireless Charger', description: 'Fast wireless charging pad compatible with all Qi devices', basePrice: 28.99 },
    { name: 'Smart Watch', description: 'Feature-rich smartwatch with health monitoring and notifications', basePrice: 199.99 },
    { name: 'Phone Stand', description: 'Adjustable phone stand for desk with cable management', basePrice: 15.99 },
    { name: 'Car Mount', description: 'Magnetic car mount for smartphones with 360-degree rotation', basePrice: 19.99 },
    { name: 'Screen Protector', description: 'Tempered glass screen protector with easy installation kit', basePrice: 12.99 },
    { name: 'Laptop Stand', description: 'Aluminum laptop stand with heat dissipation and ergonomic design', basePrice: 45.99 },
    { name: 'Cable Organizer', description: 'Cable management system with adhesive clips and ties', basePrice: 9.99 },
    { name: 'Ring Light', description: 'LED ring light for photography and video calls with tripod', basePrice: 38.99 },
    { name: 'Memory Card', description: 'High-speed microSD card 64GB with adapter', basePrice: 22.99 },
    { name: 'Keyboard Wireless', description: 'Compact wireless keyboard with long battery life', basePrice: 49.99 },
    { name: 'Tablet Stylus', description: 'Precision stylus pen for tablets with palm rejection', basePrice: 31.99 },
    { name: 'Smart Plug', description: 'WiFi smart plug with voice control and scheduling features', basePrice: 16.99 }
  ],
  'Sports': [
    { name: 'Yoga Mat', description: 'Non-slip yoga mat with extra thickness for comfort', basePrice: 34.99 },
    { name: 'Resistance Bands', description: 'Set of 5 resistance bands with different tension levels', basePrice: 19.99 },
    { name: 'Water Bottle', description: 'Insulated stainless steel water bottle keeps drinks cold 24h', basePrice: 24.99 },
    { name: 'Foam Roller', description: 'High-density foam roller for muscle recovery and massage', basePrice: 28.99 },
    { name: 'Boxing Gloves', description: 'Professional boxing gloves with wrist support and ventilation', basePrice: 49.99 },
    { name: 'Jump Rope', description: 'Adjustable jump rope with ball bearing system for smooth rotation', basePrice: 14.99 },
    { name: 'Gym Bag', description: 'Spacious gym duffel bag with shoe compartment and water bottle holder', basePrice: 39.99 },
    { name: 'Tennis Racket', description: 'Lightweight tennis racket with graphite composite frame', basePrice: 89.99 },
    { name: 'Workout Gloves', description: 'Breathable workout gloves with wrist support and grip padding', basePrice: 18.99 },
    { name: 'Protein Shaker', description: 'BPA-free protein shaker bottle with mixing ball and measurements', basePrice: 12.99 },
    { name: 'Basketball', description: 'Official size basketball with deep channel design', basePrice: 32.99 },
    { name: 'Swimming Goggles', description: 'Anti-fog swimming goggles with UV protection and adjustable strap', basePrice: 16.99 },
    { name: 'Dumbbell Set', description: 'Adjustable dumbbell set with multiple weight plates', basePrice: 124.99 },
    { name: 'Yoga Block', description: 'High-density foam yoga block for support and alignment', basePrice: 11.99 },
    { name: 'Running Belt', description: 'Lightweight running belt with expandable pockets for phone and keys', basePrice: 21.99 },
    { name: 'Soccer Ball', description: 'FIFA-approved soccer ball with durable synthetic leather', basePrice: 27.99 },
    { name: 'Knee Brace', description: 'Compression knee brace with adjustable straps for support', basePrice: 23.99 },
    { name: 'Exercise Bike', description: 'Compact stationary exercise bike with LCD display and resistance levels', basePrice: 199.99 },
    { name: 'Golf Balls', description: 'Set of 12 professional golf balls with dimple pattern', basePrice: 29.99 },
    { name: 'Workout Towel', description: 'Quick-dry microfiber workout towel with corner zip pocket', basePrice: 13.99 }
  ],
  'Other': [
    { name: 'Gift Card $25', description: 'Digital gift card for online shopping, perfect for any occasion', basePrice: 25.00 },
    { name: 'Gift Card $50', description: 'Digital gift card for online shopping with flexible redemption', basePrice: 50.00 },
    { name: 'Mystery Box Small', description: 'Surprise mystery box with assorted items worth $30+', basePrice: 19.99 },
    { name: 'Mystery Box Large', description: 'Premium mystery box with high-value items worth $80+', basePrice: 49.99 },
    { name: 'Sample Pack', description: 'Sample pack with miniature versions of popular products', basePrice: 9.99 },
    { name: 'Subscription Box', description: 'Monthly subscription box with curated lifestyle products', basePrice: 34.99 },
    { name: 'Digital Download', description: 'Exclusive digital content pack with guides and templates', basePrice: 14.99 },
    { name: 'Starter Kit', description: 'Complete starter kit with essential items for beginners', basePrice: 42.99 },
    { name: 'Limited Edition', description: 'Limited edition collectible item with certificate of authenticity', basePrice: 149.99 },
    { name: 'Bundle Deal', description: 'Special bundle deal combining multiple popular products', basePrice: 89.99 },
    { name: 'Clearance Item A', description: 'Clearance item from previous season at discounted price', basePrice: 15.99 },
    { name: 'Clearance Item B', description: 'Final sale clearance item with limited quantities available', basePrice: 12.99 },
    { name: 'Refurbished Good', description: 'Certified refurbished item with warranty and quality guarantee', basePrice: 67.99 },
    { name: 'Vintage Find', description: 'Unique vintage item with historical significance and character', basePrice: 78.99 },
    { name: 'Handmade Craft', description: 'Artisan handmade craft item with unique design elements', basePrice: 45.99 },
    { name: 'Custom Order', description: 'Personalized custom order item made to your specifications', basePrice: 124.99 },
    { name: 'Seasonal Special', description: 'Special seasonal item available for limited time only', basePrice: 32.99 },
    { name: 'New Arrival', description: 'Brand new arrival featuring latest design and technology', basePrice: 87.99 },
    { name: 'Best Seller', description: 'Customer favorite best-selling item with top ratings', basePrice: 56.99 },
    { name: 'Premium Quality', description: 'Premium quality item with superior materials and craftsmanship', basePrice: 134.99 }
  ]
};

async function seedProducts() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(dbURI, { dbName: 'App' });
    console.log('Connected successfully!');

    // Find the first admin user to assign as product creator
    const adminUser = await User.findOne({ role: { $in: ['admin', 'product_manager'] } });
    if (!adminUser) {
      console.error('No admin or product manager user found. Please create one first.');
      process.exit(1);
    }

    console.log(`Using user ${adminUser.username} as product creator`);

    // Clear existing products
    console.log('Clearing existing products...');
    await Product.deleteMany({});

    let totalProducts = 0;
    const categories = Object.keys(productData);

    for (const category of categories) {
      console.log(`\nSeeding ${category} category...`);
      const categoryProducts = productData[category];

      for (let i = 0; i < categoryProducts.length; i++) {
        const productInfo = categoryProducts[i];
        
        // Generate varied stock quantities
        const stockQuantity = Math.floor(Math.random() * 150) + 10; // 10-160 items
        const inStock = stockQuantity > 0;
        
        // Add some size variations for clothing and shoes
        let sizes = [];
        if (category === 'Clothing') {
          sizes = [
            { name: 'XS', price: productInfo.basePrice },
            { name: 'S', price: productInfo.basePrice },
            { name: 'M', price: productInfo.basePrice },
            { name: 'L', price: productInfo.basePrice + 2 },
            { name: 'XL', price: productInfo.basePrice + 4 },
            { name: 'XXL', price: productInfo.basePrice + 6 }
          ];
        } else if (category === 'Shoes') {
          sizes = [];
          for (let size = 6; size <= 12; size += 0.5) {
            sizes.push({ 
              name: size.toString(), 
              price: productInfo.basePrice + (size > 10 ? 5 : 0) 
            });
          }
        }

        // Add color variations for some categories
        let colors = [];
        if (['Clothing', 'Shoes', 'Accessories'].includes(category)) {
          const colorOptions = [
            { name: 'Black', code: '#000000' },
            { name: 'White', code: '#FFFFFF' },
            { name: 'Navy', code: '#001f3f' },
            { name: 'Gray', code: '#808080' },
            { name: 'Brown', code: '#8B4513' }
          ];
          // Randomly assign 2-4 colors
          const numColors = Math.floor(Math.random() * 3) + 2;
          colors = colorOptions.slice(0, numColors);
        }

        // Create product features
        const features = [
          'High quality materials',
          'Durable construction',
          'Comfortable fit',
          'Easy to clean',
          'Versatile design'
        ].slice(0, Math.floor(Math.random() * 3) + 2);

        // Cycle through available SVG images
        const svgImages = ['product1.svg', 'product2.svg', 'product3.svg', 'product4.svg'];
        const mainImage = svgImages[i % 4];
        
        const product = new Product({
          name: productInfo.name,
          description: productInfo.description,
          basePrice: productInfo.basePrice,
          category: category,
          image: mainImage,
          images: [mainImage, ...svgImages.filter(img => img !== mainImage).slice(0, 2)], // Add variety
          sizes: sizes,
          colors: colors,
          features: features,
          inStock: inStock,
          stockQuantity: stockQuantity,
          createdBy: adminUser._id
        });

        await product.save();
        totalProducts++;
        
        // Show progress
        if (totalProducts % 10 === 0) {
          console.log(`Created ${totalProducts} products so far...`);
        }
      }
      
      console.log(`✓ Created ${categoryProducts.length} products for ${category}`);
    }

    console.log(`\n🎉 Successfully seeded ${totalProducts} products across ${categories.length} categories!`);
    console.log('\nProducts per category:');
    for (const category of categories) {
      console.log(`  ${category}: ${productData[category].length} products`);
    }

  } catch (error) {
    console.error('Error seeding products:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the seeder
if (require.main === module) {
  seedProducts();
}

module.exports = seedProducts;