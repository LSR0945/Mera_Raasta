import { Link } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import Logo from '../../components/common/Logo';
import { useAuth } from '../../hooks/useAuth';

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
    const timer = setInterval(() => { start += step; if (start >= end) { setCount(end); clearInterval(timer); } else setCount(Math.floor(start)); }, 16);
    return () => clearInterval(timer);
  }, [started, end, duration]);
  return <span ref={ref}>{count}{suffix}</span>;
}

function RevealSection({ children, className = '', delay = 0 }) {
  const [show, setShow] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShow(true); obs.disconnect(); } }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`transition-all duration-1000 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function StudentBubble({ name, role, color, x, y, delay, size = 48 }) {
  return (
    <div className="absolute" style={{ left: `${x}%`, top: `${y}%`, animation: `studentFloat ${6 + delay}s ease-in-out ${delay}s infinite` }}>
      <div className={`w-${size < 52 ? 12 : 14} h-${size < 52 ? 12 : 14} bg-gradient-to-br ${color} rounded-full flex items-center justify-center text-white font-bold text-sm border-3 border-white/80 shadow-xl`}
        style={{ width: size, height: size, borderWidth: 3, animation: `studentPop 0.6s ease ${delay + 0.5}s both` }}>
        {name[0]}
      </div>
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
        <span className="text-[9px] font-bold text-gray-600">{name}</span>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, gradient, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <RevealSection delay={delay}>
      <div className="relative group p-6 sm:p-7 rounded-3xl bg-white border border-gray-100 hover:border-gray-200 transition-all duration-500 hover:shadow-2xl hover:shadow-gray-200/50 hover:-translate-y-2 cursor-pointer overflow-hidden"
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500`} />
        <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-2xl mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
          {icon}
        </div>
        <h3 className="text-lg font-extrabold text-gray-900 mb-2 group-hover:text-gray-800 transition-colors">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ backgroundImage: `linear-gradient(90deg, ${gradient.includes('blue') ? '#3b82f6' : gradient.includes('violet') ? '#8b5cf6' : gradient.includes('emerald') ? '#10b981' : gradient.includes('orange') ? '#f97316' : gradient.includes('pink') ? '#ec4899' : '#6366f1'}, transparent)` }} />
      </div>
    </RevealSection>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    const h = (e) => setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <style>{`
        @keyframes studentFloat { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-20px) scale(1.05)} }
        @keyframes studentPop { 0%{transform:scale(0);opacity:0} 60%{transform:scale(1.2)} 100%{transform:scale(1);opacity:1} }
        @keyframes heroGradient { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes shimmerText { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes rippleAnim { to { width: 300px; height: 300px; opacity: 0; } }
        @keyframes orbMove { 0%,100%{transform:translate(0,0)} 33%{transform:translate(40px,-30px)} 66%{transform:translate(-30px,40px)} }
        @keyframes pulseGlow { 0%,100%{box-shadow:0 0 20px rgba(99,102,241,0.2)} 50%{box-shadow:0 0 50px rgba(99,102,241,0.4)} }
        @keyframes floatParticle { 0%,100%{transform:translateY(0) translateX(0);opacity:0.3} 25%{transform:translateY(-30px) translateX(10px);opacity:0.6} 50%{transform:translateY(-15px) translateX(-15px);opacity:0.4} 75%{transform:translateY(-40px) translateX(5px);opacity:0.5} }
        @keyframes typeWriter { from{width:0} to{width:100%} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes cardSlideUp { 0%{opacity:0;transform:translateY(60px) scale(0.95)} 100%{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes sparkleFloat { 0%{transform:scale(0) rotate(0deg);opacity:1} 100%{transform:scale(1.5) rotate(180deg) translateY(-40px);opacity:0} }
      `}</style>

      {/* ═══ NAVBAR ═══ */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-2xl shadow-lg shadow-gray-200/40 border-b border-gray-100/50' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-[72px]">
            <Logo size="default" />
            <div className="hidden lg:flex items-center gap-1">
              {['Features', 'How It Works', 'Roles', 'Testimonials'].map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(/\s/g, '-')}`}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-50 transition-all duration-300">{item}</a>
              ))}
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <Link to="/dashboard" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 px-4 py-2 rounded-xl hover:bg-emerald-50 transition-all">
                  <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>
                  Dashboard
                </Link>
              ) : (
                <Link to="/login" className="hidden sm:inline-flex text-sm font-semibold text-gray-600 hover:text-gray-900 px-4 py-2 rounded-xl hover:bg-gray-50 transition-all">Login</Link>
              )}
              <Link to={user ? '/dashboard' : '/register'}
                className="relative inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 overflow-hidden group">
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative">{user ? 'Go to Dashboard' : 'Get Started'}</span>
                <svg className="w-4 h-4 relative group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
              <button onClick={() => setMobileMenu(!mobileMenu)} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenu ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
              </button>
            </div>
          </div>
        </div>
        {mobileMenu && (
          <div className="lg:hidden bg-white/95 backdrop-blur-2xl border-t border-gray-100 shadow-2xl">
            <div className="px-4 py-4 space-y-1">
              {['Features', 'How It Works', 'Roles', 'Testimonials'].map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(/\s/g, '-')}`} onClick={() => setMobileMenu(false)} className="block px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-all">{item}</a>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* ═══ HERO — Students Background ═══ */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Dark gradient background */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 25%, #1e1b4b 50%, #0f172a 75%, #0c0c1d 100%)' }} />

        {/* Animated orbs */}
        <div className="absolute w-[600px] h-[600px] bg-indigo-500/15 rounded-full blur-[120px] -top-40 -left-40" style={{ animation: 'orbMove 15s ease-in-out infinite' }} />
        <div className="absolute w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[100px] top-1/3 right-0" style={{ animation: 'orbMove 12s ease-in-out 4s infinite' }} />
        <div className="absolute w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[80px] bottom-0 left-1/3" style={{ animation: 'orbMove 10s ease-in-out 8s infinite' }} />

        {/* Grid dots */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        {/* Parallax student bubbles */}
        <div className="absolute inset-0 hidden lg:block" style={{ transform: `translate(${mousePos.x * -10}px, ${mousePos.y * -10}px)` }}>
          <StudentBubble name="Priya" color="from-blue-400 to-blue-600" x={8} y={15} delay={0} size={44} />
          <StudentBubble name="Rahul" color="from-violet-400 to-violet-600" x={85} y={20} delay={1} size={52} />
          <StudentBubble name="Sneha" color="from-emerald-400 to-emerald-600" x={15} y={70} delay={2} size={40} />
          <StudentBubble name="Arjun" color="from-amber-400 to-orange-500" x={78} y={65} delay={0.5} size={48} />
          <StudentBubble name="Kavya" color="from-pink-400 to-rose-500" x={50} y={10} delay={1.5} size={36} />
          <StudentBubble name="Amit" color="from-cyan-400 to-blue-500" x={35} y={80} delay={3} size={42} />
          <StudentBubble name="Neha" color="from-indigo-400 to-purple-500" x={70} y={45} delay={2.5} size={38} />
          <StudentBubble name="Vikram" color="from-teal-400 to-green-500" x={5} y={45} delay={1.8} size={46} />
        </div>

        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div key={i} className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{ left: `${5 + Math.random() * 90}%`, top: `${5 + Math.random() * 90}%`, animation: `floatParticle ${4 + Math.random() * 6}s ease-in-out ${Math.random() * 5}s infinite` }} />
        ))}

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Important Info Banner — TOP */}
          <RevealSection delay={0}>
            <div className="flex justify-center mb-8 sm:mb-12">
              <div className="inline-flex items-center gap-3 bg-white/[0.07] backdrop-blur-xl border border-white/[0.1] rounded-full px-5 sm:px-6 py-2.5 sm:py-3">
                <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" /></span>
                <span className="text-xs sm:text-sm font-semibold text-white/80">India's #1 AI-Powered Career Guidance Platform</span>
                <span className="hidden sm:inline text-white/20">•</span>
                <span className="hidden sm:inline text-xs font-bold text-indigo-400">10,000+ Students Trust Us</span>
              </div>
            </div>
          </RevealSection>

          <div className="text-center max-w-5xl mx-auto">
            <RevealSection delay={100}>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white mb-6 sm:mb-8 leading-[1.05] tracking-tight">
                Find Your{' '}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent"
                    style={{ backgroundSize: '200% auto', animation: 'heroGradient 4s ease infinite' }}>
                    Perfect Career
                  </span>
                </span>
                {' '}Path
              </h1>
            </RevealSection>

            <RevealSection delay={200}>
              <p className="text-base sm:text-lg lg:text-xl text-white/40 mb-10 sm:mb-12 max-w-3xl mx-auto leading-relaxed">
                India's smartest career guidance platform. Get AI-powered recommendations, personalized roadmaps, and expert mentorship to build your dream career.
              </p>
            </RevealSection>

            <RevealSection delay={300}>
              <div className="flex flex-wrap items-center justify-center gap-4 mb-12 sm:mb-16">
                <Link to="/register"
                  className="relative inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-sm sm:text-base hover:from-blue-700 hover:to-indigo-700 transition-all shadow-2xl shadow-blue-500/25 hover:shadow-3xl hover:-translate-y-1 overflow-hidden group"
                  style={{ animation: 'pulseGlow 3s ease-in-out infinite' }}>
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative">Start Your Journey — Free</span>
                  <svg className="w-5 h-5 relative group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </Link>
                <Link to="/login"
                  className="inline-flex items-center gap-2 border-2 border-white/15 text-white/70 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-sm sm:text-base hover:border-white/30 hover:text-white hover:bg-white/5 transition-all duration-300 backdrop-blur-sm">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" /></svg>
                  Watch Demo
                </Link>
              </div>
            </RevealSection>

            {/* Stats Bar — Important Info */}
            <RevealSection delay={400}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto">
                {[
                  { n: 10000, s: '+', l: 'Students', icon: '🎓', gradient: 'from-blue-500 to-cyan-500' },
                  { n: 500, s: '+', l: 'Careers', icon: '💼', gradient: 'from-violet-500 to-purple-500' },
                  { n: 95, s: '%', l: 'Success', icon: '🏆', gradient: 'from-emerald-500 to-teal-500' },
                  { n: 200, s: '+', l: 'Mentors', icon: '🧑‍🏫', gradient: 'from-amber-500 to-orange-500' },
                ].map((s, i) => (
                  <div key={i} className="bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 sm:p-5 hover:bg-white/[0.1] transition-all duration-500 hover:scale-105 group cursor-default"
                    style={{ animation: `cardSlideUp 0.6s ease ${0.5 + i * 0.1}s both` }}>
                    <div className={`w-10 h-10 bg-gradient-to-br ${s.gradient} rounded-xl flex items-center justify-center text-lg mb-3 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300`}>{s.icon}</div>
                    <p className="text-2xl sm:text-3xl font-black text-white mb-0.5"><Counter end={s.n} suffix={s.s} /></p>
                    <p className="text-[10px] sm:text-xs text-white/40 font-medium">{s.l}</p>
                  </div>
                ))}
              </div>
            </RevealSection>

            {/* Social Proof */}
            <RevealSection delay={500}>
              <div className="flex items-center justify-center gap-4 sm:gap-6 mt-10 sm:mt-14">
                <div className="flex -space-x-2.5">
                  {['from-blue-400 to-blue-600', 'from-violet-400 to-violet-600', 'from-emerald-400 to-emerald-600', 'from-amber-400 to-amber-500', 'from-pink-400 to-pink-600'].map((c, i) => (
                    <div key={i} className={`w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br ${c} rounded-full border-2 border-[#1a1a3e] flex items-center justify-center text-white text-xs font-bold shadow-lg`}
                      style={{ animation: `studentPop 0.4s ease ${0.6 + i * 0.1}s both` }}>
                      {['P', 'R', 'A', 'S', 'K'][i]}
                    </div>
                  ))}
                </div>
                <div className="border-l border-white/10 pl-4 sm:pl-6">
                  <div className="flex items-center gap-0.5 mb-0.5">
                    {[1, 2, 3, 4, 5].map((s) => <svg key={s} className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
                  </div>
                  <p className="text-sm font-bold text-white">4.9/5 Rating</p>
                  <p className="text-[10px] text-white/30">from 10,000+ students</p>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ═══ MARQUEE TRUSTED BY ═══ */}
      <section className="py-8 bg-gray-50 border-y border-gray-100 overflow-hidden">
        <div className="flex items-center gap-12" style={{ animation: 'marquee 30s linear infinite', width: 'max-content' }}>
          {[...Array(2)].map((_, set) => (
            <div key={set} className="flex items-center gap-12 shrink-0">
              {['IIT Delhi', 'IIT Bombay', 'NIT Trichy', 'BITS Pilani', 'IIM Ahmedabad', 'Stanford', 'MIT', 'Google', 'Microsoft', 'Amazon'].map((name, i) => (
                <span key={`${set}-${i}`} className="text-sm font-bold text-gray-300 whitespace-nowrap px-4">{name}</span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="py-20 sm:py-28 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16 sm:mb-20">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full mb-4">Why Mera Raasta</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">Everything You Need</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">From career discovery to job readiness — we've got every step covered.</p>
          </RevealSection>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {[
              { icon: '🎯', title: 'AI Career Matching', desc: 'Smart algorithms analyze your skills, interests & goals to suggest the perfect career path.', gradient: 'from-blue-500 to-cyan-500' },
              { icon: '🗺️', title: 'Personalized Roadmaps', desc: 'Step-by-step career roadmaps with milestones, deadlines & actionable tasks.', gradient: 'from-violet-500 to-purple-500' },
              { icon: '📚', title: 'Education Hub', desc: 'Explore courses, colleges, scholarships & government schemes — all in one place.', gradient: 'from-emerald-500 to-teal-500' },
              { icon: '🤖', title: 'AI Career Coach', desc: 'Chat with AI for instant career guidance, resume tips & interview prep.', gradient: 'from-amber-500 to-orange-500' },
              { icon: '📄', title: 'Resume Builder', desc: 'Create professional resumes with AI-powered suggestions & ATS-friendly templates.', gradient: 'from-pink-500 to-rose-500' },
              { icon: '👨‍👩‍👧', title: 'Parent Dashboard', desc: 'Parents can track children\'s career journey, progress & milestones in real-time.', gradient: 'from-indigo-500 to-violet-500' },
            ].map((f, i) => (
              <FeatureCard key={i} {...f} delay={i * 100} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" className="py-20 sm:py-28 lg:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16 sm:mb-20">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 uppercase tracking-widest bg-violet-50 border border-violet-100 px-4 py-1.5 rounded-full mb-4">Process</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">How It Works</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">Start your career journey in minutes.</p>
          </RevealSection>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 relative">
            <div className="hidden lg:block absolute top-20 left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-violet-200 via-blue-200 to-emerald-200" />
            {[
              { num: '01', icon: '✨', title: 'Sign Up Free', desc: 'Create your account in 30 seconds. Choose your role.' },
              { num: '02', icon: '📝', title: 'Quick Assessment', desc: 'Tell us about your interests, skills & career goals.' },
              { num: '03', icon: '🧠', title: 'AI Recommends', desc: 'Our AI finds the best career paths for you.' },
              { num: '04', icon: '🚀', title: 'Follow Roadmap', desc: 'Start your personalized career journey.' },
            ].map((s, i) => (
              <RevealSection key={i} delay={i * 150} className="relative text-center group">
                <div className="relative z-10 w-16 h-16 bg-white border-2 border-gray-200 group-hover:border-violet-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300">{s.icon}</div>
                <div className="bg-white border border-gray-100 rounded-2xl p-6 group-hover:shadow-lg transition-all duration-300">
                  <span className="text-[10px] font-bold text-violet-500 mb-2 block tracking-widest">STEP {s.num}</span>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ROLES ═══ */}
      <section id="roles" className="py-20 sm:py-28 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16 sm:mb-20">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-4 py-1.5 rounded-full mb-4">For Everyone</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">Choose Your Role</h2>
          </RevealSection>
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { icon: '🎓', title: 'Student', desc: 'Explore careers, get AI recommendations, follow personalized roadmaps, and prepare for your dream job.', gradient: 'from-blue-600 to-indigo-600', light: 'bg-blue-50', border: 'border-blue-100 hover:border-blue-300' },
              { icon: '👨‍👩‍👧', title: 'Parent', desc: "Track your child's career journey, monitor their progress, and stay involved in their career decisions.", gradient: 'from-emerald-600 to-teal-600', light: 'bg-emerald-50', border: 'border-emerald-100 hover:border-emerald-300' },
              { icon: '🧑‍🏫', title: 'Mentor', desc: 'Guide students, track their progress, provide feedback, and help shape the next generation.', gradient: 'from-violet-600 to-purple-600', light: 'bg-violet-50', border: 'border-violet-100 hover:border-violet-300' },
            ].map((r, i) => (
              <RevealSection key={i} delay={i * 150}>
                <div className={`${r.light} ${r.border} border-2 rounded-3xl text-center transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group overflow-hidden relative`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${r.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500`} />
                  <div className="relative p-8 sm:p-10">
                    <span className="text-6xl mb-6 block group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">{r.icon}</span>
                    <h3 className="text-2xl font-extrabold text-gray-900 mb-3">{r.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed mb-8">{r.desc}</p>
                    <Link to="/register"
                      className={`inline-flex items-center gap-2 bg-gradient-to-r ${r.gradient} text-white px-8 py-3.5 rounded-2xl font-bold text-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden group/btn`}>
                      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                      <span className="relative">Join as {r.title}</span>
                      <svg className="w-4 h-4 relative group-hover/btn:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </Link>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section id="testimonials" className="py-20 sm:py-28 lg:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16 sm:mb-20">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 border border-amber-100 px-4 py-1.5 rounded-full mb-4">Testimonials</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">Loved by Thousands</h2>
          </RevealSection>
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { name: 'Priya Sharma', role: 'Class 12 Student', text: 'Mera Raasta helped me discover my passion for Data Science. The personalized roadmap made everything so clear and actionable!', rating: 5, color: 'from-blue-500 to-indigo-500' },
              { name: 'Rajesh Kumar', role: 'Parent', text: "As a parent, I can finally track my daughter's career progress. The parent dashboard is incredibly useful and easy to use.", rating: 5, color: 'from-emerald-500 to-teal-500' },
              { name: 'Anita Devi', role: 'Career Mentor', text: 'The mentor tools help me guide multiple students effectively. I can track their progress and provide timely advice.', rating: 5, color: 'from-violet-500 to-purple-500' },
            ].map((t, i) => (
              <RevealSection key={i} delay={i * 150}>
                <div className="bg-white rounded-3xl border border-gray-100 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group overflow-hidden h-full">
                  <div className="p-7 sm:p-8">
                    <div className="flex gap-0.5 mb-4">
                      {[...Array(t.rating)].map((_, s) => <svg key={s} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed mb-6">"{t.text}"</p>
                    <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
                      <div className={`w-11 h-11 bg-gradient-to-br ${t.color} rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-110 transition-transform`}>{t.name[0]}</div>
                      <div><p className="text-sm font-bold text-gray-900">{t.name}</p><p className="text-xs text-gray-500">{t.role}</p></div>
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-20 sm:py-28 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection>
            <div className="relative rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f0f23, #1e1b4b, #0f172a)' }}>
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-1/4 w-72 h-72 bg-white rounded-full blur-3xl" style={{ animation: 'orbMove 10s ease-in-out infinite' }} />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-400 rounded-full blur-3xl" style={{ animation: 'orbMove 12s ease-in-out 4s infinite' }} />
              </div>
              <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
              <div className="relative z-10 p-10 sm:p-14 lg:p-20 text-center">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 tracking-tight">Ready to Find Your Path?</h2>
                <p className="text-white/40 text-lg mb-10 max-w-xl mx-auto">Join 10,000+ students who have already discovered their perfect career.</p>
                <Link to="/register"
                  className="inline-flex items-center gap-2 bg-white text-gray-900 px-10 py-4 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all shadow-2xl hover:shadow-3xl hover:-translate-y-0.5 relative overflow-hidden group">
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative">Get Started Free</span>
                  <svg className="w-4 h-4 relative group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </Link>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
            <div className="col-span-2 md:col-span-4 lg:col-span-1">
              <Logo size="default" />
              <p className="text-sm leading-relaxed mb-6">India's smartest career guidance platform.</p>
            </div>
            {[
              { title: 'Product', links: ['AI Career Matching', 'Personalized Roadmaps', 'Education Hub', 'Resume Builder'] },
              { title: 'For', links: ['Students', 'Parents', 'Mentors'] },
              { title: 'Company', links: ['About Us', 'Careers', 'Blog', 'Contact'] },
              { title: 'Support', links: ['Help Center', 'Privacy Policy', 'Terms of Service'] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-bold text-white mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (<li key={l}><a href="#" className="text-sm hover:text-white transition-colors">{l}</a></li>))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">&copy; 2026 Mera Raasta. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
