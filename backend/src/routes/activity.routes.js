import { Router } from 'express';
import { getMyActivities, getChildActivities, getChildStats } from '../controllers/activity.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.get('/activities/me', authenticate, getMyActivities);
router.get('/activities/child/:childId', authenticate, authorize('parent'), getChildActivities);
router.get('/activities/child/:childId/stats', authenticate, authorize('parent'), getChildStats);

export default router;
