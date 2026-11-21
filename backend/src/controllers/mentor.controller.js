import User from '../models/User.js';
import Roadmap from '../models/Roadmap.js';
import MentorNote from '../models/MentorNote.js';
import { AppError } from '../utils/helpers.js';

// Security: mentor sirf apne students ko dekh sakta hai
async function assertOwnStudent(mentorId, studentId) {
  const student = await User.findOne({ _id: studentId, mentor: mentorId }).select('-password -refreshToken');
  if (!student) throw new AppError('Student not found', 404);
  return student;
}

export const getStudents = async (req, res, next) => {
  try {
    const students = await User.find({ mentor: req.user._id }).select('-password -refreshToken');
    res.status(200).json({ success: true, data: { students } });
  } catch (error) { next(error); }
};

export const getStats = async (req, res, next) => {
  try {
    const students = await User.find({ mentor: req.user._id });
    let active = 0, completed = 0;
    for (const s of students) {
      // Roadmap model me student field hai (user nahi)
      const rm = await Roadmap.findOne({ student: s._id });
      if (rm) { if (rm.overallProgress >= 100) completed++; else active++; }
    }
    const reviews = await MentorNote.countDocuments({ mentor: req.user._id });
    res.status(200).json({ success: true, data: { stats: { total: students.length, active, completed, reviews } } });
  } catch (error) { next(error); }
};

export const getStudentDetail = async (req, res, next) => {
  try {
    const student = await assertOwnStudent(req.user._id, req.params.studentId);
    res.status(200).json({ success: true, data: { student } });
  } catch (error) { next(error); }
};

export const getStudentRoadmap = async (req, res, next) => {
  try {
    await assertOwnStudent(req.user._id, req.params.studentId);
    const roadmap = await Roadmap.findOne({ student: req.params.studentId }).sort({ updatedAt: -1 });
    res.status(200).json({ success: true, data: { roadmap } });
  } catch (error) { next(error); }
};

export const getStudentNotes = async (req, res, next) => {
  try {
    await assertOwnStudent(req.user._id, req.params.studentId);
    const notes = await MentorNote.find({ mentor: req.user._id, student: req.params.studentId })
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({ success: true, data: { notes } });
  } catch (error) { next(error); }
};

export const addStudentNote = async (req, res, next) => {
  try {
    await assertOwnStudent(req.user._id, req.params.studentId);
    const content = String(req.body.content || '').trim();
    if (!content) return next(new AppError('Note content required', 400));
    const note = await MentorNote.create({
      mentor: req.user._id,
      student: req.params.studentId,
      content: content.slice(0, 2000),
    });
    res.status(201).json({ success: true, message: 'Note added', data: { note } });
  } catch (error) { next(error); }
};

export const getReviews = async (req, res, next) => {
  try { res.status(200).json({ success: true, data: { reviews: [] } }); }
  catch (error) { next(error); }
};
