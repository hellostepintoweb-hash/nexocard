const express = require('express');
const router = express.Router();
const Card = require('../models/card');
const Analytics = require('../models/Analytics');
const Wallet = require('../models/Wallet');
const { ensureAuth } = require('../middleware/auth');

router.get('/dashboard', ensureAuth, async (req, res) => {
  try {
    const userCards = await Card.find({ user: req.user.id }).lean();
    
    const cardIds = userCards.map(c => c._id);
    const analyticsData = await Analytics.find({ card: { $in: cardIds } }).lean();

    const userWallet = await Wallet.findOne({ user: req.user.id }).populate('savedCards').lean();
    const savedCards = userWallet && userWallet.savedCards ? userWallet.savedCards : [];

    res.render('dashboard', {
      user: req.user,
      userCards,
      savedCards,
      analyticsData
    });
  } catch (err) {
    console.error('Dashboard route error:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;