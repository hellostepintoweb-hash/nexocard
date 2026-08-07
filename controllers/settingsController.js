const Settings = require('../models/Settings');

exports.getSettingsPage = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.render('admin/settings', {
      title: 'Admin Settings | NEXO',
      settings,
      messages: { success: req.flash ? req.flash('success') : null, error: req.flash ? req.flash('error') : null },
    });
  } catch (error) {
    console.error('Admin Settings Fetch Error:', error);
    res.status(500).render('404', { message: 'Unable to load Admin Settings.' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const {
      planName,
      price,
      currency,
      paymentType,
      offerText,
      offerEnabled,
      paymentEnabled,
      maintenanceMode,
      companyName,
      companyAddress,
      supportEmail,
      supportPhone,
      whatsappNumber,
    } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    settings.planName = planName ? planName.trim() : settings.planName;
    settings.price = price !== undefined ? Number(price) : settings.price;
    settings.currency = currency ? currency.trim().toUpperCase() : settings.currency;
    settings.paymentType = paymentType ? paymentType.trim() : settings.paymentType;
    settings.offerText = offerText ? offerText.trim() : settings.offerText;
    settings.offerEnabled = offerEnabled === 'on' || offerEnabled === 'true' || offerEnabled === true;
    settings.paymentEnabled = paymentEnabled === 'on' || paymentEnabled === 'true' || paymentEnabled === true;
    settings.maintenanceMode = maintenanceMode === 'on' || maintenanceMode === 'true' || maintenanceMode === true;
    settings.companyName = companyName ? companyName.trim() : settings.companyName;
    settings.companyAddress = companyAddress ? companyAddress.trim() : settings.companyAddress;
    settings.supportEmail = supportEmail ? supportEmail.trim().toLowerCase() : settings.supportEmail;
    settings.supportPhone = supportPhone ? supportPhone.trim() : settings.supportPhone;
    settings.whatsappNumber = whatsappNumber ? whatsappNumber.trim() : settings.whatsappNumber;

    await settings.save();

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(200).json({ success: true, message: 'Settings updated dynamically.', settings });
    }

    res.redirect('/admin/settings');
  } catch (error) {
    console.error('Update Settings Error:', error);
    res.status(500).render('admin/settings', {
      title: 'Admin Settings | NEXO',
      settings: req.body,
      error: 'Failed to update settings.',
    });
  }
};