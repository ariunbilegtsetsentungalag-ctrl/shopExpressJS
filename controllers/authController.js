const User = require('../models/User');

exports.getLogin = (req, res) => {
  res.render('login', { 
    title: res.__('login'),
    currentLocale: req.getLocale()
  });
};

exports.getSignup = (req, res) => {
  res.render('signup', { 
    title: res.__('signup'),
    currentLocale: req.getLocale()
  });
};

exports.postSignup = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      req.flash('error', 'User already exists');
      return res.redirect('/signup');
    }
    const user = new User({
      username,
      email,
      password
    });

    await user.save();

    // Automatically log in the user after successful registration
    req.session.userId = user._id;
    req.session.username = user.username;
    req.session.user = { 
      username: user.username,
      role: user.role,
      permissions: user.permissions
    };

    req.flash('success', 'Welcome! Your account has been created successfully.');
    req.session.save(() => {
      res.redirect('/');
    });
  } catch (error) {
    console.error('Signup error:', error);
    req.flash('error', 'Error during registration');
    res.redirect('/signup');
  }
};

exports.postLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      req.flash('error', 'Invalid username or password');
      return req.session.save(() => {
        res.redirect('/login');
      });
    }
console.log("hi");
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.flash('error', 'Invalid username or password');
      return req.session.save(() => {
        res.redirect('/login');
      });
    }

    req.session.userId = user._id;
    req.session.username = user.username;
    req.session.user = { 
      username: user.username,
      role: user.role,
      permissions: user.permissions
    };
    
    req.flash('success', 'Successfully logged in!');
    req.session.save(() => {
      res.redirect('/');
    });
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'Error during login');
    req.session.save(() => {
      res.redirect('/login');
    });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/login');
  });
};

exports.checkUsername = async (req, res) => {
  try {
    const { username } = req.params;
    
    // Basic validation
    if (!username || username.length < 3) {
      return res.json({
        available: false,
        message: 'Username must be at least 3 characters long',
        suggestions: []
      });
    }

    // Check if username exists
    const existingUser = await User.findOne({ username });
    
    if (!existingUser) {
      return res.json({
        available: true,
        message: 'Username is available',
        suggestions: []
      });
    }

    // Generate suggestions with numbers
    const suggestions = [];
    for (let i = 1; i <= 5; i++) {
      const suggestion = `${username}${i}`;
      const suggestionExists = await User.findOne({ username: suggestion });
      if (!suggestionExists) {
        suggestions.push(suggestion);
      }
    }

    // If no simple numbered suggestions available, try random numbers
    if (suggestions.length === 0) {
      for (let i = 0; i < 3; i++) {
        const randomNum = Math.floor(Math.random() * 999) + 1;
        const suggestion = `${username}${randomNum}`;
        const suggestionExists = await User.findOne({ username: suggestion });
        if (!suggestionExists) {
          suggestions.push(suggestion);
        }
      }
    }

    res.json({
      available: false,
      message: 'Username is already taken',
      suggestions: suggestions.slice(0, 3) // Return max 3 suggestions
    });

  } catch (error) {
    console.error('Username check error:', error);
    res.status(500).json({
      available: false,
      message: 'Error checking username availability',
      suggestions: []
    });
  }
};