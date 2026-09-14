import { LmsCourse, Quiz } from '../models/LmsQuiz.js';

export const getAllLmsCourses = async (req, res) => {
  const courses = await LmsCourse.find({ isPublished: true });
  res.status(200).json({ success: true, data: { courses } });
};

export const getLmsCourseBySlug = async (req, res) => {
  const course = await LmsCourse.findOne({ slug: req.params.slug, isPublished: true });
  if (!course) return res.status(404).json({ success: false, message: 'Not found' });
  res.status(200).json({ success: true, data: { course } });
};

export const getAllQuizzes = async (req, res) => {
  const quizzes = await Quiz.find({ isPublished: true }).select('-questions');
  res.status(200).json({ success: true, data: { quizzes } });
};

export const getQuizBySlug = async (req, res) => {
  const quiz = await Quiz.findOne({ slug: req.params.slug, isPublished: true });
  if (!quiz) return res.status(404).json({ success: false, message: 'Not found' });
  res.status(200).json({ success: true, data: { quiz } });
};

export const getMyAttempts = async (req, res) => {
  res.status(200).json({ success: true, data: { attempts: [] } });
};
