import Location from '../models/Location.js';

// ═══ getStates — Saare states lao ═══
export const getStates = async (req, res, next) => {
  try {
    const states = await Location.find({ isActive: true }).select('state stateCode type districts.name').sort({ state: 1 });
    res.status(200).json({ success: true, data: { states } });
  } catch (error) { next(error); }
};

// ═══ getDistrictsByState — State ke districts lao ═══
export const getDistrictsByState = async (req, res, next) => {
  try {
    const { state } = req.params;
    const location = await Location.findOne({ stateCode: state }) || await Location.findOne({ state: new RegExp(state, 'i') });
    if (!location) return res.status(404).json({ success: false, message: 'State not found' });
    res.status(200).json({ success: true, data: { districts: location.districts.map(d => d.name), state: location.state } });
  } catch (error) { next(error); }
};

// ═══ getCitiesByDistrict — District ki cities lao ═══
export const getCitiesByDistrict = async (req, res, next) => {
  try {
    const { state, district } = req.params;
    const location = await Location.findOne({ stateCode: state }) || await Location.findOne({ state: new RegExp(state, 'i') });
    if (!location) return res.status(404).json({ success: false, message: 'State not found' });
    const dist = location.districts.find(d => d.name.toLowerCase() === district.toLowerCase());
    if (!dist) return res.status(404).json({ success: false, message: 'District not found' });
    res.status(200).json({ success: true, data: { cities: dist.cities, district: dist.name } });
  } catch (error) { next(error); }
};

// ═══ searchLocations — Location search ═══
export const searchLocations = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, message: 'Search term required' });
    const regex = new RegExp(q, 'i');
    const states = await Location.find({ $or: [{ state: regex }, { stateCode: regex }, { 'districts.name': regex }, { 'districts.cities': regex }] }).sort({ state: 1 }).limit(20);
    const results = states.map(s => ({ state: s.state, stateCode: s.stateCode, type: s.type }));
    res.status(200).json({ success: true, data: { results } });
  } catch (error) { next(error); }
};