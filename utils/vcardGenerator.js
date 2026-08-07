/**
 * Generates an RFC 6350 compliant vCard string from a Card document.
 * @param {Object} card - Card object populated with contact information
 * @returns {string} Standard vCard text string
 */
function generateVCard(card) {
  const nameParts = card.fullName ? card.fullName.trim().split(' ') : [''];
  const lastName = nameParts.length > 1 ? nameParts.pop() : '';
  const firstName = nameParts.join(' ');

  let vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${lastName};${firstName};;;`,
    `FN:${card.fullName || ''}`,
    `ORG:${card.company || ''}`,
    `TITLE:${card.title || ''}`,
  ];

  if (card.contactInfo?.email) {
    vcard.push(`EMAIL;TYPE=INTERNET,PREF:${card.contactInfo.email}`);
  }

  if (card.contactInfo?.phone) {
    vcard.push(`TEL;TYPE=CELL:${card.contactInfo.phone}`);
  }

  if (card.contactInfo?.website) {
    vcard.push(`URL:${card.contactInfo.website}`);
  }

  if (card.contactInfo?.location) {
    vcard.push(`ADR;TYPE=WORK:;;${card.contactInfo.location};;;;`);
  }

  if (card.bio) {
    vcard.push(`NOTE:${card.bio.replace(/\n/g, '\\n')}`);
  }

  // Append social links
  if (Array.isArray(card.socialLinks)) {
    card.socialLinks.forEach((link) => {
      if (link.url) {
        vcard.push(`URL;TYPE=${link.platform.toUpperCase()}:${link.url}`);
      }
    });
  }

  vcard.push('END:VCARD');

  return vcard.join('\r\n');
}

module.exports = { generateVCard };