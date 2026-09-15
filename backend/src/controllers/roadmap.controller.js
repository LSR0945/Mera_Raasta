import mongoose from 'mongoose';
import Roadmap from '../models/Roadmap.js';
import Career from '../models/Career.js';
import { logActivity } from './activity.controller.js';

export const getMyRoadmap = async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findOne({ student: req.user._id });
    res.status(200).json({ success: true, data: { roadmap } });
  } catch (error) {
    // If schema mismatch, drop and return null
    if (error.name === 'CastError' || error.name === 'ValidationError') {
      try {
        await Roadmap.deleteMany({ student: req.user._id });
        res.status(200).json({ success: true, data: { roadmap: null } });
      } catch { next(error); }
    } else { next(error); }
  }
};

export const createRoadmap = async (req, res, next) => {
  try {
    const { careerId } = req.body;
    let career = careerId ? await Career.findById(careerId) : await Career.findOne({ isActive: true });
    if (!career) return res.status(404).json({ success: false, message: 'No career found. Please select a valid career.' });

    // Delete any existing roadmap (fixes old schema issues)
    await Roadmap.deleteMany({ student: req.user._id });

    const nodes = [
      { title: 'Complete Profile', description: 'Fill in your academic details and interests.', type: 'profile', status: 'pending', progress: 0, order: 1 },
      { title: 'Learn Fundamentals', description: `Build core skills for ${career.title}.`, type: 'education', status: 'pending', progress: 0, order: 2, metadata: { duration: '3 months' } },
      { title: 'Online Course', description: 'Complete a relevant online course.', type: 'course', status: 'pending', progress: 0, order: 3, metadata: { duration: '1 month' } },
      { title: 'Build Project', description: 'Create a portfolio project.', type: 'project', status: 'pending', progress: 0, order: 4, metadata: { duration: '2 weeks' } },
      { title: 'Practice Skills', description: 'Daily practice and revision.', type: 'skill', status: 'pending', progress: 0, order: 5, metadata: { duration: 'Ongoing' } },
      { title: 'Mock Interviews', description: 'Practice with mock interviews.', type: 'interview', status: 'pending', progress: 0, order: 6 },
      { title: 'Resume Building', description: 'Create a professional resume.', type: 'resume', status: 'pending', progress: 0, order: 7 },
      { title: 'Apply for Internships', description: 'Start applying for internships.', type: 'internship', status: 'pending', progress: 0, order: 8 },
      { title: 'Portfolio Review', description: 'Get feedback on your portfolio.', type: 'project', status: 'pending', progress: 0, order: 9 },
      { title: 'Job Applications', description: 'Apply for full-time positions.', type: 'job', status: 'pending', progress: 0, order: 10 },
    ];

    const roadmap = await Roadmap.create({
      student: req.user._id,
      career: career._id,
      title: `Path to ${career.title}`,
      description: `Your personalized roadmap to become a ${career.title}`,
      nodes,
      overallProgress: 0,
    });

    logActivity(req.user._id, 'Created roadmap', 'roadmap', { career: career.title, steps: nodes.length });

    res.status(201).json({ success: true, message: 'Roadmap created', data: { roadmap } });
  } catch (error) { next(error); }
};

export const updateNodeProgress = async (req, res, next) => {
  try {
    const { nodeId } = req.params;
    const { status, progress } = req.body;
    const roadmap = await Roadmap.findOne({ student: req.user._id });
    if (!roadmap) return res.status(404).json({ success: false, message: 'No roadmap found' });

    const node = roadmap.nodes.id(nodeId);
    if (!node) return res.status(404).json({ success: false, message: 'Node not found' });

    node.status = status || node.status;
    node.progress = progress !== undefined ? progress : node.progress;

    logActivity(req.user._id, `Updated step: ${node.title}`, 'roadmap', { step: node.title, status: node.status, progress: node.progress });

    const completed = roadmap.nodes.filter(n => n.status === 'completed').length;
    roadmap.overallProgress = Math.round((completed / roadmap.nodes.length) * 100);

    await roadmap.save();
    res.status(200).json({ success: true, message: 'Node updated', data: { roadmap } });
  } catch (error) {
    // If schema mismatch, clear and return error
    if (error.name === 'CastError' || error.name === 'ValidationError') {
      try {
        await Roadmap.deleteMany({ student: req.user._id });
        res.status(400).json({ success: false, message: 'Roadmap was corrupted. Please create a new one.' });
      } catch { next(error); }
    } else { next(error); }
  }
};
