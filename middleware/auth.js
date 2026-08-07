// middleware/auth.js

module.exports = {
  ensureAuth: function (req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/auth/login');
  },

  ensureGuest: function (req, res, next) {
    if (req.isAuthenticated()) {
      // Redirect based on user role
      if (req.user && req.user.role === 'admin') {
        return res.redirect('/admin/dashboard');
      }
      return res.redirect('/dashboard');
    }
    return next();
  }
};