import crypto from 'crypto';
import User from '../models/User.js';
import { AppError, generateTokens, verifyRefreshToken } from '../utils/helpers.js';
import { sendEmail, welcomeEmail, otpEmail, resetTransporter, isEmailConfigured } from '../utils/sendEmail.js';
import { config } from '../config/env.js';
import { logActivity } from '../controllers/activity.controller.js';

// OTP 6-digit hota hai — SHA-256 hash karke DB me save (plain text kabhi nahi)
const hashOtp = (otp) => crypto.createHash('sha256').update(String(otp)).digest('hex');
const makeOtp = () => String(crypto.randomInt(100000, 1000000)); // 100000-999999
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minute valid

// OTP email bhejo. Return: { sent: boolean }
async function sendOtpEmail(user, otp) {
  // Development me OTP console me dikhao — testing ke liye useful
  if (config.nodeEnv !== 'production') console.log('[verify-otp] OTP for', user.email, '=', otp);
  try {
    await sendEmail({
      to: user.email,
      subject: `${otp} is your Mera Raasta verification code`,
      html: otpEmail(user.name, otp),
    });
    return { sent: true };
  } catch (err) {
    console.error('[verify-otp] email failed:', err.message);
    resetTransporter();
    return { sent: false };
  }
}

// OTP generate + save + email bhejo
async function issueOtp(user) {
  const otp = makeOtp();
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        emailVerificationOtp: hashOtp(otp),
        emailVerificationOtpExpires: new Date(Date.now() + OTP_TTL_MS),
        emailVerificationAttempts: 0,
      },
    }
  );
  return sendOtpEmail(user, otp);
}

export const register = async (req, res, next) => {
  try {
    const { name, password, role } = req.body;
    const email = String(req.body.email || '').trim().toLowerCase();
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isEmailVerified) {
      return next(new AppError('Email already in use', 400));
    }

    const canSendEmail = isEmailConfigured();
    const otp = canSendEmail ? makeOtp() : null;
    const otpFields = otp
      ? {
          emailVerificationOtp: hashOtp(otp),
          emailVerificationOtpExpires: new Date(Date.now() + OTP_TTL_MS),
          emailVerificationAttempts: 0,
        }
      : {};

    let user;
    if (existingUser) {
      // Unverified account hai to details + fresh OTP ek hi DB write me save karo
      existingUser.name = name;
      existingUser.password = password;
      if (role) existingUser.role = role;
      if (otp) {
        existingUser.emailVerificationOtp = otpFields.emailVerificationOtp;
        existingUser.emailVerificationOtpExpires = otpFields.emailVerificationOtpExpires;
        existingUser.emailVerificationAttempts = 0;
      }
      user = await existingUser.save();
    } else {
      user = await User.create({
        name,
        email,
        password,
        role,
        isEmailVerified: false,
        ...otpFields,
      });
    }

    logActivity(user._id, 'Account created (OTP verification pending)', 'system', { role, name });

    // Email bhej sakte hain? (Gmail SMTP ya HTTP provider configured ho)
    const { sent } = otp ? await sendOtpEmail(user, otp) : { sent: false };

    if (!sent) {
      const tokens = generateTokens(user._id);
      await User.findByIdAndUpdate(user._id, {
        $set: { isEmailVerified: true, refreshToken: tokens.refreshToken, lastLogin: new Date() },
        $unset: { emailVerificationOtp: 1, emailVerificationOtpExpires: 1 },
      });
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return res.status(201).json({
        success: true,
        message: 'Account created successfully!',
        data: {
          user: { id: user._id, name: user.name, email: user.email, role: user.role },
          accessToken: tokens.accessToken,
          requiresVerification: false,
          emailSent: false,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Account created. 6-digit OTP sent to your email.',
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        requiresVerification: true,
        emailSent: true,
      },
    });
  } catch (error) { next(error); }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const email = String(req.body.email || req.query.email || '').trim().toLowerCase();
    const otp = String(req.body.otp || req.query.otp || '').replace(/\D/g, '');
    if (!email) return next(new AppError('Email is required', 400));
    if (otp.length !== 6) return next(new AppError('Please enter the 6-digit OTP', 400));

    const user = await User.findOne({ email })
      .select('+emailVerificationOtp +emailVerificationOtpExpires +emailVerificationAttempts');
    if (!user) return next(new AppError('Invalid OTP. Please check and try again.', 400));

    // Pehle se verified ho to koi dikkat nahi — auto-login kar dete hain
    if (user.isEmailVerified) {
      const tokens = generateTokens(user._id);
      await User.findByIdAndUpdate(user._id, { refreshToken: tokens.refreshToken, lastLogin: new Date() });
      res.cookie('refreshToken', tokens.refreshToken, { httpOnly: true, secure: config.nodeEnv === 'production', sameSite: config.nodeEnv === 'production' ? 'none' : 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
      return res.status(200).json({
        success: true,
        message: 'Email already verified! Welcome to Mera Raasta.',
        data: { email: user.email, accessToken: tokens.accessToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } },
      });
    }

    // Zyada wrong attempts — OTP ko hi invalidate kar do (brute-force protection)
    if ((user.emailVerificationAttempts || 0) >= 5) {
      await User.updateOne({ _id: user._id }, { $unset: { emailVerificationOtp: 1, emailVerificationOtpExpires: 1 }, $set: { emailVerificationAttempts: 0 } });
      return next(new AppError('Too many wrong attempts. Please resend the OTP.', 400));
    }
    if (!user.emailVerificationOtp || !user.emailVerificationOtpExpires || user.emailVerificationOtpExpires < new Date()) {
      return next(new AppError('OTP expired. Please resend the OTP.', 400));
    }
    if (user.emailVerificationOtp !== hashOtp(otp)) {
      await User.updateOne({ _id: user._id }, { $inc: { emailVerificationAttempts: 1 } });
      return next(new AppError('Incorrect OTP. Please try again.', 400));
    }

    await User.updateOne(
      { _id: user._id },
      {
        $set: { isEmailVerified: true, emailVerificationAttempts: 0 },
        $unset: { emailVerificationOtp: 1, emailVerificationOtpExpires: 1 },
      }
    );
    user.isEmailVerified = true;

    logActivity(user._id, 'Email verified (OTP)', 'system', { email: user.email });

    // Welcome email (background) — verification ke baad hi bhejo
    sendEmail({ to: user.email, subject: `Welcome to Mera Raasta, ${user.name}!`, html: welcomeEmail(user.name, user.role) })
      .catch(() => resetTransporter());

    // OTP verify hote hi tokens generate — website turant khul jaye
    const { accessToken, refreshToken } = generateTokens(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken, lastLogin: new Date() });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
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
      return res.status(200).json({ success: true, message: 'If this email is registered, an OTP has been sent.' });
    }
    if (user.isEmailVerified) return next(new AppError('Email is already verified. Please login.', 400));

    // Email bhej sakte hain? HTTP provider configured ho, ya local SMTP available ho.
    // Render free par SMTP ports blocked hain, isliye wahan sirf HTTP providers chalenge.
    const canSendEmail = isEmailConfigured();
    const { sent } = canSendEmail ? await issueOtp(user) : { sent: false };
    if (!sent) {
      // Email service unavailable (e.g. Render SMTP block) — auto-verify + return token so user isn't stuck
      const tokens = generateTokens(user._id);
      await User.updateOne(
        { _id: user._id },
        {
          $set: { isEmailVerified: true, refreshToken: tokens.refreshToken, lastLogin: new Date() },
          $unset: { emailVerificationOtp: 1, emailVerificationOtpExpires: 1 },
        }
      );
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return res.status(200).json({
        success: true,
        message: 'Account verified! Logging you in...',
        data: { verified: true, accessToken: tokens.accessToken },
      });
    }

    res.status(200).json({ success: true, message: 'OTP sent. Please check your email (and spam folder).' });
  } catch (error) { next(error); }
};

export const checkVerificationStatus = async (req, res, next) => {
  try {
    const email = String(req.query.email || req.body.email || '').trim().toLowerCase();
    if (!email) return next(new AppError('Email is required', 400));

    const user = await User.findOne({ email });
    if (!user) return next(new AppError('User not found', 404));

    if (!user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        data: { verified: false },
      });
    }

    // Phone ya doosre device se verify ho chuka hai — auto-login ke liye token generate karo
    const { accessToken, refreshToken } = generateTokens(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken, lastLogin: new Date() });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! Logging you in...',
      data: {
        verified: true,
        accessToken,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
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
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: config.nodeEnv === 'production', sameSite: config.nodeEnv === 'production' ? 'none' : 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
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
    res.cookie('refreshToken', newRefreshToken, { httpOnly: true, secure: config.nodeEnv === 'production', sameSite: config.nodeEnv === 'production' ? 'none' : 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
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
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: config.nodeEnv === 'production', sameSite: config.nodeEnv === 'production' ? 'none' : 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(200).json({ success: true, message: 'Password changed successfully', data: { accessToken } });
  } catch (error) { next(error); }
};
