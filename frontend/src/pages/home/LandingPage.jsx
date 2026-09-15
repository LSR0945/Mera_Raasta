import { Link } from 'react-router-dom';
import { useState, useEffect, useRef, useMemo } from 'react';
import Logo from '../../components/common/Logo';
import { useAuth } from '../../hooks/useAuth';

/* ═══ ANIMATED COUNTER ═══ */
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
    let s = 0, step = end / (duration / 16);
    const t = setInterval(() => { s += step; if (s >= end) { setCount(end); clearInterval(t); } else setCount(Math.floor(s)); }, 16);
    return () => clearInterval(t);
  }, [started, end, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ═══ SCROLL REVEAL ═══ */
function Reveal({ children, className = '', delay = 0 }) {
  const [show, setShow] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShow(true); obs.disconnect(); } }, { threshold: 0.06 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`transition-all duration-[1000ms] cubic-bezier(0.16,1,0.3,1) ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>{children}</div>
  );
}

/* ═══ 3D TILT ═══ */
function Tilt({ children, className = '', intensity = 12 }) {
  const ref = useRef(null);
  const [t, setT] = useState('');
  const move = (e) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    setT(`perspective(800px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg) scale(1.02)`);
  };
  return (
    <div ref={ref} className={`transition-transform duration-300 ease-out ${className}`} style={{ transform: t }}
      onMouseMove={move} onMouseLeave={() => setT('')}>{children}</div>
  );
}

/* ═══ MAGNETIC BTN ═══ */
function Btn({ children, to, primary }) {
  const ref = useRef(null);
  const [o, setO] = useState({ x: 0, y: 0 });
  const move = (e) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    setO({ x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.25 });
  };
  return (
    <Link to={to} ref={ref}
      className={`relative inline-flex items-center gap-2.5 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-sm sm:text-base transition-all duration-300 hover:-translate-y-0.5 overflow-hidden group
        ${primary
          ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-[0_0_40px_rgba(99,102,241,0.3)] hover:shadow-[0_0_60px_rgba(99,102,241,0.5)]'
          : 'bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] text-white hover:bg-white/[0.1] hover:border-white/[0.2]'}`}
      style={{ transform: `translate(${o.x}px,${o.y}px)` }} onMouseMove={move} onMouseLeave={() => setO({ x: 0, y: 0 })}>
      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      <span className="relative flex items-center gap-2">{children}</span>
    </Link>
  );
}

/* ═══ PARTICLE FIELD ═══ */
function Particles({ count = 35 }) {
  const p = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    s: 1 + Math.random() * 2.5, d: 5 + Math.random() * 10, dl: Math.random() * 6,
  })), [count]);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {p.map(i => (
        <div key={i.id} className="absolute bg-white rounded-full" style={{
          left: `${i.x}%`, top: `${i.y}%`, width: i.s, height: i.s, opacity: 0.2 + Math.random() * 0.3,
          animation: `pDrift ${i.d}s ease-in-out ${i.dl}s infinite`,
        }} />
      ))}
    </div>
  );
}

/* ═══ TYPEWRITER ═══ */
function Typer({ words, speed = 50, pause = 2200 }) {
  const [i, setI] = useState(0), [txt, setTxt] = useState(''), [del, setDel] = useState(false);
  useEffect(() => {
    const w = words[i];
    const t = setTimeout(() => {
      if (!del) {
        setTxt(w.slice(0, txt.length + 1));
        if (txt.length + 1 === w.length) setTimeout(() => setDel(true), pause);
      } else {
        setTxt(w.slice(0, txt.length - 1));
        if (txt.length - 1 === 0) { setDel(false); setI((i + 1) % words.length); }
      }
    }, del ? speed / 2 : speed);
    return () => clearTimeout(t);
  }, [txt, del, i]);
  return <span>{txt}<span className="inline-block w-[2px] h-[1.1em] bg-indigo-400 ml-0.5 align-middle" style={{ animation: 'blink 1s step-end infinite' }} /></span>;
}

/* ═══ MAIN ═══ */
export default function LandingPage() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const s = () => setScrolled(window.scrollY > 30);
    const m = (e) => setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    window.addEventListener('scroll', s, { passive: true });
    window.addEventListener('mousemove', m, { passive: true });
    return () => { window.removeEventListener('scroll', s); window.removeEventListener('mousemove', m); };
  }, []);

  /* Student photos — clear, high-quality */
  const photos = [
    { src: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=500&h=650&fit=crop&auto=format', name: 'Priya Sharma', sub: 'IIT Delhi • Computer Science', w: 'w-[200px] lg:w-[240px]', h: 'h-[260px] lg:h-[310px]', pos: 'left-[4%] top-[8%]', rotate: '-3deg', delay: 0 },
    { src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=650&fit=crop&auto=format', name: 'Arjun Patel', sub: 'BITS Pilani • MBA', w: 'w-[180px] lg:w-[220px]', h: 'h-[230px] lg:h-[280px]', pos: 'right-[6%] top-[6%]', rotate: '2deg', delay: 0.6 },
    { src: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&h=650&fit=crop&auto=format', name: 'Sneha Reddy', sub: 'AIIMS • Medical', w: 'w-[170px] lg:w-[200px]', h: 'h-[220px] lg:h-[260px]', pos: 'right-[3%] bottom-[18%]', rotate: '-2deg', delay: 1.0 },
    { src: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&h=650&fit=crop&auto=format', name: 'Vikram Singh', sub: 'NIT Trichy • Data Science', w: 'w-[160px] lg:w-[190px]', h: 'h-[210px] lg:h-[250px]', pos: 'left-[8%] bottom-[15%]', rotate: '3deg', delay: 0.3 },
    { src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=650&fit=crop&auto=format', name: 'Kavya Nair', sub: 'NID Ahmedabad • Design', w: 'w-[150px] lg:w-[180px]', h: 'h-[195px] lg:h-[235px]', pos: 'left-[38%] top-[3%]', rotate: '1deg', delay: 0.8 },
    { src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=650&fit=crop&auto=format', name: 'Amit Kumar', sub: 'IIT Bombay • AI/ML', w: 'w-[140px] lg:w-[170px]', h: 'h-[185px] lg:h-[220px]', pos: 'left-[35%] bottom-[10%]', rotate: '-1deg', delay: 1.2 },
    { src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&h=650&fit=crop&auto=format', name: 'Neha Gupta', sub: 'NLU Delhi • Law', w: 'w-[130px] lg:w-[160px]', h: 'h-[170px] lg:h-[210px]', pos: 'right-[30%] top-[12%]', rotate: '2deg', delay: 0.4 },
    { src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&h=650&fit=crop&auto=format', name: 'Rahul Verma', sub: 'VIT Vellore • BCA', w: 'w-[120px] lg:w-[150px]', h: 'h-[160px] lg:h-[195px]', pos: 'right-[28%] bottom-[20%]', rotate: '-2deg', delay: 1.4 },
  ];

  return (
    <div className="min-h-screen bg-[#06060f] overflow-hidden selection:bg-indigo-500/30">
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pDrift { 0%,100%{transform:translateY(0) translateX(0);opacity:0.25} 25%{transform:translateY(-30px) translateX(12px);opacity:0.5} 50%{transform:translateY(-15px) translateX(-18px);opacity:0.3} 75%{transform:translateY(-45px) translateX(8px);opacity:0.45} }
        @keyframes gradShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes slideR { 0%{width:0} 100%{width:100%} }
        @keyframes fadeIn { 0%{opacity:0;transform:translateY(20px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes heroIn { 0%{opacity:0;transform:translateY(30px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes photoIn { 0%{opacity:0;transform:scale(0.85) translateY(30px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes photoFloat { 0%,100%{transform:translateY(0) rotate(var(--r,0deg))} 50%{transform:translateY(-12px) rotate(calc(var(--r,0deg) + 0.8deg))} }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes glow { 0%,100%{box-shadow:0 0 20px rgba(99,102,241,0.15)} 50%{box-shadow:0 0 50px rgba(99,102,241,0.3)} }
        @keyframes orbMove { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(40px,-30px) scale(1.05)} 66%{transform:translate(-30px,40px) scale(0.95)} }
        @keyframes gridFade { 0%,100%{opacity:0.025} 50%{opacity:0.05} }
        @keyframes badgeIn { 0%{opacity:0;transform:scale(0.9)} 100%{opacity:1;transform:scale(1)} }
        @keyframes starPulse { 0%,100%{opacity:0.15;transform:scale(1)} 50%{opacity:0.8;transform:scale(1.4)} }
      `}</style>

      {/* ═══ NAVBAR ═══ */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#06060f]/70 backdrop-blur-2xl border-b border-white/[0.04]' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-[68px]">
          <Logo size="default" />
          <div className="hidden lg:flex items-center gap-1">
            {['Features', 'How It Works', 'Roles', 'Testimonials'].map(n => (
              <a key={n} href={`#${n.toLowerCase().replace(/\s/g, '-')}`} className="px-4 py-2 text-[13px] font-medium text-white/40 hover:text-white/80 rounded-lg hover:bg-white/[0.04] transition-all">{n}</a>
            ))}
          </div>
          <div className="flex items-center gap-2.5">
            {user ? (
              <Link to="/dashboard" className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-semibold text-emerald-400/80 hover:text-emerald-300 px-3 py-1.5 rounded-lg hover:bg-emerald-500/[0.08] transition-all">
                <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" /></span>
                Dashboard
              </Link>
            ) : (
              <Link to="/login" className="hidden sm:inline-flex text-[13px] font-medium text-white/40 hover:text-white/80 px-3 py-1.5 rounded-lg hover:bg-white/[0.04] transition-all">Login</Link>
            )}
            <Link to={user ? '/dashboard' : '/register'}
              className="inline-flex items-center gap-2 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] hover:border-white/[0.15] text-white px-4 py-2 rounded-xl text-[13px] font-semibold transition-all duration-300 hover:-translate-y-0.5">
              {user ? 'Dashboard' : 'Get Started'}
              <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            <button onClick={() => setMenu(!menu)} className="lg:hidden p-2 rounded-lg hover:bg-white/[0.05] text-white/50">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menu ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
            </button>
          </div>
        </div>
        {menu && (
          <div className="lg:hidden bg-[#0a0a14]/95 backdrop-blur-2xl border-t border-white/[0.04] px-4 py-3 space-y-1">
            {['Features', 'How It Works', 'Roles', 'Testimonials'].map(n => (
              <a key={n} href={`#${n.toLowerCase().replace(/\s/g, '-')}`} onClick={() => setMenu(false)}
                className="block px-3 py-2.5 text-sm text-white/50 hover:text-white hover:bg-white/[0.04] rounded-lg transition-all">{n}</a>
            ))}
          </div>
        )}
      </nav>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* HERO — Clear student photos + premium content                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #06060f 0%, #0c0c24 40%, #0f0f32 60%, #08081a 80%, #06060f 100%)' }} />

        {/* Subtle orbs */}
        <div className="absolute w-[600px] h-[600px] -top-40 -left-40 opacity-20" style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', filter: 'blur(80px)', animation: 'orbMove 18s ease-in-out infinite' }} />
        <div className="absolute w-[500px] h-[500px] top-1/4 -right-32 opacity-15" style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', filter: 'blur(70px)', animation: 'orbMove 14s ease-in-out 4s infinite' }} />
        <div className="absolute w-[400px] h-[400px] bottom-0 left-1/3 opacity-10" style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)', filter: 'blur(60px)', animation: 'orbMove 16s ease-in-out 8s infinite' }} />

        {/* Grid dots */}
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)', backgroundSize: '40px 40px', animation: 'gridFade 8s ease-in-out infinite' }} />

        <Particles count={30} />

        {/* ═══ STUDENT PHOTOS — CLEAR & VISIBLE ═══ */}
        <div className="absolute inset-0 hidden lg:block" style={{ transform: `translate(${(mouse.x - 0.5) * -8}px, ${(mouse.y - 0.5) * -8}px)` }}>
          {photos.map((p, i) => (
            <div key={i} className={`absolute ${p.pos} ${p.w}`} style={{ '--r': p.rotate, animation: `photoIn 1s ease ${0.3 + p.delay}s both, photoFloat ${6 + i * 0.5}s ease-in-out ${p.delay + 1}s infinite` }}>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/[0.08] hover:border-white/[0.2] transition-all duration-500 hover:scale-105 hover:shadow-[0_0_40px_rgba(99,102,241,0.15)] group"
                style={{ transform: `rotate(${p.rotate})` }}>
                <img src={p.src} alt={p.name} className={`${p.h} w-full object-cover`} loading="lazy" />
                {/* Bottom gradient for name */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-10 pb-3 px-3">
                  <p className="text-white text-xs font-bold leading-tight">{p.name}</p>
                  <p className="text-white/50 text-[9px] mt-0.5">{p.sub}</p>
                </div>
                {/* Top corner badge */}
                <div className="absolute top-2 right-2 bg-white/10 backdrop-blur-md rounded-full px-2 py-0.5 border border-white/[0.08]">
                  <span className="text-[8px] font-bold text-white/70">STUDENT</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: 2 clear photos */}
        <div className="absolute inset-0 lg:hidden">
          <div className="absolute left-[-8%] top-[12%] w-[140px]" style={{ animation: 'photoIn 0.8s ease 0.5s both' }}>
            <div className="rounded-xl overflow-hidden shadow-2xl shadow-black/60 border border-white/[0.08]" style={{ transform: 'rotate(-3deg)' }}>
              <img src={photos[0].src} alt="" className="h-[180px] w-full object-cover" loading="lazy" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <p className="text-white text-[10px] font-bold">{photos[0].name}</p>
              </div>
            </div>
          </div>
          <div className="absolute right-[-5%] bottom-[22%] w-[130px]" style={{ animation: 'photoIn 0.8s ease 0.8s both' }}>
            <div className="rounded-xl overflow-hidden shadow-2xl shadow-black/60 border border-white/[0.08]" style={{ transform: 'rotate(2deg)' }}>
              <img src={photos[2].src} alt="" className="h-[170px] w-full object-cover" loading="lazy" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <p className="text-white text-[10px] font-bold">{photos[2].name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content gradient overlay — light, lets photos show */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#06060f]/80 via-[#06060f]/40 to-[#06060f]/80 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#06060f]/60 via-transparent to-[#06060f]/90 pointer-events-none" />

        {/* ═══ HERO CONTENT ═══ */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 text-center">
          {/* Badge */}
          <Reveal delay={0}>
            <div className="flex justify-center mb-8" style={{ animation: 'badgeIn 0.8s ease 0.2s both' }}>
              <div className="inline-flex items-center gap-2 bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-full px-4 py-2">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" /></span>
                <span className="text-[11px] font-semibold text-white/60">India's #1 AI-Powered Career Platform</span>
                <span className="text-white/10">|</span>
                <span className="text-[11px] font-bold text-indigo-400/80">10,000+ Students</span>
              </div>
            </div>
          </Reveal>

          {/* Heading */}
          <Reveal delay={100}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem] font-black text-white mb-5 leading-[1.05] tracking-tight" style={{ animation: 'heroIn 1s ease 0.3s both' }}>
              Find Your<br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent"
                style={{ backgroundSize: '200% auto', animation: 'gradShift 4s ease infinite' }}>
                Perfect Career
              </span>
              <br />Path
            </h1>
          </Reveal>

          {/* Typing */}
          <Reveal delay={250}>
            <div className="text-[15px] sm:text-base text-white/30 mb-3 h-6">
              <Typer words={[
                'Learn coding with AI — Python, Java, Deep Learning & more.',
                'AI-powered career recommendations just for you.',
                'Personalized roadmaps to your dream career.',
                'Master Machine Learning, Neural Networks & AI.',
              ]} />
            </div>
          </Reveal>

          <Reveal delay={350}>
            <p className="text-sm text-white/20 mb-10 max-w-xl mx-auto">
              From career discovery to job readiness — built for Indian students.
            </p>
          </Reveal>

          {/* Buttons */}
          <Reveal delay={400}>
            <div className="flex flex-wrap items-center justify-center gap-3 mb-14">
              <Btn to={user ? '/dashboard' : '/register'} primary>
                Start Your Journey — Free
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Btn>
              <Btn to="/login">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" /></svg>
                Watch Demo
              </Btn>
            </div>
          </Reveal>

          {/* Stats */}
          <Reveal delay={500}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto mb-10">
              {[
                { n: 10000, s: '+', l: 'Students', icon: '🎓', color: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/10' },
                { n: 500, s: '+', l: 'Career Paths', icon: '💼', color: 'from-violet-500/20 to-purple-500/20', border: 'border-violet-500/10' },
                { n: 95, s: '%', l: 'Success', icon: '🏆', color: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/10' },
                { n: 200, s: '+', l: 'Mentors', icon: '🧑‍🏫', color: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/10' },
              ].map((s, i) => (
                <div key={i} className={`bg-white/[0.02] backdrop-blur-xl border ${s.border} rounded-xl p-4 hover:bg-white/[0.05] transition-all duration-500 group cursor-default`}
                  style={{ animation: `fadeIn 0.6s ease ${0.6 + i * 0.1}s both` }}>
                  <div className={`w-9 h-9 bg-gradient-to-br ${s.color} rounded-lg flex items-center justify-center text-lg mb-2 mx-auto group-hover:scale-110 transition-transform`}>{s.icon}</div>
                  <p className="text-xl sm:text-2xl font-black text-white"><Counter end={s.n} suffix={s.s} /></p>
                  <p className="text-[9px] sm:text-[10px] text-white/30 font-medium uppercase tracking-widest mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Social proof */}
          <Reveal delay={650}>
            <div className="flex items-center justify-center gap-4">
              <div className="flex -space-x-2.5">
                {photos.slice(0, 5).map((p, i) => (
                  <div key={i} className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#0a0a1e] shadow-lg"
                    style={{ animation: `fadeIn 0.4s ease ${0.7 + i * 0.08}s both` }}>
                    <img src={p.src} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
              <div className="border-l border-white/[0.06] pl-4">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => <svg key={s} className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
                </div>
                <p className="text-[11px] font-bold text-white/70">4.9/5 <span className="text-white/30 font-normal">from 10,000+</span></p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#080818] to-transparent" />
      </section>

      {/* ═══ TRUSTED BY ═══ */}
      <section className="py-8 bg-[#080818] border-y border-white/[0.03] overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#080818] via-transparent to-[#080818] z-10 pointer-events-none" />
        <p className="text-center text-[9px] font-bold text-white/15 uppercase tracking-[0.3em] mb-5">Trusted by students from</p>
        <div className="flex items-center gap-14" style={{ animation: 'marquee 30s linear infinite', width: 'max-content' }}>
          {[...Array(2)].map((_, s) => (
            <div key={s} className="flex items-center gap-14 shrink-0">
              {['IIT Delhi', 'IIT Bombay', 'NIT Trichy', 'BITS Pilani', 'IIM Ahmedabad', 'Stanford', 'MIT', 'Google', 'Microsoft', 'Amazon'].map((n, i) => (
                <span key={`${s}-${i}`} className="text-[13px] font-semibold text-white/12 hover:text-white/25 transition-colors whitespace-nowrap cursor-default">{n}</span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ALL FEATURES — Complete platform capabilities                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section id="features" className="py-20 sm:py-28 lg:py-36 bg-[#080818] relative">
        <div className="absolute w-[500px] h-[500px] -top-40 -left-40 opacity-10" style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)', filter: 'blur(80px)', animation: 'orbMove 18s ease-in-out infinite' }} />
        <div className="absolute w-[400px] h-[400px] bottom-0 right-0 opacity-8" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)', filter: 'blur(70px)', animation: 'orbMove 15s ease-in-out 5s infinite' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          {/* Header */}
          <Reveal className="text-center mb-16 sm:mb-20">
            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-indigo-400/80 uppercase tracking-[0.25em] bg-indigo-500/[0.06] border border-indigo-500/15 px-3 py-1 rounded-full mb-4">Platform Features</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3 tracking-tight">Everything You Can Do</h2>
            <p className="text-white/25 max-w-2xl mx-auto text-sm sm:text-base">From AI-powered career guidance to deep learning — one platform for your entire career journey.</p>
          </Reveal>

          {/* ═══ AI & DEEP LEARNING ═══ */}
          <Reveal className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center text-sm shadow-lg shadow-indigo-500/20">🧠</div>
              <h3 className="text-lg font-bold text-white">AI & Deep Learning</h3>
              <div className="flex-1 h-[1px] bg-white/[0.04]" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: '🎯', t: 'AI Career Matching', d: 'Deep learning algorithms analyze 50+ data points to find your perfect career match.', a: '#6366f1' },
                { icon: '🤖', t: 'AI Career Coach', d: 'Chat with our AI counselor for instant guidance, resume tips & interview prep.', a: '#8b5cf6' },
                { icon: '🧠', t: 'Smart Recommendations', d: 'AI generates 3 personalized career plans with fit scores & reasoning.', a: '#a855f7' },
                { icon: '⚡', t: 'Next Best Action', d: 'AI suggests exactly what you should do next to advance your career.', a: '#7c3aed' },
              ].map((f, i) => (
                <Reveal key={i} delay={i * 60}>
                  <Tilt intensity={8}>
                    <div className="relative p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] hover:border-white/[0.1] transition-all duration-500 group overflow-hidden h-full">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(400px circle at 50% 0%, ${f.a}08, transparent 60%)` }} />
                      <span className="text-2xl mb-3 block group-hover:scale-110 transition-transform">{f.icon}</span>
                      <h4 className="text-[13px] font-bold text-white mb-1">{f.t}</h4>
                      <p className="text-[11px] text-white/25 leading-relaxed">{f.d}</p>
                    </div>
                  </Tilt>
                </Reveal>
              ))}
            </div>
          </Reveal>

          {/* ═══ LEARN & BUILD — Coding, Courses, Quizzes ═══ */}
          <Reveal className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-sm shadow-lg shadow-emerald-500/20">💻</div>
              <h3 className="text-lg font-bold text-white">Learn & Build</h3>
              <div className="flex-1 h-[1px] bg-white/[0.04]" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: '🐍', t: 'Learn Coding with AI', d: 'AI-powered coding lessons — Python, Java, C++, Web Development & more.', a: '#10b981' },
                { icon: '📊', t: 'Deep Learning Courses', d: 'Machine Learning, Neural Networks, NLP, Computer Vision — structured learning paths.', a: '#14b8a6' },
                { icon: '📝', t: 'LMS Quizzes & Tests', d: 'Test your knowledge with interactive quizzes. Track scores & improve.', a: '#06b6d4' },
                { icon: '🔧', t: 'Hands-on Projects', d: 'Real-world projects to build your portfolio — from beginner to advanced.', a: '#0ea5e9' },
              ].map((f, i) => (
                <Reveal key={i} delay={i * 60}>
                  <Tilt intensity={8}>
                    <div className="relative p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] hover:border-white/[0.1] transition-all duration-500 group overflow-hidden h-full">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(400px circle at 50% 0%, ${f.a}08, transparent 60%)` }} />
                      <span className="text-2xl mb-3 block group-hover:scale-110 transition-transform">{f.icon}</span>
                      <h4 className="text-[13px] font-bold text-white mb-1">{f.t}</h4>
                      <p className="text-[11px] text-white/25 leading-relaxed">{f.d}</p>
                    </div>
                  </Tilt>
                </Reveal>
              ))}
            </div>
          </Reveal>

          {/* ═══ CAREER GROWTH ═══ */}
          <Reveal className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center text-sm shadow-lg shadow-amber-500/20">🚀</div>
              <h3 className="text-lg font-bold text-white">Career Growth</h3>
              <div className="flex-1 h-[1px] bg-white/[0.04]" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: '🗺️', t: 'Personalized Roadmaps', d: 'Step-by-step career roadmaps with milestones, deadlines & progress tracking.', a: '#f59e0b' },
                { icon: '📄', t: 'AI Resume Builder', d: 'Create ATS-friendly resumes with AI suggestions. Stand out from the crowd.', a: '#f97316' },
                { icon: '💼', t: 'Internship Finder', d: 'Curated internships matched to your skills, interests & career goals.', a: '#ef4444' },
                { icon: '🎤', t: 'Interview Preparation', d: 'AI-powered interview quizzes, common questions & mock interview practice.', a: '#dc2626' },
              ].map((f, i) => (
                <Reveal key={i} delay={i * 60}>
                  <Tilt intensity={8}>
                    <div className="relative p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] hover:border-white/[0.1] transition-all duration-500 group overflow-hidden h-full">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(400px circle at 50% 0%, ${f.a}08, transparent 60%)` }} />
                      <span className="text-2xl mb-3 block group-hover:scale-110 transition-transform">{f.icon}</span>
                      <h4 className="text-[13px] font-bold text-white mb-1">{f.t}</h4>
                      <p className="text-[11px] text-white/25 leading-relaxed">{f.d}</p>
                    </div>
                  </Tilt>
                </Reveal>
              ))}
            </div>
          </Reveal>

          {/* ═══ EDUCATION HUB ═══ */}
          <Reveal className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-sm shadow-lg shadow-blue-500/20">📚</div>
              <h3 className="text-lg font-bold text-white">Education Hub</h3>
              <div className="flex-1 h-[1px] bg-white/[0.04]" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: '🎓', t: 'Online Courses', d: 'Curated courses from top platforms — Udemy, Coursera, NPTEL & more.', a: '#3b82f6' },
                { icon: '🏛️', t: 'College Directory', d: 'Explore top colleges across India — IITs, NITs, BITS, state colleges.', a: '#2563eb' },
                { icon: '🏆', t: 'Scholarships', d: '100+ scholarships — merit-based, need-based, government & private.', a: '#1d4ed8' },
                { icon: '🇮🇳', t: 'Government Schemes', d: 'PM schemes, state scholarships, skill development programs — all listed.', a: '#1e40af' },
              ].map((f, i) => (
                <Reveal key={i} delay={i * 60}>
                  <Tilt intensity={8}>
                    <div className="relative p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] hover:border-white/[0.1] transition-all duration-500 group overflow-hidden h-full">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(400px circle at 50% 0%, ${f.a}08, transparent 60%)` }} />
                      <span className="text-2xl mb-3 block group-hover:scale-110 transition-transform">{f.icon}</span>
                      <h4 className="text-[13px] font-bold text-white mb-1">{f.t}</h4>
                      <p className="text-[11px] text-white/25 leading-relaxed">{f.d}</p>
                    </div>
                  </Tilt>
                </Reveal>
              ))}
            </div>
          </Reveal>

          {/* ═══ FOR FAMILIES ═══ */}
          <Reveal className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center text-sm shadow-lg shadow-pink-500/20">👨‍👩‍👧</div>
              <h3 className="text-lg font-bold text-white">For Families</h3>
              <div className="flex-1 h-[1px] bg-white/[0.04]" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: '📊', t: 'Parent Dashboard', d: 'Track your child\'s career journey, progress & milestones in real-time.', a: '#ec4899' },
                { icon: '📈', t: 'Progress Reports', d: 'Detailed progress reports — roadmap completion, activity logs, achievements.', a: '#db2777' },
                { icon: '🧑‍🏫', t: 'Mentor System', d: 'Connect with experienced mentors. Get guidance, notes & reviews.', a: '#be185d' },
                { icon: '🔔', t: 'Activity Monitoring', d: 'Real-time activity tracking — what your child is learning and exploring.', a: '#9d174d' },
              ].map((f, i) => (
                <Reveal key={i} delay={i * 60}>
                  <Tilt intensity={8}>
                    <div className="relative p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] hover:border-white/[0.1] transition-all duration-500 group overflow-hidden h-full">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(400px circle at 50% 0%, ${f.a}08, transparent 60%)` }} />
                      <span className="text-2xl mb-3 block group-hover:scale-110 transition-transform">{f.icon}</span>
                      <h4 className="text-[13px] font-bold text-white mb-1">{f.t}</h4>
                      <p className="text-[11px] text-white/25 leading-relaxed">{f.d}</p>
                    </div>
                  </Tilt>
                </Reveal>
              ))}
            </div>
          </Reveal>

           {/* ═══ YOUR PROFILE ═══ */}
          <Reveal className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center text-sm shadow-lg shadow-violet-500/20">👤</div>
              <h3 className="text-lg font-bold text-white">Your Profile</h3>
              <div className="flex-1 h-[1px] bg-white/[0.04]" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: '📋', t: '6-Section Profile', d: 'Personal, education, interests, skills, career goals & preferences — complete profile.', a: '#8b5cf6' },
                { icon: '🎯', t: 'Interest Mapping', d: '12 interest categories mapped to careers — Technology, Science, Arts & more.', a: '#7c3aed' },
                { icon: '🏅', t: 'Achievement Badges', d: '8 achievement badges — First Login, Profile Done, Career Pick, Champion & more.', a: '#6d28d9' },
                { icon: '🔥', t: 'Weekly Streaks', d: 'Track your learning streak. Stay consistent, climb the leaderboard.', a: '#5b21b6' },
              ].map((f, i) => (
                <Reveal key={i} delay={i * 60}>
                  <Tilt intensity={8}>
                    <div className="relative p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] hover:border-white/[0.1] transition-all duration-500 group overflow-hidden h-full">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(400px circle at 50% 0%, ${f.a}08, transparent 60%)` }} />
                      <span className="text-2xl mb-3 block group-hover:scale-110 transition-transform">{f.icon}</span>
                      <h4 className="text-[13px] font-bold text-white mb-1">{f.t}</h4>
                      <p className="text-[11px] text-white/25 leading-relaxed">{f.d}</p>
                    </div>
                  </Tilt>
                </Reveal>
              ))}
            </div>
          </Reveal>

          {/* ═══ PLACEMENT REWARDS & CERTIFICATIONS ═══ */}
          <Reveal className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg flex items-center justify-center text-sm shadow-lg shadow-amber-500/20">🏆</div>
              <h3 className="text-lg font-bold text-white">Placement Rewards & Certifications</h3>
              <div className="flex-1 h-[1px] bg-white/[0.04]" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: '💰', t: 'Placement Rewards', d: 'Get cash rewards & achievement bonuses when you land your dream job through us.', a: '#f59e0b' },
                { icon: '🎓', t: 'Real World Certifications', d: 'Industry-recognized certifications that add value to your resume & LinkedIn.', a: '#d97706' },
                { icon: '🏅', t: 'Achievement Bonus', d: 'Unlock bonus rewards for completing milestones — course completion, interview prep, placement.', a: '#b45309' },
                { icon: '⭐', t: 'Success Wall of Fame', d: 'Top performers featured on our platform. Build your reputation & get noticed by recruiters.', a: '#92400e' },
              ].map((f, i) => (
                <Reveal key={i} delay={i * 60}>
                  <Tilt intensity={8}>
                    <div className="relative p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] hover:border-white/[0.1] transition-all duration-500 group overflow-hidden h-full">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(400px circle at 50% 0%, ${f.a}08, transparent 60%)` }} />
                      <span className="text-2xl mb-3 block group-hover:scale-110 transition-transform">{f.icon}</span>
                      <h4 className="text-[13px] font-bold text-white mb-1">{f.t}</h4>
                      <p className="text-[11px] text-white/25 leading-relaxed">{f.d}</p>
                    </div>
                  </Tilt>
                </Reveal>
              ))}
            </div>
          </Reveal>

          {/* ═══ TECHNICAL MASTERY — Excel, Power BI ═══ */}
          <Reveal className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-sm shadow-lg shadow-green-500/20">📊</div>
              <h3 className="text-lg font-bold text-white">Technical Mastery</h3>
              <div className="flex-1 h-[1px] bg-white/[0.04]" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: '📑', t: 'MS Excel Expert', d: 'Master advanced Excel — VLOOKUP, Pivot Tables, Macros, Data Analysis, Dashboards.', a: '#22c55e' },
                { icon: '📈', t: 'Power BI Expert', d: 'Build interactive dashboards, DAX formulas, data modeling & visual storytelling.', a: '#16a34a' },
                { icon: '🐍', t: 'Python for Data Science', d: 'Pandas, NumPy, Matplotlib, Scikit-learn — complete data science toolkit.', a: '#15803d' },
                { icon: '🤖', t: 'AI & ML Projects', d: 'Build real AI models — classification, regression, NLP, computer vision projects.', a: '#166534' },
              ].map((f, i) => (
                <Reveal key={i} delay={i * 60}>
                  <Tilt intensity={8}>
                    <div className="relative p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] hover:border-white/[0.1] transition-all duration-500 group overflow-hidden h-full">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(400px circle at 50% 0%, ${f.a}08, transparent 60%)` }} />
                      <span className="text-2xl mb-3 block group-hover:scale-110 transition-transform">{f.icon}</span>
                      <h4 className="text-[13px] font-bold text-white mb-1">{f.t}</h4>
                      <p className="text-[11px] text-white/25 leading-relaxed">{f.d}</p>
                    </div>
                  </Tilt>
                </Reveal>
              ))}
            </div>
          </Reveal>

          {/* ═══ COMMUNICATION & SOFT SKILLS ═══ */}
          <Reveal className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center text-sm shadow-lg shadow-cyan-500/20">🗣️</div>
              <h3 className="text-lg font-bold text-white">Communication & Soft Skills</h3>
              <div className="flex-1 h-[1px] bg-white/[0.04]" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: '💬', t: 'Improve Communication', d: 'Structured modules to build fluency — speaking, writing, body language & email etiquette.', a: '#06b6d4' },
                { icon: '🎤', t: 'High-Level Communication', d: 'Executive communication — boardroom presentations, stakeholder management, negotiation.', a: '#0891b2' },
                { icon: '📊', t: 'Customer Feedback Analysis', d: 'Learn to analyze customer data, sentiment analysis, feedback loops & action plans.', a: '#0e7490' },
                { icon: '🤝', t: 'Presentation Activities', d: 'Regular presentation practice — pitch decks, product demos, project walkthroughs.', a: '#155e75' },
              ].map((f, i) => (
                <Reveal key={i} delay={i * 60}>
                  <Tilt intensity={8}>
                    <div className="relative p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] hover:border-white/[0.1] transition-all duration-500 group overflow-hidden h-full">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(400px circle at 50% 0%, ${f.a}08, transparent 60%)` }} />
                      <span className="text-2xl mb-3 block group-hover:scale-110 transition-transform">{f.icon}</span>
                      <h4 className="text-[13px] font-bold text-white mb-1">{f.t}</h4>
                      <p className="text-[11px] text-white/25 leading-relaxed">{f.d}</p>
                    </div>
                  </Tilt>
                </Reveal>
              ))}
            </div>
          </Reveal>

          {/* ═══ REAL WORLD EXPERIENCE ═══ */}
          <Reveal className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-pink-500 rounded-lg flex items-center justify-center text-sm shadow-lg shadow-rose-500/20">🌍</div>
              <h3 className="text-lg font-bold text-white">Real World Experience</h3>
              <div className="flex-1 h-[1px] bg-white/[0.04]" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: '🔧', t: 'Real World Projects', d: 'Work on live projects — build apps, dashboards, analysis reports for actual clients.', a: '#f43f5e' },
                { icon: '🤝', t: 'Client Interaction', d: 'Direct client calls, requirement gathering, feedback sessions — real professional experience.', a: '#e11d48' },
                { icon: '📅', t: 'Monthly Webinars', d: 'Exclusive monthly webinars with national company experts — IIT professors, CXOs, industry leaders.', a: '#be123c' },
                { icon: '👨‍💼', t: 'Industry Expert Teachers', d: 'Learn from professionals working at Google, Microsoft, Amazon, top Indian startups.', a: '#9f1239' },
              ].map((f, i) => (
                <Reveal key={i} delay={i * 60}>
                  <Tilt intensity={8}>
                    <div className="relative p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] hover:border-white/[0.1] transition-all duration-500 group overflow-hidden h-full">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(400px circle at 50% 0%, ${f.a}08, transparent 60%)` }} />
                      <span className="text-2xl mb-3 block group-hover:scale-110 transition-transform">{f.icon}</span>
                      <h4 className="text-[13px] font-bold text-white mb-1">{f.t}</h4>
                      <p className="text-[11px] text-white/25 leading-relaxed">{f.d}</p>
                    </div>
                  </Tilt>
                </Reveal>
              ))}
            </div>
          </Reveal>

          {/* ═══ LEADERSHIP & PERSONAL BRANDING ═══ */}
          <Reveal className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center text-sm shadow-lg shadow-indigo-500/20">👑</div>
              <h3 className="text-lg font-bold text-white">Leadership & Personal Branding</h3>
              <div className="flex-1 h-[1px] bg-white/[0.04]" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: '🎯', t: 'Personal Branding', d: 'Build your LinkedIn brand, portfolio website, professional online presence & networking.', a: '#6366f1' },
                { icon: '👥', t: 'Team Work & Collaboration', d: 'Group projects, agile sprints, cross-functional team exercises — workplace readiness.', a: '#4f46e5' },
                { icon: '📖', t: 'Leadership Quality', d: 'Decision making, conflict resolution, team motivation, strategic thinking workshops.', a: '#4338ca' },
                { icon: '😊', t: 'Positive Attitude Development', d: 'Growth mindset training, stress management, resilience building & emotional intelligence.', a: '#3730a3' },
              ].map((f, i) => (
                <Reveal key={i} delay={i * 60}>
                  <Tilt intensity={8}>
                    <div className="relative p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] hover:border-white/[0.1] transition-all duration-500 group overflow-hidden h-full">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(400px circle at 50% 0%, ${f.a}08, transparent 60%)` }} />
                      <span className="text-2xl mb-3 block group-hover:scale-110 transition-transform">{f.icon}</span>
                      <h4 className="text-[13px] font-bold text-white mb-1">{f.t}</h4>
                      <p className="text-[11px] text-white/25 leading-relaxed">{f.d}</p>
                    </div>
                  </Tilt>
                </Reveal>
              ))}
            </div>
          </Reveal>

          {/* ═══ BRAND MANAGEMENT ═══ */}
          <Reveal className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center text-sm shadow-lg shadow-teal-500/20">🎨</div>
              <h3 className="text-lg font-bold text-white">Brand Management & Marketing</h3>
              <div className="flex-1 h-[1px] bg-white/[0.04]" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: '🎨', t: 'Brand Management', d: 'Learn brand strategy, positioning, visual identity, brand voice & market differentiation.', a: '#14b8a6' },
                { icon: '📱', t: 'Digital Marketing', d: 'SEO, social media marketing, content strategy, paid ads & analytics — full stack marketing.', a: '#0d9488' },
                { icon: '📊', t: 'Market Research', d: 'Competitor analysis, user research, survey design, data-driven decision making.', a: '#0f766e' },
                { icon: '🧠', t: 'Strategic Thinking', d: 'Business strategy, go-to-market planning, growth hacking & product thinking.', a: '#115e59' },
              ].map((f, i) => (
                <Reveal key={i} delay={i * 60}>
                  <Tilt intensity={8}>
                    <div className="relative p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] hover:border-white/[0.1] transition-all duration-500 group overflow-hidden h-full">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(400px circle at 50% 0%, ${f.a}08, transparent 60%)` }} />
                      <span className="text-2xl mb-3 block group-hover:scale-110 transition-transform">{f.icon}</span>
                      <h4 className="text-[13px] font-bold text-white mb-1">{f.t}</h4>
                      <p className="text-[11px] text-white/25 leading-relaxed">{f.d}</p>
                    </div>
                  </Tilt>
                </Reveal>
              ))}
            </div>
          </Reveal>

          {/* ═══ DATA ANALYTICS & VISUALIZATION ═══ */}
          <Reveal className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-sm shadow-lg shadow-orange-500/20">📊</div>
              <h3 className="text-lg font-bold text-white">Data Analytics & Visualization</h3>
              <div className="flex-1 h-[1px] bg-white/[0.04]" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: '📈', t: 'Tableau Expert', d: 'Interactive dashboards, data storytelling, calculated fields & publish to web.', a: '#f97316' },
                { icon: '🔢', t: 'SQL Mastery', d: 'Advanced queries, joins, subqueries, stored procedures, database optimization.', a: '#ea580c' },
                { icon: '📉', t: 'Data Visualization', d: 'Chart design principles, color theory, infographic creation & visual analytics.', a: '#c2410c' },
                { icon: '🧮', t: 'Statistical Analysis', d: 'Hypothesis testing, regression, A/B testing, probability & statistical modeling.', a: '#9a3412' },
              ].map((f, i) => (
                <Reveal key={i} delay={i * 60}>
                  <Tilt intensity={8}>
                    <div className="relative p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] hover:border-white/[0.1] transition-all duration-500 group overflow-hidden h-full">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(400px circle at 50% 0%, ${f.a}08, transparent 60%)` }} />
                      <span className="text-2xl mb-3 block group-hover:scale-110 transition-transform">{f.icon}</span>
                      <h4 className="text-[13px] font-bold text-white mb-1">{f.t}</h4>
                      <p className="text-[11px] text-white/25 leading-relaxed">{f.d}</p>
                    </div>
                  </Tilt>
                </Reveal>
              ))}
            </div>
          </Reveal>

          {/* ═══ CLOUD & DEVOPS ═══ */}
          <Reveal className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-500 rounded-lg flex items-center justify-center text-sm shadow-lg shadow-sky-500/20">☁️</div>
              <h3 className="text-lg font-bold text-white">Cloud & DevOps</h3>
              <div className="flex-1 h-[1px] bg-white/[0.04]" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: '☁️', t: 'AWS Cloud', d: 'EC2, S3, Lambda, RDS — complete AWS certification prep & hands-on labs.', a: '#0ea5e9' },
                { icon: '🔷', t: 'Azure & GCP', d: 'Microsoft Azure fundamentals, Google Cloud Platform, multi-cloud strategies.', a: '#0284c7' },
                { icon: '🐳', t: 'Docker & Kubernetes', d: 'Containerization, orchestration, CI/CD pipelines & microservices deployment.', a: '#0369a1' },
                { icon: '⚙️', t: 'DevOps Practices', d: 'Jenkins, GitHub Actions, Terraform, monitoring, infrastructure as code.', a: '#075985' },
              ].map((f, i) => (
                <Reveal key={i} delay={i * 60}>
                  <Tilt intensity={8}>
                    <div className="relative p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] hover:border-white/[0.1] transition-all duration-500 group overflow-hidden h-full">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(400px circle at 50% 0%, ${f.a}08, transparent 60%)` }} />
                      <span className="text-2xl mb-3 block group-hover:scale-110 transition-transform">{f.icon}</span>
                      <h4 className="text-[13px] font-bold text-white mb-1">{f.t}</h4>
                      <p className="text-[11px] text-white/25 leading-relaxed">{f.d}</p>
                    </div>
                  </Tilt>
                </Reveal>
              ))}
            </div>
          </Reveal>

          {/* ═══ UI/UX & DESIGN ═══ */}
          <Reveal className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-fuchsia-500 to-pink-500 rounded-lg flex items-center justify-center text-sm shadow-lg shadow-fuchsia-500/20">🎨</div>
              <h3 className="text-lg font-bold text-white">UI/UX & Design</h3>
              <div className="flex-1 h-[1px] bg-white/[0.04]" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: '🎨', t: 'UI/UX Design', d: 'Figma, Adobe XD, wireframing, prototyping, user research & design thinking.', a: '#d946ef' },
                { icon: '🖌️', t: 'Graphic Design', d: 'Photoshop, Illustrator, Canva — logo design, social media creatives & branding.', a: '#c026d3' },
                { icon: '🎬', t: 'Video Editing', d: 'Premiere Pro, After Effects, CapCut — YouTube, reels, professional video production.', a: '#a21caf' },
                { icon: '✏️', t: 'Motion Graphics', d: 'Animated explainer videos, UI animations, Lottie files & visual effects.', a: '#86198f' },
              ].map((f, i) => (
                <Reveal key={i} delay={i * 60}>
                  <Tilt intensity={8}>
                    <div className="relative p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] hover:border-white/[0.1] transition-all duration-500 group overflow-hidden h-full">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(400px circle at 50% 0%, ${f.a}08, transparent 60%)` }} />
                      <span className="text-2xl mb-3 block group-hover:scale-110 transition-transform">{f.icon}</span>
                      <h4 className="text-[13px] font-bold text-white mb-1">{f.t}</h4>
                      <p className="text-[11px] text-white/25 leading-relaxed">{f.d}</p>
                    </div>
                  </Tilt>
                </Reveal>
              ))}
            </div>
          </Reveal>

          {/* ═══ CONTENT & CREATIVE ═══ */}
          <Reveal className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-lime-500 to-green-500 rounded-lg flex items-center justify-center text-sm shadow-lg shadow-lime-500/20">✍️</div>
              <h3 className="text-lg font-bold text-white">Content & Creative</h3>
              <div className="flex-1 h-[1px] bg-white/[0.04]" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: '✍️', t: 'Content Writing', d: 'Blog writing, SEO content, copywriting, technical writing & editing skills.', a: '#84cc16' },
                { icon: '📝', t: 'Copywriting', d: 'Ad copy, sales pages, email sequences, persuasion psychology & A/B testing.', a: '#65a30d' },
                { icon: '🎙️', t: 'Podcasting', d: 'Audio editing, interview techniques, distribution, monetization & audience building.', a: '#4d7c0f' },
                { icon: '📸', t: 'Photography', d: 'Product photography, portrait editing, Lightroom, composition & visual storytelling.', a: '#3f6212' },
              ].map((f, i) => (
                <Reveal key={i} delay={i * 60}>
                  <Tilt intensity={8}>
                    <div className="relative p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] hover:border-white/[0.1] transition-all duration-500 group overflow-hidden h-full">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(400px circle at 50% 0%, ${f.a}08, transparent 60%)` }} />
                      <span className="text-2xl mb-3 block group-hover:scale-110 transition-transform">{f.icon}</span>
                      <h4 className="text-[13px] font-bold text-white mb-1">{f.t}</h4>
                      <p className="text-[11px] text-white/25 leading-relaxed">{f.d}</p>
                    </div>
                  </Tilt>
                </Reveal>
              ))}
            </div>
          </Reveal>

          {/* ═══ FINANCE & BUSINESS ═══ */}
          <Reveal className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center text-sm shadow-lg shadow-emerald-500/20">💰</div>
              <h3 className="text-lg font-bold text-white">Finance & Business</h3>
              <div className="flex-1 h-[1px] bg-white/[0.04]" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: '💰', t: 'Financial Modeling', d: 'Excel financial models, DCF valuation, P&L analysis, budgeting & forecasting.', a: '#10b981' },
                { icon: '📈', t: 'Stock Market', d: 'Technical analysis, fundamental analysis, portfolio management & trading strategies.', a: '#059669' },
                { icon: '🏦', t: 'Investment Banking', d: 'M&A, IPOs, equity research, financial statements analysis & valuation methods.', a: '#047857' },
                { icon: '📊', t: 'Business Analytics', d: 'KPI tracking, business intelligence, data-driven决策 & performance dashboards.', a: '#065f46' },
              ].map((f, i) => (
                <Reveal key={i} delay={i * 60}>
                  <Tilt intensity={8}>
                    <div className="relative p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] hover:border-white/[0.1] transition-all duration-500 group overflow-hidden h-full">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(400px circle at 50% 0%, ${f.a}08, transparent 60%)` }} />
                      <span className="text-2xl mb-3 block group-hover:scale-110 transition-transform">{f.icon}</span>
                      <h4 className="text-[13px] font-bold text-white mb-1">{f.t}</h4>
                      <p className="text-[11px] text-white/25 leading-relaxed">{f.d}</p>
                    </div>
                  </Tilt>
                </Reveal>
              ))}
            </div>
          </Reveal>

          {/* ═══ ENTREPRENEURSHIP & STARTUP ═══ */}
          <Reveal className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center text-sm shadow-lg shadow-yellow-500/20">🚀</div>
              <h3 className="text-lg font-bold text-white">Entrepreneurship & Startup</h3>
              <div className="flex-1 h-[1px] bg-white/[0.04]" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: '🚀', t: 'Startup Guidance', d: 'Idea validation, MVP building, lean startup methodology & product-market fit.', a: '#eab308' },
                { icon: '💵', t: 'Fundraising', d: 'Pitch decks, investor relations, VC funding, angel investment & grant applications.', a: '#ca8a04' },
                { icon: '📋', t: 'Business Planning', d: 'Business model canvas, revenue models, competitive analysis & scaling strategies.', a: '#a16207' },
                { icon: '🤝', t: 'Networking', d: 'Professional networking, LinkedIn optimization, mentor connections & industry events.', a: '#854d0e' },
              ].map((f, i) => (
                <Reveal key={i} delay={i * 60}>
                  <Tilt intensity={8}>
                    <div className="relative p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] hover:border-white/[0.1] transition-all duration-500 group overflow-hidden h-full">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(400px circle at 50% 0%, ${f.a}08, transparent 60%)` }} />
                      <span className="text-2xl mb-3 block group-hover:scale-110 transition-transform">{f.icon}</span>
                      <h4 className="text-[13px] font-bold text-white mb-1">{f.t}</h4>
                      <p className="text-[11px] text-white/25 leading-relaxed">{f.d}</p>
                    </div>
                  </Tilt>
                </Reveal>
              ))}
            </div>
          </Reveal>

          {/* ═══ PRODUCTIVITY & TOOLS ═══ */}
          <Reveal className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-zinc-400 to-gray-500 rounded-lg flex items-center justify-center text-sm shadow-lg shadow-gray-500/20">⚡</div>
              <h3 className="text-lg font-bold text-white">Productivity & Professional Tools</h3>
              <div className="flex-1 h-[1px] bg-white/[0.04]" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: '📑', t: 'Advanced Excel', d: 'Macros, VBA, Power Query, complex formulas, automation & business intelligence.', a: '#71717a' },
                { icon: '📊', t: 'Power BI & Tableau', d: 'End-to-end data visualization — from raw data to interactive executive dashboards.', a: '#52525b' },
                { icon: '📋', t: 'Project Management', d: 'Agile, Scrum, Kanban, Jira, Trello — manage teams & deliver projects on time.', a: '#404040' },
                { icon: '⏰', t: 'Time Management', d: 'Pomodoro, time blocking, priority matrices, productivity systems & habit building.', a: '#333333' },
              ].map((f, i) => (
                <Reveal key={i} delay={i * 60}>
                  <Tilt intensity={8}>
                    <div className="relative p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] hover:border-white/[0.1] transition-all duration-500 group overflow-hidden h-full">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(400px circle at 50% 0%, ${f.a}08, transparent 60%)` }} />
                      <span className="text-2xl mb-3 block group-hover:scale-110 transition-transform">{f.icon}</span>
                      <h4 className="text-[13px] font-bold text-white mb-1">{f.t}</h4>
                      <p className="text-[11px] text-white/25 leading-relaxed">{f.d}</p>
                    </div>
                  </Tilt>
                </Reveal>
              ))}
            </div>
          </Reveal>

          {/* ═══ CYBERSECURITY & BLOCKCHAIN ═══ */}
          <Reveal className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg flex items-center justify-center text-sm shadow-lg shadow-red-500/20">🔒</div>
              <h3 className="text-lg font-bold text-white">Cybersecurity & Emerging Tech</h3>
              <div className="flex-1 h-[1px] bg-white/[0.04]" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: '🔒', t: 'Cyber Security', d: 'Ethical hacking, network security, penetration testing & security audit fundamentals.', a: '#ef4444' },
                { icon: '⛓️', t: 'Blockchain & Web3', d: 'Smart contracts, Solidity, DeFi, NFTs & decentralized application development.', a: '#dc2626' },
                { icon: '🤖', t: 'IoT & Embedded', d: 'Arduino, Raspberry Pi, sensor networks, edge computing & IoT project building.', a: '#b91c1c' },
                { icon: '🔮', t: 'AR/VR Development', d: 'Unity 3D, augmented reality apps, virtual reality experiences & immersive design.', a: '#991b1b' },
              ].map((f, i) => (
                <Reveal key={i} delay={i * 60}>
                  <Tilt intensity={8}>
                    <div className="relative p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] hover:border-white/[0.1] transition-all duration-500 group overflow-hidden h-full">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(400px circle at 50% 0%, ${f.a}08, transparent 60%)` }} />
                      <span className="text-2xl mb-3 block group-hover:scale-110 transition-transform">{f.icon}</span>
                      <h4 className="text-[13px] font-bold text-white mb-1">{f.t}</h4>
                      <p className="text-[11px] text-white/25 leading-relaxed">{f.d}</p>
                    </div>
                  </Tilt>
                </Reveal>
              ))}
            </div>
          </Reveal>

        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" className="py-24 sm:py-32 lg:py-36 bg-[#06060f] relative">
        <div className="absolute w-[400px] h-[400px] top-20 right-0 opacity-8" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)', filter: 'blur(60px)', animation: 'orbMove 18s ease-in-out 2s infinite' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Reveal className="text-center mb-14 sm:mb-16">
            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-violet-400/80 uppercase tracking-[0.25em] bg-violet-500/[0.06] border border-violet-500/15 px-3 py-1 rounded-full mb-4">Process</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3 tracking-tight">How It Works</h2>
            <p className="text-white/25 max-w-lg mx-auto text-sm">Start your career journey in minutes.</p>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            <div className="hidden lg:block absolute top-[42px] left-[12%] right-[12%] h-[1px] bg-white/[0.04] overflow-hidden">
              <div className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-violet-500/30 via-blue-500/30 to-emerald-500/30" style={{ animation: 'shimmer 5s ease-in-out infinite' }} />
            </div>
            {[
              { n: '01', i: '✨', t: 'Sign Up Free', d: 'Create your account in 30 seconds.' },
              { n: '02', i: '📝', t: 'Quick Assessment', d: 'Tell us about your interests & goals.' },
              { n: '03', i: '🧠', t: 'AI Recommends', d: 'Our AI finds the best career paths.' },
              { n: '04', i: '🚀', t: 'Follow Roadmap', d: 'Start your personalized journey.' },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 120} className="relative text-center group">
                <div className="relative z-10 w-14 h-14 bg-white/[0.03] border border-white/[0.06] group-hover:border-white/[0.15] rounded-xl flex items-center justify-center text-2xl mx-auto mb-4 group-hover:scale-110 transition-all duration-500">{s.i}</div>
                <div className="bg-white/[0.015] border border-white/[0.04] rounded-xl p-5 group-hover:bg-white/[0.03] transition-all duration-500">
                  <span className="text-[9px] font-bold text-white/25 tracking-[0.3em] uppercase">Step {s.n}</span>
                  <h3 className="text-sm font-bold text-white mt-1 mb-1">{s.t}</h3>
                  <p className="text-[12px] text-white/25">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ROLES ═══ */}
      <section id="roles" className="py-24 sm:py-32 lg:py-36 bg-[#080818] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Reveal className="text-center mb-14 sm:mb-16">
            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-emerald-400/80 uppercase tracking-[0.25em] bg-emerald-500/[0.06] border border-emerald-500/15 px-3 py-1 rounded-full mb-4">For Everyone</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3 tracking-tight">Choose Your Role</h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { i: '🎓', t: 'Student', d: 'Explore careers, get AI recommendations, follow personalized roadmaps, and prepare for your dream job.', g: 'from-blue-600 to-indigo-600', a: '#6366f1' },
              { i: '👨‍👩‍👧', t: 'Parent', d: "Track your child's career journey, monitor their progress, and stay involved in their career decisions.", g: 'from-emerald-600 to-teal-600', a: '#10b981' },
              { i: '🧑‍🏫', t: 'Mentor', d: 'Guide students, track their progress, provide feedback, and help shape the next generation.', g: 'from-violet-600 to-purple-600', a: '#8b5cf6' },
            ].map((r, i) => (
              <Reveal key={i} delay={i * 120}>
                <Tilt intensity={8}>
                  <div className="relative bg-white/[0.015] border border-white/[0.04] hover:border-white/[0.1] rounded-2xl text-center transition-all duration-500 group overflow-hidden h-full">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(400px circle at 50% 20%, ${r.a}10, transparent 60%)` }} />
                    <div className="relative p-8 sm:p-9">
                      <span className="text-5xl mb-5 block group-hover:scale-110 transition-transform duration-500">{r.i}</span>
                      <h3 className="text-xl font-extrabold text-white mb-2">{r.t}</h3>
                      <p className="text-[13px] text-white/30 leading-relaxed mb-6">{r.d}</p>
                      <Link to="/register"
                        className={`inline-flex items-center gap-2 bg-gradient-to-r ${r.g} text-white px-7 py-3 rounded-xl font-bold text-[13px] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group/btn`}>
                        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                        <span className="relative">Join as {r.t}</span>
                        <svg className="w-3.5 h-3.5 relative" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                      </Link>
                    </div>
                  </div>
                </Tilt>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section id="testimonials" className="py-24 sm:py-32 lg:py-36 bg-[#06060f] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Reveal className="text-center mb-14 sm:mb-16">
            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-amber-400/80 uppercase tracking-[0.25em] bg-amber-500/[0.06] border border-amber-500/15 px-3 py-1 rounded-full mb-4">Testimonials</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3 tracking-tight">Loved by Thousands</h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { n: 'Priya Sharma', r: 'Class 12 Student', t: 'Mera Raasta helped me discover my passion for Data Science. The personalized roadmap made everything so clear and actionable!', c: photos[0].src, a: '#6366f1' },
              { n: 'Rajesh Kumar', r: 'Parent', t: "As a parent, I can finally track my daughter's career progress. The parent dashboard is incredibly useful and easy to use.", c: photos[2].src, a: '#10b981' },
              { n: 'Anita Devi', r: 'Career Mentor', t: 'The mentor tools help me guide multiple students effectively. I can track their progress and provide timely advice.', c: photos[5].src, a: '#8b5cf6' },
            ].map((t, i) => (
              <Reveal key={i} delay={i * 120}>
                <Tilt intensity={6}>
                  <div className="relative bg-white/[0.015] border border-white/[0.04] hover:border-white/[0.1] rounded-2xl transition-all duration-500 group overflow-hidden h-full">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(400px circle at 50% 0%, ${t.a}08, transparent 60%)` }} />
                    <div className="relative p-6">
                      <div className="flex gap-0.5 mb-3">
                        {[1, 2, 3, 4, 5].map(s => <svg key={s} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
                      </div>
                      <p className="text-white/40 text-[13px] leading-relaxed mb-5">"{t.t}"</p>
                      <div className="flex items-center gap-3 pt-4 border-t border-white/[0.04]">
                        <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10">
                          <img src={t.c} alt={t.n} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-white/80">{t.n}</p>
                          <p className="text-[10px] text-white/25">{t.r}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Tilt>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-24 sm:py-32 lg:py-36 bg-[#080818] relative overflow-hidden">
        <div className="absolute w-[500px] h-[500px] -top-40 left-1/4 opacity-12" style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)', filter: 'blur(60px)', animation: 'orbMove 15s ease-in-out infinite' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Reveal>
            <div className="relative rounded-3xl overflow-hidden border border-white/[0.04]" style={{ background: 'linear-gradient(135deg, #0a0a28, #12103a, #0a0a28)' }}>
              <Particles count={20} />
              <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
              <div className="relative z-10 p-12 sm:p-16 lg:p-20 text-center">
                <Reveal delay={100}>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4 tracking-tight">Ready to Find Your Path?</h2>
                </Reveal>
                <Reveal delay={200}>
                  <p className="text-white/30 text-sm mb-10 max-w-md mx-auto">Join 10,000+ students who have already discovered their perfect career.</p>
                </Reveal>
                <Reveal delay={300}>
                  <Btn to="/register" primary>
                    Get Started Free
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </Btn>
                </Reveal>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-[#06060f] border-t border-white/[0.03]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            <div className="col-span-2 md:col-span-4 lg:col-span-1">
              <Logo size="default" />
              <p className="text-[12px] text-white/20 leading-relaxed mt-3">India's smartest career guidance platform.</p>
            </div>
            {[
              { t: 'Product', l: ['AI Matching', 'Roadmaps', 'Education Hub', 'Resume Builder'] },
              { t: 'For', l: ['Students', 'Parents', 'Mentors'] },
              { t: 'Company', l: ['About', 'Careers', 'Blog', 'Contact'] },
              { t: 'Support', l: ['Help Center', 'Privacy', 'Terms'] },
            ].map(c => (
              <div key={c.t}>
                <h4 className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-3">{c.t}</h4>
                <ul className="space-y-2">
                  {c.l.map(l => <li key={l}><a href="#" className="text-[12px] text-white/20 hover:text-white/50 transition-colors">{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/[0.03] mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-white/15">&copy; 2026 Mera Raasta. All rights reserved.</p>
            <div className="flex items-center gap-4">
              {['Twitter', 'GitHub', 'LinkedIn'].map(s => (
                <a key={s} href="#" className="text-[11px] text-white/15 hover:text-white/40 transition-colors">{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
