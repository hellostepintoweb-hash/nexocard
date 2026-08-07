const express = require('express');
const passport = require('passport');
const router = express.Router();
const User = require('../models/User');
const { ensureGuest, ensureAuth } = require('../middleware/auth');

// @desc    Render Login Page
// @route   GET /auth/login
router.get('/login', ensureGuest, (req, res) => {
  res.render('auth/login', { error: null, redirect: req.query.redirect || '' });
});

// @desc    Render Register Page
// @route   GET /auth/register
router.get('/register', ensureGuest, (req, res) => {
  res.render('auth/register', { error: null });
});

// @desc    Register User
// @route   POST /auth/register
router.post('/register', ensureGuest, async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      return res.render('auth/register', { error: 'Email is already registered' });
    }

    // Create user in database
    user = await User.create({ name, email, password });

    // Re-fetch user from DB to ensure clean document state for session serialization
    const sessionUser = await User.findById(user._id);

    req.login(sessionUser, (err) => {
      if (err) return res.render('auth/register', { error: 'Login session failed after registration' });
      const returnTo = req.query.redirect || req.body.redirect || '/dashboard';
      res.redirect(returnTo);
    });
  } catch (err) {
    console.error(err);
    res.render('auth/register', { error: 'An error occurred during registration' });
  }
});

// @desc    Login User
// @route   POST /auth/login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.render('auth/login', { 
        error: info ? info.message : 'Invalid credentials', 
        redirect: req.query.redirect || req.body.redirect || '' 
      });
    }
    req.login(user, (err) => {
      if (err) return next(err);
      
      // Determine default dashboard route based on user role
      const defaultDashboard = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';

      // Check if user came with an explicit redirect query/body parameter
      let target = req.query.redirect || req.body.redirect || defaultDashboard;
      
      try {
        target = decodeURIComponent(target);
      } catch(e) {}
      
      if (!target.startsWith('/')) target = '/' + target;
      
      return res.redirect(target);
    });
  })(req, res, next);
});

// @desc    Auth with Google
// @route   GET /auth/google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @desc    Google auth callback
// @route   GET /auth/google/callback
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/login' }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);

// @desc    Logout User
// @route   GET /auth/logout
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/');
  });
});



module.exports = router;