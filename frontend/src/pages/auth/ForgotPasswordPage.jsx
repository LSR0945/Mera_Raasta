import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Logo from '../../components/common/Logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      toast.success(data.message);
      if (data.otp) { setOtp(data.otp); toast.success(`Dev Mode OTP: ${data.otp}`, { duration: 10000 }); }
      setStep(2);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } finally { setSubmitting(false); }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const { data } = await api.post('/auth/verify-reset-otp', { email, otp });
      setResetToken(data.data.resetToken);
      toast.success('OTP verified!'); setStep(3);
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid OTP'); } finally { setSubmitting(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    if (newPassword.length < 8) return toast.error('Password must be at least 8 characters');
    setSubmitting(true);
    try {
      await api.post('/auth/reset-password', { email, resetToken, newPassword });
      toast.success('Password reset! Please login.'); navigate('/login');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } finally { setSubmitting(false); }
  };

  const stepLabels = ['Email', 'Verify', 'New Password'];
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <div className="w-full max-w-[420px]">
        {/* Home + Logo */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Home
          </Link>
          <Logo size="small" />
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              {i < stepLabels.length - 1 && <div className={`w-8 h-0.5 ${step > i + 1 ? 'bg-green-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          {step === 1 && (
            <>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Forgot Password?</h1>
              <p className="text-gray-500 text-sm mb-6">Enter your email to receive an OTP.</p>
              <form onSubmit={handleSendOTP} className="space-y-5">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl text-sm focus:border-blue-500 focus:ring-0 outline-none bg-white transition-all placeholder:text-gray-400"
                  placeholder="you@example.com" />
                <button type="submit" disabled={submitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-2xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25">
                  {submitting ? 'Sending...' : 'Send OTP'}
                </button>
              </form>
            </>
          )}
          {step === 2 && (
            <>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Enter OTP</h1>
              <p className="text-gray-500 text-sm mb-6">Sent to <span className="font-semibold">{email}</span></p>
              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} required maxLength={6}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl text-sm focus:border-blue-500 focus:ring-0 outline-none bg-white transition-all text-center text-2xl tracking-[0.5em] font-mono"
                  placeholder="000000" />
                <button type="submit" disabled={submitting || otp.length !== 6}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-2xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25">
                  {submitting ? 'Verifying...' : 'Verify OTP'}
                </button>
                <button type="button" onClick={() => setStep(1)} className="w-full text-sm font-semibold text-gray-500 hover:text-gray-700">Change email</button>
              </form>
            </>
          )}
          {step === 3 && (
            <>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">New Password</h1>
              <p className="text-gray-500 text-sm mb-6">Create a strong password.</p>
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8}
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl text-sm focus:border-blue-500 focus:ring-0 outline-none bg-white transition-all placeholder:text-gray-400 pr-12"
                    placeholder="Min 8 characters" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-600">
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                  className={`w-full px-4 py-3.5 border-2 rounded-2xl text-sm focus:border-blue-500 focus:ring-0 outline-none bg-white transition-all placeholder:text-gray-400 ${confirmPassword && newPassword !== confirmPassword ? 'border-red-400' : 'border-gray-200'}`}
                  placeholder="Confirm password" />
                {confirmPassword && newPassword !== confirmPassword && <p className="text-xs text-red-500 font-semibold">Passwords do not match</p>}
                <button type="submit" disabled={submitting || newPassword.length < 8 || newPassword !== confirmPassword}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-2xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25">
                  {submitting ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors">← Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
