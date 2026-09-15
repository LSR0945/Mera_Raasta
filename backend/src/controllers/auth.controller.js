import User from '../models/User.js';
import { AppError, generateTokens, verifyRefreshToken } from '../utils/helpers.js';
import { sendEmail, welcomeEmail, resetTransporter } from '../utils/sendEmail.js';
import { config } from '../config/env.js';
import { logActivity } from '../controllers/activity.controller.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return next(new AppError('Email already in use', 400));
    const user = await User.create({ name, email, password, role });
    const { accessToken, refreshToken } = generateTokens(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken });

    logActivity(user._id, 'Account created', 'system', { role, name });

    // Send welcome email in background (non-blocking)
    const html = welcomeEmail(name, role);
    sendEmail({ to: email, subject: `Welcome to Mera Raasta, ${name}!`, html })
      .then(() => console.log('Email sent to:', email))
      .catch(() => { console.log('Email failed for:', email); resetTransporter(); });

    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: config.nodeEnv === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        accessToken,
      },
    });
  } catch (error) { next(error); }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) return next(new AppError('Invalid email or password', 401));
    if (!user.isActive) return next(new AppError('Account deactivated', 403));
    const { accessToken, refreshToken } = generateTokens(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken, lastLogin: new Date() });
    logActivity(user._id, 'Logged in', 'login', { email });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: config.nodeEnv === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(200).json({ success: true, message: 'Login successful', data: { user: { id: user._id, name: user.name, email: user.email, role: user.role }, accessToken } });
  } catch (error) { next(error); }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.cookies;
    if (!token) return next(new AppError('Refresh token not found', 401));
    let decoded;
    try { decoded = verifyRefreshToken(token); } catch { return next(new AppError('Invalid refresh token', 401)); }
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) return next(new AppError('Refresh token invalid', 401));
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken: newRefreshToken });
    res.cookie('refreshToken', newRefreshToken, { httpOnly: true, secure: config.nodeEnv === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(200).json({ success: true, data: { accessToken } });
  } catch (error) { next(error); }
};

export const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.clearCookie('refreshToken');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) { next(error); }
};

export const getMe = async (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user } });
};

export const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'phone', 'class', 'subjects', 'expertise', 'bio', 'avatar'];
    const updates = {};
    allowedFields.forEach((field) => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });
    if (Object.keys(updates).length === 0) return next(new AppError('No valid fields to update', 400));
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.status(200).json({ success: true, message: 'Profile updated', data: { user } });
  } catch (error) { next(error); }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, email } = req.body;
    // Support both authenticated (req.user) and public (email in body) access
    const userId = req.user?._id || (email ? (await User.findOne({ email }))?._id : null);
    if (!userId) return next(new AppError('User not found', 404));
    const user = await User.findById(userId).select('+password');
    if (!user) return next(new AppError('User not found', 404));
    if (!(await user.comparePassword(currentPassword))) return next(new AppError('Current password is incorrect', 401));
    if (currentPassword === newPassword) return next(new AppError('New password must be different', 400));
    user.password = newPassword;
    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save();
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: config.nodeEnv === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(200).json({ success: true, message: 'Password changed successfully', data: { accessToken } });
  } catch (error) { next(error); }
};
