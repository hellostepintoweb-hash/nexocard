const express = require('express');
const router = express.Router();
const Card = require('../models/card');
const Analytics = require('../models/Analytics');
const Wallet = require('../models/Wallet');
const { ensureAuth } = require('../middleware/auth');

// @desc    Dashboard / User Nexo Wallet
// @route   GET /dashboard
router.get('/dashboard', ensureAuth, async (req, res) => {
  try {
    const userCards = await Card.find({ user: req.user.id });

    const wallet = await Wallet.findOne({ user: req.user.id }).populate({
      path: 'savedCards',
      populate: { path: 'user', select: 'name email avatar' }
    });

    const savedCards = wallet ? wallet.savedCards : [];

    const cardIds = userCards.map((c) => c._id);
    const analyticsData = await Analytics.find({ card: { $in: cardIds } });

    res.render('wallet/dashboard', {
      userCards,
      savedCards,
      analyticsData,
    });
  } catch (err) {
    console.error('Dashboard Fetch Error:', err);
    res.status(500).send('Server Error');
  }
});

// @desc    Save a Digital Card to User's Nexo Wallet
// @route   POST /wallet/save/:cardId
router.post('/wallet/save/:cardId', async (req, res) => {
  // Guarantee JSON output header for all outcomes
  res.setHeader('Content-Type', 'application/json');

  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const { cardId } = req.params;
    const userId = req.user.id;

    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ 
        success: false, 
        message: 'Card not found' 
      });
    }

    // 1. Add user ID to Card's savedByUsers array
    await Card.findByIdAndUpdate(cardId, {
      $addToSet: { savedByUsers: userId }
    });

    // 2. Add card ID to User's Wallet document (upsert if missing)
    await Wallet.findOneAndUpdate(
      { user: userId },
      { $addToSet: { savedCards: cardId } },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Card Saved Successfully'
    });
  } catch (err) {
    console.error('Save Card Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error saving card to wallet'
    });
  }
});

// @desc    Remove a Saved Card from Nexo Wallet
// @route   POST /wallet/remove/:cardId
router.post('/wallet/remove/:cardId', ensureAuth, async (req, res) => {
  try {
    const { cardId } = req.params;
    const userId = req.user.id;

    await Card.findByIdAndUpdate(cardId, {
      $pull: { savedByUsers: userId },
    });

    await Wallet.findOneAndUpdate(
      { user: userId },
      { $pull: { savedCards: cardId } }
    );

    res.redirect('/dashboard');
  } catch (err) {
    console.error('Remove Card Error:', err);
    res.status(500).send('Error removing card from wallet');
  }
});

// @desc    Track Link Clicks for Card Analytics
// @route   POST /analytics/click/:cardId
router.post('/analytics/click/:cardId', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { linkType } = req.body;

    if (!linkType) {
      return res.status(400).json({ success: false, message: 'Link type required' });
    }

    const updateResult = await Analytics.updateOne(
      { card: req.params.cardId, 'clicks.linkType': linkType },
      { $inc: { 'clicks.$.count': 1 } }
    );

    if (updateResult.matchedCount === 0) {
      await Analytics.updateOne(
        { card: req.params.cardId },
        { $push: { clicks: { linkType, count: 1 } } },
        { upsert: true }
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Analytics Track Error:', err);
    res.status(500).json({ success: false, message: 'Failed to record event' });
  }
});

module.exports = router;