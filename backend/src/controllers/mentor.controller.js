import User from '../models/User.js';
import { AppError } from '../utils/helpers.js';

export const getStudents = async (req, res, next) => {
  try {
    const students = await User.find({ mentor: req.user._id }).select('-password -refreshToken');
    res.status(200).json({ success: true, data: { students } });
  } catch (error) { next(error); }
};

export const getStats = async (req, res, next) => {
  try {
    const students = await User.find({ mentor: req.user._id });
    const Roadmap = (await import('../models/Roadmap.js')).default;
    let active = 0, completed = 0;
    for (const s of students) {
      const rm = await Roadmap.findOne({ user: s._id });
      if (rm) { if (rm.overallProgress >= 100) completed++; else active++; }
    }
    res.status(200).json({ success: true, data: { stats: { total: students.length, active, completed, reviews: 0 } } });
  } catch (error) { next(error); }
};

export const getStudentDetail = async (req, res, next) => {
  try {
    const student = await User.findOne({ _id: req.params.studentId, mentor: req.user._id }).select('-password -refreshToken');
    if (!student) return next(new AppError('Student not found', 404));
    res.status(200).json({ success: true, data: { student } });
  } catch (error) { next(error); }
};

export const getStudentRoadmap = async (req, res, next) => {
  try {
    const Roadmap = (await import('../models/Roadmap.js')).default;
    const roadmap = await Roadmap.findOne({ user: req.params.studentId }).sort({ updatedAt: -1 });
    res.status(200).json({ success: true, data: { roadmap } });
  } catch (error) { next(error); }
};

export const getStudentNotes = async (req, res, next) => {
  try { res.status(200).json({ success: true, data: { notes: [] } }); }
  catch (error) { next(error); }
};

export const addStudentNote = async (req, res, next) => {
  try { res.status(201).json({ success: true, message: 'Note added', data: { note: { content: req.body.content, createdAt: new Date() } } }); }
  catch (error) { next(error); }
};

export const getReviews = async (req, res, next) => {
  try { res.status(200).json({ success: true, data: { reviews: [] } }); }
  catch (error) { next(error); }
};
