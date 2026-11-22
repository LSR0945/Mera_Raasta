import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, logout, refreshToken, getMe, updateProfile, changePassword, verifyEmail, resendVerification } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { sanitizeInput } from '../middleware/sanitize.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/auth/register', sanitizeInput, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().isIn(['student', 'parent', 'mentor', 'admin']),
], validate, register);

router.post('/auth/login', sanitizeInput, [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
], validate, login);

// Email verification — link click par frontend ye API call karta hai
router.get('/auth/verify-email', verifyEmail);
router.post('/auth/verify-email', verifyEmail);
router.post('/auth/resend-verification', sanitizeInput, [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
], validate, resendVerification);

router.post('/auth/logout', authenticate, logout);
router.post('/auth/refresh', refreshToken);
router.get('/auth/me', authenticate, getMe);
router.put('/auth/profile', authenticate, sanitizeInput, updateProfile);
router.put('/auth/change-password', authenticate, sanitizeInput, [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
], validate, changePassword);

// Public change password (from login page)
router.post('/auth/change-password', sanitizeInput, [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
], validate, changePassword);

export default router;
