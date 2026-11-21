import User from '../models/User.js';
import { AppError } from '../utils/helpers.js';
import Roadmap from '../models/Roadmap.js';
import StudentProfile from '../models/StudentProfile.js';

// Parent ke children User.parent field se aate hain (StudentProfile me parent field nahi hai)
async function getMyChildren(parentId) {
  return User.find({ parent: parentId }).select('-password -refreshToken');
}

// Security: child sirf apne hi parent ko dikhe
async function assertOwnChild(parentId, childId) {
  const child = await User.findOne({ _id: childId, parent: parentId }).select('-password -refreshToken');
  if (!child) throw new AppError('Child not found', 404);
  return child;
}

export const getChildren = async (req, res, next) => {
  try {
    const children = await getMyChildren(req.user._id);
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
    // Parent ke children array me bhi link karo
    await User.updateOne({ _id: req.user._id }, { $addToSet: { children: child._id } });
    res.status(201).json({ success: true, message: 'Child added', data: { child: { id: child._id, name: child.name, email: child.email } } });
  } catch (error) { next(error); }
};

export const getChild = async (req, res, next) => {
  try {
    const child = await assertOwnChild(req.user._id, req.params.childId);
    const profile = await StudentProfile.findOne({ user: child._id });
    const roadmap = await Roadmap.findOne({ student: child._id });

    res.status(200).json({ success: true, data: { child, profile, roadmap } });
  } catch (error) { next(error); }
};

export const getChildRoadmap = async (req, res, next) => {
  try {
    const child = await assertOwnChild(req.user._id, req.params.childId);
    const roadmap = await Roadmap.findOne({ student: child._id });
    res.status(200).json({ success: true, data: { roadmap } });
  } catch (error) { next(error); }
};

export const getChildProfile = async (req, res, next) => {
  try {
    const child = await assertOwnChild(req.user._id, req.params.childId);
    const profile = await StudentProfile.findOne({ user: child._id });
    res.status(200).json({ success: true, data: { profile } });
  } catch (error) { next(error); }
};

export const getParentStats = async (req, res, next) => {
  try {
    const children = await getMyChildren(req.user._id);

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
