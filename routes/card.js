const express = require('express');
const router = express.Router();
const Card = require('../models/card');
const upload = require('../middleware/upload');
const Analytics = require('../models/Analytics');
const { uploadToCloudinary } = require('../config/cloudinary');

const ensureAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/login');
};

// =====================================================
// CHECK HANDLE / SLUG AVAILABILITY
// GET /api/check-slug/:slug
// =====================================================
router.get('/api/check-slug/:slug', async (req, res) => {
  try {
    const slug = (req.params.slug || '').trim().toLowerCase();
    const currentCardId = req.query.cardId || null;

    // Basic validation
    if (!slug) {
      return res.status(400).json({
        available: false,
        message: 'Slug is required'
      });
    }

    // Only allow safe characters
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(200).json({
        available: false,
        handle: slug,
        message: 'Only letters, numbers and hyphens are allowed'
      });
    }

    // Find an existing card with this handle
    const existingCard = await Card.findOne({
      handle: slug
    }).select('_id handle');

    // Editing an existing card:
    // If this is the same card, the slug is still available.
    if (
      existingCard &&
      currentCardId &&
      existingCard._id.toString() === currentCardId.toString()
    ) {
      return res.status(200).json({
        available: true,
        handle: slug,
        message: 'Slug is available'
      });
    }

    // Slug already belongs to another card
    if (existingCard) {
      return res.status(200).json({
        available: false,
        handle: slug,
        message: 'Slug is already taken'
      });
    }

    // Slug is free
    return res.status(200).json({
      available: true,
      handle: slug,
      message: 'Slug is available'
    });

  } catch (error) {
    console.error('Slug availability check error:', error);

    return res.status(500).json({
      available: false,
      message: 'Unable to check slug availability'
    });
  }
});

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
    // 1. Keep your exact working database lookup with lowercase handle
    const handle = req.params.handle ? req.params.handle.toLowerCase() : '';
    const card = await Card.findOne({ handle });

    if (!card) {
      return res.status(404).render('404', { message: 'Nexo Profile Card not found.' });
    }

    await Analytics.findOneAndUpdate(
      { card: card._id },
      { $inc: { views: 1 } },
      { upsert: true, new: true }
    );
    // --------------------------------------------

    // 2. Wallet check (unmodified)
    let isSavedInWallet = false;
    if (req.isAuthenticated() && req.user && req.user.wallet) {
      isSavedInWallet = req.user.wallet.some((id) => id.toString() === card._id.toString());
    }

    // 3. Build SEO metadata dynamically with fallback values
    const fullName = card.fullName || card.name || 'User';
    const title = card.title || card.designation || '';
    const company = card.company || card.organization || '';
    const about = card.about || card.bio || '';

    // Title construction
    let seoTitle = `${fullName} | NEXO Digital Card`;
    if (fullName && title && company) {
      seoTitle = `${fullName} | ${title} at ${company} | NEXO`;
    } else if (fullName && title) {
      seoTitle = `${fullName} | ${title} | NEXO`;
    }

    // Description construction
    let seoDescription = about.trim().replace(/\s+/g, ' ');
    if (!seoDescription) {
      seoDescription = `Connect with ${fullName}${title ? `, ${title}` : ''}${company ? ` at ${company}` : ''}. View contact details, social links, and digital card on NEXO.`;
    }
    if (seoDescription.length > 155) {
      seoDescription = seoDescription.substring(0, 152) + '...';
    }

    // Profile Image absolute URL fallback
    let seoImage = 'https://nexocard.in/images/og-default.jpg';
    if (card.profileImage) {
      if (card.profileImage.startsWith('http://') || card.profileImage.startsWith('https://')) {
        seoImage = card.profileImage;
      } else {
        const cleanPath = card.profileImage.startsWith('/') ? card.profileImage : `/${card.profileImage}`;
        seoImage = `https://nexocard.in${cleanPath}`;
      }
    }

    const canonicalUrl = `https://nexocard.in/c/${card.handle}`;

    // 4. Render 'card/public' with both your original variables and the new SEO object
    res.render('card/public', {
      card,
      isSavedInWallet,
      seo: {
        title: seoTitle,
        description: seoDescription,
        canonicalUrl,
        image: seoImage
      }
    });

  } catch (error) {
    console.error('Error loading profile card:', error);
    res.status(500).render('404', { message: 'Error loading profile card.' });
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


// Add helper to escape vCard string fields according to vCard standard
const escapeVCardField = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
};

// GET /c/:handle/vcard - Dynamic vCard download route
router.get('/c/:handle/vcard', async (req, res) => {
  try {
    const rawHandle = req.params.handle || '';
    const cleanHandle = rawHandle.trim().toLowerCase();

    // Query card using schema handle property
    const card = await Card.findOne({ handle: cleanHandle });

    // Handle non-existent cards using existing NEXO 404 response
    if (!card) {
      return res.status(404).render('404', { message: 'Nexo Profile Card not found.' });
    }

    const hostUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const cardSlug = card.handle;
    const displayName = card.fullName || 'Contact';

    // Build vCard 3.0 fields safely
    let vCardLines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${escapeVCardField(displayName)}`,
      `N:${escapeVCardField(displayName.split(' ').reverse().join(';'))};;;`
    ];

    if (card.company) {
      vCardLines.push(`ORG:${escapeVCardField(card.company)}`);
    }

    if (card.title) {
      vCardLines.push(`TITLE:${escapeVCardField(card.title)}`);
    }

    if (card.phone) {
      const cleanPhone = card.phone.replace(/[^0-9+]/g, '');
      if (cleanPhone) {
        vCardLines.push(`TEL;TYPE=CELL:${cleanPhone}`);
      }
    }

    if (card.email) {
      vCardLines.push(`EMAIL;TYPE=INTERNET:${escapeVCardField(card.email)}`);
    }

    if (card.website) {
      const formattedUrl = card.website.startsWith('http') ? card.website : `https://${card.website}`;
      vCardLines.push(`URL:${escapeVCardField(formattedUrl)}`);
    } else {
      vCardLines.push(`URL:${escapeVCardField(`${hostUrl}/c/${cardSlug}`)}`);
    }

    if (card.address) {
      vCardLines.push(`ADR;TYPE=WORK:;;${escapeVCardField(card.address)};;;;`);
    }

    if (card.profilePhoto || card.avatarUrl) {
      const photoUrl = card.profilePhoto || card.avatarUrl;
      if (photoUrl && photoUrl.startsWith('http')) {
        vCardLines.push(`PHOTO;VALUE=URL:${photoUrl}`);
      }
    }

    vCardLines.push('END:VCARD');

    const vCardContent = vCardLines.join('\r\n');

    // Sanitize filename for header
    const safeFilename = cardSlug.replace(/[^a-zA-Z0-9_-]/g, '_');

    // Set correct headers for instant download
    res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.vcf"`);

    return res.status(200).send(vCardContent);

  } catch (error) {
    console.error('vCard Generation Error:', error);
    return res.status(500).render('404', { message: 'Error generating contact file.' });
  }
});




module.exports = router;
