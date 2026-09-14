import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Logo from '../../components/common/Logo';

export default function ChangePasswordPage() {
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const strength = (p) => { let s = 0; if (p.length >= 8) s++; if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++; return s; };
  const str = strength(newPassword);
  const strColors = ['bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-green-400'];
  const strLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    if (newPassword.length < 8) return toast.error('Password must be at least 8 characters');
    if (currentPassword === newPassword) return toast.error('New password must be different');
    setSubmitting(true);
    try {
      await api.post('/auth/change-password', { email, currentPassword, newPassword });
      toast.success('Password changed successfully! Please login with new password.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setSubmitting(false); }
  };

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

        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* Icon */}
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-lg shadow-amber-500/25">
            🔑
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">Change Password</h1>
          <p className="text-gray-500 text-sm mb-8 text-center">Update your account password for better security.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                </span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl text-sm focus:border-blue-500 focus:ring-0 outline-none bg-white transition-all placeholder:text-gray-400"
                  placeholder="you@example.com" />
              </div>
            </div>

            {/* Current Password */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Current Password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                </span>
                <input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required
                  className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-2xl text-sm focus:border-blue-500 focus:ring-0 outline-none bg-white transition-all placeholder:text-gray-400"
                  placeholder="Enter current password" />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors">
                  {showCurrent ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">New Password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </span>
                <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8}
                  className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-2xl text-sm focus:border-blue-500 focus:ring-0 outline-none bg-white transition-all placeholder:text-gray-400"
                  placeholder="Min 8 characters" />
                <button type="button" onClick={() => setShowNew(!showNew)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors">
                  {showNew ? '🙈' : '👁️'}
                </button>
              </div>
              {newPassword && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-1.5">{[0, 1, 2, 3].map((i) => <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < str ? strColors[str - 1] : 'bg-gray-200'}`} />)}</div>
                  <p className={`text-xs font-semibold ${str >= 3 ? 'text-green-600' : str >= 2 ? 'text-amber-600' : 'text-red-500'}`}>{strLabels[str - 1] || 'Too short'}</p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Confirm New Password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </span>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                  className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-2xl text-sm focus:border-blue-500 focus:ring-0 outline-none bg-white transition-all placeholder:text-gray-400 ${confirmPassword && newPassword !== confirmPassword ? 'border-red-400' : 'border-gray-200'}`}
                  placeholder="Re-enter new password" />
              </div>
              {confirmPassword && newPassword !== confirmPassword && <p className="text-xs text-red-500 font-semibold mt-1.5">Passwords do not match</p>}
            </div>

            {/* Submit */}
            <button type="submit" disabled={submitting || !email || !currentPassword || newPassword.length < 8 || newPassword !== confirmPassword}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3.5 rounded-2xl font-bold text-sm hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 transition-all shadow-lg shadow-amber-500/25 hover:shadow-xl flex items-center justify-center gap-2">
              {submitting ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Changing...</>
              ) : 'Change Password'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors">← Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
