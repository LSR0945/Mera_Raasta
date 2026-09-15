import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import Logo from '../../components/common/Logo';
import Captcha from '../../components/common/Captcha';

function FloatingParticle({ delay, size, x, y, dur }) {
  return (
    <div className="absolute rounded-full bg-white/10" style={{
      width: size, height: size, left: `${x}%`, top: `${y}%`,
      animation: `particleFloat ${dur}s ease-in-out ${delay}s infinite`,
    }} />
  );
}

function FieldWrapper({ children, delay = 0 }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t); }, [delay]);
  return <div className={`transition-all duration-700 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>{children}</div>;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!captchaVerified) return toast.error('Solve the captcha first!');
    setSubmitting(true);
    try { await login(email, password); toast.success('Welcome back!'); navigate('/dashboard'); }
    catch (err) { toast.error(err.response?.data?.message || 'Login failed'); }
    finally { setSubmitting(false); }
  };

  return (
    <>
      <style>{`
        @keyframes particleFloat { 0%,100%{transform:translateY(0) scale(1);opacity:0.3} 50%{transform:translateY(-40px) scale(1.2);opacity:0.6} }
        @keyframes slideInLeft { 0%{opacity:0;transform:translateX(-60px)} 100%{opacity:1;transform:translateX(0)} }
        @keyframes slideInRight { 0%{opacity:0;transform:translateX(60px)} 100%{opacity:1;transform:translateX(0)} }
        @keyframes fadeUp { 0%{opacity:0;transform:translateY(30px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes glow { 0%,100%{box-shadow:0 0 20px rgba(99,102,241,0.3)} 50%{box-shadow:0 0 40px rgba(99,102,241,0.6)} }
        @keyframes gradientFlow { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        @keyframes pulseRing { 0%{transform:scale(1);opacity:1} 100%{transform:scale(1.5);opacity:0} }
        @keyframes orbMove { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-20px) scale(1.1)} 66%{transform:translate(-20px,30px) scale(0.9)} }
        @keyframes textReveal { 0%{clip-path:inset(0 100% 0 0)} 100%{clip-path:inset(0 0% 0 0)} }
        @keyframes btnShine { 0%{left:-100%} 100%{left:200%} }
      `}</style>

      <div className="min-h-screen flex bg-[#0a0a1a] overflow-hidden">
        {/* ═══ LEFT PANEL — Dark Premium ═══ */}
        <div className="hidden lg:flex lg:w-[50%] relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 40%, #0f172a 70%, #0c0c1d 100%)' }}>

          {/* Animated orbs */}
          <div className="absolute w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] -top-40 -left-40" style={{ animation: 'orbMove 12s ease-in-out infinite' }} />
          <div className="absolute w-[400px] h-[400px] bg-violet-500/15 rounded-full blur-[100px] bottom-20 right-10" style={{ animation: 'orbMove 15s ease-in-out 3s infinite' }} />
          <div className="absolute w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] top-1/2 left-1/3" style={{ animation: 'orbMove 10s ease-in-out 6s infinite' }} />

          {/* Grid dots */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

          {/* Floating particles */}
          {[...Array(12)].map((_, i) => (
            <FloatingParticle key={i} delay={i * 0.8} size={`${4 + Math.random() * 6}px`} x={10 + Math.random() * 80} y={10 + Math.random() * 80} dur={4 + Math.random() * 4} />
          ))}

          <div className="relative z-10 flex flex-col justify-center p-12 xl:p-20 w-full">
            {/* Logo */}
            <div className={`mb-16 ${mounted ? 'animate-[slideInLeft_0.8s_ease_both]' : 'opacity-0'}`}>
              <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/30"
                  style={{ animation: 'glow 3s ease-in-out infinite' }}>M</div>
                <span className="text-xl font-extrabold text-white tracking-tight">Mera Raasta</span>
              </div>
            </div>

            {/* Heading */}
            <div className={`mb-14 ${mounted ? 'animate-[slideInLeft_0.8s_ease_0.2s_both]' : 'opacity-0'}`}>
              <h1 className="text-4xl xl:text-6xl font-black text-white mb-6 leading-[1.1]">
                Welcome<br />
                <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent"
                  style={{ backgroundSize: '200% 200%', animation: 'gradientFlow 4s ease infinite' }}>
                  Back!
                </span>
              </h1>
              <p className="text-white/40 text-lg leading-relaxed max-w-md">
                Log in to continue your career journey. Your personalized roadmap is waiting.
              </p>
            </div>

            {/* Features */}
            <div className={`space-y-4 mb-14 ${mounted ? 'animate-[slideInLeft_0.8s_ease_0.4s_both]' : 'opacity-0'}`}>
              {[
                { icon: '🎯', text: 'AI-powered career matching', gradient: 'from-blue-500 to-cyan-500' },
                { icon: '🗺️', text: 'Personalized career roadmaps', gradient: 'from-violet-500 to-purple-500' },
                { icon: '🤖', text: '24/7 AI career coach', gradient: 'from-emerald-500 to-teal-500' },
                { icon: '📊', text: 'Progress tracking & analytics', gradient: 'from-amber-500 to-orange-500' },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-4 group" style={{ animation: `fadeUp 0.5s ease ${0.5 + i * 0.1}s both` }}>
                  <div className={`w-11 h-11 bg-gradient-to-br ${f.gradient} rounded-xl flex items-center justify-center text-lg shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {f.icon}
                  </div>
                  <span className="text-sm text-white/60 font-medium group-hover:text-white/80 transition-colors">{f.text}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className={`grid grid-cols-3 gap-4 ${mounted ? 'animate-[slideInLeft_0.8s_ease_0.8s_both]' : 'opacity-0'}`}>
              {[{ n: '10K+', l: 'Students', c: 'from-blue-500 to-indigo-500' }, { n: '500+', l: 'Careers', c: 'from-violet-500 to-purple-500' }, { n: '95%', l: 'Success', c: 'from-emerald-500 to-teal-500' }].map((s, i) => (
                <div key={i} className="bg-white/[0.04] backdrop-blur-sm rounded-2xl p-5 text-center border border-white/[0.06] hover:bg-white/[0.08] transition-all duration-300 hover:scale-105">
                  <p className="text-2xl font-black bg-gradient-to-r bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${['#6366f1','#8b5cf6','#10b981'][i]}, ${['#818cf8','#a78bfa','#34d399'][i]})` }}>{s.n}</p>
                  <p className="text-[10px] text-white/30 mt-1 font-medium">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ RIGHT PANEL — Form ═══ */}
        <div className="flex-1 flex items-center justify-center px-5 py-10 relative"
          style={{ background: 'linear-gradient(135deg, #fafbff 0%, #f0f0ff 50%, #e8f4ff 100%)' }}>

          {/* Subtle background orbs */}
          <div className="absolute w-[300px] h-[300px] bg-indigo-200/30 rounded-full blur-[80px] top-20 right-20" />
          <div className="absolute w-[200px] h-[200px] bg-violet-200/20 rounded-full blur-[60px] bottom-20 left-20" />

          <div className="w-full max-w-[440px] relative z-10">
            {/* Back + Mobile Logo */}
            <div className={`flex items-center justify-between mb-10 ${mounted ? 'animate-[fadeUp_0.6s_ease_0.1s_both]' : 'opacity-0'}`}>
              <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-gray-700 px-3 py-2 rounded-xl hover:bg-white/80 transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                Home
              </Link>
              <div className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 border border-gray-100">
                <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-white font-black text-xs">M</div>
                <span className="text-sm font-bold text-gray-800">Mera Raasta</span>
              </div>
            </div>

            {/* Title */}
            <div className={`mb-8 ${mounted ? 'animate-[fadeUp_0.6s_ease_0.2s_both]' : 'opacity-0'}`}>
              <h1 className="text-3xl font-black text-gray-900 mb-2">Sign In</h1>
              <p className="text-gray-400 text-sm">Enter your credentials to access your dashboard.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <FieldWrapper delay={300}>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Email Address</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                    </span>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl text-sm focus:border-indigo-500 focus:ring-0 outline-none bg-white transition-all duration-300 placeholder:text-gray-400 hover:border-gray-300 focus:shadow-lg focus:shadow-indigo-500/10"
                      placeholder="you@example.com" />
                    {email && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                  </div>
                </div>
              </FieldWrapper>

              <FieldWrapper delay={400}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                    <div className="flex items-center gap-3">
                      <Link to="/forgot-password" className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors">Forgot?</Link>
                      <span className="text-gray-200">|</span>
                      <Link to="/change-password" className="text-xs font-semibold text-amber-500 hover:text-amber-700 transition-colors">Change</Link>
                    </div>
                  </div>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                    </span>
                    <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required
                      className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-2xl text-sm focus:border-indigo-500 focus:ring-0 outline-none bg-white transition-all duration-300 placeholder:text-gray-400 hover:border-gray-300 focus:shadow-lg focus:shadow-indigo-500/10"
                      placeholder="Enter your password" />
                    <button type="button" onClick={() => setShow(!show)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {show ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                      : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    </button>
                  </div>
                </div>
              </FieldWrapper>

              <FieldWrapper delay={500}>
                <Captcha onVerify={setCaptchaVerified} />
              </FieldWrapper>

              <FieldWrapper delay={600}>
                <button type="submit" disabled={submitting || !captchaVerified}
                  className="relative w-full py-3.5 rounded-2xl font-bold text-sm text-white overflow-hidden transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)', backgroundSize: '200% 200%', animation: 'gradientFlow 3s ease infinite' }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{ animation: submitting ? 'shimmer 1.5s infinite' : 'none' }} />
                  </div>
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      <>
                        Sign In
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                      </>
                    )}
                  </span>
                </button>
              </FieldWrapper>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            </div>

            {/* Demo Accounts */}
            <FieldWrapper delay={700}>
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-gray-100/80">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Demo Accounts</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { role: 'Student', email: 'rahul@student.com', icon: '🎓', gradient: 'from-blue-500 to-indigo-500', hoverBg: 'hover:bg-blue-50 hover:border-blue-300' },
                    { role: 'Parent', email: 'priya@parent.com', icon: '👨‍👩‍👧', gradient: 'from-emerald-500 to-teal-500', hoverBg: 'hover:bg-emerald-50 hover:border-emerald-300' },
                    { role: 'Mentor', email: 'amit@mentor.com', icon: '🧑‍🏫', gradient: 'from-violet-500 to-purple-500', hoverBg: 'hover:bg-violet-50 hover:border-violet-300' },
                  ].map((d) => (
                    <button key={d.role} type="button" onClick={() => { setEmail(d.email); setPassword('password123'); }}
                      className={`p-3 rounded-xl border border-gray-200 text-center transition-all duration-300 ${d.hoverBg} hover:scale-105 hover:shadow-md active:scale-95`}>
                      <span className="text-2xl block mb-1">{d.icon}</span>
                      <span className="text-[10px] font-bold text-gray-600 block">{d.role}</span>
                    </button>
                  ))}
                </div>
              </div>
            </FieldWrapper>

            {/* Register Link */}
            <FieldWrapper delay={800}>
              <p className="text-center text-sm text-gray-400 mt-8">
                Don't have an account?{' '}
                <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors relative group">
                  Create free account
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 group-hover:w-full transition-all duration-300" />
                </Link>
              </p>
            </FieldWrapper>
          </div>
        </div>
      </div>
    </>
  );
}
