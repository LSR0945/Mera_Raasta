import { Project, Internship, Job, Interview } from '../models/CareerReadiness.js';

const createCrud = (Model, name) => ({
  getAll: async (req, res) => {
    const { page = 1, limit = 20, difficulty, category } = req.query;
    const filter = {};
    if (difficulty) filter.difficulty = difficulty;
    if (category) filter.category = category;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([Model.find(filter).skip(skip).limit(parseInt(limit)), Model.countDocuments(filter)]);
    const key = name.toLowerCase() + 's';
    res.status(200).json({ success: true, data: { [key]: items, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } } });
  },
  getBySlug: async (req, res) => {
    const item = await Model.findOne({ slug: req.params.slug });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, data: { item } });
  },
});

export const { getAll: getAllProjects, getBySlug: getProjectBySlug } = createCrud(Project, 'Project');
export const { getAll: getAllInternships, getBySlug: getInternshipBySlug } = createCrud(Internship, 'Internship');
export const { getAll: getAllJobs, getBySlug: getJobBySlug } = createCrud(Job, 'Job');
export const { getAll: getAllInterviews, getBySlug: getInterviewBySlug } = createCrud(Interview, 'Interview');
