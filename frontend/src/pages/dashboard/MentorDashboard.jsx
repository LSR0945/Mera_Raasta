import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';

/* ═══ ANIMATED COUNTER ═══ */
function Counter({ end, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const step = (now) => {
          const p = Math.min((now - start) / duration, 1);
          setCount(Math.floor(p * end));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end, duration]);
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
    <div ref={ref} className={`transition-all duration-[800ms] cubic-bezier(0.16,1,0.3,1) ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>{children}</div>
  );
}

/* ═══ 3D TILT CARD ═══ */
function TiltCard({ children, className = '' }) {
  const ref = useRef(null);
  const [t, setT] = useState('');
  const move = (e) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    setT(`perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) scale(1.01)`);
  };
  return (
    <div ref={ref} className={`transition-transform duration-300 ease-out ${className}`} style={{ transform: t }}
      onMouseMove={move} onMouseLeave={() => setT('')}>{children}</div>
  );
}

/* ═══ PARTICLE FIELD ═══ */
function Particles({ count = 20 }) {
  const p = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    s: 1 + Math.random() * 2, d: 5 + Math.random() * 10, dl: Math.random() * 6,
  })), [count]);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {p.map(i => (
        <div key={i.id} className="absolute bg-white rounded-full" style={{
          left: `${i.x}%`, top: `${i.y}%`, width: i.s, height: i.s, opacity: 0.1 + Math.random() * 0.15,
          animation: `mDrift ${i.d}s ease-in-out ${i.dl}s infinite`,
        }} />
      ))}
    </div>
  );
}

/* ═══ RING PROGRESS ═══ */
function RingProgress({ value, size = 100, stroke = 6, color = '#8b5cf6', label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
            className="transition-all duration-[2000ms] ease-out" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-black text-white">{value}%</span>
        </div>
      </div>
      {label && <span className="text-[10px] text-white/30 font-medium">{label}</span>}
    </div>
  );
}

/* ═══ MAIN ═══ */
export default function MentorDashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    api.get('/mentor/students').then(({ data }) => setStudents(data.data.students || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const m = (e) => setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    window.addEventListener('mousemove', m, { passive: true });
    return () => window.removeEventListener('mousemove', m);
  }, []);

  const avgProgress = students.length ? Math.round(students.reduce((a, s) => a + (s.progress || 0), 0) / students.length) : 0;
  const activeStudents = students.filter(s => (s.progress || 0) > 0).length;
  const topStudents = [...students].sort((a, b) => (b.progress || 0) - (a.progress || 0)).slice(0, 6);
  const completedStudents = students.filter(s => (s.progress || 0) >= 80).length;
  const needsHelp = students.filter(s => (s.progress || 0) > 0 && (s.progress || 0) < 25).length;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center" style={{ animation: 'fadeInUp 0.6s ease' }}>
        <div className="w-20 h-20 bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4" style={{ animation: 'glowPulse 2s ease-in-out infinite' }}>🧑‍🏫</div>
        <p className="text-sm font-semibold text-white/40">Loading your mentor dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-[1400px] relative">
      <style>{`
        @keyframes mDrift { 0%,100%{transform:translateY(0) translateX(0);opacity:0.15} 25%{transform:translateY(-20px) translateX(8px);opacity:0.3} 50%{transform:translateY(-10px) translateX(-12px);opacity:0.2} 75%{transform:translateY(-30px) translateX(5px);opacity:0.25} }
        @keyframes fadeInUp { 0%{opacity:0;transform:translateY(20px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 20px rgba(139,92,246,0.1)} 50%{box-shadow:0 0 40px rgba(139,92,246,0.25)} }
        @keyframes orbMove { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-20px) scale(1.05)} 66%{transform:translate(-20px,25px) scale(0.95)} }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulseRing { 0%{transform:scale(1);opacity:0.4} 100%{transform:scale(1.8);opacity:0} }
        @keyframes checkPop { 0%{transform:scale(0)} 50%{transform:scale(1.3)} 100%{transform:scale(1)} }
        @keyframes gradShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
      `}</style>

      {/* ═══ PREMIUM HERO ═══ */}
      <Reveal>
        <div className="relative rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1035 0%, #2d1b69 40%, #1e1145 70%, #150d30 100%)' }}>
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute w-[400px] h-[400px] -top-20 -right-20 opacity-20" style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', filter: 'blur(60px)', animation: 'orbMove 14s ease-in-out infinite' }} />
            <div className="absolute w-[300px] h-[300px] -bottom-10 -left-10 opacity-15" style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)', filter: 'blur(50px)', animation: 'orbMove 12s ease-in-out 4s infinite' }} />
            <div className="absolute w-[250px] h-[250px] top-1/3 left-1/2 opacity-10" style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', filter: 'blur(40px)', animation: 'orbMove 16s ease-in-out 8s infinite' }} />
          </div>
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)', backgroundSize: '28px 28px' }} />
          <Particles count={15} />

          <div className="relative z-10 p-8 lg:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] rounded-full px-4 py-2 mb-5">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" /></span>
                <span className="text-[11px] font-semibold text-white/60">Mentor Dashboard Active</span>
              </div>
              <h1 className="text-3xl lg:text-5xl font-black text-white mb-3 leading-[1.1] tracking-tight">
                Welcome back,<br />
                <span className="bg-gradient-to-r from-violet-300 via-purple-300 to-fuchsia-300 bg-clip-text text-transparent" style={{ backgroundSize: '200% auto', animation: 'gradShift 4s ease infinite' }}>
                  {user?.name}!
                </span>
              </h1>
              <p className="text-white/35 text-base max-w-lg">Guide students, track their growth, and shape the next generation of leaders.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/dashboard/students" className="inline-flex items-center gap-2 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] text-white px-6 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/10">
                View Students
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
              <Link to="/dashboard/ai-community" className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/25">
                Messages
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ═══ STATS ═══ */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: students.length, icon: '🎓', color: 'from-blue-500/15 to-cyan-500/15', border: 'border-blue-500/10', iconBg: 'from-blue-500 to-cyan-500', sub: 'Assigned' },
          { label: 'Active Learners', value: activeStudents, icon: '🔥', color: 'from-emerald-500/15 to-teal-500/15', border: 'border-emerald-500/10', iconBg: 'from-emerald-500 to-teal-500', sub: 'In progress' },
          { label: 'Avg Progress', value: avgProgress, suffix: '%', icon: '📊', color: 'from-violet-500/15 to-purple-500/15', border: 'border-violet-500/10', iconBg: 'from-violet-500 to-purple-500', sub: 'Overall' },
          { label: 'Needs Help', value: needsHelp, icon: '⚡', color: 'from-amber-500/15 to-orange-500/15', border: 'border-amber-500/10', iconBg: 'from-amber-500 to-orange-500', sub: 'Below 25%' },
        ].map((stat, i) => (
          <Reveal key={i} delay={i * 80}>
            <TiltCard>
              <div className={`relative bg-gradient-to-br ${stat.color} border ${stat.border} rounded-2xl p-5 transition-all duration-500 group overflow-hidden cursor-default`}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(300px circle at 50% 0%, ${stat.border.includes('blue') ? '#3b82f610' : stat.border.includes('emerald') ? '#10b98110' : stat.border.includes('violet') ? '#8b5cf610' : '#f59e0b10'}, transparent 60%)` }} />
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.iconBg} rounded-xl flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform`}>{stat.icon}</div>
                  <span className="text-[9px] font-bold text-white/25 bg-white/[0.04] px-2 py-0.5 rounded-full">{stat.sub}</span>
                </div>
                <p className="text-2xl font-black text-white mb-0.5"><Counter end={stat.value} suffix={stat.suffix || ''} /></p>
                <p className="text-[11px] text-white/30 font-medium">{stat.label}</p>
              </div>
            </TiltCard>
          </Reveal>
        ))}
      </div>

      {/* ═══ MAIN GRID ═══ */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* ═══ STUDENTS LIST ═══ */}
        <Reveal delay={100} className="lg:col-span-2">
          <div className="relative bg-white/[0.02] border border-white/[0.04] rounded-3xl p-6 lg:p-8 overflow-hidden">
            <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: 'radial-gradient(400px circle at 50% 0%, #8b5cf608, transparent 60%)' }} />
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div>
                <h2 className="text-xl font-black text-white">My Students</h2>
                <p className="text-sm text-white/25 mt-1">Guide and monitor their progress</p>
              </div>
              <Link to="/dashboard/students" className="inline-flex items-center gap-2 text-sm font-bold text-violet-400 hover:text-violet-300 bg-violet-500/[0.08] hover:bg-violet-500/[0.12] px-4 py-2 rounded-xl transition-all border border-violet-500/10">
                View All
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>

            {students.length === 0 ? (
              <div className="text-center py-16 relative z-10">
                <div className="w-24 h-24 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/10 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-6" style={{ animation: 'glowPulse 3s ease-in-out infinite' }}>📚</div>
                <h3 className="text-2xl font-black text-white mb-3">No students yet</h3>
                <p className="text-white/25 mb-8 max-w-md mx-auto text-sm">Students will appear here once they are assigned to you.</p>
                <Link to="/dashboard/students" className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-8 py-3.5 rounded-2xl font-bold text-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/25">
                  View Students
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </Link>
              </div>
            ) : (
              <div className="space-y-2 relative z-10">
                {topStudents.map((student, i) => (
                  <Link key={i} to={`/dashboard/students/${student._id}`} className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-white/[0.03] transition-all duration-300 border border-transparent hover:border-white/[0.06]">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/10 rounded-xl flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform">
                        {student.name?.[0] || '?'}
                      </div>
                      {i === 0 && students.length > 1 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-[10px] shadow-lg" style={{ animation: 'checkPop 0.5s ease' }}>🏆</div>
                      )}
                      {i < 3 && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] border border-white/[0.1]"
                          style={{ background: i === 0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : i === 1 ? 'linear-gradient(135deg, #94a3b8, #64748b)' : 'linear-gradient(135deg, #b45309, #92400e)' }}>
                          {i + 1}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white truncate">{student.name}</h4>
                        {i === 0 && students.length > 1 && <span className="text-[9px] font-bold text-amber-400/80 bg-amber-500/[0.1] border border-amber-500/10 px-2 py-0.5 rounded-full">Top Performer</span>}
                      </div>
                      <p className="text-[11px] text-white/25 mt-0.5">{student.interest || 'Interest not set'} • {student.class || 'Class not set'}</p>
                    </div>
                    <div className="text-right min-w-[100px]">
                      <div className="flex items-center justify-end gap-2 mb-1.5">
                        <span className="text-sm font-bold text-white/70">{student.progress || 0}%</span>
                        {(student.progress || 0) >= 75 && <span className="text-xs">🔥</span>}
                      </div>
                      <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{
                          width: `${student.progress || 0}%`,
                          background: (student.progress || 0) >= 75 ? 'linear-gradient(90deg, #10b981, #06b6d4)' :
                            (student.progress || 0) >= 40 ? 'linear-gradient(90deg, #6366f1, #8b5cf6)' :
                            'linear-gradient(90deg, #f59e0b, #f97316)'
                        }} />
                      </div>
                    </div>
                  </Link>
                ))}
                {students.length > 6 && (
                  <Link to="/dashboard/students" className="flex items-center justify-center py-3 text-sm font-bold text-violet-400 hover:text-violet-300 hover:bg-white/[0.02] rounded-xl transition-all">
                    +{students.length - 6} more students
                  </Link>
                )}
              </div>
            )}
          </div>
        </Reveal>

        {/* ═══ RIGHT COLUMN ═══ */}
        <div className="space-y-6">

          {/* ═══ QUICK ACTIONS ═══ */}
          <Reveal delay={200}>
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-3xl p-6">
              <h2 className="text-[11px] font-bold text-white/25 uppercase tracking-widest mb-5">Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { icon: '📋', label: 'Review Assignments', desc: 'Grade & feedback', to: '/dashboard/reviews', color: 'from-blue-500/15 to-indigo-500/15', border: 'border-blue-500/10', iconBg: 'from-blue-500 to-indigo-500' },
                  { icon: '💬', label: 'Messages', desc: 'Chat with students', to: '/dashboard/ai-community', color: 'from-emerald-500/15 to-teal-500/15', border: 'border-emerald-500/10', iconBg: 'from-emerald-500 to-teal-500' },
                  { icon: '📊', label: 'Analytics', desc: 'Deep insights', to: '/dashboard/students', color: 'from-violet-500/15 to-purple-500/15', border: 'border-violet-500/10', iconBg: 'from-violet-500 to-purple-500' },
                  { icon: '📝', label: 'Create Content', desc: 'Lessons & materials', to: '/dashboard/education', color: 'from-amber-500/15 to-orange-500/15', border: 'border-amber-500/10', iconBg: 'from-amber-500 to-orange-500' },
                  { icon: '🎯', label: 'Set Goals', desc: 'Student targets', to: '/dashboard/roadmap', color: 'from-rose-500/15 to-pink-500/15', border: 'border-rose-500/10', iconBg: 'from-rose-500 to-pink-500' },
                ].map((item) => (
                  <Link key={item.to} to={item.to} className={`group flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-r ${item.color} border ${item.border} hover:bg-white/[0.04] transition-all duration-300`}>
                    <div className={`w-10 h-10 bg-gradient-to-br ${item.iconBg} rounded-lg flex items-center justify-center text-lg shadow-md group-hover:scale-110 transition-transform`}>{item.icon}</div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-white/80 block">{item.label}</span>
                      <span className="text-[10px] text-white/25">{item.desc}</span>
                    </div>
                    <svg className="w-4 h-4 text-white/15 group-hover:text-white/40 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </Link>
                ))}
              </div>
            </div>
          </Reveal>

          {/* ═══ MENTOR TIP ═══ */}
          <Reveal delay={300}>
            <div className="relative rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #2d1b69, #1e1145)' }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <div className="p-6 relative z-10">
                <div className="w-12 h-12 bg-white/[0.06] border border-white/[0.08] rounded-xl flex items-center justify-center text-2xl mb-4" style={{ animation: 'float 3s ease-in-out infinite' }}>🎯</div>
                <h3 className="text-lg font-black text-white mb-2">Mentor Tip</h3>
                <p className="text-sm text-white/30 leading-relaxed mb-5">Schedule weekly check-ins with your students. Consistent guidance helps them stay on track and builds lasting mentor-student relationships.</p>
                <div className="flex gap-2">
                  <Link to="/dashboard/students" className="inline-flex items-center gap-1.5 bg-white/[0.06] border border-white/[0.08] text-white/70 px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/[0.10] transition-all">
                    View Students
                  </Link>
                  <Link to="/dashboard/ai-community" className="inline-flex items-center gap-1.5 bg-white/[0.06] border border-white/[0.08] text-white/70 px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/[0.10] transition-all">
                    Messages
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>

          {/* ═══ PROGRESS OVERVIEW ═══ */}
          <Reveal delay={400}>
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-3xl p-6">
              <h2 className="text-[11px] font-bold text-white/25 uppercase tracking-widest mb-6">Progress Overview</h2>

              {/* Ring Progress */}
              <div className="flex justify-center mb-6">
                <RingProgress value={avgProgress} size={120} stroke={8} color="#8b5cf6" label="Average" />
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Excellent (>75%)', count: completedStudents, total: students.length, color: 'from-emerald-500 to-teal-500', textColor: 'text-emerald-400' },
                  { label: 'Growing (25-75%)', count: students.filter(s => (s.progress || 0) >= 25 && (s.progress || 0) < 75).length, total: students.length, color: 'from-violet-500 to-purple-500', textColor: 'text-violet-400' },
                  { label: 'Needs Help (<25%)', count: needsHelp, total: students.length, color: 'from-amber-500 to-orange-500', textColor: 'text-amber-400' },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] text-white/35 font-medium">{item.label}</span>
                      <span className={`text-[11px] font-bold ${item.textColor}`}>{item.count}/{item.total}</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-1000`}
                        style={{ width: `${item.total ? (item.count / item.total * 100) : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}