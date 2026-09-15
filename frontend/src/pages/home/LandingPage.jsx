import { Link } from 'react-router-dom';
import { useState, useEffect, useRef, useMemo } from 'react';
import Logo from '../../components/common/Logo';
import { useAuth } from '../../hooks/useAuth';

/* ─── ANIMATED COUNTER ─── */
function Counter({ end, suffix = '', duration = 2200 }) {
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
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── SCROLL REVEAL ─── */
function Reveal({ children, className = '', delay = 0, direction = 'up' }) {
  const [show, setShow] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShow(true); obs.disconnect(); } }, { threshold: 0.08 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const dir = { up: 'translate-y-16', down: '-translate-y-16', left: 'translate-x-16', right: '-translate-x-16', scale: 'scale-90' }[direction] || 'translate-y-16';
  return (
    <div ref={ref} className={`transition-all duration-[1200ms] ease-out ${show ? 'opacity-100 translate-x-0 translate-y-0 scale-100' : `opacity-0 ${dir}`} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>{children}</div>
  );
}

/* ─── 3D TILT CARD ─── */
function TiltCard({ children, className = '', intensity = 15 }) {
  const cardRef = useRef(null);
  const [transform, setTransform] = useState('');
  const handleMouse = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTransform(`perspective(800px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg) scale3d(1.03,1.03,1.03)`);
  };
  const reset = () => setTransform('perspective(800px) rotateY(0) rotateX(0) scale3d(1,1,1)');
  return (
    <div ref={cardRef} className={`transition-transform duration-300 ease-out will-change-transform ${className}`}
      style={{ transform }} onMouseMove={handleMouse} onMouseLeave={reset}>
      {children}
    </div>
  );
}

/* ─── MAGNETIC BUTTON ─── */
function MagicButton({ children, to, className = '', variant = 'primary' }) {
  const btnRef = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const handleMouse = (e) => {
    const el = btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setOffset({ x: (e.clientX - rect.left - rect.width / 2) * 0.3, y: (e.clientY - rect.top - rect.height / 2) * 0.3 });
  };
  const reset = () => setOffset({ x: 0, y: 0 });
  const base = variant === 'primary'
    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50'
    : 'bg-white/5 backdrop-blur-xl border-2 border-white/15 text-white hover:border-white/30 hover:bg-white/10';
  return (
    <Link to={to} ref={btnRef} className={`relative inline-flex items-center gap-2.5 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-sm sm:text-base transition-all duration-300 hover:-translate-y-1 overflow-hidden group ${base} ${className}`}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }} onMouseMove={handleMouse} onMouseLeave={reset}>
      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      <span className="relative flex items-center gap-2">{children}</span>
    </Link>
  );
}

/* ─── FLOATING ORB ─── */
function Orb({ color, size, x, y, delay, duration }) {
  return (
    <div className="absolute rounded-full pointer-events-none" style={{
      width: size, height: size, left: x, top: y, background: color,
      filter: 'blur(80px)', animation: `orbFloat ${duration}s ease-in-out ${delay}s infinite`,
    }} />
  );
}

/* ─── PARTICLE CONSTELLATION ─── */
function ParticleField({ count = 40 }) {
  const particles = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    size: 1 + Math.random() * 3, dur: 6 + Math.random() * 8,
    delay: Math.random() * 5, opacity: 0.15 + Math.random() * 0.35,
  })), [count]);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div key={p.id} className="absolute rounded-full bg-white" style={{
          left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, opacity: p.opacity,
          animation: `particleDrift ${p.dur}s ease-in-out ${p.delay}s infinite`,
        }} />
      ))}
    </div>
  );
}

/* ─── TYPEWRITER ─── */
function TypeWriter({ words, speed = 80, pause = 2000 }) {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const word = words[idx];
    const timer = setTimeout(() => {
      if (!deleting) {
        setText(word.slice(0, text.length + 1));
        if (text.length + 1 === word.length) setTimeout(() => setDeleting(true), pause);
      } else {
        setText(word.slice(0, text.length - 1));
        if (text.length - 1 === 0) { setDeleting(false); setIdx((idx + 1) % words.length); }
      }
    }, deleting ? speed / 2 : speed);
    return () => clearTimeout(timer);
  }, [text, deleting, idx, words, speed, pause]);
  return <span>{text}<span className="inline-block w-[3px] h-[1em] bg-indigo-400 ml-0.5 align-middle" style={{ animation: 'blink 1s step-end infinite' }} /></span>;
}

/* ─── STUDENT PHOTO CARD (for hero background) ─── */
function StudentPhoto({ src, name, role, style, delay }) {
  return (
    <div className="absolute group/photo" style={{ ...style, animation: `photoFloat ${7 + delay}s ease-in-out ${delay}s infinite, popIn 0.8s ease ${delay + 0.3}s both` }}>
      <div className="relative w-[120px] sm:w-[150px] lg:w-[180px] rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/40 hover:scale-105 hover:border-white/20 transition-all duration-500"
        style={{ transform: `rotate(${style?.rotate || 0}deg)` }}>
        <img src={src} alt={name} className="w-full aspect-[3/4] object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white text-[10px] sm:text-xs font-bold leading-tight">{name}</p>
          <p className="text-white/50 text-[8px] sm:text-[9px]">{role}</p>
        </div>
        {/* Glow border on hover */}
        <div className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover/photo:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3), rgba(6,182,212,0.3))' }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/* MAIN COMPONENT                                                */
/* ═══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => { setScrolled(window.scrollY > 30); setScrollY(window.scrollY); };
    const onMouse = (e) => setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMouse, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('mousemove', onMouse); };
  }, []);

  /* Real student photos — free Unsplash images */
  const studentPhotos = [
    { src: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=500&fit=crop&auto=format', name: 'Priya Sharma', role: 'Engineering Student', rotate: -6, x: '3%', y: '12%', delay: 0 },
    { src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=500&fit=crop&auto=format', name: 'Rahul Verma', role: 'BCA Student', rotate: 4, x: '18%', y: '55%', delay: 0.8 },
    { src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&auto=format', name: 'Arjun Patel', role: 'MBA Aspirant', rotate: -3, x: '82%', y: '10%', delay: 0.4 },
    { src: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop&auto=format', name: 'Sneha Reddy', role: 'Medical Student', rotate: 5, x: '75%', y: '52%', delay: 1.2 },
    { src: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&auto=format', name: 'Vikram Singh', role: 'IIT Aspirant', rotate: -4, x: '48%', y: '78%', delay: 0.6 },
    { src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&auto=format', name: 'Kavya Nair', role: 'Design Student', rotate: 3, x: '38%', y: '5%', delay: 1.0 },
    { src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&auto=format', name: 'Amit Kumar', role: 'Data Science', rotate: -5, x: '60%', y: '70%', delay: 1.4 },
    { src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop&auto=format', name: 'Neha Gupta', role: 'Law Student', rotate: 6, x: '8%', y: '75%', delay: 0.2 },
  ];

  return (
    <div className="min-h-screen bg-[#050510] overflow-hidden">
      <style>{`
        @keyframes orbFloat { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(50px,-40px) scale(1.1)} 66%{transform:translate(-40px,50px) scale(0.9)} }
        @keyframes particleDrift { 0%,100%{transform:translateY(0) translateX(0);opacity:var(--o,0.3)} 25%{transform:translateY(-35px) translateX(15px);opacity:calc(var(--o,0.3) + 0.2)} 50%{transform:translateY(-20px) translateX(-20px);opacity:var(--o,0.3)} 75%{transform:translateY(-50px) translateX(10px);opacity:calc(var(--o,0.3) + 0.15)} }
        @keyframes heroGradient { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes textGlow { 0%,100%{text-shadow:0 0 20px rgba(129,140,248,0.3)} 50%{text-shadow:0 0 60px rgba(129,140,248,0.6),0 0 120px rgba(129,140,248,0.2)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulseGlow { 0%,100%{box-shadow:0 0 20px rgba(99,102,241,0.3),0 0 60px rgba(99,102,241,0.1)} 50%{box-shadow:0 0 40px rgba(99,102,241,0.5),0 0 80px rgba(99,102,241,0.2)} }
        @keyframes popIn { 0%{transform:scale(0) rotate(-10deg);opacity:0} 70%{transform:scale(1.1) rotate(2deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
        @keyframes glowPulse { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.15)} }
        @keyframes cardSlideUp { 0%{opacity:0;transform:translateY(80px) scale(0.92)} 100%{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes morphBlob { 0%,100%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%} 50%{border-radius:30% 60% 70% 40%/50% 60% 30% 60%} }
        @keyframes floatSlow { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-15px)} }
        @keyframes photoFloat { 0%,100%{transform:translateY(0) rotate(var(--r,0deg))} 50%{transform:translateY(-18px) rotate(calc(var(--r,0deg) + 1.5deg))} }
        @keyframes shimmerLine { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes fadeSlideUp { 0%{opacity:0;transform:translateY(30px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes heroTextIn { 0%{opacity:0;transform:translateY(40px) skewY(2deg)} 100%{opacity:1;transform:translateY(0) skewY(0)} }
        @keyframes gridPulse { 0%,100%{opacity:0.03} 50%{opacity:0.06} }
        @keyframes starTwinkle { 0%,100%{opacity:0.2;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }
        @keyframes slideRight { 0%{width:0} 100%{width:100%} }
        @keyframes slideRight { 0%{width:0} 100%{width:100%} }
        @keyframes borderShimmer { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
      `}</style>

      {/* ═══ NAVBAR ═══ */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-700 ${scrolled ? 'bg-[#0a0a1a]/80 backdrop-blur-3xl shadow-2xl shadow-black/40 border-b border-white/[0.04]' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-[76px]">
            <Logo size="default" />
            <div className="hidden lg:flex items-center gap-1">
              {['Features', 'How It Works', 'Roles', 'Testimonials'].map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(/\s/g, '-')}`}
                  className="px-4 py-2 text-sm font-medium text-white/50 hover:text-white rounded-xl hover:bg-white/[0.05] transition-all duration-300">{item}</a>
              ))}
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <Link to="/dashboard" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300 px-4 py-2 rounded-xl hover:bg-emerald-500/10 transition-all">
                  <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>
                  Dashboard
                </Link>
              ) : (
                <Link to="/login" className="hidden sm:inline-flex text-sm font-semibold text-white/50 hover:text-white px-4 py-2 rounded-xl hover:bg-white/[0.05] transition-all">Login</Link>
              )}
              <Link to={user ? '/dashboard' : '/register'}
                className="relative inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 overflow-hidden group">
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative">{user ? 'Dashboard' : 'Get Started'}</span>
                <svg className="w-4 h-4 relative group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
              <button onClick={() => setMobileMenu(!mobileMenu)} className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition-all text-white/60">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenu ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
              </button>
            </div>
          </div>
        </div>
        {mobileMenu && (
          <div className="lg:hidden bg-[#0a0a1a]/95 backdrop-blur-3xl border-t border-white/[0.05] shadow-2xl">
            <div className="px-4 py-4 space-y-1">
              {['Features', 'How It Works', 'Roles', 'Testimonials'].map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(/\s/g, '-')}`} onClick={() => setMobileMenu(false)}
                  className="block px-4 py-3 text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.05] rounded-xl transition-all">{item}</a>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* HERO — Full viewport with real student photos           */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Deep dark base */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, #050510 0%, #0a0a2e 30%, #0f0f3a 50%, #080820 70%, #050510 100%)' }} />

        {/* Morphing blobs */}
        <div className="absolute w-[700px] h-[700px] -top-60 -left-60 opacity-25" style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', animation: 'morphBlob 20s ease-in-out infinite, orbFloat 15s ease-in-out infinite', filter: 'blur(60px)' }} />
        <div className="absolute w-[500px] h-[500px] top-1/3 -right-40 opacity-18" style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', animation: 'morphBlob 18s ease-in-out 5s infinite, orbFloat 12s ease-in-out 3s infinite', filter: 'blur(50px)' }} />
        <div className="absolute w-[400px] h-[400px] bottom-0 left-1/3 opacity-12" style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)', animation: 'morphBlob 16s ease-in-out 8s infinite, orbFloat 14s ease-in-out 6s infinite', filter: 'blur(50px)' }} />

        {/* Animated grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)', backgroundSize: '48px 48px', animation: 'gridPulse 6s ease-in-out infinite' }} />

        {/* Particles */}
        <ParticleField count={50} />

        {/* Stars */}
        {[...Array(15)].map((_, i) => (
          <div key={i} className="absolute w-1 h-1 bg-white rounded-full" style={{
            left: `${5 + Math.random() * 90}%`, top: `${5 + Math.random() * 90}%`,
            animation: `starTwinkle ${2 + Math.random() * 3}s ease-in-out ${Math.random() * 3}s infinite`,
          }} />
        ))}

        {/* ═══ REAL STUDENT PHOTOS — scattered across hero ═══ */}
        <div className="absolute inset-0 hidden lg:block" style={{ transform: `translate(${(mousePos.x - 0.5) * -12}px, ${(mousePos.y - 0.5) * -12}px)` }}>
          {studentPhotos.map((photo, i) => (
            <StudentPhoto key={i} {...photo} style={{ left: photo.x, top: photo.y, '--r': `${photo.rotate}deg` }} />
          ))}
        </div>

        {/* Mobile: show 2 photos only */}
        <div className="absolute inset-0 lg:hidden">
          <StudentPhoto {...studentPhotos[0]} style={{ left: '-5%', top: '8%', '--r': '-4deg' }} />
          <StudentPhoto {...studentPhotos[3]} style={{ left: '72%', top: '60%', '--r': '3deg' }} />
        </div>

        {/* Dark overlay on photos for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050510]/60 via-[#050510]/40 to-[#050510]/80 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#050510_70%)] pointer-events-none" />

        {/* Hero content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 text-center">
          {/* Badge */}
          <Reveal delay={0}>
            <div className="flex justify-center mb-8 sm:mb-10" style={{ animation: 'fadeSlideUp 1s ease 0.2s both' }}>
              <div className="inline-flex items-center gap-2.5 bg-white/[0.05] backdrop-blur-2xl border border-white/[0.08] rounded-full px-5 sm:px-6 py-2.5 sm:py-3 hover:bg-white/[0.08] transition-all duration-500 cursor-default group">
                <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" /></span>
                <span className="text-xs sm:text-sm font-semibold text-white/70 group-hover:text-white/90 transition-colors">India's #1 AI-Powered Career Guidance</span>
                <span className="text-white/10">•</span>
                <span className="text-xs font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors">10,000+ Students</span>
              </div>
            </div>
          </Reveal>

          {/* Headline */}
          <Reveal delay={150}>
            <h1 className="text-[2.8rem] sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6.5rem] font-black text-white mb-6 sm:mb-8 leading-[1.02] tracking-tight"
              style={{ animation: 'heroTextIn 1.2s ease 0.3s both' }}>
              <span className="block">Find Your</span>
              <span className="relative inline-block mt-1">
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent"
                  style={{ backgroundSize: '200% auto', animation: 'heroGradient 5s ease infinite', WebkitTextFillColor: 'transparent' }}>
                  Perfect Career
                </span>
                <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full opacity-60" style={{ animation: 'slideRight 1.5s ease 1.2s both' }} />
              </span>
              <span className="block mt-1">Path</span>
            </h1>
          </Reveal>

          {/* Typing subtitle */}
          <Reveal delay={300}>
            <p className="text-base sm:text-lg lg:text-xl text-white/35 mb-4 max-w-3xl mx-auto leading-relaxed h-8">
              <TypeWriter words={[
                'AI-powered career recommendations just for you.',
                'Personalized roadmaps to your dream career.',
                'Expert mentorship at every step.',
                'Track progress — parents & mentors included.',
              ]} speed={45} pause={2500} />
            </p>
          </Reveal>

          <Reveal delay={400}>
            <p className="text-sm sm:text-base text-white/25 mb-12 sm:mb-14 max-w-2xl mx-auto leading-relaxed">
              From career discovery to job readiness — the smartest platform built for Indian students.
            </p>
          </Reveal>

          {/* Buttons */}
          <Reveal delay={500}>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5 mb-16 sm:mb-20">
              <MagicButton to={user ? '/dashboard' : '/register'} variant="primary">
                Start Your Journey — Free
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </MagicButton>
              <MagicButton to="/login" variant="ghost">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" /></svg>
                Watch Demo
              </MagicButton>
            </div>
          </Reveal>

          {/* Stats */}
          <Reveal delay={600}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto mb-12 sm:mb-16">
              {[
                { n: 10000, s: '+', l: 'Students', icon: '🎓', gradient: 'from-blue-500 to-cyan-400', shadow: 'shadow-blue-500/20' },
                { n: 500, s: '+', l: 'Career Paths', icon: '💼', gradient: 'from-violet-500 to-purple-400', shadow: 'shadow-violet-500/20' },
                { n: 95, s: '%', l: 'Success Rate', icon: '🏆', gradient: 'from-emerald-500 to-teal-400', shadow: 'shadow-emerald-500/20' },
                { n: 200, s: '+', l: 'Mentors', icon: '🧑‍🏫', gradient: 'from-amber-500 to-orange-400', shadow: 'shadow-amber-500/20' },
              ].map((s, i) => (
                <div key={i} className={`relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 sm:p-6 hover:bg-white/[0.07] transition-all duration-500 hover:scale-105 group cursor-default overflow-hidden ${s.shadow}`}
                  style={{ animation: `cardSlideUp 0.7s ease ${0.7 + i * 0.12}s both` }}>
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  <div className={`w-11 h-11 bg-gradient-to-br ${s.gradient} rounded-xl flex items-center justify-center text-xl mb-3 mx-auto shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>{s.icon}</div>
                  <p className="text-2xl sm:text-3xl font-black text-white mb-1"><Counter end={s.n} suffix={s.s} /></p>
                  <p className="text-[10px] sm:text-xs text-white/35 font-medium uppercase tracking-wider">{s.l}</p>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Social proof — real photo avatars */}
          <Reveal delay={750}>
            <div className="flex items-center justify-center gap-4 sm:gap-6">
              <div className="flex -space-x-3">
                {studentPhotos.slice(0, 5).map((p, i) => (
                  <div key={i} className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full border-[3px] border-[#0a0a2e] overflow-hidden shadow-xl"
                    style={{ animation: `popIn 0.5s ease ${0.8 + i * 0.1}s both` }}>
                    <img src={p.src} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
              <div className="border-l border-white/10 pl-4 sm:pl-6">
                <div className="flex items-center gap-0.5 mb-0.5">
                  {[1, 2, 3, 4, 5].map((s) => <svg key={s} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
                </div>
                <p className="text-sm font-bold text-white">4.9/5 Rating</p>
                <p className="text-[10px] text-white/30">from 10,000+ students</p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#070718] to-transparent" />
      </section>

      {/* ═══ TRUSTED BY ═══ */}
      <section className="py-10 bg-[#070718] border-y border-white/[0.03] overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#070718] via-transparent to-[#070718] z-10 pointer-events-none" />
        <Reveal>
          <p className="text-center text-[10px] sm:text-xs font-bold text-white/20 uppercase tracking-[0.3em] mb-6">Trusted by students from</p>
        </Reveal>
        <div className="flex items-center gap-16" style={{ animation: 'marquee 35s linear infinite', width: 'max-content' }}>
          {[...Array(2)].map((_, set) => (
            <div key={set} className="flex items-center gap-16 shrink-0">
              {['IIT Delhi', 'IIT Bombay', 'NIT Trichy', 'BITS Pilani', 'IIM Ahmedabad', 'Stanford', 'MIT', 'Google', 'Microsoft', 'Amazon'].map((name, i) => (
                <span key={`${set}-${i}`} className="text-sm font-bold text-white/15 hover:text-white/30 transition-colors duration-500 whitespace-nowrap px-2 cursor-default">{name}</span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="py-24 sm:py-32 lg:py-40 bg-[#070718] relative">
        <Orb color="rgba(99,102,241,0.12)" size="500px" x="-10%" y="20%" delay={0} duration={18} />
        <Orb color="rgba(139,92,246,0.08)" size="400px" x="80%" y="60%" delay={5} duration={15} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Reveal className="text-center mb-16 sm:mb-20">
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-indigo-400 uppercase tracking-[0.25em] bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-full mb-5">Why Mera Raasta</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white mb-5 tracking-tight">Everything You Need</h2>
            <p className="text-white/30 max-w-2xl mx-auto text-base sm:text-lg">From career discovery to job readiness — every step, beautifully crafted.</p>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {[
              { icon: '🎯', title: 'AI Career Matching', desc: 'Smart algorithms analyze your skills, interests & goals to suggest the perfect career path.', gradient: 'from-blue-500 to-cyan-400', accent: '#3b82f6' },
              { icon: '🗺️', title: 'Personalized Roadmaps', desc: 'Step-by-step career roadmaps with milestones, deadlines & actionable tasks.', gradient: 'from-violet-500 to-purple-400', accent: '#8b5cf6' },
              { icon: '📚', title: 'Education Hub', desc: 'Explore courses, colleges, scholarships & government schemes — all in one place.', gradient: 'from-emerald-500 to-teal-400', accent: '#10b981' },
              { icon: '🤖', title: 'AI Career Coach', desc: 'Chat with AI for instant career guidance, resume tips & interview prep.', gradient: 'from-amber-500 to-orange-400', accent: '#f59e0b' },
              { icon: '📄', title: 'Resume Builder', desc: 'Create professional resumes with AI-powered suggestions & ATS-friendly templates.', gradient: 'from-pink-500 to-rose-400', accent: '#ec4899' },
              { icon: '👨‍👩‍👧', title: 'Parent Dashboard', desc: 'Parents can track their child\'s career journey, progress & milestones in real-time.', gradient: 'from-indigo-500 to-violet-400', accent: '#6366f1' },
            ].map((f, i) => (
              <Reveal key={i} delay={i * 100}>
                <TiltCard intensity={12}>
                  <div className="relative p-6 sm:p-7 rounded-3xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.12] transition-all duration-500 hover:shadow-2xl overflow-hidden group cursor-default h-full">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${f.accent}08, transparent 40%)` }} />
                    <div className="absolute top-0 left-0 w-full h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ backgroundImage: `linear-gradient(90deg, transparent, ${f.accent}40, transparent)` }} />
                    <div className={`w-14 h-14 bg-gradient-to-br ${f.gradient} rounded-2xl flex items-center justify-center text-2xl mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>{f.icon}</div>
                    <h3 className="text-lg font-extrabold text-white mb-2">{f.title}</h3>
                    <p className="text-sm text-white/35 leading-relaxed">{f.desc}</p>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" className="py-24 sm:py-32 lg:py-40 bg-[#050510] relative overflow-hidden">
        <Orb color="rgba(168,85,247,0.1)" size="500px" x="60%" y="10%" delay={2} duration={20} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Reveal className="text-center mb-16 sm:mb-20">
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-violet-400 uppercase tracking-[0.25em] bg-violet-500/10 border border-violet-500/20 px-4 py-1.5 rounded-full mb-5">Process</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white mb-5 tracking-tight">How It Works</h2>
            <p className="text-white/30 max-w-2xl mx-auto text-base sm:text-lg">Start your career journey in minutes.</p>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 relative">
            <div className="hidden lg:block absolute top-24 left-[12%] right-[12%] h-[2px] overflow-hidden">
              <div className="w-full h-full bg-white/[0.04]" />
              <div className="absolute top-0 left-0 h-full w-1/4 bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500 opacity-40" style={{ animation: 'shimmerLine 4s ease-in-out infinite' }} />
            </div>
            {[
              { num: '01', icon: '✨', title: 'Sign Up Free', desc: 'Create your account in 30 seconds. Choose your role — student, parent, or mentor.', gradient: 'from-violet-500 to-purple-400' },
              { num: '02', icon: '📝', title: 'Quick Assessment', desc: 'Tell us about your interests, skills & career goals in a fun quiz.', gradient: 'from-blue-500 to-indigo-400' },
              { num: '03', icon: '🧠', title: 'AI Recommends', desc: 'Our AI analyzes your profile and finds the best career paths for you.', gradient: 'from-cyan-500 to-blue-400' },
              { num: '04', icon: '🚀', title: 'Follow Roadmap', desc: 'Start your personalized career journey with step-by-step guidance.', gradient: 'from-emerald-500 to-teal-400' },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 180} direction="up" className="relative text-center group">
                <div className="relative z-10 w-16 h-16 bg-white/[0.03] border border-white/[0.08] group-hover:border-white/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5 group-hover:scale-110 group-hover:shadow-2xl transition-all duration-500">
                  {s.icon}
                  <div className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle, ${s.gradient.includes('violet') ? '#8b5cf620' : s.gradient.includes('blue') ? '#3b82f620' : s.gradient.includes('cyan') ? '#06b6d420' : '#10b98120'}, transparent)` }} />
                </div>
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 group-hover:bg-white/[0.04] transition-all duration-500">
                  <span className="text-[10px] font-bold text-white/30 mb-2 block tracking-[0.3em] uppercase">Step {s.num}</span>
                  <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-white/30 leading-relaxed">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ROLES ═══ */}
      <section id="roles" className="py-24 sm:py-32 lg:py-40 bg-[#070718] relative">
        <Orb color="rgba(16,185,129,0.08)" size="400px" x="10%" y="30%" delay={0} duration={16} />
        <Orb color="rgba(236,72,153,0.06)" size="350px" x="75%" y="50%" delay={4} duration={14} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Reveal className="text-center mb-16 sm:mb-20">
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-[0.25em] bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full mb-5">For Everyone</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white mb-5 tracking-tight">Choose Your Role</h2>
            <p className="text-white/30 max-w-2xl mx-auto text-base sm:text-lg">Whether you're a student, parent, or mentor — we have something special for you.</p>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { icon: '🎓', title: 'Student', desc: 'Explore careers, get AI recommendations, follow personalized roadmaps, and prepare for your dream job.', gradient: 'from-blue-600 to-indigo-600', glow: 'rgba(99,102,241,0.15)', border: 'border-blue-500/20 hover:border-blue-400/40' },
              { icon: '👨‍👩‍👧', title: 'Parent', desc: "Track your child's career journey, monitor their progress, and stay involved in their career decisions.", gradient: 'from-emerald-600 to-teal-600', glow: 'rgba(16,185,129,0.15)', border: 'border-emerald-500/20 hover:border-emerald-400/40' },
              { icon: '🧑‍🏫', title: 'Mentor', desc: 'Guide students, track their progress, provide feedback, and help shape the next generation.', gradient: 'from-violet-600 to-purple-600', glow: 'rgba(139,92,246,0.15)', border: 'border-violet-500/20 hover:border-violet-400/40' },
            ].map((r, i) => (
              <Reveal key={i} delay={i * 180}>
                <TiltCard intensity={10}>
                  <div className={`relative bg-white/[0.02] ${r.border} border rounded-3xl text-center transition-all duration-500 hover:shadow-2xl group overflow-hidden h-full`}>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: `radial-gradient(500px circle at 50% 30%, ${r.glow}, transparent 60%)` }} />
                    <div className="relative p-8 sm:p-10">
                      <div className="relative inline-block mb-6">
                        <div className="absolute -inset-4 bg-gradient-to-br opacity-0 group-hover:opacity-30 transition-opacity duration-500 rounded-full blur-xl" style={{ backgroundImage: `linear-gradient(135deg, ${r.glow}, transparent)` }} />
                        <span className="text-6xl relative group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 inline-block">{r.icon}</span>
                      </div>
                      <h3 className="text-2xl font-extrabold text-white mb-3">{r.title}</h3>
                      <p className="text-sm text-white/35 leading-relaxed mb-8">{r.desc}</p>
                      <Link to="/register"
                        className={`inline-flex items-center gap-2 bg-gradient-to-r ${r.gradient} text-white px-8 py-3.5 rounded-2xl font-bold text-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden group/btn`}>
                        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                        <span className="relative">Join as {r.title}</span>
                        <svg className="w-4 h-4 relative group-hover/btn:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                      </Link>
                    </div>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section id="testimonials" className="py-24 sm:py-32 lg:py-40 bg-[#050510] relative">
        <Orb color="rgba(245,158,11,0.08)" size="400px" x="50%" y="20%" delay={3} duration={17} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Reveal className="text-center mb-16 sm:mb-20">
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-amber-400 uppercase tracking-[0.25em] bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full mb-5">Testimonials</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white mb-5 tracking-tight">Loved by Thousands</h2>
            <p className="text-white/30 max-w-2xl mx-auto text-base sm:text-lg">Real stories from students, parents, and mentors.</p>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { name: 'Priya Sharma', role: 'Class 12 Student', text: 'Mera Raasta helped me discover my passion for Data Science. The personalized roadmap made everything so clear and actionable!', rating: 5, color: 'from-blue-500 to-indigo-500', glow: 'rgba(99,102,241,0.12)', img: studentPhotos[0].src },
              { name: 'Rajesh Kumar', role: 'Parent', text: "As a parent, I can finally track my daughter's career progress. The parent dashboard is incredibly useful and easy to use.", rating: 5, color: 'from-emerald-500 to-teal-500', glow: 'rgba(16,185,129,0.12)', img: studentPhotos[2].src },
              { name: 'Anita Devi', role: 'Career Mentor', text: 'The mentor tools help me guide multiple students effectively. I can track their progress and provide timely advice.', rating: 5, color: 'from-violet-500 to-purple-500', glow: 'rgba(139,92,246,0.12)', img: studentPhotos[5].src },
            ].map((t, i) => (
              <Reveal key={i} delay={i * 180}>
                <TiltCard intensity={8}>
                  <div className="relative bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.12] rounded-3xl transition-all duration-500 hover:shadow-2xl group overflow-hidden h-full">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: `radial-gradient(400px circle at 50% 0%, ${t.glow}, transparent 60%)` }} />
                    <div className="relative p-7 sm:p-8">
                      <div className="flex gap-0.5 mb-4">
                        {[...Array(t.rating)].map((_, s) => <svg key={s} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
                      </div>
                      <p className="text-white/50 text-sm leading-relaxed mb-6">"{t.text}"</p>
                      <div className="flex items-center gap-3 pt-5 border-t border-white/[0.05]">
                        <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/10 shadow-lg group-hover:scale-110 transition-transform duration-500">
                          <img src={t.img} alt={t.name} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                        <div><p className="text-sm font-bold text-white">{t.name}</p><p className="text-xs text-white/30">{t.role}</p></div>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-24 sm:py-32 lg:py-40 bg-[#070718] relative overflow-hidden">
        <Orb color="rgba(99,102,241,0.15)" size="600px" x="20%" y="30%" delay={0} duration={18} />
        <Orb color="rgba(139,92,246,0.1)" size="500px" x="60%" y="50%" delay={6} duration={15} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Reveal>
            <div className="relative rounded-[2rem] overflow-hidden border border-white/[0.06]" style={{ background: 'linear-gradient(160deg, #0c0c30, #1a1050, #0c0c30)' }}>
              <ParticleField count={25} />
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
              <div className="relative z-10 p-12 sm:p-16 lg:p-24 text-center">
                <Reveal delay={100}>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white mb-5 tracking-tight">Ready to Find Your Path?</h2>
                </Reveal>
                <Reveal delay={200}>
                  <p className="text-white/35 text-base sm:text-lg mb-12 max-w-xl mx-auto">Join 10,000+ students who have already discovered their perfect career.</p>
                </Reveal>
                <Reveal delay={300}>
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    <MagicButton to="/register" variant="primary">
                      Get Started Free
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </MagicButton>
                  </div>
                </Reveal>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-[#050510] border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
            <div className="col-span-2 md:col-span-4 lg:col-span-1">
              <Logo size="default" />
              <p className="text-sm text-white/25 leading-relaxed mb-6">India's smartest career guidance platform.</p>
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
                  {col.links.map((l) => (<li key={l}><a href="#" className="text-sm text-white/25 hover:text-white/60 transition-colors duration-300">{l}</a></li>))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/[0.04] mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/20">&copy; 2026 Mera Raasta. All rights reserved.</p>
            <div className="flex items-center gap-4">
              {['Twitter', 'GitHub', 'LinkedIn'].map(s => (
                <a key={s} href="#" className="text-sm text-white/20 hover:text-white/50 transition-colors duration-300">{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
