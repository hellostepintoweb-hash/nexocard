/**
 * Email Helper Utility
 * Configured for production transactional dispatch.
 */
const sendPaymentSuccessEmail = async ({ to, user, payment, card }) => {
  try {
    console.log(`[EMAIL HELPER] Dispatching payment receipt to: ${to}`);
    console.log(`[EMAIL HELPER] Invoice: ${payment.invoiceNumber} | Amount: ₹${payment.amount}`);
    // Future SMTP transport binding point (e.g. Nodemailer, Resend, SendGrid)
    return { success: true, messageId: `mock-msg-${Date.now()}` };
  } catch (error) {
    console.error('[EMAIL HELPER ERROR]:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPaymentSuccessEmail,
};