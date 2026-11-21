import { Router } from 'express';
import { getCollegesByCity, getCollegeDetail, searchColleges, getAllCities, getCollegesNearby } from '../controllers/college.controller.js';

const router = Router();

// ═══ Public routes — Login ki zaroorat nahi ═══
// NOTE: /colleges path education.routes.js me bhi hai (education wala data).
// Isliye nearby-colleges ke liye alag namespace use karte hain — warna
// /colleges/cities ko education ka /colleges/:slug pakad leta hai (404 bug).
router.get('/nearby-colleges', getCollegesByCity);            // City/type/tag se colleges dhundho
router.get('/nearby-colleges/cities', getAllCities);          // Saari cities list karo
router.get('/nearby-colleges/search', searchColleges);        // Free text search
router.get('/nearby-colleges/:slug', getCollegeDetail);       // Single college detail
router.post('/nearby-colleges/nearby', getCollegesNearby);    // Location + budget based nearby colleges

export default router;
