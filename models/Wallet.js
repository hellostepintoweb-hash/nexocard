const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  savedCards: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card'
  }]
}, { timestamps: true });

module.exports = mongoose.models.Wallet || mongoose.model('Wallet', WalletSchema);