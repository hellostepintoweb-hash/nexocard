const Settings = require('../models/Settings');

module.exports = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();

    // Check if maintenance mode is enabled in the database
    if (settings && settings.maintenanceMode) {
      
      // 1. Allow authenticated Admins to bypass maintenance mode
      if (req.isAuthenticated() && req.user.role === 'admin') {
        return next();
      }

      // 2. Allow access to auth routes (so admins can log in) and system health check
      if (
        req.path.startsWith('/auth') ||
        req.path.startsWith('/public') ||
        req.path === '/health'
      ) {
        return next();
      }

      // 3. Block regular users and visitors
      return res.status(503).render('503', {
        title: 'System Maintenance | NEXO',
        message: 'We are currently performing scheduled platform maintenance. Please check back shortly!'
      });
    }

    next();
  } catch (error) {
    console.error('Maintenance Middleware Error:', error);
    next();
  }
};