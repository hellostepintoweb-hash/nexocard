const User = require('../models/User');
const Card = require('../models/Card');
const Payment = require('../models/Payment');
const Analytics = require('../models/Analytics');

// GET Admin Overview Dashboard
exports.getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCards = await Card.countDocuments();

    // Query successful payments for revenue and financial metrics
    const successfulPayments = await Payment.find({ status: 'SUCCESS' }).lean();
    const failedPaymentsCount = await Payment.countDocuments({ status: 'FAILED' });
    const successfulPaymentsCount = successfulPayments.length;

    // Financial Computations
    const totalRevenue = successfulPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayRevenue = successfulPayments
      .filter((p) => new Date(p.paymentDate || p.createdAt) >= startOfToday)
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const arpu = totalUsers > 0 ? (totalRevenue / totalUsers).toFixed(2) : '0.00';
    const premiumUsers = await Card.distinct('user', { isPremium: true });

    // Aggregate Platform Analytics
    const analyticsDocs = await Analytics.find().lean();
    const totalViews = analyticsDocs.reduce((sum, a) => sum + (a.views || 0), 0);
    const totalScans = analyticsDocs.reduce((sum, a) => sum + (a.scans || 0), 0);
    const totalSaves = analyticsDocs.reduce((sum, a) => sum + (a.saves || 0), 0);

    // Recent Transactions Table Data
    const recentPayments = await Payment.find()
      .populate('user', 'name email')
      .populate('card', 'handle')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.render('admin/dashboard', {
      title: 'Founder Analytics & Admin Dashboard | NEXO',
      metrics: {
        totalUsers,
        totalCards,
        totalRevenue,
        successfulPaymentsCount,
        failedPaymentsCount,
        todayRevenue,
        arpu,
        premiumUsersCount: premiumUsers.length,
        totalViews,
        totalScans,
        totalSaves,
      },
      recentPayments,
    });
  } catch (error) {
    console.error('Admin Dashboard Controller Error:', error);
    res.status(500).render('404', { message: 'Unable to load Admin Dashboard.' });
  }
};

// GET Export Payments CSV
exports.exportPaymentsCSV = async (req, res) => {
  try {
    const payments = await Payment.find().populate('user', 'name email').lean();
    let csv = 'Invoice Number,User Name,User Email,Amount,Currency,Plan,Status,Date,Razorpay Order ID,Payment ID\n';

    payments.forEach((p) => {
      const userName = p.user && p.user.name ? p.user.name.replace(/"/g, '""') : 'N/A';
      const userEmail = p.user && p.user.email ? p.user.email : 'N/A';
      const paymentDate = p.paymentDate || p.createdAt;

      csv += `"${p.invoiceNumber}","${userName}","${userEmail}","${p.amount}","${p.currency}","${p.plan}","${p.status}","${paymentDate}","${p.razorpayOrderId || ''}","${p.razorpayPaymentId || ''}"\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment(`NEXO-Payments-Export-${Date.now()}.csv`);
    return res.send(csv);
  } catch (error) {
    console.error('CSV Export Error:', error);
    res.status(500).send('Failed to generate CSV export.');
  }
};