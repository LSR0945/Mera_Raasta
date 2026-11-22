import crypto from 'crypto';
import User from '../models/User.js';
import { AppError, generateTokens, verifyRefreshToken } from '../utils/helpers.js';
import { sendEmail, welcomeEmail, verificationEmail, resetTransporter } from '../utils/sendEmail.js';
import { config } from '../config/env.js';
import { logActivity } from '../controllers/activity.controller.js';

// Token DB me plain text save nahi karte — SHA-256 hash save karte hain.
const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');
const makeVerificationToken = () => crypto.randomBytes(32).toString('hex');
const frontendUrl = () => String(config.clientUrl || 'http://localhost:5173').replace(/\/+$/, '');

// Verification link banao + email bhejo. Return: { sent: boolean, link }
async function sendVerificationEmail(user, rawToken) {
  const link = `${frontendUrl()}/verify-email?token=${rawToken}`;
  // Development me link console me dikhao — testing ke liye useful
  if (config.nodeEnv !== 'production') console.log('[verify-email] link:', link);
  try {
    await sendEmail({
      to: user.email,
      subject: 'Verify your email - Mera Raasta',
      html: verificationEmail(user.name, link),
    });
    return { sent: true, link };
  } catch (err) {
    console.error('[verify-email] email failed:', err.message);
    resetTransporter();
    return { sent: false, link };
  }
}

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return next(new AppError('Email already in use', 400));

    // Verification token — 24 ghante valid
    const rawToken = makeVerificationToken();
    const user = await User.create({
      name,
      email,
      password,
      role,
      isEmailVerified: false,
      emailVerificationToken: hashToken(rawToken),
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    logActivity(user._id, 'Account created (verification pending)', 'system', { role, name });

    // Email bhejo. Fail ho to bhi account bana rehta hai — user resend kar sakta hai.
    const { sent } = await sendVerificationEmail(user, rawToken);

    res.status(201).json({
      success: true,
      message: sent
        ? 'Account created. Verification link sent to your email.'
        : 'Account created, but verification email could not be sent. Please use resend.',
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        requiresVerification: true,
        emailSent: sent,
      },
    });
  } catch (error) { next(error); }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const token = String(req.query.token || req.body.token || '').trim();
    if (!token) return next(new AppError('Verification token is missing', 400));

    const user = await User.findOne({
      emailVerificationToken: hashToken(token),
      emailVerificationExpires: { $gt: new Date() },
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) return next(new AppError('Verification link is invalid or expired', 400));

    await User.updateOne(
      { _id: user._id },
      { $set: { isEmailVerified: true }, $unset: { emailVerificationToken: 1, emailVerificationExpires: 1 } }
    );
    user.isEmailVerified = true;

    logActivity(user._id, 'Email verified', 'system', { email: user.email });

    // Welcome email (background) — verification ke baad hi bhejo
    sendEmail({ to: user.email, subject: `Welcome to Mera Raasta, ${user.name}!`, html: welcomeEmail(user.name, user.role) })
      .catch(() => resetTransporter());

    // User verify hone par turant tokens generate karo taki website direct khul sake
    const { accessToken, refreshToken } = generateTokens(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken, lastLogin: new Date() });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! Welcome to Mera Raasta.',
      data: {
        email: user.email,
        accessToken,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (error) { next(error); }
};

export const resendVerification = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email) return next(new AppError('Email is required', 400));

    const user = await User.findOne({ email });

    // Security: unknown email par bhi same response — account enumeration avoid
    if (!user) {
      return res.status(200).json({ success: true, message: 'If this email is registered, a verification link has been sent.' });
    }
    if (user.isEmailVerified) return next(new AppError('Email is already verified. Please login.', 400));

    const rawToken = makeVerificationToken();
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerificationToken: hashToken(rawToken),
          emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      }
    );

    const { sent } = await sendVerificationEmail(user, rawToken);
    if (!sent) return next(new AppError('Could not send verification email. Please try again later.', 502));

    res.status(200).json({ success: true, message: 'Verification link sent. Please check your email.' });
  } catch (error) { next(error); }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) return next(new AppError('Invalid email or password', 401));
    if (!user.isActive) return next(new AppError('Account deactivated', 403));

    // Email verify nahi hua to login block
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email first. Check your inbox for the verification link.',
        data: { email: user.email },
      });
    }

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
