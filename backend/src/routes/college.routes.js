import { Router } from 'express';
import { getCollegesByCity, getCollegeDetail, searchColleges, getAllCities, getCollegesNearby } from '../controllers/college.controller.js';

const router = Router();

// ═══ Public routes — Login ki zaroorat nahi ═══
router.get('/colleges', getCollegesByCity);           // City/type/tag se colleges dhundho
router.get('/colleges/cities', getAllCities);          // Saari cities list karo
router.get('/colleges/search', searchColleges);       // Free text search
router.get('/colleges/:slug', getCollegeDetail);       // Single college detail
router.post('/colleges/nearby', getCollegesNearby);   // Location + budget based nearby colleges

export default router;