const express = require('express');
const router = express.Router();
const passport = require('../middleware/Passport');

// Start Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));


router.get('/test', (req, res) => {
  res.json({ message: 'Auth test route is working!' });
});
// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication sends JWT and user info
    res.json({
      success: true,
      token: req.user.token,
      user: {
        id: req.user.user._id,
        name: req.user.user.name,
        email: req.user.user.email,
      }
    });
  }
);

module.exports = router;
