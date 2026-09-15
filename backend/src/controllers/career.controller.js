import Career from '../models/Career.js';
import CareerRecommendation from '../models/CareerRecommendation.js';
import StudentProfile from '../models/StudentProfile.js';
import { AppError } from '../utils/helpers.js';
import { logActivity } from './activity.controller.js';

export const getAllCareers = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [careers, total] = await Promise.all([
      Career.find(filter).skip(skip).limit(parseInt(limit)),
      Career.countDocuments(filter)
    ]);
    res.status(200).json({ success: true, data: { careers, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } } });
  } catch (error) { next(error); }
};

export const getCareerBySlug = async (req, res, next) => {
  try {
    const career = await Career.findOne({ slug: req.params.slug, isActive: true });
    if (!career) return next(new AppError('Career not found', 404));
    if (req.user) logActivity(req.user._id, `Viewed career: ${career.title}`, 'career', { career: career.title, category: career.category });
    res.status(200).json({ success: true, data: { career } });
  } catch (error) { next(error); }
};

export const getCareerById = async (req, res, next) => {
  try {
    const career = await Career.findById(req.params.id);
    if (!career) return next(new AppError('Career not found', 404));
    res.status(200).json({ success: true, data: { career } });
  } catch (error) { next(error); }
};

export const compareCareers = async (req, res, next) => {
  try {
    const { ids } = req.query;
    if (!ids || ids.split(',').length < 2) return next(new AppError('At least 2 career IDs needed', 400));
    const careers = await Career.find({ _id: { $in: ids.split(',') } });
    res.status(200).json({ success: true, data: { careers } });
  } catch (error) { next(error); }
};

export const getRecommendations = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) return next(new AppError('Please complete your profile first', 400));
    let rec = await CareerRecommendation.findOne({ student: req.user._id });
    if (!rec) {
      const careers = await Career.find({ isActive: true }).limit(3);
      if (careers.length >= 1) {
        rec = await CareerRecommendation.create({
          student: req.user._id,
          planA: { career: careers[0]._id, fitScores: { academic: 75, interest: 80, skills: 70, budget: 65, overall: 72 }, reasoning: 'Based on your interests and education level.' },
          planB: careers[1] ? { career: careers[1]._id, fitScores: { academic: 65, interest: 70, skills: 60, budget: 70, overall: 66 }, reasoning: 'Alternative option matching your profile.' } : undefined,
          planC: careers[2] ? { career: careers[2]._id, fitScores: { academic: 55, interest: 60, skills: 50, budget: 75, overall: 60 }, reasoning: 'Worth exploring as a backup plan.' } : undefined,
        });
      }
    }
    if (rec) {
      await rec.populate('planA.career planB.career planC.career');
    }
    res.status(200).json({ success: true, data: { recommendation: rec } });
  } catch (error) { next(error); }
};

export const refreshRecommendations = async (req, res, next) => {
  try {
    await CareerRecommendation.deleteMany({ student: req.user._id });
    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) return next(new AppError('Please complete your profile first', 400));
    let rec;
    const careers = await Career.find({ isActive: true }).limit(3);
    if (careers.length >= 1) {
      rec = await CareerRecommendation.create({
        student: req.user._id,
        planA: { career: careers[0]._id, fitScores: { academic: 75, interest: 80, skills: 70, budget: 65, overall: 72 }, reasoning: 'Based on your interests and education level.' },
        planB: careers[1] ? { career: careers[1]._id, fitScores: { academic: 65, interest: 70, skills: 60, budget: 70, overall: 66 }, reasoning: 'Alternative option matching your profile.' } : undefined,
        planC: careers[2] ? { career: careers[2]._id, fitScores: { academic: 55, interest: 60, skills: 50, budget: 75, overall: 60 }, reasoning: 'Worth exploring as a backup plan.' } : undefined,
      });
    }
    if (rec) await rec.populate('planA.career planB.career planC.career');
    res.status(200).json({ success: true, data: { recommendation: rec } });
  } catch (error) { next(error); }
};

export const getRecommendationHistory = async (req, res, next) => {
  try {
    const recs = await CareerRecommendation.find({ student: req.user._id }).sort({ createdAt: -1 }).limit(5);
    res.status(200).json({ success: true, data: { recommendations: recs } });
  } catch (error) { next(error); }
};
