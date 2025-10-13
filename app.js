require('dotenv').config();
const express = require('express')
const session = require('express-session')
const flash = require('connect-flash')
const cookieParser = require('cookie-parser')
const path = require('path')
const mongoose = require('mongoose')
const MongoStore = require('connect-mongo')
const helmet = require('helmet')
const compression = require('compression')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const mongoSanitize = require('express-mongo-sanitize')
const authController = require('./controllers/authController')
const productController = require('./controllers/productController')
const cartController = require('./controllers/cartController')
const adminController = require('./controllers/adminController')
const adminCategoryController = require('./controllers/adminCategoryController')
const userController = require('./controllers/userController')
const { isAuthenticated, requireCompleteProfile } = require('./middleware/auth')
const { isAdminOrProductManager, isAdmin } = require('./middleware/adminAuth')
const i18n = require('i18n')


const dbURI = process.env.CONNECTION_STRING;
mongoose.connect(dbURI, {
  dbName: 'App'  
})
  .then(() => console.log('Connected to MongoDB Atlas...'))
  .catch(err => console.error('Could not connect to MongoDB:', err))

const app = express()

// Security & performance middleware
app.set('trust proxy', 1)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"]
        }
    }
}))
app.use(compression())
app.use(mongoSanitize())
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// Basic rate limit (adjust as needed)
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 })
app.use(limiter)

app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(cookieParser()) // Add cookie parser middleware
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')))

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-super-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: dbURI,
    dbName: 'App',
    ttl: 24 * 60 * 60
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, 
    sameSite: 'lax'
  }
}))

app.use(flash())

// i18n configuration
i18n.configure({
  locales: ['en', 'mn'],
  directory: path.join(__dirname, 'locales'),
  defaultLocale: 'en',
  cookie: 'lang',
  queryParameter: false, // Disable query parameters to prevent routing conflicts
  autoReload: true,
  updateFiles: false,
  objectNotation: false,
  api: {
    '__': '__',
    '__n': '__n'
  }
})

// i18n middleware
app.use(i18n.init)

// Custom middleware to ensure locale is set from cookie
app.use((req, res, next) => {
  // Check if there's a lang cookie and set the locale accordingly
  if (req.cookies && req.cookies.lang && ['en', 'mn'].includes(req.cookies.lang)) {
    req.setLocale(req.cookies.lang);
  }
  next();
});

app.use((req, res, next) => {

  res.locals.userId = req.session.userId;
  res.locals.username = req.session.username;
  res.locals.user = req.session.user;
  

  res.locals.success = req.flash('success') || [];
  res.locals.error = req.flash('error') || [];
  
  // Make i18n functions available in all views
  res.locals.__ = res.__;
  res.locals.__n = res.__n;
  res.locals.getLocale = () => req.getLocale();
  res.locals.currentLocale = req.getLocale();
  
  next();
});


// Language switching route
app.get('/lang/:locale', (req, res) => {
  console.log('Language switch request received:', req.params.locale);
  const locale = req.params.locale;
  if (['en', 'mn'].includes(locale)) {
    console.log('Setting locale to:', locale);
    // Set the cookie with proper configuration
    res.cookie('lang', locale, { 
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/' // Ensure cookie is available site-wide
    });
    // Set the locale for the current request
    req.setLocale(locale);
    console.log('Locale set to:', req.getLocale());
    console.log('Cookie will be set to:', locale);
  } else {
    console.log('Invalid locale requested:', locale);
  }
  const redirectUrl = req.get('Referer') || '/shop';
  console.log('Redirecting to:', redirectUrl);
  res.redirect(redirectUrl);
});

app.get('/login', authController.getLogin);
app.post('/login', authController.postLogin);
app.get('/signup', authController.getSignup);
app.post('/signup', authController.postSignup);
app.get('/logout', authController.logout);


app.get('/', isAuthenticated, (req, res) => res.redirect('/shop'));
app.get('/shop', isAuthenticated, productController.viewProducts);
app.get('/api/products/search', isAuthenticated, productController.searchProducts);
app.get('/product/:id', isAuthenticated, productController.viewProduct);
app.get('/cart', isAuthenticated, requireCompleteProfile, cartController.viewCart);
const { validateQuantity, validateProductId, cartRateLimit } = require('./middleware/validation');
app.post('/cart/add', isAuthenticated, requireCompleteProfile, cartRateLimit, validateProductId, validateQuantity, cartController.addToCart);
app.post('/cart/update', isAuthenticated, requireCompleteProfile, cartController.updateCartItem);
app.get('/cart/remove/:id', isAuthenticated, requireCompleteProfile, cartController.removeFromCart);
app.post('/cart/checkout', isAuthenticated, requireCompleteProfile, cartController.checkout);
app.get('/order-history', isAuthenticated, cartController.orderHistory);
app.get('/my-spending', isAuthenticated, userController.getUserSpendingAnalytics);
app.get('/profile', isAuthenticated, userController.getProfile);
app.post('/profile', isAuthenticated, userController.updateProfile);

// Admin Routes
app.get('/admin', isAuthenticated, isAdminOrProductManager, adminController.dashboard);
app.get('/admin/products', isAuthenticated, isAdminOrProductManager, adminController.getProducts);
app.get('/admin/add-product', isAuthenticated, isAdminOrProductManager, adminController.getAddProduct);
app.post('/admin/products', isAuthenticated, isAdminOrProductManager, adminController.uploadProductImages, adminController.createProduct);
app.get('/admin/products/:id/edit', isAuthenticated, isAdminOrProductManager, adminController.getEditProduct);
app.post('/admin/products/:id', isAuthenticated, isAdminOrProductManager, adminController.uploadProductImages, adminController.updateProduct);
app.post('/admin/products/:id/delete', isAuthenticated, isAdminOrProductManager, adminController.deleteProduct);
app.get('/admin/users', isAuthenticated, isAdmin, adminController.getUsers);
app.post('/admin/users/role', isAuthenticated, isAdmin, adminController.updateUserRole);
app.get('/admin/income-analytics', isAuthenticated, isAdmin, adminController.getIncomeAnalytics);

// Category management routes (admin only)
app.get('/admin/categories', isAuthenticated, isAdmin, adminCategoryController.viewCategories);
app.post('/admin/categories/add', isAuthenticated, isAdmin, adminCategoryController.addCategory);
app.post('/admin/categories/update/:id', isAuthenticated, isAdmin, adminCategoryController.updateCategory);
app.get('/admin/categories/delete/:id', isAuthenticated, isAdmin, adminCategoryController.deleteCategory);


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('404', { 
    title: 'Error',
    message: 'Something went wrong!' 
  });
});


// Error handling middleware
const { notFound, errorHandler, handleDatabaseErrors } = require('./middleware/errorHandler');

// Handle database connection errors
handleDatabaseErrors();

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 9005;

function getLocalIP() {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

function startServer(startPort, maxAttempts = 5) {
  let currentPort = startPort;
  let attempts = 0;

  const tryListen = () => {
    const server = app.listen(currentPort, '0.0.0.0', () => {
      const localIP = getLocalIP();
      console.log(`Server running: http://localhost:${currentPort} | Network: http://${localIP}:${currentPort}`);
    });

    server.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE' && attempts < maxAttempts - 1) {
        attempts += 1;
        console.warn(`Port ${currentPort} in use. Trying ${currentPort + 1}...`);
        currentPort += 1;
        setTimeout(tryListen, 250);
      } else {
        console.error('Failed to start server:', err);
        process.exit(1);
      }
    });
  };

  tryListen();
}

startServer(PORT);
module.exports = app;