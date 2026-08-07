const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const User = require('../models/User');
const Card = require('../models/Card');

// Helper to assemble SEO & Global Data
async function getCorporateContext(req, title, description, canonicalPath) {
  const settings = await Settings.getSettings();
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  
  return {
    title: `${title} | NEXO - Digital Business Card Platform`,
    metaDescription: description,
    canonicalUrl: `${baseUrl}${canonicalPath}`,
    ogImage: `${baseUrl}/flat_logo.png`,
    settings,
    user: req.user || null
  };
}

// 1. Contact Us Route
router.get('/contact', async (req, res, next) => {
  try {
    const ctx = await getCorporateContext(
      req,
      'Contact Us',
      'Get in touch with the NEXO support team. We are available to assist with your digital business card and wallet needs.',
      '/contact'
    );
    res.render('corporate/contact', ctx);
  } catch (err) {
    next(err);
  }
});

// 2. About Us Route
router.get('/about', async (req, res, next) => {
  try {
    const ctx = await getCorporateContext(
      req,
      'About Us',
      'Learn about NEXO, our mission, vision, and the technology driving the digital business card revolution.',
      '/about'
    );

    // Fetch dynamic live metrics from MongoDB
    let totalUsers = 1000;
    let totalCards = 5000;
    try {
      if (User && Card) {
        const uCount = await User.countDocuments();
        const cCount = await Card.countDocuments();
        if (uCount > 0) totalUsers = uCount;
        if (cCount > 0) totalCards = cCount;
      }
    } catch (e) {
      // Fallback display metrics
    }

    ctx.stats = {
      users: totalUsers,
      cards: totalCards,
      countries: '15+',
      uptime: '99.9%'
    };

    res.render('corporate/about', ctx);
  } catch (err) {
    next(err);
  }
});

// 3. FAQ Route
router.get('/faq', async (req, res, next) => {
  try {
    const ctx = await getCorporateContext(
      req,
      'Frequently Asked Questions',
      'Find fast answers regarding NEXO Digital Cards, Wallet integration, lifetime access, payments, and security.',
      '/faq'
    );
    res.render('corporate/faq', ctx);
  } catch (err) {
    next(err);
  }
});

// 4. Privacy Policy Route
router.get('/privacy-policy', async (req, res, next) => {
  try {
    const ctx = await getCorporateContext(
      req,
      'Privacy Policy',
      'Read the NEXO Privacy Policy to understand how we collect, protect, and manage your account and profile data.',
      '/privacy-policy'
    );
    res.render('corporate/privacy-policy', ctx);
  } catch (err) {
    next(err);
  }
});

// 5. Terms & Conditions Route
router.get('/terms', async (req, res, next) => {
  try {
    const ctx = await getCorporateContext(
      req,
      'Terms & Conditions',
      'Review the terms of service, platform rules, and agreement for using NEXO digital business cards.',
      '/terms'
    );
    res.render('corporate/terms', ctx);
  } catch (err) {
    next(err);
  }
});

// 6. Refund Policy Route
router.get('/refund-policy', async (req, res, next) => {
  try {
    const ctx = await getCorporateContext(
      req,
      'Refund Policy',
      'Review the NEXO refund and cancellation policies regarding digital products and lifetime passes.',
      '/refund-policy'
    );
    res.render('corporate/refund-policy', ctx);
  } catch (err) {
    next(err);
  }
});

module.exports = router;