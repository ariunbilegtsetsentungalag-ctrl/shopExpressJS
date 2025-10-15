const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const PromoCode = require('../models/PromoCode');
const Category = require('../models/Category');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../public/images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } 
});

exports.dashboard = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const recentProducts = await Product.find()
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      totalProducts,
      totalUsers,
      recentProducts
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    req.flash('error', 'Error loading dashboard');
    res.redirect('/shop');
  }
};

exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20; // Products per page
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';

    // Build search query
    let searchQuery = {};
    
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category && category !== 'all') {
      searchQuery.category = category;
    }

    const totalProducts = await Product.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalProducts / limit);

    const products = await Product.find(searchQuery)
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get unique categories for filter dropdown
    const categories = await Product.distinct('category');

    res.render('admin/products', {
      title: 'Manage Products',
      products,
      currentPage: page,
      totalPages,
      totalProducts,
      search,
      category,
      categories
    });
  } catch (error) {
    console.error('Products error:', error);
    req.flash('error', 'Error loading products');
    res.redirect('/admin');
  }
};


exports.getAddProduct = (req, res) => {
  res.render('admin/add-product', {
    title: 'Add New Product'
  });
};

exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      basePrice,
      category,
      sizes,
      colors,
      features,
      stockQuantity
    } = req.body;

    const images = req.files ? req.files.map(file => file.filename) : [];
    const mainImage = images.length > 0 ? images[0] : 'default.svg';

    let parsedSizes = [];
    if (sizes && typeof sizes === 'string') {
      try {
        parsedSizes = JSON.parse(sizes);
        console.log('Parsed sizes:', parsedSizes);
      } catch (e) {
        console.error('Error parsing sizes:', e);
        console.error('Raw sizes data:', sizes);
      }
    }

    let parsedColors = [];
    if (colors && typeof colors === 'string') {
      try {
        parsedColors = JSON.parse(colors);
        console.log('Parsed colors:', parsedColors);
      } catch (e) {
        console.error('Error parsing colors:', e);
        console.error('Raw colors data:', colors);
      }
    }


    let parsedFeatures = [];
    if (features) {
      if (typeof features === 'string') {
        parsedFeatures = features.split('\n').filter(f => f.trim());
      } else if (Array.isArray(features)) {
        parsedFeatures = features;
      }
    }

    const product = new Product({
      name,
      description,
      basePrice: parseFloat(basePrice),
      category,
      image: mainImage,
      images,
      sizes: parsedSizes,
      colors: parsedColors,
      features: parsedFeatures,
      stockQuantity: parseInt(stockQuantity) || 0,
      deliveryTime: parseInt(req.body.deliveryTime) || 14,
      inStock: parseInt(stockQuantity) > 0,
      createdBy: req.session.userId
    });

    await product.save();
    req.flash('success', 'Product created successfully!');
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Create product error:', error);
    req.flash('error', 'Error creating product');
    res.redirect('/admin/add-product');
  }
};


exports.getEditProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/admin/products');
    }

    res.render('admin/edit-product', {
      title: 'Edit Product',
      product
    });
  } catch (error) {
    console.error('Edit product error:', error);
    req.flash('error', 'Error loading product');
    res.redirect('/admin/products');
  }
};


exports.updateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      basePrice,
      category,
      sizes,
      colors,
      features,
      stockQuantity
    } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/admin/products');
    }


    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.filename);
      product.images = [...product.images, ...newImages];
      product.image = product.images[0];
    }

    product.name = name;
    product.description = description;
    product.basePrice = parseFloat(basePrice);
    product.category = category;
    product.stockQuantity = parseInt(stockQuantity) || 0;
    product.deliveryTime = parseInt(req.body.deliveryTime) || 14;
    product.inStock = parseInt(stockQuantity) > 0;


    if (sizes && typeof sizes === 'string') {
      try {
        product.sizes = JSON.parse(sizes);
      } catch (e) {
        console.error('Error parsing sizes:', e);
      }
    }


    if (colors && typeof colors === 'string') {
      try {
        product.colors = JSON.parse(colors);
      } catch (e) {
        console.error('Error parsing colors:', e);
      }
    }

    if (features) {
      if (typeof features === 'string') {
        product.features = features.split('\n').filter(f => f.trim());
      } else if (Array.isArray(features)) {
        product.features = features;
      }
    }

    await product.save();
    req.flash('success', 'Product updated successfully!');
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Update product error:', error);
    req.flash('error', 'Error updating product');
    res.redirect('/admin/products');
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/admin/products');
    }

    product.images.forEach(image => {
      const imagePath = path.join(__dirname, '../public/images', image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    });

    req.flash('success', 'Product deleted successfully!');
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Delete product error:', error);
    req.flash('error', 'Error deleting product');
    res.redirect('/admin/products');
  }
};


exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.render('admin/users', {
      title: 'Manage Users',
      users,
      userId: req.session.userId,
      currentPage: page,
      totalPages,
      totalUsers
    });
  } catch (error) {
    console.error('Users error:', error);
    req.flash('error', 'Error loading users');
    res.redirect('/admin');
  }
};


exports.updateUserRole = async (req, res) => {
  try {
    const { userId, role, permissions } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/admin/users');
    }

    user.role = role;
    user.permissions = permissions ? permissions.split(',').map(p => p.trim()) : [];
    
    await user.save();
    req.flash('success', 'User role updated successfully!');
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Update user role error:', error);
    req.flash('error', 'Error updating user role');
    res.redirect('/admin/users');
  }
};


exports.uploadProductImages = upload.array('images', 5);

exports.getIncomeAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth();
    
    const last30Days = new Date(now);
    last30Days.setDate(now.getDate() - 30);
    
    const dailyIncome = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: last30Days }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$orderDate" },
            month: { $month: "$orderDate" },
            day: { $dayOfMonth: "$orderDate" }
          },
          totalIncome: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
      }
    ]);

    // Monthly income for the current year
    const monthlyIncome = await Order.aggregate([
      {
        $match: {
          orderDate: {
            $gte: new Date(thisYear, 0, 1),
            $lt: new Date(thisYear + 1, 0, 1)
          }
        }
      },
      {
        $group: {
          _id: { $month: "$orderDate" },
          totalIncome: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { "_id": 1 }
      }
    ]);

    // Total statistics
    const totalStats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: "$totalAmount" }
        }
      }
    ]);

    // This month's stats
    const thisMonthStart = new Date(thisYear, thisMonth, 1);
    const thisMonthEnd = new Date(thisYear, thisMonth + 1, 1);
    
    const thisMonthStats = await Order.aggregate([
      {
        $match: {
          orderDate: {
            $gte: thisMonthStart,
            $lt: thisMonthEnd
          }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    // Top selling products by revenue
    const topProducts = await Order.aggregate([
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.productId",
          productName: { $first: "$products.name" },
          totalRevenue: { $sum: { $multiply: ["$products.price", "$products.quantity"] } },
          totalQuantity: { $sum: "$products.quantity" }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 }
    ]);

    res.render('admin/income-analytics', {
      title: 'Income Analytics',
      dailyIncome,
      monthlyIncome,
      totalStats: totalStats[0] || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 },
      thisMonthStats: thisMonthStats[0] || { totalRevenue: 0, totalOrders: 0 },
      topProducts
    });
  } catch (error) {
    console.error('Income analytics error:', error);
    req.flash('error', 'Error loading income analytics');
    res.redirect('/admin');
  }
};

// Promo Code Management Functions
exports.getPromoCodes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    
    const searchQuery = req.query.search ? {
      $or: [
        { code: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ]
    } : {};
    
    const promoCodes = await PromoCode.find(searchQuery)
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalPromoCodes = await PromoCode.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalPromoCodes / limit);
    
    const activePromoCodes = await PromoCode.countDocuments({ isActive: true });
    const expiredPromoCodes = await PromoCode.countDocuments({ 
      expiryDate: { $lt: new Date() } 
    });
    
    res.render('admin/promo-codes', {
      title: 'Manage Promo Codes',
      promoCodes,
      totalPromoCodes,
      activePromoCodes,
      expiredPromoCodes,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      nextPage: page + 1,
      prevPage: page - 1,
      searchQuery: req.query.search || ''
    });
  } catch (error) {
    console.error('Get promo codes error:', error);
    req.flash('error', 'Error loading promo codes');
    res.redirect('/admin');
  }
};

exports.getAddPromoCode = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.render('admin/add-promo-code', {
      title: 'Add New Promo Code',
      categories
    });
  } catch (error) {
    console.error('Get add promo code error:', error);
    req.flash('error', 'Error loading form');
    res.redirect('/admin/promo-codes');
  }
};

exports.createPromoCode = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minimumOrderAmount,
      maximumDiscountAmount,
      expiryDate,
      usageLimit,
      isActive,
      applicableCategories,
      excludedCategories
    } = req.body;
    
    // Check if promo code already exists
    const existingCode = await PromoCode.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      req.flash('error', 'Promo code already exists');
      return res.redirect('/admin/add-promo-code');
    }
    
    const promoCode = new PromoCode({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue: parseFloat(discountValue),
      minimumOrderAmount: parseFloat(minimumOrderAmount) || 0,
      maximumDiscountAmount: maximumDiscountAmount ? parseFloat(maximumDiscountAmount) : null,
      expiryDate: new Date(expiryDate),
      usageLimit: usageLimit ? parseInt(usageLimit) : null,
      isActive: isActive === 'on',
      applicableCategories: applicableCategories || [],
      excludedCategories: excludedCategories || [],
      createdBy: req.session.userId
    });
    
    await promoCode.save();
    req.flash('success', 'Promo code created successfully!');
    res.redirect('/admin/promo-codes');
  } catch (error) {
    console.error('Create promo code error:', error);
    req.flash('error', 'Error creating promo code: ' + error.message);
    res.redirect('/admin/add-promo-code');
  }
};

exports.getEditPromoCode = async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);
    if (!promoCode) {
      req.flash('error', 'Promo code not found');
      return res.redirect('/admin/promo-codes');
    }
    
    const categories = await Category.find().sort({ name: 1 });
    res.render('admin/edit-promo-code', {
      title: 'Edit Promo Code',
      promoCode,
      categories
    });
  } catch (error) {
    console.error('Get edit promo code error:', error);
    req.flash('error', 'Error loading promo code');
    res.redirect('/admin/promo-codes');
  }
};

exports.updatePromoCode = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minimumOrderAmount,
      maximumDiscountAmount,
      expiryDate,
      usageLimit,
      isActive,
      applicableCategories,
      excludedCategories
    } = req.body;
    
    const promoCode = await PromoCode.findById(req.params.id);
    if (!promoCode) {
      req.flash('error', 'Promo code not found');
      return res.redirect('/admin/promo-codes');
    }
    
    // Check if code is being changed and if new code already exists
    if (code.toUpperCase() !== promoCode.code) {
      const existingCode = await PromoCode.findOne({ 
        code: code.toUpperCase(),
        _id: { $ne: promoCode._id }
      });
      if (existingCode) {
        req.flash('error', 'Promo code already exists');
        return res.redirect(`/admin/promo-codes/edit/${promoCode._id}`);
      }
    }
    
    promoCode.code = code.toUpperCase();
    promoCode.description = description;
    promoCode.discountType = discountType;
    promoCode.discountValue = parseFloat(discountValue);
    promoCode.minimumOrderAmount = parseFloat(minimumOrderAmount) || 0;
    promoCode.maximumDiscountAmount = maximumDiscountAmount ? parseFloat(maximumDiscountAmount) : null;
    promoCode.expiryDate = new Date(expiryDate);
    promoCode.usageLimit = usageLimit ? parseInt(usageLimit) : null;
    promoCode.isActive = isActive === 'on';
    promoCode.applicableCategories = applicableCategories || [];
    promoCode.excludedCategories = excludedCategories || [];
    
    await promoCode.save();
    req.flash('success', 'Promo code updated successfully!');
    res.redirect('/admin/promo-codes');
  } catch (error) {
    console.error('Update promo code error:', error);
    req.flash('error', 'Error updating promo code: ' + error.message);
    res.redirect(`/admin/promo-codes/edit/${req.params.id}`);
  }
};

exports.deletePromoCode = async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);
    if (!promoCode) {
      req.flash('error', 'Promo code not found');
      return res.redirect('/admin/promo-codes');
    }
    
    await PromoCode.findByIdAndDelete(req.params.id);
    req.flash('success', 'Promo code deleted successfully!');
    res.redirect('/admin/promo-codes');
  } catch (error) {
    console.error('Delete promo code error:', error);
    req.flash('error', 'Error deleting promo code');
    res.redirect('/admin/promo-codes');
  }
};

exports.togglePromoCodeStatus = async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);
    if (!promoCode) {
      return res.status(404).json({ success: false, message: 'Promo code not found' });
    }
    
    promoCode.isActive = !promoCode.isActive;
    await promoCode.save();
    
    res.json({ 
      success: true, 
      message: `Promo code ${promoCode.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: promoCode.isActive 
    });
  } catch (error) {
    console.error('Toggle promo code status error:', error);
    res.status(500).json({ success: false, message: 'Error updating promo code status' });
  }
};

module.exports = exports;