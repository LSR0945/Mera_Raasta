import User from '../models/User.js';
import { AppError } from '../utils/helpers.js';
import Roadmap from '../models/Roadmap.js';
import StudentProfile from '../models/StudentProfile.js';
import Career from '../models/Career.js';

export const getChildren = async (req, res, next) => {
  try {
    const profiles = await StudentProfile.find({ parent: req.user._id });
    const childIds = profiles.map(p => p.user);
    const children = await User.find({ _id: { $in: childIds } }).select('-password -refreshToken');
    res.status(200).json({ success: true, data: { children } });
  } catch (error) { next(error); }
};

export const addChild = async (req, res, next) => {
  try {
    const { name, email, password, class: childClass, interest } = req.body;
    if (!name || !email || !password) return next(new AppError('Name, email and password required', 400));
    const existing = await User.findOne({ email });
    if (existing) return next(new AppError('Email already in use', 400));
    const child = await User.create({
      name, email, password, role: 'student',
      parent: req.user._id, class: childClass, subjects: interest ? [interest] : []
    });
    res.status(201).json({ success: true, message: 'Child added', data: { child: { id: child._id, name: child.name, email: child.email } } });
  } catch (error) { next(error); }
};

export const getChild = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.params.childId, parent: req.user._id });
    if (!profile) return next(new AppError('Child not found', 404));

    const child = await User.findOne({ _id: req.params.childId }).select('-password -refreshToken');
    const roadmap = await Roadmap.findOne({ student: child._id });

    res.status(200).json({ success: true, data: { child, profile, roadmap } });
  } catch (error) { next(error); }
};

export const getChildRoadmap = async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findOne({ student: req.params.childId });
    res.status(200).json({ success: true, data: { roadmap } });
  } catch (error) { next(error); }
};

export const getChildProfile = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.params.childId });
    res.status(200).json({ success: true, data: { profile } });
  } catch (error) { next(error); }
};

export const getParentStats = async (req, res, next) => {
  try {
    const profiles = await StudentProfile.find({ parent: req.user._id });
    const childIds = profiles.map(p => p.user);
    const children = await User.find({ _id: { $in: childIds } }).select('_id name email class isActive lastLogin createdAt');

    const stats = await Promise.all(children.map(async (child) => {
      const profile = await StudentProfile.findOne({ user: child._id });
      const roadmap = await Roadmap.findOne({ student: child._id });

      return {
        child: { id: child._id, name: child.name, email: child.email, class: child.class, lastLogin: child.lastLogin, joinedAt: child.createdAt },
        profile: profile ? {
          educationLevel: profile.educationLevel,
          interests: profile.interests,
          skills: profile.skills,
          onboardingCompleted: profile.onboardingCompleted,
        } : null,
        roadmap: roadmap ? {
          title: roadmap.title,
          overallProgress: roadmap.overallProgress,
          totalNodes: roadmap.nodes.length,
          completedNodes: roadmap.nodes.filter(n => n.status === 'completed').length,
          inProgressNodes: roadmap.nodes.filter(n => n.status === 'in_progress').length,
        } : null,
      };
    }));

    res.status(200).json({ success: true, data: { children: stats } });
  } catch (error) { next(error); }
};
