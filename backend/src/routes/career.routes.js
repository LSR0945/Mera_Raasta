import { Router } from 'express';
import { getAllCareers, getCareerBySlug, getCareerById, compareCareers, getRecommendations, refreshRecommendations, getRecommendationHistory } from '../controllers/career.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.get('/careers', getAllCareers);
router.get('/careers/compare', compareCareers);
router.get('/careers/recommendations', authenticate, authorize('student'), getRecommendations);
router.post('/careers/recommendations/refresh', authenticate, authorize('student'), refreshRecommendations);
router.get('/careers/recommendations/history', authenticate, authorize('student'), getRecommendationHistory);
router.get('/careers/detail/:id', getCareerById);
router.get('/careers/:slug', getCareerBySlug);
export default router;
