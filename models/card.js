const mongoose = require('mongoose');

const CardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    handle: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      default: '',
    },
    company: {
      type: String,
      default: '',
    },
    about: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    whatsapp: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      default: '',
    },
    website: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    googleMapUrl: {
      type: String,
      default: '',
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    avatarUrl: {
      type: String,
      default: '/images/default-avatar.png',
    },
    coverUrl: {
      type: String,
      default: '',
    },
    qrCodeDataUrl: {
      type: String,
      default: '',
    },
    socialLinks: {
      type: Array,
      default: [],
    },
    theme: {
      type: Object,
      default: {},
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'UNPAID'],
      default: 'UNPAID',
    },
    paymentPlan: {
      type: String,
      default: '',
    },
    paymentAmount: {
      type: Number,
      default: 0,
    },
    paymentDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// TO THIS (Safe export check):
module.exports = mongoose.models.Card || mongoose.model('Card', CardSchema);