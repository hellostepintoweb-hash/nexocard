const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Card = require('../models/Card');
const { protect, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/admin/dashboard-stats
 * @desc    Fetch aggregated high-level business analytics overview across all SaaS accounts
 * @access  Protected/Admin
 */
router.get('/dashboard-stats', protect, authorize('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const suspendedUsers = await User.countDocuments({ status: 'suspended' });
    const totalCards = await Card.countDocuments();

    // Aggregate globally cross-cutting usage metrics efficiently via MongoDB stage piping
    const operationalMetrics = await Card.aggregate([
      {
        $group: {
          _id: null,
          views: { $sum: '$analytics.totalViews' },
          scans: { $sum: '$analytics.qrScans' },
          shares: { $sum: '$analytics.shareCount' },
          saves: { $sum: '$analytics.savedContacts' }
        }
      }
    ]);

    const globalStats = operationalMetrics[0] || { views: 0, scans: 0, shares: 0, saves: 0 };

    res.status(200).json({
      success: true,
      data: {
        users: { total: totalUsers, suspended: suspendedUsers },
        cards: { total: totalCards },
        analytics: globalStats
      }
    });
  } catch (err) {
    console.error('Administrative aggregation failure:', err);
    res.status(500).json({ success: false, error: 'Failed to aggregate master system telemetry.' });
  }
});

/**
 * @route   GET /api/admin/users
 * @desc    Fetch a complete system index mapping of platform users joined with card volume properties
 * @access  Protected/Admin
 */
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    // Utilize efficient aggregation pipelines to assemble relational lookups without triggering N+1 load bugs
    const userProfiles = await User.aggregate([
      { $match: { role: { $ne: 'admin' } } },
      {
        $lookup: {
          from: 'cards',
          localField: '_id',
          foreignField: 'userId',
          as: 'cards'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          mobile: 1,
          status: 1,
          createdAt: 1,
          cardsCount: { $size: '$cards' },
          aggregateViews: { $sum: '$cards.analytics.totalViews' }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    res.status(200).json({ success: true, data: userProfiles });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Database tracking sequence encountered a read fault.' });
  }
});

/**
 * @route   PATCH /api/admin/users/:id/status
 * @desc    Toggle user status parameters to handle account suspension or clearance tasks
 * @access  Protected/Admin
 */
router.patch('/users/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Specified execution target status parameter is invalid.' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'Target user could not be located in database records.' });
    }

    targetUser.status = status;
    await targetUser.save();

    // If account gets suspended, cascade internal availability tags across their card profiles
    if (status === 'suspended') {
      await Card.updateMany({ userId: targetUser._id }, { isActive: false });
    } else {
      await Card.updateMany({ userId: targetUser._id }, { isActive: true });
    }

    res.status(200).json({ success: true, message: `User target status updated successfully to [${status}].` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to commit user status mutation matrix.' });
  }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Permanently purge a user profile alongside all associated card profiles from the platform
 * @access  Protected/Admin
 */
router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'Target user profile mapping record absent.' });
    }

    // Cascade deletion of card profiles belonging to the user
    await Card.deleteMany({ userId: targetUser._id });
    await targetUser.deleteOne();

    res.status(200).json({ success: true, message: 'User account and all associated profile instances permanently purged.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Transactional processing failure while scrubbing account data.' });
  }
});

module.exports = router;