import Location from '../models/Location.js';

// ═══ getStates — Saare states/UTs lao (Government LGD data se) ═══
export const getStates = async (req, res, next) => {
  try {
    const states = await Location.find({ isActive: true })
      .select('state stateCode type districts.name')
      .sort({ state: 1 });
    res.status(200).json({ success: true, data: { states } });
  } catch (error) { next(error); }
};

// ═══ getDistrictsByState — State ke districts lao ═══
// Accepts stateCode (numeric "28") ya state name ("Andhra Pradesh")
export const getDistrictsByState = async (req, res, next) => {
  try {
    const { state } = req.params;
    // Pehle stateCode se dhundho, phir name se
    let location = await Location.findOne({ stateCode: state });
    if (!location) location = await Location.findOne({ state: new RegExp(`^${state}$`, 'i') });
    if (!location) location = await Location.findOne({ state: new RegExp(state, 'i') });
    if (!location) return res.status(404).json({ success: false, message: 'State not found' });
    res.status(200).json({ success: true, data: { districts: location.districts.map(d => d.name), state: location.state, stateCode: location.stateCode } });
  } catch (error) { next(error); }
};

// ═══ getCitiesByDistrict — District ki cities lao ═══
export const getCitiesByDistrict = async (req, res, next) => {
  try {
    const { state, district } = req.params;
    let location = await Location.findOne({ stateCode: state });
    if (!location) location = await Location.findOne({ state: new RegExp(`^${state}$`, 'i') });
    if (!location) location = await Location.findOne({ state: new RegExp(state, 'i') });
    if (!location) return res.status(404).json({ success: false, message: 'State not found' });
    // District name se dhundho (case-insensitive, partial match)
    const dist = location.districts.find(d => d.name.toLowerCase() === district.toLowerCase())
      || location.districts.find(d => d.name.toLowerCase().includes(district.toLowerCase()))
      || location.districts.find(d => district.toLowerCase().includes(d.name.toLowerCase()));
    if (!dist) return res.status(404).json({ success: false, message: 'District not found', availableDistricts: location.districts.map(d => d.name) });
    res.status(200).json({ success: true, data: { cities: dist.cities, district: dist.name } });
  } catch (error) { next(error); }
};

// ═══ searchLocations — Location search (government data) ═══
export const searchLocations = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, message: 'Search term required' });
    const regex = new RegExp(q, 'i');
    const states = await Location.find({
      $or: [{ state: regex }, { stateCode: regex }, { 'districts.name': regex }, { 'districts.cities': regex }]
    }).sort({ state: 1 }).limit(20);
    const results = states.map(s => ({ state: s.state, stateCode: s.stateCode, type: s.type }));
    res.status(200).json({ success: true, data: { results } });
  } catch (error) { next(error); }
};