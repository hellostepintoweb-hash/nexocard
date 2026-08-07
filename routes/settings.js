const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

const ensureAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).render('404', { message: 'Access Denied: Admin privileges required.' });
};

router.get('/admin/settings', ensureAdmin, settingsController.getSettingsPage);
router.post('/admin/settings', ensureAdmin, settingsController.updateSettings);

module.exports = router;