/**
 * ═══════════════════════════════════════════════════════════════════
 *  Mera Raasta — Gmail Email Relay (Google Apps Script)
 * ═══════════════════════════════════════════════════════════════════
 *
 *  KYUN? Render free tier SMTP ports (25, 465, 587) block karta hai.
 *  Isliye ye script Gmail ke through HTTPS par email bhejti hai.
 *  Koi naya account/signup nahi chahiye — aapka Gmail hi use hota hai.
 *
 *  SETUP (5 minute):
 *  1. https://script.google.com kholo → "New project"
 *  2. Neeche wala poora code copy-paste karo
 *  3. SECRET ko kisi lambi random string se badlo (yaad rakhna!)
 *  4. Deploy → New deployment → type: "Web app"
 *       - Description: Mera Raasta Email Relay
 *       - Execute as: Me
 *       - Who has access: Anyone          <-- IMPORTANT
 *     → Deploy → Authorize access → Allow
 *  5. "Web app URL" copy karo (https://script.google.com/macros/s/.../exec)
 *  6. Render Dashboard → backend service → Environment me add karo:
 *       GAS_EMAIL_URL    = <copied URL>
 *       GAS_EMAIL_SECRET = <same secret jo yahan daala>
 *  7. Render par "Manual Deploy → Deploy latest commit" karo
 *
 *  NOTE: Consumer Gmail par free quota ~100 recipients/day hai.
 *        Chhote project ke liye kaafi hai.
 * ═══════════════════════════════════════════════════════════════════
 */

// 🔴 Isse badlo — Render ke GAS_EMAIL_SECRET me bhi bilkul yahi value daalni hai
const SECRET = 'mera-raasta-CHANGE-ME-TO-A-LONG-RANDOM-SECRET';

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, error: 'empty request' });
    }

    const body = JSON.parse(e.postData.contents);

    // Security: bina secret ke koi bhi is URL se spam na bhej sake
    if (String(body.secret || '') !== SECRET) {
      return jsonResponse({ success: false, error: 'unauthorized' });
    }

    const to = String(body.to || '').trim();
    const subject = String(body.subject || 'Mera Raasta');
    const html = String(body.html || '');
    const fromName = String(body.fromName || 'Mera Raasta');

    if (!to || !html) {
      return jsonResponse({ success: false, error: 'to and html are required' });
    }

    MailApp.sendEmail({
      to: to,
      subject: subject,
      htmlBody: html,
      name: fromName,
    });

    return jsonResponse({ success: true });
  } catch (err) {
    return jsonResponse({
      success: false,
      error: String(err && err.message ? err.message : err),
    });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Optional test — Apps Script editor me ye function select karke "Run" dabao.
 * Apne hi Gmail par ek test email aayega.
 */
function testSend() {
  MailApp.sendEmail({
    to: Session.getActiveUser().getEmail(),
    subject: 'Mera Raasta email relay test',
    htmlBody: '<h2>✅ Gmail relay working!</h2><p>Ab Mera Raasta OTP emails bhej sakta hai.</p>',
    name: 'Mera Raasta',
  });
}
