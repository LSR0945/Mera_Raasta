import { Course, College, Scholarship, Government } from '../models/Education.js';
import { matchGoalGuide } from '../utils/goalSubjects.js';

const createController = (Model, name) => ({
  getAll: async (req, res) => {
    const { category, search, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (search) filter.$text = { $search: search };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([Model.find(filter).skip(skip).limit(parseInt(limit)), Model.countDocuments(filter)]);
    const key = name === 'Government' ? 'items' : name.toLowerCase() + 's';
    res.status(200).json({ success: true, data: { [key]: items, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } } });
  },
  getBySlug: async (req, res) => {
    const item = await Model.findOne({ slug: req.params.slug, isActive: true });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, data: { item } });
  },
});

export const { getAll: getAllCourses, getBySlug: getCourseBySlug } = createController(Course, 'Course');
export const { getAll: getAllColleges, getBySlug: getCollegeBySlug } = createController(College, 'College');
export const { getAll: getAllScholarships, getBySlug: getScholarshipBySlug } = createController(Scholarship, 'Scholarship');
export const { getAll: getAllGovernment, getBySlug: getGovernmentBySlug } = createController(Government, 'Government');

// ═══ Goal → Subject guide (GoI regulations rules + live data.gov.in AISHE data) ═══
// data.gov.in OGD platform ki AISHE API (Ministry of Education) se live stats
// fetch karte hain — 6 ghante cache, key .env me DATA_GOV_IN_KEY se override.
// Sample key data.gov.in docs me publicly di gayi hai (free, unlimited-ish).

const AISHE_RESOURCE = 'f648af2c-e993-4af1-8695-3b0af7a98e4f'; // Institute-wise HEI details (AISHE 2020-21)
const DATA_GOV_KEY = process.env.DATA_GOV_IN_KEY || '579b464db66ec23bdd0000012041aca96faa47a4602429dc165cd658';
let govtCache = { data: null, at: 0 };
const GOVT_TTL = 6 * 60 * 60 * 1000; // 6 ghante

async function fetchGovtStats() {
  if (govtCache.data && Date.now() - govtCache.at < GOVT_TTL) return govtCache.data;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const url = `https://api.data.gov.in/resource/${AISHE_RESOURCE}?api-key=${DATA_GOV_KEY}&format=json&limit=50`;
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const json = await r.json();
    const recs = json.records || [];
    let total = 0, uni = 0, col = 0;
    for (const row of recs) {
      const n = Number(row.registered) || 0;
      const label = String(row['higher_educational_institutions__heis_'] || '');
      total += n;
      if (/^universit/i.test(label)) uni += n;        // "University/University Level Institutions"
      else if (/college/i.test(label)) col += n;       // "Colleges - Affiliated/Constituent..."
    }
    if (!total) throw new Error('empty records');
    const data = {
      source: 'data.gov.in (OGD Platform India) — All India Survey on Higher Education (AISHE), Ministry of Education',
      year: '2020-21',
      summary: `AISHE 2020-21 (Govt of India) ke according India me ${uni} universities, ${col} colleges aur kul ${total} higher-education institutions registered hain.`,
      totalInstitutions: total,
      universities: uni,
      colleges: col,
    };
    govtCache = { data, at: Date.now() };
    return data;
  } catch {
    return null; // API fail ho to guide rules phir bhi chalenge
  }
}

export const getGoalSubjects = async (req, res) => {
  const { goal } = req.query;
  const guide = matchGoalGuide(goal);
  const govt = await fetchGovtStats();
  res.status(200).json({
    success: true,
    data: {
      goal: (goal || '').trim(),
      matched: !!guide,
      guide,           // { mandatory, suggested, note } ya null
      govt,            // { source, year, summary, ... } ya null
      rulesSource: 'Government regulations (NMC, AICTE, ICAI, NCHMCT, NCERT, DG Shipping, UPSC) — ye rules kabhi-bahi public API me nahi milte, isliye yahan encode kiye gaye hain',
    },
  });
};
