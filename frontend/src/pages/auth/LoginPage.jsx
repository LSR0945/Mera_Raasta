import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import Logo from '../../components/common/Logo';
import Captcha from '../../components/common/Captcha';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!captchaVerified) return toast.error('Please verify you are human!');
    setSubmitting(true);
    try { await login(email, password); toast.success('Welcome back!'); navigate('/dashboard'); }
    catch (err) { toast.error(err.response?.data?.message || 'Login failed'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel ── */}
      <div className="hidden lg:flex lg:w-[48%] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center p-12 xl:p-16 w-full">
          <div className="mb-14">
            <Logo size="large" className="[&_span]:text-white [&_span]:bg-none [&_span>span]:text-white" />
          </div>
          <div className="mb-12">
            <h1 className="text-4xl xl:text-5xl font-extrabold text-white mb-5 leading-tight">Welcome<br />Back!</h1>
            <p className="text-blue-100/80 text-lg leading-relaxed max-w-md">Log in to continue your career journey. Your personalized roadmap is waiting.</p>
          </div>
          <div className="space-y-4 mb-12">
            {[
              { icon: '🎯', text: 'AI-powered career matching' },
              { icon: '🗺️', text: 'Personalized career roadmaps' },
              { icon: '🤖', text: '24/7 AI career coach' },
              { icon: '📊', text: 'Progress tracking & analytics' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3.5">
                <div className="w-9 h-9 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center text-sm border border-white/10">{f.icon}</div>
                <span className="text-sm text-blue-50/90 font-medium">{f.text}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[{ n: '10K+', l: 'Students' }, { n: '500+', l: 'Careers' }, { n: '95%', l: 'Success' }].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10">
                <p className="text-xl font-extrabold text-white">{s.n}</p>
                <p className="text-[10px] text-blue-200 mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 flex items-center justify-center px-5 py-10 bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
        <div className="w-full max-w-[420px]">
          {/* Home + Mobile Logo */}
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              Home
            </Link>
            <Logo size="small" />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Sign In</h1>
            <p className="text-gray-500">Enter your credentials to access your dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-gray-900">Password</label>
                <div className="flex items-center gap-3">
                  <Link to="/forgot-password" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">Forgot?</Link>
                  <span className="text-gray-300">|</span>
                  <Link to="/change-password" className="text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors">Change Password</Link>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                </span>
                <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-2xl text-sm focus:border-blue-500 focus:ring-0 outline-none bg-white transition-all placeholder:text-gray-400"
                  placeholder="Enter your password" />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors">
                  {show ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                </button>
              </div>
            </div>
            <Captcha onVerify={setCaptchaVerified} />
            <button type="submit" disabled={submitting || !captchaVerified}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-2xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl flex items-center justify-center gap-2">
              {submitting ? (<><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Signing In...</>) : 'Sign In'}
            </button>
          </form>

          <div className="flex items-center gap-4 my-6"><div className="flex-1 h-px bg-gray-200" /><span className="text-xs text-gray-400 font-medium">or</span><div className="flex-1 h-px bg-gray-200" /></div>

          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Demo Accounts</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { role: 'Student', email: 'rahul@student.com', icon: '🎓', color: 'hover:bg-blue-50 hover:border-blue-200' },
                { role: 'Parent', email: 'priya@parent.com', icon: '👨‍👩‍👧', color: 'hover:bg-emerald-50 hover:border-emerald-200' },
                { role: 'Mentor', email: 'amit@mentor.com', icon: '🧑‍🏫', color: 'hover:bg-violet-50 hover:border-violet-200' },
              ].map((d) => (
                <button key={d.role} type="button" onClick={() => { setEmail(d.email); setPassword('password123'); }}
                  className={`p-3 rounded-xl border border-gray-200 text-center transition-all ${d.color}`}>
                  <span className="text-xl block mb-1">{d.icon}</span>
                  <span className="text-[10px] font-bold text-gray-700 block">{d.role}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">Create free account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
