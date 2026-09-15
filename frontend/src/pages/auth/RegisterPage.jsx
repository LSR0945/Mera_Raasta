import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import Logo from '../../components/common/Logo';

/* ═══ PARTICLE FIELD ═══ */
function Particles({ count = 30 }) {
  const p = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    s: 1 + Math.random() * 2, d: 5 + Math.random() * 10, dl: Math.random() * 6,
  })), [count]);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {p.map(i => (
        <div key={i.id} className="absolute bg-white rounded-full" style={{
          left: `${i.x}%`, top: `${i.y}%`, width: i.s, height: i.s, opacity: 0.15 + Math.random() * 0.2,
          animation: `pDrift ${i.d}s ease-in-out ${i.dl}s infinite`,
        }} />
      ))}
    </div>
  );
}

/* ═══ MAIN ═══ */
export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const [mounted, setMounted] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const m = (e) => setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    window.addEventListener('mousemove', m, { passive: true });
    return () => window.removeEventListener('mousemove', m);
  }, []);

  const roles = [
    { value: 'student', label: 'Student', icon: '🎓', desc: 'Explore careers & get AI guidance', color: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/20', activeBorder: 'border-blue-400', activeGlow: 'shadow-[0_0_30px_rgba(59,130,246,0.2)]', gradient: 'from-blue-600 to-indigo-600' },
    { value: 'parent', label: 'Parent', icon: '👨‍👩‍👧', desc: "Track your child's progress", color: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/20', activeBorder: 'border-emerald-400', activeGlow: 'shadow-[0_0_30px_rgba(16,185,129,0.2)]', gradient: 'from-emerald-600 to-teal-600' },
    { value: 'mentor', label: 'Mentor', icon: '🧑‍🏫', desc: 'Guide & mentor students', color: 'from-violet-500/20 to-purple-500/20', border: 'border-violet-500/20', activeBorder: 'border-violet-400', activeGlow: 'shadow-[0_0_30px_rgba(139,92,246,0.2)]', gradient: 'from-violet-600 to-purple-600' },
  ];

  const passwordStrength = (p) => { let s = 0; if (p.length >= 8) s++; if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++; return s; };
  const strength = passwordStrength(password);
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthTextColors = ['text-red-400', 'text-orange-400', 'text-amber-400', 'text-emerald-400'];

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
    <div className="min-h-screen bg-[#06060f] overflow-hidden">
      <style>{`
        @keyframes pDrift { 0%,100%{transform:translateY(0) translateX(0);opacity:0.2} 25%{transform:translateY(-25px) translateX(10px);opacity:0.4} 50%{transform:translateY(-12px) translateX(-15px);opacity:0.25} 75%{transform:translateY(-35px) translateX(6px);opacity:0.35} }
        @keyframes orbMove { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-25px) scale(1.04)} 66%{transform:translate(-25px,30px) scale(0.96)} }
        @keyframes fadeInUp { 0%{opacity:0;transform:translateY(25px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { 0%{opacity:0} 100%{opacity:1} }
        @keyframes slideInRight { 0%{opacity:0;transform:translateX(30px)} 100%{opacity:1;transform:translateX(0)} }
        @keyframes slideInLeft { 0%{opacity:0;transform:translateX(-30px)} 100%{opacity:1;transform:translateX(0)} }
        @keyframes scaleIn { 0%{opacity:0;transform:scale(0.9)} 100%{opacity:1;transform:scale(1)} }
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 20px rgba(99,102,241,0.1)} 50%{box-shadow:0 0 40px rgba(99,102,241,0.25)} }
        @keyframes borderGlow { 0%,100%{border-color:rgba(99,102,241,0.2)} 50%{border-color:rgba(99,102,241,0.5)} }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes checkPop { 0%{transform:scale(0)} 50%{transform:scale(1.3)} 100%{transform:scale(1)} }
        @keyframes progressFill { 0%{width:0} 100%{width:var(--fill)} }
        @keyframes gradShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes cardHover { 0%{transform:translateY(0)} 100%{transform:translateY(-4px)} }
      `}</style>

      <div className="flex min-h-screen">
        {/* ═══ LEFT PANEL — Premium Dark ═══ */}
        <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, #06060f 0%, #0c0c24 30%, #12103a 50%, #0c0c24 70%, #06060f 100%)' }} />
          <div className="absolute w-[500px] h-[500px] -top-20 -left-20 opacity-20" style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', filter: 'blur(80px)', animation: 'orbMove 16s ease-in-out infinite' }} />
          <div className="absolute w-[400px] h-[400px] bottom-20 right-0 opacity-15" style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', filter: 'blur(70px)', animation: 'orbMove 14s ease-in-out 4s infinite' }} />
          <div className="absolute w-[300px] h-[300px] top-1/2 left-1/3 opacity-10" style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)', filter: 'blur(60px)', animation: 'orbMove 18s ease-in-out 8s infinite' }} />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          <Particles count={25} />

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center p-12 xl:p-16 w-full">
            <div className="mb-14" style={{ animation: 'fadeInUp 0.8s ease 0.2s both' }}>
              <Logo size="large" className="[&_span]:text-white [&_span]:bg-none [&_span>span]:text-white" />
            </div>

            <div className="mb-12" style={{ animation: 'fadeInUp 0.8s ease 0.4s both' }}>
              <h1 className="text-4xl xl:text-5xl font-black text-white mb-5 leading-[1.1] tracking-tight">
                Start Your<br />
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent" style={{ backgroundSize: '200% auto', animation: 'gradShift 4s ease infinite' }}>
                  Dream Career
                </span>
              </h1>
              <p className="text-white/40 text-lg leading-relaxed max-w-md">Join thousands of students, parents, and mentors building better futures.</p>
            </div>

            <div className="space-y-4 mb-12">
              {[
                { icon: '🎯', text: 'AI-powered career matching', delay: '0.5s' },
                { icon: '🗺️', text: 'Personalized career roadmaps', delay: '0.6s' },
                { icon: '🤖', text: '24/7 AI career coach', delay: '0.7s' },
                { icon: '👨‍👩‍👧', text: 'Parent & mentor dashboards', delay: '0.8s' },
                { icon: '🏆', text: 'Placement rewards & certifications', delay: '0.9s' },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3.5" style={{ animation: `fadeInUp 0.6s ease ${f.delay} both` }}>
                  <div className="w-10 h-10 bg-white/[0.06] backdrop-blur-sm rounded-xl flex items-center justify-center text-sm border border-white/[0.08] group-hover:scale-110 transition-transform">{f.icon}</div>
                  <span className="text-sm text-white/50 font-medium">{f.text}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4" style={{ animation: 'fadeInUp 0.8s ease 1s both' }}>
              {[{ n: '10K+', l: 'Students', icon: '🎓' }, { n: '500+', l: 'Careers', icon: '💼' }, { n: '95%', l: 'Success', icon: '🏆' }].map((s, i) => (
                <div key={i} className="bg-white/[0.04] backdrop-blur-xl rounded-2xl p-4 text-center border border-white/[0.06] hover:bg-white/[0.07] transition-all duration-500 group cursor-default" style={{ animation: `scaleIn 0.5s ease ${1.1 + i * 0.1}s both` }}>
                  <div className="text-xl mb-1 group-hover:scale-110 transition-transform">{s.icon}</div>
                  <p className="text-xl font-black text-white">{s.n}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ RIGHT PANEL — Form ═══ */}
        <div className="flex-1 flex items-center justify-center px-5 py-10 relative">
          {/* Subtle bg */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#06060f] via-[#0a0a1a] to-[#06060f]" />
          <div className="absolute w-[300px] h-[300px] top-20 right-10 opacity-10" style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)', filter: 'blur(50px)' }} />

          <div className="w-full max-w-[420px] relative z-10">
            {/* Home + Mobile Logo */}
            <div className="flex items-center justify-between mb-8" style={{ animation: 'fadeInUp 0.6s ease 0.1s both' }}>
              <Link to="/" className="inline-flex items-center gap-2 text-[13px] font-medium text-white/30 hover:text-white/70 px-3 py-2 rounded-xl hover:bg-white/[0.04] transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                Home
              </Link>
              <div className="lg:hidden"><Logo size="small" /></div>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-3 mb-8" style={{ animation: 'fadeInUp 0.6s ease 0.2s both' }}>
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${step >= s ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25' : 'bg-white/[0.04] text-white/30 border border-white/[0.06]'}`}>
                    {step > s ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} style={{ animation: 'checkPop 0.4s ease' }}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    ) : s}
                  </div>
                  {s < 2 && (
                    <div className="flex-1 h-1 rounded-full bg-white/[0.04] overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${step > 1 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : ''}`} style={step > 1 ? { animation: 'shimmer 2s ease-in-out infinite', width: '100%' } : {}} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ═══ STEP 1: Role + Name ═══ */}
            {step === 1 && (
              <div style={{ animation: 'slideInRight 0.5s ease' }}>
                <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Create Account</h1>
                <p className="text-white/30 text-sm mb-8">Choose your role and tell us your name.</p>

                {/* Role Cards */}
                <div className="space-y-3 mb-6">
                  {roles.map((r, i) => (
                    <button key={r.value} type="button" onClick={() => setRole(r.value)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 text-left group
                        ${role === r.value
                          ? `bg-gradient-to-r ${r.color} ${r.activeBorder} ${r.activeGlow}`
                          : `bg-white/[0.02] ${r.border} hover:bg-white/[0.04]`}`}
                      style={{ animation: `fadeInUp 0.5s ease ${0.3 + i * 0.1}s both` }}>
                      <div className={`w-12 h-12 bg-gradient-to-br ${r.color} rounded-xl flex items-center justify-center text-2xl border border-white/[0.06] group-hover:scale-110 transition-transform`}>{r.icon}</div>
                      <div className="flex-1">
                        <p className="font-bold text-white text-sm">{r.label}</p>
                        <p className="text-[11px] text-white/30 mt-0.5">{r.desc}</p>
                      </div>
                      {role === r.value && (
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center" style={{ animation: 'checkPop 0.3s ease' }}>
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Name Input */}
                <div className="relative mb-6" style={{ animation: 'fadeInUp 0.5s ease 0.6s both' }}>
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                  </span>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                    className="w-full pl-12 pr-4 py-3.5 border border-white/[0.08] rounded-2xl text-sm text-white bg-white/[0.03] focus:border-blue-500/50 focus:bg-white/[0.05] outline-none transition-all duration-300 placeholder:text-white/20"
                    placeholder="Enter your full name" />
                </div>

                <button onClick={handleNext}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-2xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 flex items-center justify-center gap-2 group relative overflow-hidden"
                  style={{ animation: 'fadeInUp 0.5s ease 0.7s both' }}>
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative flex items-center gap-2">
                    Continue
                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </span>
                </button>
              </div>
            )}

            {/* ═══ STEP 2: Email + Password ═══ */}
            {step === 2 && (
              <div style={{ animation: 'slideInRight 0.5s ease' }}>
                <div className="flex items-center gap-3 mb-6" style={{ animation: 'fadeInUp 0.4s ease 0.1s both' }}>
                  <button onClick={() => setStep(1)} className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center transition-all duration-300 text-white/40 hover:text-white/70">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Almost Done!</h1>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm text-white/30">Signing up as</span>
                      <span className={`inline-flex items-center gap-1 bg-gradient-to-r ${selectedRole?.color} px-2.5 py-0.5 rounded-full text-xs font-bold text-white border border-white/[0.08]`}>
                        {selectedRole?.icon} {selectedRole?.label}
                      </span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div className="relative" style={{ animation: 'fadeInUp 0.4s ease 0.2s both' }}>
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                    </span>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                      className="w-full pl-12 pr-4 py-3.5 border border-white/[0.08] rounded-2xl text-sm text-white bg-white/[0.03] focus:border-blue-500/50 focus:bg-white/[0.05] outline-none transition-all duration-300 placeholder:text-white/20"
                      placeholder="you@example.com" />
                  </div>

                  {/* Password */}
                  <div className="relative" style={{ animation: 'fadeInUp 0.4s ease 0.3s both' }}>
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                    </span>
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
                      className="w-full pl-12 pr-12 py-3.5 border border-white/[0.08] rounded-2xl text-sm text-white bg-white/[0.03] focus:border-blue-500/50 focus:bg-white/[0.05] outline-none transition-all duration-300 placeholder:text-white/20"
                      placeholder="Min 8 characters" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      )}
                    </button>
                  </div>

                  {/* Password Strength */}
                  {password && (
                    <div className="space-y-1.5" style={{ animation: 'fadeInUp 0.3s ease' }}>
                      <div className="flex gap-1.5">
                        {[0, 1, 2, 3].map((i) => (
                          <div key={i} className="h-1.5 flex-1 rounded-full bg-white/[0.04] overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${i < strength ? strengthColors[strength - 1] : ''}`}
                              style={i < strength ? { animation: `progressFill 0.5s ease ${i * 0.1}s both`, '--fill': '100%' } : {}} />
                          </div>
                        ))}
                      </div>
                      <p className={`text-xs font-semibold ${strength >= 3 ? strengthTextColors[3] : strength >= 2 ? strengthTextColors[2] : strengthTextColors[strength - 1] || 'text-white/30'}`}>
                        {strength > 0 ? strengthLabels[strength - 1] : 'Too short'}
                      </p>
                    </div>
                  )}

                  {/* Confirm Password */}
                  <div className="relative" style={{ animation: 'fadeInUp 0.4s ease 0.4s both' }}>
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                    </span>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                      className={`w-full pl-12 pr-4 py-3.5 border rounded-2xl text-sm text-white bg-white/[0.03] outline-none transition-all duration-300 placeholder:text-white/20 ${confirmPassword && password !== confirmPassword ? 'border-red-500/50 focus:border-red-500/70' : 'border-white/[0.08] focus:border-blue-500/50 focus:bg-white/[0.05]'}`}
                      placeholder="Confirm password" />
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-red-400 font-semibold mt-1.5 ml-1" style={{ animation: 'fadeInUp 0.3s ease' }}>Passwords do not match</p>
                    )}
                  </div>

                  {/* Submit */}
                  <button type="submit" disabled={submitting || !email || password.length < 8 || password !== confirmPassword}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-2xl font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 flex items-center justify-center gap-2 group relative overflow-hidden"
                    style={{ animation: 'fadeInUp 0.4s ease 0.5s both' }}>
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <span className="relative flex items-center gap-2">
                      {submitting ? (
                        <>
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Creating Account...
                        </>
                      ) : (
                        <>
                          Create Account
                          <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </>
                      )}
                    </span>
                  </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-4 my-6" style={{ animation: 'fadeInUp 0.4s ease 0.6s both' }}>
                  <div className="flex-1 h-[1px] bg-white/[0.06]" />
                  <span className="text-[11px] text-white/20 font-medium">or continue with</span>
                  <div className="flex-1 h-[1px] bg-white/[0.06]" />
                </div>

                {/* Social Login */}
                <div className="grid grid-cols-3 gap-3" style={{ animation: 'fadeInUp 0.4s ease 0.7s both' }}>
                  {[
                    { icon: 'G', label: 'Google', color: 'hover:bg-white/[0.06]' },
                    { icon: 'f', label: 'Facebook', color: 'hover:bg-white/[0.06]' },
                    { icon: 'X', label: 'X / Twitter', color: 'hover:bg-white/[0.06]' },
                  ].map((s, i) => (
                    <button key={i} type="button" className={`flex items-center justify-center gap-2 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] ${s.color} transition-all duration-300 group`}>
                      <span className="text-sm font-bold text-white/40 group-hover:text-white/70 transition-colors">{s.icon}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Login Link */}
            <p className="text-center text-sm text-white/25 mt-8" style={{ animation: 'fadeInUp 0.5s ease 0.8s both' }}>
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-blue-400 hover:text-blue-300 transition-colors">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}