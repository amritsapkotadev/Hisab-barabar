const express = require('express');
const router = express.Router();
const passport = require('./middleware/Passport');

// Start Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth callback
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication bhane jwt token ani user profile patahune ho
    res.json({
      success: true,
      token: req.user.token,
      user: {
        id: req.user.user._id,
        name: req.user.user.name,
        email: req.user.user.email,
        picture: req.user.user.picture,
      }
    });
  }
);

module.exports = router;
