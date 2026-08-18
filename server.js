const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const connectDB = require('./config/db');
const Settings = require('./models/Settings');
const seoRoutes = require('./routes/seo');
const landingRoutes = require('./routes/landing');

dotenv.config();
connectDB();

const app = express();

require('./config/passport')(passport);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'nexo_production_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nexo_card_db',
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(async (req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.error = null;
  res.locals.success = null;
  try {
    res.locals.siteSettings = await Settings.getSettings();
  } catch (err) {
    res.locals.siteSettings = {};
  }
  next();
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'NEXO Engine running normally.' });
});

app.get('/', async (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/dashboard');
  }
  const settings = await Settings.getSettings();
  return res.render('index', {
    title: 'NEXO - The Smartest Way to Share Your Business Identity',
    settings,
  });
});

app.use('/', seoRoutes);
// Authentication Routes
app.use('/auth', require('./routes/auth'));



// Administrative Routes (MUST be mounted before generic card routes)
app.use('/', require('./routes/admin'));
app.use('/', require('./routes/settings'));
app.use('/', landingRoutes);

// Application & Operational Routes
app.use('/', require('./routes/dashboard'));
app.use('/', require('./routes/wallet'));
app.use('/', require('./routes/payment'));
app.use('/', require('./routes/analytics'));
// Add corporate route registration directly before dynamic card handle matching
app.use('/', require('./routes/corporate'));


// Card Routes (Handles dynamic handles /c/:handle)
app.use('/', require('./routes/card'));

// 404 Catch-All Handler
app.use((req, res) => {
  res.status(404).render('404', { message: 'Page or resource not found.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`NEXO SaaS Platform active in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
