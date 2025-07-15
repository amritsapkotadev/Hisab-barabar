const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, googleLogin, googleRegister, setBudget, changePassword, deleteAccount, verifyOTP, resendOTP } = require('../controllers/userController');
const protect = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerUser);  // POST /users/register
router.post('/login', loginUser);        // POST /users/login

// OTP verification route
router.post('/verify-otp', verifyOTP); // POST /users/verify-otp
router.post('/resend-otp', resendOTP); // POST /users/resend-otp

//Setting budget routes
router.post('/budget', protect, setBudget);        // POST /users/budget

// Google authentication routes
router.post('/google-login', googleLogin);     // POST /users/google-login
router.post('/google-register', googleRegister); // POST /users/google-register

// Protected routes
router.get('/profile', protect, getUserProfile);  // GET /users/profile

//Change password route
router.put('/change-password', protect, changePassword);

//Account deletion route
router.delete('/delete-account', protect, deleteAccount);

// Get all users (for testing - protect in production)
router.get('/', async (req, res) => {
  try {
    const User = require('../models/User');
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({
      error: 'Internal server error while fetching users'
    });
  }
});

module.exports = router;