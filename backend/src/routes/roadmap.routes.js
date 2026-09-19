import { Router } from 'express';
import { getMyRoadmap, createRoadmap, updateNodeProgress, generateFromForm, updateRoadmap, deleteRoadmap } from '../controllers/roadmap.controller.js';
import { getNextBestActions, refreshNextBestActions, dismissAction } from '../controllers/nextBestAction.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.get('/roadmap', authenticate, getMyRoadmap);
router.post('/roadmap', authenticate, createRoadmap);
router.post('/roadmap/generate', authenticate, generateFromForm);
router.put('/roadmap', authenticate, updateRoadmap);
router.delete('/roadmap', authenticate, deleteRoadmap);
router.put('/roadmap/node/:nodeId', authenticate, updateNodeProgress);
router.get('/next-best-action', authenticate, getNextBestActions);
router.post('/next-best-action/refresh', authenticate, refreshNextBestActions);
router.put('/next-best-action/dismiss/:actionIndex', authenticate, dismissAction);
export default router;
