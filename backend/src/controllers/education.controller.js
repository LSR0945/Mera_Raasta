import { Course, College, Scholarship, Government } from '../models/Education.js';

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
