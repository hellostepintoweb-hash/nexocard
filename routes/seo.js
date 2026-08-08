const express = require('express');
const router = express.Router();
const Card = require('../models/card');

const DOMAIN = 'https://nexocard.in';

/**
 * Escape XML special characters to prevent malformed XML
 */
function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * GET /robots.txt
 */
router.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  const robotsTxt = `User-agent: *
Allow: /

Disallow: /dashboard
Disallow: /admin
Disallow: /login
Disallow: /register
Disallow: /auth
Disallow: /card
Disallow: /wallet

Sitemap: ${DOMAIN}/sitemap.xml
`;
  res.send(robotsTxt.trim());
});

/**
 * GET /sitemap.xml
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    // 1. Static site routes that exist in NEXO
    const staticPages = [
      '',
      '/about',
      '/contact',
      '/faq',
      '/privacy-policy',
      '/terms',
      '/refund-policy'
    ];

    // 2. Fetch active and public cards with valid handle
    const publicCards = await Card.find({
      handle: { $exists: true, $ne: '' }
    }).select('handle updatedAt').lean();

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Append static pages
    staticPages.forEach((route) => {
      xml += '  <url>\n';
      xml += `    <loc>${DOMAIN}${route}</loc>\n`;
      xml += '  </url>\n';
    });

    // Append dynamic card pages
    publicCards.forEach((card) => {
      const handle = escapeXml(card.handle);
      xml += '  <url>\n';
      xml += `    <loc>${DOMAIN}/c/${handle}</loc>\n`;
      if (card.updatedAt) {
        xml += `    <lastmod>${new Date(card.updatedAt).toISOString()}</lastmod>\n`;
      }
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (err) {
    console.error('Sitemap Generation Error:', err);
    res.status(500).send('Error generating sitemap.xml');
  }
});

module.exports = router;
