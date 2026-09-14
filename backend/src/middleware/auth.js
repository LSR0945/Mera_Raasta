import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import User from '../models/User.js';
import { AppError } from '../utils/helpers.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return next(new AppError('Authentication required', 401));
    const decoded = jwt.verify(token, config.jwtAccessSecret);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return next(new AppError('User not found or deactivated', 401));
    req.user = user;
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return next(new AppError('Insufficient permissions', 403));
  next();
};
