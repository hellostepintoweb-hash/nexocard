const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    card: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Card',
      default: null,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    plan: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED'],
      default: 'PENDING',
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
    },
    razorpayPaymentId: {
      type: String,
      default: '',
    },
    razorpaySignature: {
      type: String,
      default: '',
    },
    paymentMethod: {
      type: String,
      default: 'Razorpay',
    },
    paymentDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

PaymentSchema.statics.generateInvoiceNumber = async function () {
  const year = new Date().getFullYear();
  const count = await this.countDocuments();
  const sequence = String(count + 1).padStart(6, '0');
  return `NEXO-${year}-${sequence}`;
};

module.exports = mongoose.model('Payment', PaymentSchema);