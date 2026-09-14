import crypto from 'crypto';
import User from '../models/User.js';
import PasswordReset from '../models/PasswordReset.js';
import { AppError } from '../utils/helpers.js';

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(200).json({ success: true, message: 'If an account exists with this email, you will receive a password reset OTP.' });
    const otp = await PasswordReset.createOTP(user.email);
    res.status(200).json({ success: true, message: 'OTP sent successfully', ...(process.env.NODE_ENV === 'development' && { otp }) });
  } catch (error) { next(error); }
};

export const verifyResetOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const record = await PasswordReset.verifyOTP(email.toLowerCase(), otp);
    if (!record) return next(new AppError('Invalid or expired OTP', 400));
    const resetToken = crypto.randomBytes(32).toString('hex');
    await User.findOneAndUpdate({ email: email.toLowerCase() }, { passwordResetToken: resetToken, passwordResetExpires: new Date(Date.now() + 15 * 60 * 1000) });
    res.status(200).json({ success: true, message: 'OTP verified', data: { resetToken } });
  } catch (error) { next(error); }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    const user = await User.findOne({ email: email.toLowerCase(), passwordResetToken: resetToken, passwordResetExpires: { $gt: new Date() } }).select('+password');
    if (!user) return next(new AppError('Invalid or expired reset token', 400));
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) { next(error); }
};
