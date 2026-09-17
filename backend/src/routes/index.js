import { Router } from 'express';
import mongoose from 'mongoose';
import authRoutes from './auth.routes.js';
import profileRoutes from './profile.routes.js';
import careerRoutes from './career.routes.js';
import educationRoutes from './education.routes.js';
import roadmapRoutes from './roadmap.routes.js';
import careerReadinessRoutes from './careerReadiness.routes.js';
import aiCommunityRoutes from './aiCommunity.routes.js';
import lmsQuizRoutes from './lmsQuiz.routes.js';
import passwordResetRoutes from './passwordReset.routes.js';
import parentRoutes from './parent.routes.js';
import mentorRoutes from './mentor.routes.js';
import activityRoutes from './activity.routes.js';
import collegeRoutes from './college.routes.js';
import locationRoutes from './location.routes.js';

const router = Router();
router.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.status(200).json({ success: true, api: 'ok', database: dbStates[dbState] || 'unknown', timestamp: new Date().toISOString() });
});
router.use(authRoutes, profileRoutes, careerRoutes, educationRoutes, roadmapRoutes, careerReadinessRoutes, aiCommunityRoutes, lmsQuizRoutes, passwordResetRoutes, parentRoutes, mentorRoutes, activityRoutes, collegeRoutes, locationRoutes);
export default router;
