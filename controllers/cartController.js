const Order = require('../models/Order')
const Product = require('../models/Product')
const mongoose = require('mongoose')
const { asyncHandler } = require('../middleware/errorHandler')

exports.viewCart = (req, res) => {
  const cart = req.session.cart || { items: [] }
  res.render('cart', { cart, title: 'My Cart' })
}

exports.addToCart = asyncHandler(async (req, res) => {
  // Input validation is now handled by middleware
  const productId = req.body.productId
  const quantity = parseInt(req.body.quantity) || 1
  const selectedSize = req.body.selectedSize
  const selectedColor = req.body.selectedColor

    const Product = require('../models/Product')
    const product = await Product.findById(productId)
    
    if (!product) {
      req.flash('error', 'Product not found')
      return res.redirect('/shop')
    }

    if (product.stockQuantity <= 0) {
      req.flash('error', 'This product is currently out of stock')
      return res.redirect('/shop')
    }

    if (product.stockQuantity < quantity) {
      req.flash('error', `Only ${product.stockQuantity} items available in stock`)
      return res.redirect(`/product/${productId}`)
    }

    req.session.cart = req.session.cart || { items: [] }
    const existingCartItem = req.session.cart.items.find(item => 
      item.product._id.toString() === product._id.toString() && 
      item.options.size === selectedSize && 
      item.options.color === selectedColor
    )
    
    const currentCartQuantity = existingCartItem ? existingCartItem.quantity : 0
    const totalRequestedQuantity = currentCartQuantity + quantity
    
    if (product.stockQuantity < totalRequestedQuantity) {
      req.flash('error', `Cannot add ${quantity} more items. Only ${product.stockQuantity - currentCartQuantity} items available (${currentCartQuantity} already in cart)`)
      return res.redirect(`/product/${productId}`)
    }

  
    let itemPrice = product.basePrice
    if (selectedSize && product.sizes && product.sizes.length > 0) {
      const sizeOption = product.sizes.find(s => s.name === selectedSize)
      if (sizeOption) {
        itemPrice = sizeOption.price
      }
    }

    const cartItem = {
      product: {
        _id: product._id,
        name: product.name,
        image: product.image,
        basePrice: product.basePrice,
        price: itemPrice
      },
      quantity,
      options: {
        size: selectedSize,
        color: selectedColor
      }
    }

    req.session.cart = req.session.cart || { items: [] }
    
    const existing = req.session.cart.items.find(item => 
      item.product._id.toString() === product._id.toString() && 
      item.options.size === selectedSize && 
      item.options.color === selectedColor
    )
    
    if (existing) {
      existing.quantity += quantity
    } else {
      req.session.cart.items.push(cartItem)
    }
    
    req.flash('success', `Added ${product.name} to cart`)
    res.redirect('/shop')
});

exports.removeFromCart = (req, res) => {
  const id = req.params.id
  const { size, color } = req.query
  req.session.cart = req.session.cart || { items: [] }

  req.session.cart.items = req.session.cart.items.filter(i => {
    const sameProduct = i.product._id.toString() === id
    const sameSize = (size ? i.options.size === size : true)
    const sameColor = (color ? i.options.color === color : true)
    // Remove only the matching line; if size/color are provided, they must match too
    return !(sameProduct && sameSize && sameColor)
  })

  res.redirect('/cart')
}

exports.updateCartItem = asyncHandler(async (req, res) => {
  const { productId, size, color, quantity } = req.body
  
  if (!productId || !quantity || quantity < 1) {
    req.flash('error', 'Invalid quantity')
    return res.redirect('/cart')
  }

  req.session.cart = req.session.cart || { items: [] }
  
  const item = req.session.cart.items.find(i => 
    i.product._id.toString() === productId && 
    i.options.size === size && 
    i.options.color === color
  )

  if (!item) {
    req.flash('error', 'Item not found in cart')
    return res.redirect('/cart')
  }

  // Check stock availability
  const product = await Product.findById(productId)
  if (!product) {
    req.flash('error', 'Product no longer exists')
    return res.redirect('/cart')
  }

  if (product.stockQuantity < quantity) {
    req.flash('error', `Only ${product.stockQuantity} items available in stock`)
    return res.redirect('/cart')
  }

  item.quantity = parseInt(quantity)
  req.flash('success', 'Cart updated successfully')
  res.redirect('/cart')
})

exports.checkout = async (req, res) => {
  const session = await mongoose.startSession()
  session.startTransaction()
  try {
    const cart = req.session.cart || { items: [] }
    if (cart.items.length === 0) {
      req.flash('error', 'Your cart is empty')
      await session.abortTransaction(); session.endSession();
      return res.redirect('/cart')
    }

    if (!req.session.userId) {
      req.flash('error', 'Please log in to place an order')
      await session.abortTransaction(); session.endSession();
      return res.redirect('/login')
    }

    for (const item of cart.items) {
      const product = await Product.findById(item.product._id).session(session)
      if (!product) {
        req.flash('error', `Product ${item.product.name} no longer exists`)
        await session.abortTransaction(); session.endSession();
        return res.redirect('/cart')
      }
      if (product.stockQuantity < item.quantity) {
        req.flash('error', `${item.product.name} is out of stock or insufficient quantity available`)
        await session.abortTransaction(); session.endSession();
        return res.redirect('/cart')
      }
    }

    const totalAmount = cart.items.reduce((total, item) => 
      total + (item.product.price * item.quantity), 0)

    const userObjectId = mongoose.Types.ObjectId.isValid(req.session.userId) ? 
      new mongoose.Types.ObjectId(req.session.userId) : req.session.userId;

    // Calculate estimated delivery date based on longest delivery time in cart
    const maxDeliveryTime = Math.max(...cart.items.map(item => item.product.deliveryTime || 14));
    const estimatedDeliveryDate = new Date();
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + maxDeliveryTime);
    
    // Generate tracking number
    const trackingNumber = 'TRK' + Math.random().toString(36).substr(2, 9).toUpperCase();

    const order = new Order({
      userId: userObjectId,
      products: cart.items.map(item => ({
        productId: item.product._id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity
      })),
      totalAmount,
      deliveryStatus: 'Processing',
      estimatedDeliveryDate: estimatedDeliveryDate,
      trackingNumber: trackingNumber
    })

    await order.save({ session })


    for (const item of cart.items) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product._id, stockQuantity: { $gte: item.quantity } },
        { $inc: { stockQuantity: -item.quantity }, $set: { inStock: true } },
        { new: true, session }
      )
      if (!updated) {
        req.flash('error', `${item.product.name} went out of stock during checkout`)
        await session.abortTransaction(); session.endSession();
        return res.redirect('/cart')
      }
      if (updated.stockQuantity <= 0) {
        await Product.updateOne(
          { _id: item.product._id },
          { $set: { stockQuantity: 0, inStock: false } },
          { session }
        )
      }
    }

    await session.commitTransaction(); session.endSession();
    req.session.cart = { items: [] }
    req.flash('success', 'Order placed successfully!')
    res.redirect('/order-history')
  } catch (error) {
    console.error('Error during checkout:', error)
    try { await session.abortTransaction() } catch (e) {}
    session.endSession()
    req.flash('error', 'An error occurred during checkout')
    res.redirect('/cart')
  }
}

exports.orderHistory = async (req, res) => {
  try {
    if (!req.session.userId) {
      req.flash('error', 'Please log in to view order history')
      return res.redirect('/login')
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 10; // Orders per page
    const skip = (page - 1) * limit;

    const userObjectId = mongoose.Types.ObjectId.isValid(req.session.userId) ?
      new mongoose.Types.ObjectId(req.session.userId) : req.session.userId;

    const totalOrders = await Order.countDocuments({ userId: userObjectId });
    const totalPages = Math.ceil(totalOrders / limit);

    const orders = await Order.find({ userId: userObjectId })
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.render('order-history', {
      orders,
      title: 'Order History',
      currentPage: page,
      totalPages,
      totalOrders
    })
  } catch (error) {
    console.error('Error fetching order history:', error)
    req.flash('error', 'Could not fetch order history')
    res.redirect('/shop')
  }
}

