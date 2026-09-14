import { Router } from 'express';
import { getAllCourses, getCourseBySlug, getAllColleges, getCollegeBySlug, getAllScholarships, getScholarshipBySlug, getAllGovernment, getGovernmentBySlug } from '../controllers/education.controller.js';

const router = Router();
router.get('/courses', getAllCourses);
router.get('/courses/:slug', getCourseBySlug);
router.get('/colleges', getAllColleges);
router.get('/colleges/:slug', getCollegeBySlug);
router.get('/scholarships', getAllScholarships);
router.get('/scholarships/:slug', getScholarshipBySlug);
router.get('/government', getAllGovernment);
router.get('/government/:slug', getGovernmentBySlug);
export default router;
