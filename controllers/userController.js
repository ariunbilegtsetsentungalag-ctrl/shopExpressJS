const User = require('../models/User');
const Profile = require('../models/Profile');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const mongoliaAddresses = require('../data/mongoliaAddresses');

// Profile controller functions
exports.getProfile = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      req.flash('error', 'Please log in to view your profile');
      return res.redirect('/login');
    }

    const user = await User.findById(userId).select('-password').populate('profile');

    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/login');
    }

    // Create profile if it doesn't exist
    if (!user.profile) {
      const profile = await Profile.findOrCreateByUserId(userId);
      user.profile = profile._id;
      await user.save();
      await user.populate('profile');
    }

    res.render('profile', {
      title: 'My Profile',
      user: user,
      profile: user.profile,
      username: req.session.username || user.username,
      redirect: req.query.redirect || null
    });

  } catch (error) {
    console.error('Profile view error:', error);
    req.flash('error', 'Error loading your profile');
    res.redirect('/shop');
  }
};

exports.getProfileDebug = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      req.flash('error', 'Please log in to view profile debug');
      return res.redirect('/login');
    }

    const user = await User.findById(userId).select('-password').populate('profile');

    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/login');
    }

    // Create profile if it doesn't exist
    if (!user.profile) {
      const profile = await Profile.findOrCreateByUserId(userId);
      user.profile = profile._id;
      await user.save();
      await user.populate('profile');
    }

    res.render('profile-debug', {
      title: 'Profile Debug',
      user: user,
      profile: user.profile,
      username: req.session.username || user.username
    });

  } catch (error) {
    console.error('Profile debug error:', error);
    req.flash('error', 'Error loading profile debug');
    res.redirect('/profile');
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
      aimag,
      duuregSum,
      horoo,
      detailedAddress,
      zipCode
    } = req.body;

    // Find user and create/update profile
    const user = await User.findById(userId);
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/login');
    }

    // Find or create profile
    let profile = await Profile.findOrCreateByUserId(userId);

    // Update user basic info (only email can be updated in User model)
    if (email && email !== user.email) {
      user.email = email;
      await user.save();
    }

    // Update profile data
    profile.personalInfo = {
      firstName: firstName ? firstName.trim() : '',
      lastName: lastName ? lastName.trim() : '',
      phone: phone ? phone.trim() : '',
      dateOfBirth: dateOfBirth || null,
      gender: gender || '',
      avatar: profile.personalInfo.avatar || ''
    };

    profile.address = {
      aimag: aimag ? aimag.trim() : '',
      duuregSum: duuregSum ? duuregSum.trim() : '',
      horoo: horoo ? horoo.trim() : '',
      detailedAddress: detailedAddress ? detailedAddress.trim() : '',
      zipCode: zipCode ? zipCode.trim() : ''
    };

    // Ensure preferences have default values for completion check
    if (!profile.preferences.language) {
      profile.preferences.language = 'mn';
    }
    if (!profile.preferences.currency) {
      profile.preferences.currency = 'MNT';
    }
    if (!profile.preferences.notifications) {
      profile.preferences.notifications = {
        email: true,
        sms: false,
        promotions: true
      };
    }

    // Save profile (will trigger pre-save hooks for completion checking)
    await profile.save();

    // Link profile to user if not already linked
    if (!user.profile || user.profile.toString() !== profile._id.toString()) {
      user.profile = profile._id;
      await user.save();
    }

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

// Address API Functions
exports.getAimags = (req, res) => {
  try {
    const aimags = Object.keys(mongoliaAddresses);
    res.json({ success: true, aimags });
  } catch (error) {
    console.error('Get aimags error:', error);
    res.status(500).json({ success: false, message: 'Error fetching aimags' });
  }
};

exports.getDistrictsOrSums = (req, res) => {
  try {
    const { aimag } = req.params;
    
    if (!mongoliaAddresses[aimag]) {
      return res.status(404).json({ success: false, message: 'Aimag not found' });
    }
    
    const aimagData = mongoliaAddresses[aimag];
    
    if (aimagData.type === 'city') {
      // For Ulaanbaatar, return districts (duureg)
      const districts = Object.keys(aimagData.districts);
      res.json({ success: true, type: 'districts', data: districts });
    } else {
      // For other aimags, return sums
      res.json({ success: true, type: 'sums', data: aimagData.sums });
    }
  } catch (error) {
    console.error('Get districts/sums error:', error);
    res.status(500).json({ success: false, message: 'Error fetching districts/sums' });
  }
};

exports.getHoroos = (req, res) => {
  try {
    const { aimag, district } = req.params;
    
    if (!mongoliaAddresses[aimag] || mongoliaAddresses[aimag].type !== 'city') {
      return res.status(404).json({ success: false, message: 'Invalid request for horoos' });
    }
    
    const aimagData = mongoliaAddresses[aimag];
    
    if (!aimagData.districts[district]) {
      return res.status(404).json({ success: false, message: 'District not found' });
    }
    
    const horoos = aimagData.districts[district].horoos;
    res.json({ success: true, horoos });
  } catch (error) {
    console.error('Get horoos error:', error);
    res.status(500).json({ success: false, message: 'Error fetching horoos' });
  }
};;