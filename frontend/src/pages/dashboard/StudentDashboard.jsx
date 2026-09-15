import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';

/* ─── Animated Counter ─── */
function AnimCounter({ end, duration = 2000, suffix = '', prefix = '' }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const step = (now) => {
          const p = Math.min((now - start) / duration, 1);
          setVal(Math.floor(p * end));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{prefix}{val}{suffix}</span>;
}

/* ─── Floating Orbs (background animation) ─── */
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="absolute rounded-full opacity-20 blur-3xl"
          style={{
            width: `${120 + i * 60}px`, height: `${120 + i * 60}px`,
            background: ['#6366f1', '#8b5cf6', '#a855f7', '#3b82f6', '#06b6d4', '#10b981'][i],
            top: `${10 + i * 12}%`, left: `${5 + i * 15}%`,
            animation: `float${i % 3} ${6 + i * 2}s ease-in-out infinite`,
          }} />
      ))}
    </div>
  );
}

/* ─── SVG Ring Progress ─── */
function RingProgress({ value, size = 120, stroke = 8, color = '#6366f1', label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="-rotate-90 drop-shadow-lg">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-[2000ms] ease-out" style={{ filter: `drop-shadow(0 0 6px ${color}66)` }} />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-2xl font-extrabold text-white">{value}%</span>
      </div>
      {label && <span className="text-xs font-semibold text-white/60">{label}</span>}
    </div>
  );
}

/* ─── Glass Card ─── */
function Glass({ children, className = '', delay = 0 }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className={`bg-white/[0.07] backdrop-blur-xl border border-white/[0.12] rounded-3xl transition-all duration-700 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}>
      {children}
    </div>
  );
}

/* ─── Achievement Badge ─── */
function Badge({ icon, label, color, unlocked }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-500 ${unlocked ? 'bg-white/10 hover:bg-white/15 hover:scale-110 cursor-pointer' : 'bg-white/[0.03] opacity-40 grayscale'}`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${unlocked ? color : 'bg-gray-700'}`}
        style={unlocked ? { animation: 'badgePulse 2s ease-in-out infinite' } : {}}>
        {icon}
      </div>
      <span className="text-[10px] font-bold text-white/60 text-center leading-tight">{label}</span>
    </div>
  );
}

/* ─── Streak Dots ─── */
function StreakWeek({ days = [true, true, false, true, true, true, false] }) {
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <div className="flex items-center gap-2">
      {days.map((active, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500 ${active ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/30 scale-100' : 'bg-white/[0.06] text-white/30 scale-90'}`}
            style={active ? { animation: `streakPop 0.5s ease ${i * 0.1}s both` } : {}}>
            {active ? '🔥' : '·'}
          </div>
          <span className="text-[9px] text-white/40 font-medium">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Dashboard ─── */
export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFeature, setActiveFeature] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    try {
      const [nba, roadmap, recs, profile, activities] = await Promise.allSettled([
        api.get('/next-best-action'),
        api.get('/roadmap'),
        api.get('/careers/recommendations'),
        api.get('/profile'),
        api.get('/activities/me?limit=10'),
      ]);
      setData({
        nba: nba.status === 'fulfilled' ? nba.value.data.data?.nextBestAction : null,
        roadmap: roadmap.status === 'fulfilled' ? roadmap.value.data.data?.roadmap : null,
        recs: recs.status === 'fulfilled' ? recs.value.data.data?.recommendation : null,
        profile: profile.status === 'fulfilled' ? profile.value.data.data?.profile : null,
        activities: activities.status === 'fulfilled' ? activities.value.data.data?.activities || [] : [],
      });
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setInterval(() => setActiveFeature(p => (p + 1) % 5), 3000);
    return () => clearInterval(t);
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-white/10 rounded-full" />
        <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin" />
        <div className="absolute inset-2 w-16 h-16 border-4 border-transparent border-t-violet-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
      </div>
    </div>
  );

  const progress = data?.roadmap?.overallProgress || 0;
  const completed = data?.roadmap?.nodes?.filter(n => n.status === 'completed').length || 0;
  const inProgress = data?.roadmap?.nodes?.filter(n => n.status === 'in_progress').length || 0;
  const total = data?.roadmap?.nodes?.length || 0;
  const fitScore = data?.recs?.planA?.fitScores?.overall || 0;
  const greeting = currentTime.getHours() < 12 ? 'Good Morning' : currentTime.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  const features = [
    { icon: '🎯', label: 'Career AI', desc: 'AI-powered career matching', to: '/dashboard/careers/recommendations', gradient: 'from-blue-500 to-cyan-500' },
    { icon: '🗺️', label: 'Roadmap', desc: 'Your learning path', to: '/dashboard/roadmap', gradient: 'from-violet-500 to-purple-500' },
    { icon: '📚', label: 'Courses', desc: 'Top courses & colleges', to: '/dashboard/education', gradient: 'from-emerald-500 to-teal-500' },
    { icon: '🤖', label: 'AI Coach', desc: 'Chat with career AI', to: '/dashboard/ai-community', gradient: 'from-amber-500 to-orange-500' },
    { icon: '💼', label: 'Readiness', desc: 'Projects & internships', to: '/dashboard/career-readiness', gradient: 'from-pink-500 to-rose-500' },
  ];

  return (
    <>
      {/* Global keyframes */}
      <style>{`
        @keyframes float0 { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-30px) scale(1.1)} }
        @keyframes float1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-20px)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-15px,25px)} }
        @keyframes badgePulse { 0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,0.2)} 50%{box-shadow:0 0 20px 4px rgba(255,255,255,0.1)} }
        @keyframes streakPop { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes slideUp { 0%{opacity:0;transform:translateY(30px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { 0%{opacity:0} 100%{opacity:1} }
        @keyframes pulseGlow { 0%,100%{box-shadow:0 0 20px rgba(99,102,241,0.3)} 50%{box-shadow:0 0 40px rgba(99,102,241,0.6)} }
        @keyframes gradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
      `}</style>

      <div className="space-y-6 max-w-[1400px] relative">
        <FloatingOrbs />

        {/* ═══ GREETING HERO ═══ */}
        <div className="relative overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-10"
          style={{ background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 30%, #0f172a 70%, #0c0c1d 100%)', animation: 'slideUp 0.8s ease-out' }}>
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-500/20 via-violet-500/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-indigo-500/30"
                  style={{ animation: 'pulseGlow 3s ease-in-out infinite' }}>
                  {user?.name?.[0] || '?'}
                </div>
                <div>
                  <p className="text-white/50 text-sm font-medium">{greeting},</p>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">{user?.name} ✨</h1>
                </div>
              </div>
              <p className="text-white/40 text-sm ml-17 pl-0 sm:ml-[68px]">
                {currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                <span className="mx-2 text-white/20">•</span>
                <span className="text-indigo-400 font-medium">Level {Math.floor(completed / 2) + 1} Learner</span>
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              {!data?.profile?.onboardingCompleted && (
                <Link to="/dashboard/onboarding"
                  className="group relative px-6 py-3 rounded-2xl font-bold text-sm text-white overflow-hidden transition-all hover:shadow-xl hover:shadow-indigo-500/25 hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative">Complete Profile →</span>
                </Link>
              )}
              <Link to="/dashboard/roadmap"
                className="px-6 py-3 rounded-2xl font-bold text-sm text-white/80 bg-white/[0.08] border border-white/[0.1] hover:bg-white/[0.15] transition-all hover:-translate-y-0.5">
                My Roadmap →
              </Link>
            </div>
          </div>

          {/* Animated Stats Row */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            {[
              { label: 'Fit Score', value: fitScore, suffix: '%', icon: '🎯', gradient: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/20' },
              { label: 'Progress', value: progress, suffix: '%', icon: '📈', gradient: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/20' },
              { label: 'Completed', value: completed, suffix: `/${total}`, icon: '✅', gradient: 'from-violet-500/20 to-purple-500/20', border: 'border-violet-500/20' },
              { label: 'Active Steps', value: inProgress, suffix: '', icon: '⚡', gradient: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/20' },
            ].map((s, i) => (
              <div key={i} className={`bg-gradient-to-br ${s.gradient} backdrop-blur-sm rounded-2xl p-4 border ${s.border} hover:bg-white/[0.08] transition-all duration-300 hover:scale-105`}
                style={{ animation: `slideUp 0.6s ease ${i * 0.1}s both` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{s.label}</span>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-white">
                  <AnimCounter end={s.value} duration={1500} suffix={s.suffix} />
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ FEATURE CAROUSEL ═══ */}
        <Glass delay={100} className="p-1 overflow-hidden">
          <div className="relative overflow-hidden rounded-[1.7rem] p-4 sm:p-5"
            style={{ background: 'linear-gradient(135deg, #0f172a, #1e1b4b)' }}>
            <div className="flex items-center gap-3 overflow-hidden">
              {features.map((f, i) => (
                <Link key={i} to={f.to}
                  className={`flex-shrink-0 flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-500 ${activeFeature === i ? `bg-gradient-to-r ${f.gradient} text-white shadow-lg scale-105` : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white/70'}`}>
                  <span className="text-xl">{f.icon}</span>
                  <div className="text-left">
                    <p className="text-sm font-bold">{f.label}</p>
                    <p className="text-[10px] opacity-70">{f.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
            {/* Progress dots */}
            <div className="flex items-center gap-1.5 mt-3 ml-2">
              {features.map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all duration-500 ${activeFeature === i ? 'w-6 bg-white' : 'w-1.5 bg-white/20'}`} />
              ))}
            </div>
          </div>
        </Glass>

        {/* ═══ MAIN GRID ═══ */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Career Recommendation Card */}
            <Glass delay={200} className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-lg shadow-lg shadow-indigo-500/20">🎯</div>
                  <div>
                    <h2 className="text-base font-extrabold text-white">Career Recommendation</h2>
                    <p className="text-[11px] text-white/40">AI-powered match for your profile</p>
                  </div>
                </div>
                <Link to="/dashboard/careers/recommendations" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">View All →</Link>
              </div>
              {data?.recs?.planA?.career ? (
                <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6"
                  style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
                  <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-full">Plan A</span>
                        <span className="text-xs font-bold text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-full">{data.recs.planA.fitScores?.overall || 0}% Match</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-2">{data.recs.planA.career.title}</h3>
                      <p className="text-sm text-white/50 leading-relaxed line-clamp-2">{data.recs.planA.reasoning}</p>
                    </div>
                    <Link to={`/dashboard/careers/${data.recs.planA.career.slug}`}
                      className="px-5 py-2.5 rounded-xl bg-indigo-500 text-white font-bold text-sm hover:bg-indigo-600 transition-all hover:shadow-lg hover:shadow-indigo-500/25 whitespace-nowrap hover:-translate-y-0.5">
                      Explore →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <span className="text-6xl block mb-4" style={{ animation: 'float1 3s ease-in-out infinite' }}>🎯</span>
                  <p className="text-white/50 text-sm mb-4">Complete onboarding to unlock AI career recommendations</p>
                  <Link to="/dashboard/onboarding" className="inline-block bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-600 transition-all hover:shadow-lg hover:shadow-indigo-500/25">
                    Start Onboarding →
                  </Link>
                </div>
              )}
            </Glass>

            {/* Roadmap Card */}
            <Glass delay={300} className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-lg shadow-lg shadow-violet-500/20">🗺️</div>
                  <div>
                    <h2 className="text-base font-extrabold text-white">My Roadmap</h2>
                    <p className="text-[11px] text-white/40">{data?.roadmap?.title || 'No roadmap yet'}</p>
                  </div>
                </div>
                <Link to="/dashboard/roadmap" className="text-xs font-semibold text-violet-400 hover:text-violet-300">Open →</Link>
              </div>
              {data?.roadmap ? (
                <div className="space-y-6">
                  {/* Progress Ring + Stats */}
                  <div className="flex items-center gap-8">
                    <div className="relative flex-shrink-0">
                      <RingProgress value={progress} size={110} stroke={7} color="#8b5cf6" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Done', value: completed, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                          { label: 'Active', value: inProgress, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                          { label: 'Left', value: total - completed - inProgress, color: 'text-white/40', bg: 'bg-white/5' },
                        ].map((s, i) => (
                          <div key={i} className={`${s.bg} rounded-xl p-3 text-center`}>
                            <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
                            <p className="text-[10px] text-white/40 font-medium">{s.label}</p>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-white/40">Overall Progress</span>
                          <span className="font-bold text-violet-400">{progress}%</span>
                        </div>
                        <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-[2000ms] ease-out"
                            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #8b5cf6, #a855f7, #c084fc)' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Steps Timeline */}
                  <div className="space-y-2">
                    {data.roadmap.nodes?.slice(0, 5).map((node, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${node.status === 'completed' ? 'bg-emerald-500/10 border border-emerald-500/20' : node.status === 'in_progress' ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-white/[0.03] border border-white/[0.05]'}`}
                        style={{ animation: `slideUp 0.4s ease ${i * 0.08}s both` }}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${node.status === 'completed' ? 'bg-emerald-500 text-white' : node.status === 'in_progress' ? 'bg-blue-500 text-white animate-pulse' : 'bg-white/10 text-white/40'}`}>
                          {node.status === 'completed' ? '✓' : i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{node.title}</p>
                          <p className="text-[10px] text-white/30">{node.description}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${node.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : node.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/30'}`}>
                          {node.status === 'completed' ? 'Done' : node.status === 'in_progress' ? 'Active' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="text-5xl block mb-3">🗺️</span>
                  <p className="text-white/50 text-sm mb-4">Create your personalized career roadmap</p>
                  <Link to="/dashboard/roadmap" className="inline-block bg-violet-500 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-violet-600 transition-all hover:shadow-lg hover:shadow-violet-500/25">
                    Create Roadmap →
                  </Link>
                </div>
              )}
            </Glass>

            {/* Activity Feed */}
            <Glass delay={400} className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-lg shadow-lg shadow-cyan-500/20">📋</div>
                <div>
                  <h2 className="text-base font-extrabold text-white">Recent Activity</h2>
                  <p className="text-[11px] text-white/40">Your latest actions</p>
                </div>
              </div>
              {data?.activities?.length > 0 ? (
                <div className="space-y-2">
                  {data.activities.slice(0, 5).map((act, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-all"
                      style={{ animation: `slideUp 0.3s ease ${i * 0.05}s both` }}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${act.category === 'login' ? 'bg-emerald-500/20 text-emerald-400' : act.category === 'roadmap' ? 'bg-violet-500/20 text-violet-400' : act.category === 'career' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white/40'}`}>
                        {act.category === 'login' ? '🔑' : act.category === 'roadmap' ? '🗺️' : act.category === 'career' ? '💼' : '⚙️'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{act.action}</p>
                      </div>
                      <span className="text-[10px] text-white/30 flex-shrink-0">{new Date(act.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/30 text-sm text-center py-4">No activity yet</p>
              )}
            </Glass>
          </div>

          {/* Right Column */}
          <div className="space-y-6">

            {/* Quick Actions Grid */}
            <Glass delay={200} className="p-5">
              <h2 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: '🎯', label: 'Careers', to: '/dashboard/careers', gradient: 'from-blue-500 to-cyan-500' },
                  { icon: '📚', label: 'Education', to: '/dashboard/education', gradient: 'from-emerald-500 to-teal-500' },
                  { icon: '🤖', label: 'AI Coach', to: '/dashboard/ai-community', gradient: 'from-violet-500 to-purple-500' },
                  { icon: '📄', label: 'Resume', to: '/dashboard/resume-interview', gradient: 'from-amber-500 to-orange-500' },
                  { icon: '🗺️', label: 'Roadmap', to: '/dashboard/roadmap', gradient: 'from-pink-500 to-rose-500' },
                  { icon: '📊', label: 'Compare', to: '/dashboard/careers/compare', gradient: 'from-indigo-500 to-blue-500' },
                ].map((item, i) => (
                  <Link key={i} to={item.to}
                    className="group relative overflow-hidden p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.15] transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    style={{ animation: `slideUp 0.4s ease ${i * 0.05}s both` }}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                    <span className="text-2xl block mb-1 group-hover:scale-110 transition-transform duration-300">{item.icon}</span>
                    <span className="text-xs font-bold text-white/60 group-hover:text-white transition-colors">{item.label}</span>
                  </Link>
                ))}
              </div>
            </Glass>

            {/* Streak Card */}
            <Glass delay={250} className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🔥</span>
                <h2 className="text-sm font-bold text-white/40 uppercase tracking-wider">Weekly Streak</h2>
              </div>
              <div className="text-center mb-4">
                <p className="text-4xl font-extrabold text-white"><AnimCounter end={5} duration={1000} /></p>
                <p className="text-xs text-white/40 mt-1">day streak this week</p>
              </div>
              <StreakWeek />
            </Glass>

            {/* Achievements */}
            <Glass delay={300} className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🏆</span>
                <h2 className="text-sm font-bold text-white/40 uppercase tracking-wider">Achievements</h2>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                <Badge icon="🌟" label="First Login" color="bg-amber-500" unlocked={true} />
                <Badge icon="📝" label="Profile Done" color="bg-blue-500" unlocked={!!data?.profile?.onboardingCompleted} />
                <Badge icon="🎯" label="Career Pick" color="bg-violet-500" unlocked={!!data?.recs} />
                <Badge icon="🗺️" label="Roadmap" color="bg-emerald-500" unlocked={!!data?.roadmap} />
                <Badge icon="⚡" label="Quick Start" color="bg-cyan-500" unlocked={completed >= 1} />
                <Badge icon="🔥" label="5-Day Streak" color="bg-orange-500" unlocked={true} />
                <Badge icon="💎" label="Pro Learner" color="bg-pink-500" unlocked={completed >= 3} />
                <Badge icon="👑" label="Champion" color="bg-yellow-500" unlocked={progress >= 80} />
              </div>
            </Glass>

            {/* Motivational Quote */}
            <Glass delay={350} className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-transparent" />
              <div className="absolute -bottom-4 -right-4 text-[120px] opacity-10 select-none">💡</div>
              <div className="relative z-10">
                <span className="text-3xl block mb-3">💡</span>
                <p className="text-sm text-white/70 leading-relaxed italic mb-3">"The future belongs to those who learn more skills and combine them in creative ways."</p>
                <p className="text-xs text-white/40 font-medium">— Robert Greene</p>
              </div>
            </Glass>

            {/* Profile Completion */}
            <Glass delay={400} className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">📊</span>
                <h2 className="text-sm font-bold text-white/40 uppercase tracking-wider">Profile Strength</h2>
              </div>
              {(() => {
                let filled = 0, total2 = 8;
                if (data?.profile?.educationLevel) filled++;
                if (data?.profile?.interests?.length) filled++;
                if (data?.profile?.skills?.length) filled++;
                if (data?.profile?.careerGoals?.dreamJob) filled++;
                if (data?.profile?.budget) filled++;
                if (data?.profile?.location?.city) filled++;
                if (data?.roadmap) filled++;
                if (data?.profile?.onboardingCompleted) filled++;
                const pct = Math.round((filled / total2) * 100);
                return (
                  <div>
                    <div className="flex items-end justify-between mb-2">
                      <span className="text-2xl font-extrabold text-white">{pct}%</span>
                      <span className="text-xs text-white/40">{filled}/{total2} sections</span>
                    </div>
                    <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden mb-3">
                      <div className="h-full rounded-full transition-all duration-[2000ms]" style={{ width: `${pct}%`, background: pct >= 70 ? 'linear-gradient(90deg, #10b981, #34d399)' : pct >= 40 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #ef4444, #f87171)' }} />
                    </div>
                    {pct < 100 && (
                      <Link to="/dashboard/profile" className="block text-center text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20">
                        Complete Profile →
                      </Link>
                    )}
                  </div>
                );
              })()}
            </Glass>
          </div>
        </div>
      </div>
    </>
  );
}
