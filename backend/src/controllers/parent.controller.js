import User from '../models/User.js';
import { AppError } from '../utils/helpers.js';

export const getChildren = async (req, res, next) => {
  try {
    const children = await User.find({ parent: req.user._id }).select('-password -refreshToken');
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
      parent: req.user._id, class: childClass, interests: interest ? [interest] : []
    });
    res.status(201).json({ success: true, message: 'Child added', data: { child: { id: child._id, name: child.name, email: child.email } } });
  } catch (error) { next(error); }
};

export const getChild = async (req, res, next) => {
  try {
    const child = await User.findOne({ _id: req.params.childId, parent: req.user._id }).select('-password -refreshToken');
    if (!child) return next(new AppError('Child not found', 404));
    res.status(200).json({ success: true, data: { child } });
  } catch (error) { next(error); }
};

export const getChildRoadmap = async (req, res, next) => {
  try {
    const Roadmap = (await import('../models/Roadmap.js')).default;
    const roadmap = await Roadmap.findOne({ user: req.params.childId }).sort({ updatedAt: -1 });
    res.status(200).json({ success: true, data: { roadmap } });
  } catch (error) { next(error); }
};
