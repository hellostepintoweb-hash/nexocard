const express = require('express');
const router = express.Router();
const Card = require('../models/card');
const upload = require('../middleware/upload');
const { uploadToCloudinary } = require('../config/cloudinary');

const ensureAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/login');
};

router.get('/card/new', ensureAuth, (req, res) => {
  res.render('card/builder', {
    title: 'Create Digital Card | NEXO',
    card: null,
    errors: [],
  });
});

// Intercept save, store payload in express-session, and redirect to payment review
router.post('/card/create', ensureAuth, upload.single('profilePhoto'), async (req, res) => {
  try {
    const {
      slug,
      fullName,
      designation,
      company,
      about,
      phone,
      whatsapp,
      email,
      website,
      address,
      googleMapUrl,
      socialLinks,
      theme,
    } = req.body;

    let profilePhotoUrl = '';
    if (req.file && req.file.buffer) {
      const result = await uploadToCloudinary(req.file.buffer);
      profilePhotoUrl = result.secure_url;
    }

    let parsedSocialLinks = [];
    if (socialLinks) {
      try {
        parsedSocialLinks = typeof socialLinks === 'string' ? JSON.parse(socialLinks) : socialLinks;
      } catch (e) {}
    }

    let parsedTheme = {};
    if (theme) {
      try {
        parsedTheme = typeof theme === 'string' ? JSON.parse(theme) : theme;
      } catch (e) {}
    }

    // Save payload into session
    req.session.pendingCardData = {
      handle: slug ? slug.trim().toLowerCase() : '',
      fullName: fullName ? fullName.trim() : '',
      title: designation ? designation.trim() : '',
      company: company ? company.trim() : '',
      about: about ? about.trim() : '',
      phone: phone ? phone.trim() : '',
      whatsapp: whatsapp ? whatsapp.trim() : '',
      email: email ? email.trim() : '',
      website: website ? website.trim() : '',
      address: address ? address.trim() : '',
      googleMapUrl: googleMapUrl ? googleMapUrl.trim() : '',
      profilePhoto: profilePhotoUrl,
      socialLinks: parsedSocialLinks,
      theme: parsedTheme,
    };

    // Force session to save before redirecting
    req.session.save((err) => {
      if (err) {
        console.error('Session Save Error:', err);
        return res.status(500).render('card/builder', {
          title: 'Create Digital Card | NEXO',
          card: null,
          errors: [{ msg: 'Failed to save session data.' }],
          formData: req.body,
        });
      }
      return res.redirect('/payment/review');
    });

  } catch (error) {
    console.error('Card Creation Intercept Error:', error);
    return res.status(500).render('card/builder', {
      title: 'Create Digital Card | NEXO',
      card: null,
      errors: [{ msg: error.message || 'Failed to process card input.' }],
      formData: req.body,
    });
  }
});

router.get('/card/edit/:id', ensureAuth, async (req, res) => {
  try {
    const card = await Card.findOne({ _id: req.params.id, user: req.user._id });
    if (!card) {
      return res.status(404).render('404', { message: 'Card not found or unauthorized.' });
    }
    res.render('card/builder', {
      title: 'Edit Digital Profile | NEXO',
      card,
      errors: [],
    });
  } catch (error) {
    res.status(500).render('404', { message: 'Error fetching card details.' });
  }
});

router.post('/card/edit/:id', ensureAuth, upload.single('profilePhoto'), async (req, res) => {
  try {
    const card = await Card.findOne({ _id: req.params.id, user: req.user._id });
    if (!card) {
      return res.status(404).render('404', { message: 'Card not found or unauthorized.' });
    }

    const {
      slug,
      fullName,
      designation,
      company,
      about,
      phone,
      whatsapp,
      email,
      website,
      address,
      googleMapUrl,
      socialLinks,
      theme,
    } = req.body;

    if (req.file && req.file.buffer) {
      const result = await uploadToCloudinary(req.file.buffer);
      card.profilePhoto = result.secure_url;
    }

    if (slug) card.handle = slug.trim().toLowerCase();
    if (fullName) card.fullName = fullName.trim();
    if (designation !== undefined) card.title = designation.trim();
    if (company !== undefined) card.company = company.trim();
    if (about !== undefined) card.about = about.trim();
    if (phone !== undefined) card.phone = phone.trim();
    if (whatsapp !== undefined) card.whatsapp = whatsapp.trim();
    if (email !== undefined) card.email = email.trim();
    if (website !== undefined) card.website = website.trim();
    if (address !== undefined) card.address = address.trim();
    if (googleMapUrl !== undefined) card.googleMapUrl = googleMapUrl.trim();

    if (socialLinks) {
      try {
        const parsed = typeof socialLinks === 'string' ? JSON.parse(socialLinks) : socialLinks;
        if (Array.isArray(parsed)) card.socialLinks = parsed;
      } catch (e) {}
    }

    if (theme) {
      try {
        card.theme = typeof theme === 'string' ? JSON.parse(theme) : theme;
      } catch (e) {}
    }

    await card.save();
    return res.redirect('/dashboard');
  } catch (error) {
    const card = await Card.findById(req.params.id);
    return res.status(500).render('card/builder', {
      title: 'Edit Digital Profile | NEXO',
      card,
      errors: [{ msg: error.message || 'Failed to update card details.' }],
    });
  }
});

router.get('/c/:handle', async (req, res) => {
  try {
    const card = await Card.findOne({ handle: req.params.handle.toLowerCase() });
    if (!card) {
      return res.status(404).render('404', { message: 'Nexo Profile Card not found.' });
    }

    let isSavedInWallet = false;
    if (req.isAuthenticated() && req.user.wallet) {
      isSavedInWallet = req.user.wallet.some((id) => id.toString() === card._id.toString());
    }

    res.render('card/public', { card, isSavedInWallet });
  } catch (error) {
    res.status(500).render('404', { message: 'Error loading profile card.' });
  }
});

router.get('/api/check-slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { cardId } = req.query;
    const formattedSlug = slug.trim().toLowerCase();
    const query = { handle: formattedSlug };

    if (cardId) query._id = { $ne: cardId };

    const existingCard = await Card.findOne(query);
    return res.json({ available: !existingCard, handle: formattedSlug });
  } catch (error) {
    return res.status(500).json({ available: false, error: 'Server error' });
  }
});

router.delete('/card/delete/:id', ensureAuth, async (req, res) => {

    try {

        const card = await Card.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!card) {
            return res.status(404).json({
                success:false,
                error:'Card not found'
            });
        }

        const Wallet = require('../models/Wallet');

        await Wallet.updateMany(
            {},
            {
                $pull:{
                    savedCards:card._id
                }
            }
        );

        await Card.findByIdAndDelete(card._id);

        res.json({
            success:true
        });

    } catch(err){

        console.log(err);

        res.status(500).json({
            success:false,
            error:'Server Error'
        });

    }

});


module.exports = router;