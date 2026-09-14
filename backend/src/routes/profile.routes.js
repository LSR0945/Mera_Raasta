import { Router } from 'express';
import { getProfile, upsertProfile, completeOnboarding } from '../controllers/profile.controller.js';
import { authenticate } from '../middleware/auth.js';
import { sanitizeInput } from '../middleware/sanitize.js';

const router = Router();
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, sanitizeInput, upsertProfile);
router.post('/profile/complete-onboarding', authenticate, completeOnboarding);
export default router;
