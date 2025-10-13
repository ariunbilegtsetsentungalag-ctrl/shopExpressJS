const User = require('../models/User');

exports.getLogin = (req, res) => {
  res.render('login', { title: 'Login' });
};

exports.getSignup = (req, res) => {
  res.render('signup', { title: 'Sign Up' });
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

    req.flash('success', 'Registration successful! Please log in.');
    res.redirect('/login');
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