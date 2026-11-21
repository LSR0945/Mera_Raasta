import { Router } from 'express';
import { getAllLmsCourses, getLmsCourseBySlug, getAllQuizzes, getQuizBySlug, getMyAttempts } from '../controllers/lmsQuiz.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.get('/lms/courses', getAllLmsCourses);
router.get('/lms/courses/:slug', getLmsCourseBySlug);
router.get('/quizzes', getAllQuizzes);
// /quizzes/my-attempts ko :slug se PEHLE rakho, warna "my-attempts" slug ban jata hai
router.get('/quizzes/my-attempts', authenticate, getMyAttempts);
router.get('/quizzes/:slug', getQuizBySlug);
export default router;
