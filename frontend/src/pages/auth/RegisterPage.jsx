import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import Logo from '../../components/common/Logo';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const roles = [
    { value: 'student', label: 'Student', icon: '🎓', desc: 'Explore careers & get guidance', color: 'bg-blue-50 border-blue-200 hover:border-blue-400', active: 'bg-blue-50 border-blue-500 ring-2 ring-blue-200' },
    { value: 'parent', label: 'Parent', icon: '👨‍👩‍👧', desc: 'Track your child\'s progress', color: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400', active: 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200' },
    { value: 'mentor', label: 'Mentor', icon: '🧑‍🏫', desc: 'Guide & mentor students', color: 'bg-violet-50 border-violet-200 hover:border-violet-400', active: 'bg-violet-50 border-violet-500 ring-2 ring-violet-200' },
  ];

  const passwordStrength = (p) => { let s = 0; if (p.length >= 8) s++; if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++; return s; };
  const strength = passwordStrength(password);
  const strengthColors = ['bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-green-400'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  const handleNext = () => { if (role && name.trim()) setStep(2); else toast.error('Please select role and enter name'); };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return toast.error('Passwords do not match');
    setSubmitting(true);
    try {
      const result = await register({ name, email, password, role });
      toast.success('Account created! Welcome to Mera Raasta!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      if (msg.includes('already in use')) {
        toast.error('Email already registered! Redirecting to login...');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectedRole = roles.find(r => r.value === role);

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
            <h1 className="text-4xl xl:text-5xl font-extrabold text-white mb-5 leading-tight">Start Your<br />Journey</h1>
            <p className="text-blue-100/80 text-lg leading-relaxed max-w-md">Join thousands of students, parents, and mentors building better careers.</p>
          </div>
          <div className="space-y-4 mb-12">
            {[
              { icon: '🎯', text: 'AI-powered career matching' },
              { icon: '🗺️', text: 'Personalized career roadmaps' },
              { icon: '🤖', text: '24/7 AI career coach' },
              { icon: '👨‍👩‍👧', text: 'Parent & mentor dashboards' },
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
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              Home
            </Link>
            <Logo size="small" />
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3 mb-6">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25' : 'bg-gray-200 text-gray-500'}`}>
                  {step > s ? '✓' : s}
                </div>
                {s < 2 && <div className={`flex-1 h-1 rounded-full ${step > 1 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {/* Step 1: Role + Name */}
          {step === 1 && (
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Create Account</h1>
              <p className="text-gray-500 text-sm mb-8">Choose your role and tell us your name.</p>

              <div className="space-y-3 mb-6">
                {roles.map((r) => (
                  <button key={r.value} type="button" onClick={() => setRole(r.value)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${role === r.value ? r.active : r.color}`}>
                    <span className="text-3xl">{r.icon}</span>
                    <div>
                      <p className="font-bold text-gray-900">{r.label}</p>
                      <p className="text-xs text-gray-500">{r.desc}</p>
                    </div>
                    {role === r.value && <div className="ml-auto w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center"><svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></div>}
                  </button>
                ))}
              </div>

              <div className="relative mb-6">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg></span>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl text-sm focus:border-blue-500 focus:ring-0 outline-none bg-white transition-all placeholder:text-gray-400"
                  placeholder="Enter your full name" />
              </div>

              <button onClick={handleNext}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-2xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2">
                Continue
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </button>
            </div>
          )}

          {/* Step 2: Email + Password */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setStep(1)} className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900">Almost Done!</h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm text-gray-500">Signing up as</span>
                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-bold">{selectedRole?.icon} {selectedRole?.label}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg></span>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl text-sm focus:border-blue-500 focus:ring-0 outline-none bg-white transition-all placeholder:text-gray-400"
                    placeholder="you@example.com" />
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg></span>
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
                    className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-2xl text-sm focus:border-blue-500 focus:ring-0 outline-none bg-white transition-all placeholder:text-gray-400"
                    placeholder="Min 8 characters" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-600">
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>

                {password && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1.5">{[0, 1, 2, 3].map((i) => <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < strength ? strengthColors[strength - 1] : 'bg-gray-200'}`} />)}</div>
                    <p className={`text-xs font-semibold ${strength >= 3 ? 'text-green-600' : strength >= 2 ? 'text-amber-600' : 'text-red-500'}`}>{strengthLabels[strength - 1] || 'Too short'}</p>
                  </div>
                )}

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg></span>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                    className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-2xl text-sm focus:border-blue-500 focus:ring-0 outline-none bg-white transition-all placeholder:text-gray-400 ${confirmPassword && password !== confirmPassword ? 'border-red-400' : 'border-gray-200'}`}
                    placeholder="Confirm password" />
                </div>
                {confirmPassword && password !== confirmPassword && <p className="text-xs text-red-500 font-semibold">Passwords do not match</p>}

                <button type="submit" disabled={submitting || !email || password.length < 8 || password !== confirmPassword}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-2xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2">
                  {submitting ? (<><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Creating...</>) : 'Create Account'}
                </button>
              </form>
            </div>
          )}

          <p className="text-center text-sm text-gray-500 mt-8">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
