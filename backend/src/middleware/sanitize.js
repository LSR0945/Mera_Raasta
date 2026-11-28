const SKIP_KEYS = ['password', 'confirmPassword', 'currentPassword', 'newPassword', 'refreshToken'];

// Lightweight zero-dependency HTML/script tag stripper (avoids sanitize-html ERR_REQUIRE_ESM on Vercel)
const stripHtml = (value) =>
  value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '');

export const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (SKIP_KEYS.includes(key)) continue;
      if (typeof req.body[key] === 'string') {
        req.body[key] = stripHtml(req.body[key]);
      }
    }
  }
  next();
};
