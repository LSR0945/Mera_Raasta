import { Router } from 'express';
import { getAllProjects, getProjectBySlug, getAllInternships, getInternshipBySlug, getAllJobs, getJobBySlug, getAllInterviews, getInterviewBySlug } from '../controllers/careerReadiness.controller.js';

const router = Router();
router.get('/projects', getAllProjects);
router.get('/projects/:slug', getProjectBySlug);
router.get('/internships', getAllInternships);
router.get('/internships/:slug', getInternshipBySlug);
router.get('/jobs', getAllJobs);
router.get('/jobs/:slug', getJobBySlug);
router.get('/interviews', getAllInterviews);
router.get('/interviews/:slug', getInterviewBySlug);
export default router;
