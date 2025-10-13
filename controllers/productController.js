
const Product = require('../models/Product');
const Category = require('../models/Category');

exports.home = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ inStock: -1, stockQuantity: -1 }).limit(8).lean();
    res.render('home', { products: products, title: 'Home' });
  } catch (error) {
    console.error('Home page error:', error);
    res.render('home', { products: [], title: 'Home' });
  }
}

exports.viewProducts = async (req, res) => {
  try {
    const { q, category, page = 1 } = req.query;
    const limit = 12; // Products per page
    const skip = (parseInt(page) - 1) * limit;
    const filter = {};

    // Category filter
    if (category && category.trim() && category !== 'All') {
      filter.category = category.trim();
    }

    let query;
    if (q && q.trim()) {
      const searchTerm = q.trim().substring(0, 100);
      const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query = Product.find({
        $and: [
          filter,
          { name: regex }
        ]
      });
    } else {
      query = Product.find(filter);
    }

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(query.getFilter());
    const totalPages = Math.ceil(totalProducts / limit);

    // Get paginated products
    const products = await query
      .sort({ inStock: -1, stockQuantity: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get categories from database
    const availableCategories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
    const categoryNames = availableCategories.map(cat => cat.name);

    res.render('shop', {
      products,
      title: 'Shop',
      currentSearch: q || '',
      currentCategory: category || 'All',
      availableCategories: categoryNames,
      currentPage: parseInt(page),
      totalPages,
      hasMore: parseInt(page) < totalPages
    });
  } catch (error) {
    console.error('Shop page error:', error);
    res.render('shop', {
      products: [],
      title: 'Shop',
      currentSearch: '',
      currentCategory: 'All',
      availableCategories: [],
      currentPage: 1,
      totalPages: 1,
      hasMore: false
    });
  }
}

exports.viewProduct = async (req, res) => {
  try {
    let product;
    const id = req.params.id;
    
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id).lean();
    } else {
      product = await Product.findOne({ productId: id }).lean();
    }
    
    if (!product) {
      return res.status(404).render('404', { title: '404 - Product Not Found' });
    }
    
    res.render('single-product', { product: product, title: product.name });
  } catch (error) {
    console.error('Product view error:', error);
    res.status(404).render('404', { title: '404 - Product Not Found' });
  }
}


exports.searchProducts = async (req, res) => {
  try {
    const { q, category, page = 1, limit = 12 } = req.query;
    const filter = {};
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Add category filter if specified
    if (category && category.trim() && category !== 'All') {
      filter.category = category.trim();
    }

    let query;

    if (q && q.trim()) {
      const searchTerm = q.trim().substring(0, 100);
      const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query = Product.find({
        $and: [
          filter,
          { name: regex }
        ]
      }, {
        name: 1,
        description: 1,
        basePrice: 1,
        price: 1,
        category: 1,
        image: 1,
        stockQuantity: 1,
        inStock: 1,
        deliveryTime: 1
      });
    } else {
      query = Product.find(filter, {
        name: 1,
        description: 1,
        basePrice: 1,
        price: 1,
        category: 1,
        image: 1,
        stockQuantity: 1,
        inStock: 1,
        deliveryTime: 1
      });
    }

    // Get total count
    const totalProducts = await Product.countDocuments(query.getFilter());

    // Get paginated products
    const products = await query
      .sort({ inStock: -1, stockQuantity: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean()
      .exec();

    // Get available categories from database
    const availableCategories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
    const categoryNames = availableCategories.map(cat => cat.name);

    // Set cache headers for better performance
    res.set({
      'Cache-Control': 'public, max-age=30',
      'ETag': `"${products.length}-${page}"`
    });

    res.json({
      products,
      availableCategories: categoryNames,
      success: true,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalProducts / parseInt(limit)),
      totalProducts,
      hasMore: skip + products.length < totalProducts
    });
  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({
      products: [],
      availableCategories: [],
      success: false,
      error: 'Search failed',
      currentPage: 1,
      totalPages: 0,
      hasMore: false
    });
  }
}

exports.getProductById = async (productId) => {
  try {
    return await Product.findById(productId).lean();
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}