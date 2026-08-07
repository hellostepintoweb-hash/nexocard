const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

const ensureAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/login');
};

router.get('/payment/review', ensureAuth, paymentController.getReviewPage);
router.post('/payment/create-order', ensureAuth, paymentController.createOrder);
router.post('/payment/verify', ensureAuth, paymentController.verifyPayment);
router.get('/payment/success', ensureAuth, paymentController.getSuccessPage);
router.get('/payment/failed', ensureAuth, paymentController.getFailedPage);

module.exports = router;