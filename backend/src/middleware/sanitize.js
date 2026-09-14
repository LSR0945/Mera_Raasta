import sanitizeHtml from 'sanitize-html';

const SKIP_KEYS = ['password', 'confirmPassword', 'currentPassword', 'newPassword', 'refreshToken'];

export const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (SKIP_KEYS.includes(key)) continue;
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeHtml(req.body[key], { allowedTags: [], allowedAttributes: {} });
      }
    }
  }
  next();
};
