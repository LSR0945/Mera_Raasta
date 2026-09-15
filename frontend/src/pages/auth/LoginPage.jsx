import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import Logo from '../../components/common/Logo';
import Captcha from '../../components/common/Captcha';

/* ═══ PARTICLE FIELD ═══ */
function Particles({ count = 25 }) {
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

/* ═══ FIELD WRAPPER ═══ */
function FieldWrapper({ children, delay = 0 }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t); }, [delay]);
  return <div className={`transition-all duration-700 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>{children}</div>;
}

/* ═══ MAIN ═══ */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const m = (e) => setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    window.addEventListener('mousemove', m, { passive: true });
    return () => window.removeEventListener('mousemove', m);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!captchaVerified) return toast.error('Solve the captcha first!');
    setSubmitting(true);
    try { await login(email, password); toast.success('Welcome back!'); navigate('/dashboard'); }
    catch (err) { toast.error(err.response?.data?.message || 'Login failed'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-[#06060f] overflow-hidden">
      <style>{`
        @keyframes pDrift { 0%,100%{transform:translateY(0) translateX(0);opacity:0.2} 25%{transform:translateY(-25px) translateX(10px);opacity:0.4} 50%{transform:translateY(-12px) translateX(-15px);opacity:0.25} 75%{transform:translateY(-35px) translateX(6px);opacity:0.35} }
        @keyframes orbMove { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-25px) scale(1.04)} 66%{transform:translate(-25px,30px) scale(0.96)} }
        @keyframes fadeInUp { 0%{opacity:0;transform:translateY(25px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes slideInLeft { 0%{opacity:0;transform:translateX(-30px)} 100%{opacity:1;transform:translateX(0)} }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes gradShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes glow { 0%,100%{box-shadow:0 0 20px rgba(99,102,241,0.15)} 50%{box-shadow:0 0 40px rgba(99,102,241,0.3)} }
      `}</style>

      <div className="flex min-h-screen">
        {/* ═══ LEFT PANEL — Premium Dark ═══ */}
        <div className="hidden lg:flex lg:w-[50%] relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, #06060f 0%, #0c0c24 30%, #12103a 50%, #0c0c24 70%, #06060f 100%)' }} />
          <div className="absolute w-[500px] h-[500px] -top-20 -left-20 opacity-20" style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', filter: 'blur(80px)', animation: 'orbMove 16s ease-in-out infinite' }} />
          <div className="absolute w-[400px] h-[400px] bottom-20 right-0 opacity-15" style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', filter: 'blur(70px)', animation: 'orbMove 14s ease-in-out 4s infinite' }} />
          <div className="absolute w-[300px] h-[300px] top-1/2 left-1/3 opacity-10" style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)', filter: 'blur(60px)', animation: 'orbMove 18s ease-in-out 8s infinite' }} />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          <Particles count={25} />

          <div className="relative z-10 flex flex-col justify-center p-12 xl:p-20 w-full">
            <div className="mb-16" style={{ animation: 'slideInLeft 0.8s ease 0.2s both' }}>
              <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/20"
                  style={{ animation: 'glow 3s ease-in-out infinite' }}>M</div>
                <span className="text-xl font-extrabold text-white tracking-tight">Mera Raasta</span>
              </div>
            </div>

            <div className="mb-14" style={{ animation: 'slideInLeft 0.8s ease 0.4s both' }}>
              <h1 className="text-4xl xl:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tight">
                Welcome<br />
                <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent"
                  style={{ backgroundSize: '200% auto', animation: 'gradShift 4s ease infinite' }}>
                  Back!
                </span>
              </h1>
              <p className="text-white/40 text-lg leading-relaxed max-w-md">
                Log in to continue your career journey. Your personalized roadmap is waiting.
              </p>
            </div>

            <div className="space-y-4 mb-14">
              {[
                { icon: '🎯', text: 'AI-powered career matching', delay: '0.5s' },
                { icon: '🗺️', text: 'Personalized career roadmaps', delay: '0.6s' },
                { icon: '🤖', text: '24/7 AI career coach', delay: '0.7s' },
                { icon: '📊', text: 'Progress tracking & analytics', delay: '0.8s' },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-4 group" style={{ animation: `fadeInUp 0.5s ease ${f.delay} both` }}>
                  <div className="w-11 h-11 bg-white/[0.05] backdrop-blur-sm rounded-xl flex items-center justify-center text-lg border border-white/[0.06] group-hover:scale-110 transition-transform">{f.icon}</div>
                  <span className="text-sm text-white/40 font-medium group-hover:text-white/60 transition-colors">{f.text}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4" style={{ animation: 'slideInLeft 0.8s ease 1s both' }}>
              {[{ n: '10K+', l: 'Students', icon: '🎓' }, { n: '500+', l: 'Careers', icon: '💼' }, { n: '95%', l: 'Success', icon: '🏆' }].map((s, i) => (
                <div key={i} className="bg-white/[0.04] backdrop-blur-xl rounded-2xl p-5 text-center border border-white/[0.06] hover:bg-white/[0.07] transition-all duration-500 group cursor-default">
                  <div className="text-xl mb-1 group-hover:scale-110 transition-transform">{s.icon}</div>
                  <p className="text-2xl font-black text-white">{s.n}</p>
                  <p className="text-[10px] text-white/30 mt-1">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ RIGHT PANEL — Form ═══ */}
        <div className="flex-1 flex items-center justify-center px-5 py-10 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#06060f] via-[#0a0a1a] to-[#06060f]" />
          <div className="absolute w-[300px] h-[300px] top-20 right-10 opacity-10" style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)', filter: 'blur(50px)' }} />

          <div className="w-full max-w-[440px] relative z-10">
            {/* Back + Mobile Logo */}
            <div className={`flex items-center justify-between mb-10 ${mounted ? '' : 'opacity-0'}`} style={{ animation: 'fadeInUp 0.6s ease 0.1s both' }}>
              <Link to="/" className="inline-flex items-center gap-2 text-[13px] font-medium text-white/30 hover:text-white/70 px-3 py-2 rounded-xl hover:bg-white/[0.04] transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                Home
              </Link>
              <div className="lg:hidden"><Logo size="small" /></div>
            </div>

            {/* Title */}
            <div className="mb-8" style={{ animation: 'fadeInUp 0.6s ease 0.2s both' }}>
              <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Sign In</h1>
              <p className="text-white/30 text-sm">Enter your credentials to access your dashboard.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <FieldWrapper delay={300}>
                <div>
                  <label className="block text-[11px] font-bold text-white/30 mb-2 uppercase tracking-wider">Email Address</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                    </span>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                      className="w-full pl-12 pr-4 py-3.5 border border-white/[0.08] rounded-2xl text-sm text-white bg-white/[0.03] focus:border-blue-500/50 focus:bg-white/[0.05] outline-none transition-all duration-300 placeholder:text-white/20"
                      placeholder="you@example.com" />
                    {email && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                  </div>
                </div>
              </FieldWrapper>

              <FieldWrapper delay={400}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold text-white/30 uppercase tracking-wider">Password</label>
                    <div className="flex items-center gap-3">
                      <Link to="/forgot-password" className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">Forgot?</Link>
                      <span className="text-white/10">|</span>
                      <Link to="/change-password" className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors">Change</Link>
                    </div>
                  </div>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                    </span>
                    <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required
                      className="w-full pl-12 pr-12 py-3.5 border border-white/[0.08] rounded-2xl text-sm text-white bg-white/[0.03] focus:border-blue-500/50 focus:bg-white/[0.05] outline-none transition-all duration-300 placeholder:text-white/20"
                      placeholder="Enter your password" />
                    <button type="button" onClick={() => setShow(!show)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors">
                      {show ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      )}
                    </button>
                  </div>
                </div>
              </FieldWrapper>

              <FieldWrapper delay={500}>
                <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4">
                  <Captcha onVerify={setCaptchaVerified} />
                </div>
              </FieldWrapper>

              <FieldWrapper delay={600}>
                <button type="submit" disabled={submitting || !captchaVerified}
                  className="relative w-full py-3.5 rounded-2xl font-bold text-sm text-white overflow-hidden transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-0.5 active:scale-[0.98] group"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)', backgroundSize: '200% 200%', animation: 'gradShift 3s ease infinite' }}>
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {submitting ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Signing In...
                      </>
                    ) : (
                      <>
                        Sign In
                        <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                      </>
                    )}
                  </span>
                </button>
              </FieldWrapper>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6" style={{ animation: 'fadeInUp 0.5s ease 0.7s both' }}>
              <div className="flex-1 h-[1px] bg-white/[0.06]" />
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">or</span>
              <div className="flex-1 h-[1px] bg-white/[0.06]" />
            </div>

            {/* Demo Accounts */}
            <FieldWrapper delay={700}>
              <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl p-5 border border-white/[0.04]">
                <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-3">Demo Accounts</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { role: 'Student', email: 'rahul@student.com', icon: '🎓', gradient: 'from-blue-500/20 to-indigo-500/20', border: 'border-blue-500/20', hoverBorder: 'hover:border-blue-400/40' },
                    { role: 'Parent', email: 'priya@parent.com', icon: '👨‍👩‍👧', gradient: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/20', hoverBorder: 'hover:border-emerald-400/40' },
                    { role: 'Mentor', email: 'amit@mentor.com', icon: '🧑‍🏫', gradient: 'from-violet-500/20 to-purple-500/20', border: 'border-violet-500/20', hoverBorder: 'hover:border-violet-400/40' },
                  ].map((d) => (
                    <button key={d.role} type="button" onClick={() => { setEmail(d.email); setPassword('password123'); }}
                      className={`p-3 rounded-xl border ${d.border} bg-gradient-to-br ${d.gradient} text-center transition-all duration-300 ${d.hoverBorder} hover:scale-105 hover:bg-white/[0.04] active:scale-95 group`}>
                      <span className="text-2xl block mb-1 group-hover:scale-110 transition-transform">{d.icon}</span>
                      <span className="text-[10px] font-bold text-white/50 block">{d.role}</span>
                    </button>
                  ))}
                </div>
              </div>
            </FieldWrapper>

            {/* Register Link */}
            <FieldWrapper delay={800}>
              <p className="text-center text-sm text-white/25 mt-8">
                Don't have an account?{' '}
                <Link to="/register" className="font-bold text-blue-400 hover:text-blue-300 transition-colors">Create free account</Link>
              </p>
            </FieldWrapper>
          </div>
        </div>
      </div>
    </div>
  );
}