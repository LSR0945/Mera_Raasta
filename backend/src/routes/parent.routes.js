import { Router } from 'express';
import { getChildren, addChild, getChild, getChildRoadmap } from '../controllers/parent.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/parent/children', authenticate, authorize('parent'), getChildren);
router.post('/parent/children', authenticate, authorize('parent'), addChild);
router.get('/parent/children/:childId', authenticate, authorize('parent'), getChild);
router.get('/parent/children/:childId/roadmap', authenticate, authorize('parent'), getChildRoadmap);

export default router;
