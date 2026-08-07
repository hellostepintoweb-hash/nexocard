const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema(
  {
    planName: {
      type: String,
      default: 'Lifetime Premium',
      trim: true,
    },
    price: {
      type: Number,
      default: 299,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
    },
    paymentType: {
      type: String,
      default: 'One Time Payment',
      trim: true,
    },
    offerText: {
      type: String,
      default: 'Limited Time Offer - Save 70%',
      trim: true,
    },
    offerEnabled: {
      type: Boolean,
      default: true,
    },
    paymentEnabled: {
      type: Boolean,
      default: true,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    supportEmail: {
      type: String,
      default: 'support@nexocard.in',
      trim: true,
      lowercase: true,
    },
    supportPhone: {
      type: String,
      default: '+91 9876543210',
      trim: true,
    },
    whatsappNumber: {
      type: String,
      default: '+91 9876543210',
      trim: true,
    },
    companyName: {
      type: String,
      default: 'NEXO Technologies',
      trim: true,
    },
    companyAddress: {
      type: String,
      default: 'Chennai, Tamil Nadu, India',
      trim: true,
    },
  },
  { timestamps: true }
);

SettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', SettingsSchema);