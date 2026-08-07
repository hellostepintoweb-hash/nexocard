const crypto = require('crypto');
const Razorpay = require('razorpay');
const QRCode = require('qrcode');
const Settings = require('../models/Settings');
const Payment = require('../models/Payment');
const Card = require('../models/card');
const Analytics = require('../models/Analytics');
const Wallet = require('../models/Wallet');
const { sendPaymentSuccessEmail } = require('../utils/email');

const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret_key',
  });
};

// GET Review Page
exports.getReviewPage = async (req, res) => {
  try {
    const cardData = req.session.pendingCardData;
    if (!cardData) {
      return res.redirect('/card/new');
    }

    const settings = await Settings.getSettings();
    if (settings.maintenanceMode) {
      return res.render('503', { message: 'System under scheduled maintenance.' });
    }

    res.render('payment/review', {
      title: 'Review & Confirm Card | NEXO',
      card: cardData,
      settings,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Review Page Error:', error);
    res.status(500).render('404', { message: 'Error loading review page.' });
  }
};

// POST Create Razorpay Order
exports.createOrder = async (req, res) => {
  try {
    const cardData = req.session.pendingCardData;
    if (!cardData) {
      return res.status(400).json({ success: false, message: 'Card session expired. Please start over.' });
    }

    const settings = await Settings.getSettings();
    if (!settings.paymentEnabled) {
      return res.status(400).json({ success: false, message: 'Payments are currently disabled.' });
    }

    const razorpay = getRazorpayInstance();
    const amountInPaise = Math.round(settings.price * 100);

    const options = {
      amount: amountInPaise,
      currency: settings.currency || 'INR',
      receipt: `rcpt_${Date.now().toString().slice(-8)}`,
      notes: {
        userId: req.user._id.toString(),
        handle: cardData.handle,
      },
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      planName: settings.planName,
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment order.' });
  }
};

// POST Verify Razorpay Signature and Execute Fulfillment
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const cardData = req.session.pendingCardData;

    if (!cardData) {
      return res.status(400).json({ success: false, message: 'Session expired. Card data missing.' });
    }

    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET || 'dummy_secret_key';
    const body = razorpay_order_id + '|' + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', razorpaySecret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      const invoiceNumber = await Payment.generateInvoiceNumber();
      const settings = await Settings.getSettings();

      await Payment.create({
        user: req.user._id,
        amount: settings.price,
        currency: settings.currency,
        plan: settings.planName,
        status: 'FAILED',
        invoiceNumber,
        razorpayOrderId: razorpay_order_id || 'UNKNOWN',
        razorpayPaymentId: razorpay_payment_id || '',
        razorpaySignature: razorpay_signature || '',
      });

      return res.status(400).json({ success: false, message: 'Invalid payment signature verification.' });
    }

    const settings = await Settings.getSettings();
    const invoiceNumber = await Payment.generateInvoiceNumber();
    const paymentDate = new Date();

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const liveCardUrl = `${baseUrl}/c/${cardData.handle}`;
    const qrCodeDataUrl = await QRCode.toDataURL(liveCardUrl, { margin: 1, width: 300 });

    const newCard = new Card({
      ...cardData,
      user: req.user._id,
      qrCodeDataUrl,
      isPremium: true,
      paymentStatus: 'PAID',
      paymentPlan: settings.planName,
      paymentAmount: settings.price,
      paymentDate,
    });

    await newCard.save();

    const payment = new Payment({
      user: req.user._id,
      card: newCard._id,
      amount: settings.price,
      currency: settings.currency,
      plan: settings.planName,
      status: 'SUCCESS',
      invoiceNumber,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paymentMethod: 'Razorpay',
      paymentDate,
    });

    await payment.save();

    await Analytics.create({ card: newCard._id });

    await Wallet.findOneAndUpdate(
      { user: req.user._id },
      { $setOnInsert: { user: req.user._id, savedCards: [] } },
      { upsert: true, new: true }
    );

    req.session.lastCompletedPayment = {
      invoiceNumber: payment.invoiceNumber,
      amount: payment.amount,
      plan: payment.plan,
      cardHandle: newCard.handle,
      paymentDate,
    };

    delete req.session.pendingCardData;

    await sendPaymentSuccessEmail({
      to: req.user.email,
      user: req.user,
      payment,
      card: newCard,
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified and card published successfully!',
      redirectUrl: '/payment/success',
    });
  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ success: false, message: 'Server error during payment verification.' });
  }
};

// GET Success Page
exports.getSuccessPage = async (req, res) => {
  const paymentDetails = req.session.lastCompletedPayment || null;
  res.render('payment/success', {
    title: 'Payment Successful | NEXO',
    paymentDetails,
  });
};

// GET Failed Page
exports.getFailedPage = (req, res) => {
  res.render('payment/failed', {
    title: 'Payment Failed | NEXO',
  });
};