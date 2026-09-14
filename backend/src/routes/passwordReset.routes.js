import { Router } from 'express';
import { body } from 'express-validator';
import { forgotPassword, verifyResetOTP, resetPassword } from '../controllers/passwordReset.controller.js';
import { validate } from '../middleware/validate.js';
import { sanitizeInput } from '../middleware/sanitize.js';
import { passwordResetLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/auth/forgot-password', passwordResetLimiter, sanitizeInput, [body('email').isEmail().withMessage('Valid email required').normalizeEmail()], validate, forgotPassword);
router.post('/auth/verify-reset-otp', sanitizeInput, [body('email').isEmail().normalizeEmail(), body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')], validate, verifyResetOTP);
router.post('/auth/reset-password', sanitizeInput, [body('email').isEmail().normalizeEmail(), body('resetToken').notEmpty(), body('newPassword').isLength({ min: 8 })], validate, resetPassword);

export default router;
