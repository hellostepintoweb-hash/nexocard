const express = require('express');
const router = express.Router();
const adminDashboardController = require('../controllers/adminDashboardController');

// Admin Authentication Middleware
const ensureAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).render('404', { message: 'Access Denied: Founder/Admin privileges required.' });
};

router.get('/admin/dashboard', ensureAdmin, adminDashboardController.getAdminDashboard);
router.get('/admin/export/payments', ensureAdmin, adminDashboardController.exportPaymentsCSV);

module.exports = router;