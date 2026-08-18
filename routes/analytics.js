const express = require('express');
const router = express.Router();
const Analytics = require('../models/Analytics');

// POST /analytics/click/:cardId - Track Shares and Button Clicks
router.post('/analytics/click/:cardId', async (req, res) => {
  try {
    const { cardId } = req.params;
    const { linkType } = req.body;

    // Increment share counter if link type is share/social
    const updateField = (linkType === 'share') ? { shares: 1 } : { views: 0 }; 

    await Analytics.findOneAndUpdate(
      { card: cardId },
      { $inc: updateField },
      { upsert: true }
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Analytics track error:', error);
    return res.status(500).json({ success: false });
  }
});

module.exports = router;
