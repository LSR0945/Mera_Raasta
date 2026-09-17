import { Router } from 'express';
import { getStates, getDistrictsByState, getCitiesByDistrict, searchLocations } from '../controllers/location.controller.js';

const router = Router();
router.get('/locations/states', getStates);
router.get('/locations/states/:state/districts', getDistrictsByState);
router.get('/locations/states/:state/districts/:district/cities', getCitiesByDistrict);
router.get('/locations/search', searchLocations);

export default router;