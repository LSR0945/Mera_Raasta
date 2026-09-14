import { Router } from 'express';
import { getStudents, getStats, getStudentDetail, getStudentRoadmap, getStudentNotes, addStudentNote, getReviews } from '../controllers/mentor.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/mentor/students', authenticate, authorize('mentor'), getStudents);
router.get('/mentor/stats', authenticate, authorize('mentor'), getStats);
router.get('/mentor/students/:studentId', authenticate, authorize('mentor'), getStudentDetail);
router.get('/mentor/students/:studentId/roadmap', authenticate, authorize('mentor'), getStudentRoadmap);
router.get('/mentor/students/:studentId/notes', authenticate, authorize('mentor'), getStudentNotes);
router.post('/mentor/students/:studentId/notes', authenticate, authorize('mentor'), addStudentNote);
router.get('/mentor/reviews', authenticate, authorize('mentor'), getReviews);

export default router;
