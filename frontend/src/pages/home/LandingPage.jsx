import { Link } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import Logo from '../../components/common/Logo';
import { useAuth } from '../../hooks/useAuth';

/* ═══ Animated Counter ═══ */
function Counter({ end, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [started, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ═══ Confetti on Click ═══ */
function Confetti({ x, y, active }) {
  if (!active) return null;
  const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#10b981'];
  return (
    <div className="fixed pointer-events-none z-[9999]" style={{ left: x, top: y }}>
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * 360;
        const dist = 40 + Math.random() * 60;
        return (
          <div key={i} className="absolute w-2 h-2 rounded-full" style={{
            background: colors[i % colors.length],
            animation: `confettiPop 0.6s ease-out forwards`,
            '--tx': `${Math.cos(angle * Math.PI / 180) * dist}px`,
            '--ty': `${Math.sin(angle * Math.PI / 180) * dist}px`,
          }} />
        );
      })}
    </div>
  );
}

/* ═══ Ripple Button ═══ */
function RippleBtn({ children, className = '', onClick, ...props }) {
  const [ripples, setRipples] = useState([]);
  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(prev => [...prev, { x, y, id }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
    onClick?.(e);
  };
  return (
    <button className={`relative overflow-hidden ${className}`} onClick={handleClick} {...props}>
      {ripples.map(r => (
        <span key={r.id} className="absolute w-0 h-0 bg-white/30 rounded-full pointer-events-none"
          style={{ left: r.x, top: r.y, animation: 'rippleAnim 0.6s ease-out forwards', transform: 'translate(-50%, -50%)' }} />
      ))}
      {children}
    </button>
  );
}

/* ═══ Tilt Card ═══ */
function TiltCard({ children, className = '' }) {
  const ref = useRef(null);
  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
  };
  const handleLeave = () => { if (ref.current) ref.current.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) translateY(0px)'; };
  return (
    <div ref={ref} className={`${className} transition-transform duration-300 ease-out`} onMouseMove={handleMove} onMouseLeave={handleLeave}>
      {children}
    </div>
  );
}

/* ═══ MAIN LANDING PAGE ═══ */
export default function LandingPage() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [confetti, setConfetti] = useState({ active: false, x: 0, y: 0 });

  /* scroll reveal */
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal, .stagger-children').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  /* nav scroll */
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  /* confetti handler */
  const fireConfetti = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setConfetti({ active: true, x: rect.left + rect.width / 2, y: rect.top });
    setTimeout(() => setConfetti({ active: false, x: 0, y: 0 }), 700);
  }, []);

  /* click sparkle effect */
  const sparkle = useCallback((e) => {
    const el = document.createElement('div');
    el.innerHTML = '✨';
    el.className = 'fixed pointer-events-none z-[9999] text-2xl';
    el.style.left = `${e.clientX - 12}px`;
    el.style.top = `${e.clientY - 12}px`;
    el.style.animation = 'sparkleFloat 0.8s ease-out forwards';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* ═══ INLINE KEYFRAMES ═══ */}
      <style>{`
        @keyframes rippleAnim { to { width: 300px; height: 300px; opacity: 0; } }
        @keyframes confettiPop { 0% { transform: translate(0,0) scale(1); opacity:1; } 100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity:0; } }
        @keyframes sparkleFloat { 0% { transform: scale(0) rotate(0deg); opacity:1; } 100% { transform: scale(1.5) rotate(180deg) translateY(-40px); opacity:0; } }
        @keyframes heroGlow { 0%,100% { opacity:0.5; transform:scale(1); } 50% { opacity:0.8; transform:scale(1.05); } }
        .hero-glow { animation: heroGlow 4s ease-in-out infinite; }
      `}</style>

      <Confetti {...confetti} />

      {/* ═══════════ NAVBAR ═══════════ */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-100' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-[72px]">
            <Logo size="default" />

            <div className="hidden lg:flex items-center gap-1">
              {['Features', 'How It Works', 'Roles', 'Testimonials'].map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(/\s/g, '-')}`}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-50 transition-all magnetic">{item}</a>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <Link to="/dashboard" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 px-4 py-2 rounded-xl hover:bg-emerald-50 transition-all magnetic">
                  <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
                  Dashboard
                </Link>
              ) : (
                <Link to="/login" className="hidden sm:inline-flex text-sm font-semibold text-gray-600 hover:text-gray-900 px-4 py-2 rounded-xl hover:bg-gray-50 transition-all magnetic">Login</Link>
              )}
              <RippleBtn className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 glow-click">
                <Link to={user ? '/dashboard' : '/register'} className="flex items-center gap-2">
                  {user ? 'Go to Dashboard' : 'Get Started'}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </Link>
              </RippleBtn>
              <button onClick={() => setMobileMenu(!mobileMenu)} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl magnetic">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenu ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
              </button>
            </div>
          </div>
        </div>
        {mobileMenu && (
          <div className="lg:hidden bg-white border-t border-gray-100 shadow-xl animate-fade-in-down">
            <div className="px-4 py-4 space-y-1">
              {['Features', 'How It Works', 'Roles', 'Testimonials'].map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(/\s/g, '-')}`} onClick={() => setMobileMenu(false)} className="block px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl bounce-click">{item}</a>
              ))}
              {user ? (
                <Link to="/dashboard" className="block px-4 py-3 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-xl bounce-click flex items-center gap-2">
                  <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
                  Go to Dashboard
                </Link>
              ) : (
                <Link to="/login" className="block px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl bounce-click">Login</Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[700px] h-[700px] bg-blue-50 rounded-full blur-3xl opacity-60 hero-glow" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-50 rounded-full blur-3xl opacity-60 hero-glow" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/3 right-1/3 w-[400px] h-[400px] bg-violet-50 rounded-full blur-3xl opacity-40 hero-glow" style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto reveal">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-5 py-2 mb-8 bounce-click cursor-pointer hover:bg-blue-100 transition-colors" onClick={sparkle}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs font-semibold text-blue-700">AI-Powered Career Guidance Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.08] mb-6 tracking-tight">
              Find Your{' '}
              <span className="relative inline-block">
                <span className="relative z-10 text-shimmer">Perfect Career</span>
                <svg className="absolute -bottom-1 left-0 w-full h-3 text-blue-200/80" viewBox="0 0 200 12" fill="currentColor"><path d="M2 8c20-6 40-8 60-6s40 4 60 2 40-4 60-2" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" /></svg>
              </span>{' '}
              Path
            </h1>

            <p className="text-lg sm:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed reveal" style={{ transitionDelay: '0.2s' }}>
              India's smartest career guidance platform. Get AI-powered recommendations, personalized roadmaps, and expert mentorship to build your dream career.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-12 reveal" style={{ transitionDelay: '0.4s' }}>
              <RippleBtn onClick={fireConfetti}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:-translate-y-0.5 glow-click">
                <span>Start Your Journey — Free</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </RippleBtn>
              <a href="#how-it-works" className="inline-flex items-center gap-2 border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-2xl font-bold text-sm hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all magnetic bounce-click">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" /></svg>
                Watch Demo
              </a>
            </div>

            <div className="flex items-center justify-center gap-6 reveal" style={{ transitionDelay: '0.6s' }}>
              <div className="flex -space-x-3">
                {['from-blue-400 to-blue-600', 'from-violet-400 to-violet-600', 'from-emerald-400 to-emerald-600', 'from-amber-400 to-amber-600', 'from-pink-400 to-pink-600'].map((c, i) => (
                  <div key={i} className={`w-10 h-10 bg-gradient-to-br ${c} rounded-full border-[3px] border-white flex items-center justify-center text-white text-xs font-bold shadow-md magnetic`} style={{ animationDelay: `${i * 0.1}s` }}>
                    {['P', 'R', 'A', 'S', 'K'][i]}
                  </div>
                ))}
              </div>
              <div className="border-l border-gray-200 pl-6">
                <div className="flex items-center gap-1 mb-0.5">
                  {[1, 2, 3, 4, 5].map((s) => <svg key={s} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
                </div>
                <p className="text-sm font-bold text-gray-900">4.9/5 Rating</p>
                <p className="text-xs text-gray-500">from 10,000+ students</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ MAIN FUNCTIONS ═══════════ */}
      <section id="features" className="py-20 lg:py-28 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 reveal">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full mb-4">Why Mera Raasta</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">Everything You Need</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">From career discovery to job readiness — we've got every step of your journey covered.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {[
              { icon: '🎯', title: 'AI Career Matching', desc: 'Smart algorithms analyze your skills, interests & goals to suggest the perfect career path.', color: 'bg-blue-50 text-blue-600', border: 'border-blue-100 hover:border-blue-300' },
              { icon: '🗺️', title: 'Personalized Roadmaps', desc: 'Step-by-step career roadmaps with milestones, deadlines & actionable tasks.', color: 'bg-violet-50 text-violet-600', border: 'border-violet-100 hover:border-violet-300' },
              { icon: '📚', title: 'Education Hub', desc: 'Explore courses, colleges, scholarships & government schemes — all in one place.', color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100 hover:border-emerald-300' },
              { icon: '🤖', title: 'AI Career Coach', desc: 'Chat with AI for instant career guidance, resume tips & interview preparation.', color: 'bg-orange-50 text-orange-600', border: 'border-orange-100 hover:border-orange-300' },
              { icon: '📄', title: 'Resume Builder', desc: 'Create professional resumes with AI-powered suggestions & ATS-friendly templates.', color: 'bg-pink-50 text-pink-600', border: 'border-pink-100 hover:border-pink-300' },
              { icon: '👨‍👩‍👧', title: 'Parent Dashboard', desc: 'Parents can track children\'s career journey, progress & milestones in real-time.', color: 'bg-indigo-50 text-indigo-600', border: 'border-indigo-100 hover:border-indigo-300' },
            ].map((f, i) => (
              <TiltCard key={i} className={`${f.border} border-2 rounded-2xl bg-white cursor-pointer`} >
                <div className="p-7" onClick={sparkle}>
                  <div className={`w-14 h-14 ${f.color} rounded-2xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform`}>{f.icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ STATS (Animated Counters) ═══════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 reveal">
            {[
              { n: 10000, s: '+', l: 'Students', c: 'text-blue-600' },
              { n: 500, s: '+', l: 'Careers', c: 'text-violet-600' },
              { n: 95, s: '%', l: 'Success Rate', c: 'text-emerald-600' },
              { n: 200, s: '+', l: 'Mentors', c: 'text-amber-600' },
            ].map((s, i) => (
              <div key={i} className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl p-6 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 magnetic cursor-pointer" onClick={sparkle}>
                <p className={`text-3xl sm:text-4xl font-extrabold ${s.c} mb-1`}><Counter end={s.n} suffix={s.s} /></p>
                <p className="text-sm text-gray-500 font-medium">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 reveal">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 uppercase tracking-widest bg-violet-50 border border-violet-100 px-4 py-1.5 rounded-full mb-4">Process</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">How It Works</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">Start your career journey in minutes. Simple, fast, and effective.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative stagger-children">
            <div className="hidden lg:block absolute top-16 left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-violet-200 via-blue-200 to-emerald-200" />
            {[
              { num: '01', icon: '✨', title: 'Sign Up Free', desc: 'Create your account in 30 seconds. Choose your role.' },
              { num: '02', icon: '📝', title: 'Quick Assessment', desc: 'Tell us about your interests, skills & career goals.' },
              { num: '03', icon: '🧠', title: 'AI Recommends', desc: 'Our AI finds the best career paths for you.' },
              { num: '04', icon: '🚀', title: 'Follow Roadmap', desc: 'Start your personalized career journey.' },
            ].map((s, i) => (
              <div key={i} className="relative text-center group cursor-pointer" onClick={sparkle}>
                <div className="relative z-10 w-16 h-16 bg-white border-2 border-gray-200 group-hover:border-violet-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5 group-hover:scale-110 group-hover:shadow-xl transition-all magnetic">{s.icon}</div>
                <div className="bg-white border border-gray-100 rounded-2xl p-6 group-hover:shadow-lg transition-all tilt-card">
                  <span className="text-[10px] font-bold text-violet-500 mb-2 block tracking-widest">STEP {s.num}</span>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CHOOSE ROLE ═══════════ */}
      <section id="roles" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 reveal">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-4 py-1.5 rounded-full mb-4">For Everyone</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">Choose Your Role</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 stagger-children">
            {[
              { icon: '🎓', title: 'Student', desc: 'Explore careers, get AI recommendations, follow personalized roadmaps, and prepare for your dream job.', gradient: 'from-blue-600 to-indigo-600', light: 'bg-blue-50', border: 'border-blue-100 hover:border-blue-300' },
              { icon: '👨‍👩‍👧', title: 'Parent', desc: 'Track your child\'s career journey, monitor their progress, and stay involved in their career decisions.', gradient: 'from-emerald-600 to-teal-600', light: 'bg-emerald-50', border: 'border-emerald-100 hover:border-emerald-300' },
              { icon: '🧑‍🏫', title: 'Mentor', desc: 'Guide students, track their progress, provide feedback, and help shape the next generation.', gradient: 'from-violet-600 to-purple-600', light: 'bg-violet-50', border: 'border-violet-100 hover:border-violet-300' },
            ].map((r, i) => (
              <TiltCard key={i} className={`${r.light} ${r.border} border-2 rounded-3xl text-center cursor-pointer`}>
                <div className="p-8" onClick={fireConfetti}>
                  <span className="text-6xl mb-6 block group-hover:scale-110 transition-transform">{r.icon}</span>
                  <h3 className="text-2xl font-extrabold text-gray-900 mb-3">{r.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-6">{r.desc}</p>
                  <RippleBtn className={`inline-flex items-center gap-2 bg-gradient-to-r ${r.gradient} text-white px-7 py-3 rounded-2xl font-bold text-sm hover:shadow-lg transition-all hover:-translate-y-0.5 glow-click`}>
                    <Link to="/register" className="flex items-center gap-2">
                      Join as {r.title}
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </Link>
                  </RippleBtn>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section id="testimonials" className="py-20 lg:py-28 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 reveal">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 border border-amber-100 px-4 py-1.5 rounded-full mb-4">Testimonials</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">Loved by Thousands</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 stagger-children">
            {[
              { name: 'Priya Sharma', role: 'Class 12 Student', text: 'Mera Raasta helped me discover my passion for Data Science. The personalized roadmap made everything so clear and actionable!', rating: 5, color: 'from-blue-500 to-indigo-500' },
              { name: 'Rajesh Kumar', role: 'Parent', text: 'As a parent, I can finally track my daughter\'s career progress. The parent dashboard is incredibly useful and easy to use.', rating: 5, color: 'from-emerald-500 to-teal-500' },
              { name: 'Anita Devi', role: 'Career Mentor', text: 'The mentor tools help me guide multiple students effectively. I can track their progress and provide timely advice.', rating: 5, color: 'from-violet-500 to-purple-500' },
            ].map((t, i) => (
              <TiltCard key={i} className="bg-white rounded-2xl border border-gray-100 cursor-pointer">
                <div className="p-7" onClick={sparkle}>
                  <div className="flex gap-1 mb-4">
                    {[...Array(t.rating)].map((_, s) => <svg key={s} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <div className={`w-10 h-10 bg-gradient-to-br ${t.color} rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg`}>{t.name[0]}</div>
                    <div><p className="text-sm font-bold text-gray-900">{t.name}</p><p className="text-xs text-gray-500">{t.role}</p></div>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-3xl p-10 sm:p-14 lg:p-20 text-center overflow-hidden reveal">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-1/4 w-72 h-72 bg-white rounded-full blur-3xl hero-glow" />
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl hero-glow" style={{ animationDelay: '2s' }} />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 tracking-tight">Ready to Find Your Path?</h2>
              <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">Join 10,000+ students who have already discovered their perfect career. It's free, it's smart, and it's waiting for you.</p>
              <RippleBtn onClick={(e) => { fireConfetti(e); sparkle(e); }}
                className="inline-flex items-center gap-2 bg-white text-indigo-600 px-10 py-4 rounded-2xl font-bold text-sm hover:bg-blue-50 transition-all shadow-2xl hover:shadow-3xl hover:-translate-y-0.5 glow-click">
                Get Started Free
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </RippleBtn>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
            <div className="col-span-2 md:col-span-4 lg:col-span-1">
              <Logo size="default" />
              <p className="text-sm leading-relaxed mb-6">India's smartest career guidance platform. AI-powered recommendations for students, parents, and mentors.</p>
              <div className="flex gap-3">
                {['M', 'X', 'in', 'YT'].map((s, i) => (
                  <a key={i} href="#" className="w-9 h-9 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center text-xs font-bold text-gray-400 hover:text-white transition-all magnetic bounce-click" onClick={sparkle}>{s}</a>
                ))}
              </div>
            </div>
            {[
              { title: 'Product', links: ['AI Career Matching', 'Personalized Roadmaps', 'Education Hub', 'Resume Builder', 'AI Career Coach'] },
              { title: 'For', links: ['Students', 'Parents', 'Mentors', 'Educators'] },
              { title: 'Company', links: ['About Us', 'Careers', 'Blog', 'Press', 'Contact'] },
              { title: 'Support', links: ['Help Center', 'Privacy Policy', 'Terms of Service', 'FAQ', 'Community'] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-bold text-white mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l}><a href="#" className="text-sm hover:text-white transition-colors hover:translate-x-1 inline-block" onClick={sparkle}>{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">© 2026 Mera Raasta. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors" onClick={sparkle}>Privacy</a>
              <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors" onClick={sparkle}>Terms</a>
              <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors" onClick={sparkle}>Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
