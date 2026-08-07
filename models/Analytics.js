const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
  card: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card',
    required: true,
    unique: true
  },
  views: { type: Number, default: 0 },
  scans: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  saves: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Analytics', AnalyticsSchema);