const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');

/**
 * Configure Multipurpose Secure Memory Buffer Storage Engine for Multer
 * Imposes strong runtime validation rules over asset parameters
 */
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp|svg/;
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];

  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Security Breach: Uploaded file must be a valid system image format (JPEG, JPG, PNG, WEBP, SVG)'));
};

// Expose configured multipart receiver middleware with a strict 5MB single file asset buffer roof
exports.upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

/**
 * Express-Validator Orchestration ruleset targeting clean user registration
 */
exports.validateRegistration = [
  body('name')
    .trim()
    .notEmpty().withMessage('Display name configuration cannot be sent empty')
    .isLength({ max: 60 }).withMessage('Display name must not exceed 60 characters'),
  body('mobile')
    .trim()
    .notEmpty().withMessage('Mobile contact parameter is mandatory')
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage('Please supply a standard international E.164 compliant phone format'),
  body('email')
    .trim()
    .notEmpty().withMessage('Account communication email must be declared')
    .isEmail().withMessage('Target parameter is not recognized as a standard semantic email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Security constraint violation: Password must be at least 8 characters long')
    .matches(/\d/).withMessage('Password must contain at least one numeric character')
    .matches(/[A-Z]/).withMessage('Password must include at least one uppercase letter')
];

/**
 * Express-Validator dynamic parsing interception ruleset for Digital Cards
 */
exports.validateCardData = [
  body('name')
    .trim()
    .notEmpty().withMessage('Card display name definition cannot be left empty')
    .isLength({ max: 80 }).withMessage('Card name string length cannot exceed 80 characters'),
  body('slug')
    .trim()
    .notEmpty().withMessage('System access routing slug path is required')
    .matches(/^[a-zA-Z0-9-_]+$/).withMessage('Slug can only contain alphanumeric characters, hyphens, and underscores')
    .isLength({ min: 3, max: 60 }).withMessage('Slug matrix must measure between 3 and 60 index positions'),
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail().withMessage('Supplied routing email parameter structure is invalid')
    .normalizeEmail(),
  body('website')
    .optional({ checkFalsy: true })
    .trim()
    .isURL({ require_protocol: true }).withMessage('Provided website must be a completely valid canonical URL starting with http:// or https://'),
  body('googleMapUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL({ require_protocol: true }).withMessage('Google Maps reference value must be a verified absolute URL anchor')
];

/**
 * Structural Evaluation Check Interceptor Middleware
 */
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.xhr || req.headers.accept.includes('application/json')) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    // Determine context path fallback to gracefully preserve validation states on standard views
    const fallbackTemplate = req.path.includes('edit') ? 'edit' : (req.path.includes('login') || req.path.includes('register') ? 'login' : 'dashboard');
    return res.status(400).render(fallbackTemplate, {
      error: errors.array()[0].msg,
      success: null,
      formData: req.body
    });
  }
  next();
};