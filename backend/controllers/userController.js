const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register a new user
exports.registerUser = async (req, res) => {
  try {
    console.log('Registration attempt:', { name: req.body.name, email: req.body.email });
    
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      console.log('Registration failed: Missing fields');
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      console.log('Registration failed: Password too short');
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      console.log('Registration failed: User already exists');
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({ 
      name: name.trim(), 
      email: email.toLowerCase().trim(), 
      password: hashedPassword 
    });

    console.log('User created successfully:', { id: user._id, email: user.email });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.status(201).json({ 
      success: true,
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email 
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Register user error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login user
exports.loginUser = async (req, res) => {
  try {
    console.log('Login attempt:', { email: req.body.email });
    
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      console.log('Login failed: Missing credentials');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      console.log('Login failed: User not found');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Login failed: Invalid password');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('Login successful:', { id: user._id, email: user.email });

    // Generate token
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({ 
      success: true,
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email 
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login user error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Google Login
exports.googleLogin = async (req, res) => {
  try {
    console.log('Google login attempt:', { email: req.body.email });
    
    const { googleId, email, name, picture } = req.body;

    // Validation
    if (!googleId || !email || !name) {
      console.log('Google login failed: Missing required fields');
      return res.status(400).json({ message: 'Google ID, email, and name are required' });
    }

    // Find user by Google ID or email
    let user = await User.findOne({ 
      $or: [
        { googleId: googleId },
        { email: email.toLowerCase().trim() }
      ]
    });

    if (!user) {
      console.log('Google login failed: User not found');
      return res.status(400).json({ message: 'User not found. Please register first.' });
    }

    // Update Google ID if not set
    if (!user.googleId) {
      user.googleId = googleId;
      user.picture = picture;
      await user.save();
    }

    console.log('Google login successful:', { id: user._id, email: user.email });

    // Generate token
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({ 
      success: true,
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        picture: user.picture
      },
      message: 'Google login successful'
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Server error during Google login' });
  }
};

// Google Register
exports.googleRegister = async (req, res) => {
  try {
    console.log('Google registration attempt:', { email: req.body.email });
    
    const { googleId, email, name, picture } = req.body;

    // Validation
    if (!googleId || !email || !name) {
      console.log('Google registration failed: Missing required fields');
      return res.status(400).json({ message: 'Google ID, email, and name are required' });
    }

    // Check if user exists
    const userExists = await User.findOne({ 
      $or: [
        { googleId: googleId },
        { email: email.toLowerCase().trim() }
      ]
    });
    
    if (userExists) {
      console.log('Google registration failed: User already exists');
      return res.status(400).json({ message: 'User already exists with this email or Google account' });
    }

    // Create user with Google data
    const user = await User.create({ 
      name: name.trim(), 
      email: email.toLowerCase().trim(), 
      googleId: googleId,
      picture: picture,
      password: 'google_auth' // Placeholder password for Google users
    });

    console.log('Google user created successfully:', { id: user._id, email: user.email });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.status(201).json({ 
      success: true,
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        picture: user.picture
      },
      message: 'Google user registered successfully'
    });
  } catch (error) {
    console.error('Google register user error:', error);
    res.status(500).json({ message: 'Server error during Google registration' });
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    // req.user is set in authMiddleware
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
};