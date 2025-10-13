const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const mongoose = require('mongoose');

exports.getUserSpendingAnalytics = async (req, res) => {
  try {
    const userId = req.session.userId;
    console.log('Analytics route accessed by user:', userId);
    
    if (!userId) {
      req.flash('error', 'Please log in to view your spending analytics');
      return res.redirect('/login');
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Get all user orders
    const allOrders = await Order.find({ userId: userObjectId })
      .sort({ orderDate: -1 })
      .select('orderDate totalAmount products');

    // Calculate basic statistics
    const totalSpent = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = allOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    // Get current month data
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const thisMonthStart = new Date(thisYear, thisMonth, 1);
    const thisMonthEnd = new Date(thisYear, thisMonth + 1, 1);

    const thisMonthOrders = allOrders.filter(order => 
      order.orderDate >= thisMonthStart && order.orderDate < thisMonthEnd
    );
    const thisMonthSpent = thisMonthOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Calculate monthly spending for chart
    const monthlyData = new Array(12).fill(0);
    allOrders.forEach(order => {
      if (order.orderDate.getFullYear() === thisYear) {
        const month = order.orderDate.getMonth();
        monthlyData[month] += order.totalAmount;
      }
    });

    const monthlySpending = monthlyData.map((amount, index) => ({
      _id: index + 1,
      totalSpent: amount,
      orderCount: allOrders.filter(order => 
        order.orderDate.getFullYear() === thisYear && 
        order.orderDate.getMonth() === index
      ).length
    })).filter(month => month.totalSpent > 0);

    console.log('Rendering analytics with data...');
    res.render('user/analytics', {
      title: 'My Spending Analytics',
      username: req.session.username || 'User',
      totalSpent: totalSpent,
      totalOrders: totalOrders,
      averageOrderValue: averageOrderValue,
      thisMonthSpent: thisMonthSpent,
      thisMonthOrders: thisMonthOrders.length,
      recentOrders: allOrders.slice(0, 5),
      monthlySpending: monthlySpending,
      yearlySpendingTotal: monthlyData.reduce((sum, amount) => sum + amount, 0)
    });

  } catch (error) {
    console.error('User spending analytics error:', error);
    req.flash('error', 'Error loading your spending analytics');
    res.redirect('/shop');
  }
};

// Profile controller functions
exports.getProfile = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      req.flash('error', 'Please log in to view your profile');
      return res.redirect('/login');
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/login');
    }

    res.render('profile', {
      title: 'My Profile',
      user: user,
      username: req.session.username || user.username,
      redirect: req.query.redirect || null
    });

  } catch (error) {
    console.error('Profile view error:', error);
    req.flash('error', 'Error loading your profile');
    res.redirect('/shop');
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.session.userId;
    
    if (!userId) {
      req.flash('error', 'Please log in to update your profile');
      return res.redirect('/login');
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      cityAimag,
      duuregSum,
      horooBag,
      detailedInfo
    } = req.body;

    // Validate required fields for profile completion
    const requiredFields = {
      'First Name': firstName,
      'Last Name': lastName,
      'Phone': phone,
      'City/Aimag': cityAimag,
      'Duureg/Sum': duuregSum,
      'Horoo/Bag': horooBag
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value || !value.trim())
      .map(([field, _]) => field);

    if (missingFields.length > 0) {
      req.flash('error', `Please fill in all required fields: ${missingFields.join(', ')}`);
      return res.redirect('/profile');
    }

    // Find user and update
    const user = await User.findById(userId);

    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/login');
    }

    // Update user fields
    user.firstName = firstName.trim();
    user.lastName = lastName.trim();
    user.email = email;
    user.phone = phone.trim();
    user.dateOfBirth = dateOfBirth || null;
    user.gender = gender || '';
    user.address = {
      cityAimag: cityAimag ? cityAimag.trim() : '',
      duuregSum: duuregSum ? duuregSum.trim() : '',
      horooBag: horooBag ? horooBag.trim() : '',
      detailedInfo: detailedInfo ? detailedInfo.trim() : ''
    };

    // Save will trigger the pre-save hook to update profileCompleted
    await user.save();

    req.flash('success', 'Profile updated successfully!');

    // Check if there's a redirect URL
    const redirectUrl = req.query.redirect || '/profile';
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('Profile update error:', error);

    if (error.code === 11000) {
      req.flash('error', 'Email already exists. Please use a different email.');
    } else if (error.name === 'ValidationError') {
      req.flash('error', 'Please check your input and try again');
    } else {
      req.flash('error', 'Error updating your profile');
    }

    res.redirect('/profile');
  }
};