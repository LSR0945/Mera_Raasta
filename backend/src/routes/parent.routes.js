import { Router } from 'express';
import { getChildren, addChild, getChild, getChildRoadmap, getChildProfile, getParentStats } from '../controllers/parent.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/parent/children', authenticate, authorize('parent'), getChildren);
router.post('/parent/children', authenticate, authorize('parent'), addChild);
router.get('/parent/stats', authenticate, authorize('parent'), getParentStats);
router.get('/parent/children/:childId', authenticate, authorize('parent'), getChild);
router.get('/parent/children/:childId/roadmap', authenticate, authorize('parent'), getChildRoadmap);
router.get('/parent/children/:childId/profile', authenticate, authorize('parent'), getChildProfile);

export default router;
