const express = require('express');
const router = express.Router();

/**
 * GET /offer (Dedicated Instagram/Facebook Ad Landing Page)
 */
router.get('/offer', (req, res) => {
  res.render('landing-ad', {
    user: req.user || null,
    seo: {
      title: 'NEXO Digital Business Card — ₹299 Lifetime Access',
      description: 'Create your professional NEXO Digital Business Card for ₹299. Share your contact details, social links, QR code, location and clickable PDF from one smart digital card.',
      canonicalUrl: 'https://nexocard.in/offer'
    }
  });
});

module.exports = router;
