import { useState, useEffect, useRef } from 'react';
import { roadmapAPI } from '../../api/roadmap';
import { useLanguage } from '../../contexts/LanguageContext';
import toast from 'react-hot-toast';
import BackButton from '../../components/common/BackButton';

// ═══ STEP ICONS — Har step type ka icon ═══
const STEP_ICONS = { setup: '⚙️', education: '📖', course: '🎓', project: '🔨', skill: '⚡', interview: '🎤', resume: '📄', internship: '💼', job: '🚀', practice: '🏋️', application: '📮', milestone: '🏁', general: '📌' };

// ═══ DIFFICULTY BADGES — Difficulty ke liye colors ═══
const DIFFICULTY_badges = { easy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30', hard: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };

// ═══ CountUp Component — Number animate karo ═══
function CountUp({ target, suffix = '' }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    let start = 0;
    const step = Math.max(1, Math.floor(target / 30));
    const timer = setInterval(() => { start += step; if (start >= target) { setVal(target); clearInterval(timer); } else setVal(start); }, 30);
    return () => clearInterval(timer);
  }, [target]);
  return <>{val}{suffix}</>;
}

// ═══ Particles Component — Background mein floating dots ═══
function Particles({ count = 20 }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
    size: Math.random() * 4 + 1, delay: Math.random() * 5, duration: Math.random() * 10 + 10,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div key={p.id} className="absolute rounded-full bg-white/10"
          style={{ left: p.left, top: p.top, width: p.size, height: p.size, animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite` }} />
      ))}
    </div>
  );
}

// ═══ MilestonePopup — Jab milestone pahuncho to celebration dikhe ═══
function MilestonePopup({ milestone }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10 rounded-3xl p-10 text-center max-w-sm mx-4 animate-bounce-in shadow-2xl shadow-amber-500/20">
        <div className="text-7xl mb-4">🎉</div>
        <h3 className="text-2xl font-extrabold text-white mb-2">Milestone Reached!</h3>
        <p className="text-amber-400 text-lg font-bold">{milestone.percent}% Complete</p>
        <p className="text-gray-400 text-sm mt-2">Keep going — you're doing amazing!</p>
      </div>
    </div>
  );
}

// ═══ MAIN ROADMAP PAGE ═══
// Ab user ko career select nahi karna — roadmap apne aap ban jayega
// User sirf "Generate" button dabaye — baaki sab auto hota hai
export default function RoadmapPage() {
  const { t } = useLanguage();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [expandedNode, setExpandedNode] = useState(null);
  const [showMilestone, setShowMilestone] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const timelineRef = useRef(null);

  // ═══ useEffect — Page load pe roadmap lao ═══
  useEffect(() => { loadRoadmap(); }, []);

  // ═══ loadRoadmap — Current user ka roadmap fetch karo ═══
  const loadRoadmap = async () => {
    setLoading(true);
    try {
      const res = await roadmapAPI.get();
      if (res.data?.data?.roadmap) setRoadmap(res.data.data.roadmap);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  // ═══ handleCreate — Roadmap auto-generate karo ═══
  // User sirf button dabaye — baaki sab backend pe hota hai
  // Backend user ki profile dekh ke career auto-detect karega
  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await roadmapAPI.create({});  // careerId nahi bhej rahe — auto-detect hoga
      if (res.data?.data?.roadmap) { toast.success('Your personalized roadmap is ready!'); setRoadmap(res.data.data.roadmap); }
      else toast.error('Failed to create roadmap');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create roadmap'); } finally { setCreating(false); }
  };

  // ═══ handleUpdateNode — Step ka status update karo ═══
  const handleUpdateNode = async (nodeId, newStatus) => {
    try {
      const progress = newStatus === 'completed' ? 100 : newStatus === 'in_progress' ? 50 : 0;
      await roadmapAPI.updateNode(nodeId, { status: newStatus, progress });
      const { data } = await roadmapAPI.get();
      const updatedRoadmap = data.data.roadmap;
      setRoadmap(updatedRoadmap);
      // Milestone check
      const prevProgress = roadmap?.overallProgress || 0;
      if (updatedRoadmap.overallProgress > prevProgress) {
        const newMilestone = updatedRoadmap.milestones?.find(m => m.reached && m.percent === updatedRoadmap.overallProgress);
        if (newMilestone) { setShowMilestone(newMilestone); setTimeout(() => setShowMilestone(null), 3000); }
      }
      toast.success(newStatus === 'completed' ? 'Completed! Great job!' : newStatus === 'in_progress' ? 'Started! Keep going!' : 'Step reset');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  // ═══ LOADING STATE ═══
  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 animate-pulse shadow-xl shadow-blue-500/30">🗺️</div>
        <p className="text-sm font-semibold text-gray-400 animate-pulse">Loading your roadmap...</p>
      </div>
    </div>
  );

  // ═══ NO ROADMAP — Generate Screen ═══
  // Agar user ka roadmap nahi hai to sirf Generate button dikhe
  // User ki profile se career auto-detect hoga — koi selection nahi
  if (!roadmap) return (
    <div className="max-w-4xl mx-auto space-y-8">
      {showMilestone && <MilestonePopup milestone={showMilestone} />}
      <BackButton to="/dashboard" label={t('backToDashboard') || 'Back to Dashboard'} />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 rounded-3xl p-8 lg:p-12 text-white overflow-hidden">
        <Particles count={25} />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 bg-white/15 backdrop-blur-sm rounded-3xl flex items-center justify-center text-5xl mx-auto mb-6 border border-white/20 shadow-xl">🗺️</div>
          <h1 className="text-3xl lg:text-5xl font-extrabold mb-3 tracking-tight">Your Career Roadmap</h1>
          <p className="text-blue-100/80 text-lg max-w-xl mx-auto">
            We'll analyze your <span className="text-white font-bold">education, interests, and skills</span> to create a personalized step-by-step career path — just for you.
          </p>
        </div>
      </div>

      {/* Generate Button — Single button, no career selection */}
      <div className="bg-gray-900/50 backdrop-blur-xl rounded-3xl border border-white/5 p-8 lg:p-12 text-center">
        <div className="text-6xl mb-6">✨</div>
        <h2 className="text-2xl font-extrabold text-white mb-3">Ready to Start Your Journey?</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Click below and we'll create a personalized roadmap based on your profile — your education, interests, skills, and goals.
        </p>
        <button onClick={handleCreate} disabled={creating}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-5 rounded-2xl font-bold text-base hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 transition-all shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:-translate-y-0.5 flex items-center justify-center gap-3 mx-auto">
          {creating ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
              Creating Your Personalized Roadmap...
            </>
          ) : (
            <>
              <span className="text-xl">🚀</span>
              Generate My Roadmap
            </>
          )}
        </button>
        <p className="text-xs text-gray-500 mt-4">Based on your profile • Personalized for you • Free forever</p>
      </div>
    </div>
  );

  // ═══ ROADMAP EXISTS — Timeline View ═══
  const nodes = roadmap.nodes || [];
  const completed = nodes.filter(n => n.status === 'completed').length;
  const inProgress = nodes.filter(n => n.status === 'in_progress').length;
  const filters = ['all', 'learning', 'project', 'practice', 'interview', 'application'];
  const filteredNodes = activeFilter === 'all' ? nodes : nodes.filter(n => n.category === activeFilter);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {showMilestone && <MilestonePopup milestone={showMilestone} />}
      <BackButton to="/dashboard" label={t('backToDashboard') || 'Back to Dashboard'} />

      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-700 rounded-3xl p-8 lg:p-10 text-white overflow-hidden">
        <Particles count={20} />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4 border border-white/20">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span></span>
              <span className="text-xs font-semibold">Active Roadmap</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold mb-2 tracking-tight">{roadmap.title}</h1>
            <p className="text-purple-100/80 text-sm">{roadmap.description}</p>
          </div>
          <button onClick={() => setRoadmap(null)} className="bg-white/15 backdrop-blur-sm border border-white/20 text-white px-5 py-2.5 rounded-2xl text-sm font-bold hover:bg-white/25 transition-all shrink-0">
            New Roadmap
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Steps', value: nodes.length, icon: '📍', gradient: 'from-gray-500 to-gray-600' },
          { label: 'Completed', value: completed, icon: '✅', gradient: 'from-emerald-500 to-teal-500' },
          { label: 'In Progress', value: inProgress, icon: '🔄', gradient: 'from-blue-500 to-indigo-500' },
          { label: 'Progress', value: roadmap.overallProgress || 0, suffix: '%', icon: '📊', gradient: 'from-violet-500 to-purple-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/5 p-5 text-center hover:border-white/15 transition-all group hover:scale-[1.02]">
            <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center text-xl mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform`}>{stat.icon}</div>
            <p className="text-2xl font-extrabold text-white">{stat.suffix ? <CountUp target={stat.value} suffix={stat.suffix} /> : <CountUp target={stat.value} />}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-900/50 backdrop-blur-xl rounded-3xl border border-white/5 p-6">
        <div className="flex justify-between mb-3">
          <span className="text-sm font-bold text-white">Overall Progress</span>
          <span className="text-sm font-bold text-purple-400">{roadmap.overallProgress || 0}%</span>
        </div>
        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${roadmap.overallProgress || 0}%` }}>
            {(roadmap.overallProgress || 0) > 0 && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />}
          </div>
        </div>
        <div className="relative mt-1">
          {[25, 50, 75, 100].map(percent => (
            <div key={percent} className="absolute -top-1" style={{ left: `${percent}%`, transform: 'translateX(-50%)' }}>
              <div className={`w-2 h-2 rounded-full ${(roadmap.overallProgress || 0) >= percent ? 'bg-purple-400 shadow-lg shadow-purple-400/50' : 'bg-white/10'}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {filters.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeFilter === f ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25' : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10 hover:text-white'
            }`}>
            {f === 'all' ? `All (${nodes.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${nodes.filter(n => n.category === f).length})`}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div ref={timelineRef} className="space-y-0 relative">
        {filteredNodes.map((node, i) => {
          const isExpanded = expandedNode === node._id;
          const isLast = i === filteredNodes.length - 1;
          const icon = STEP_ICONS[node.type] || '📌';

          const statusStyles = {
            pending: { card: 'border-white/5 bg-white/[0.02] hover:border-white/10', dot: 'bg-white/10 text-gray-500', line: 'bg-white/5', badge: 'bg-white/5 text-gray-500 border border-white/5', badgeText: 'Pending' },
            in_progress: { card: 'border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50 shadow-lg shadow-blue-500/5', dot: 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30 animate-pulse', line: 'bg-gradient-to-b from-blue-500 to-white/5', badge: 'bg-blue-500/20 text-blue-400 border border-blue-500/30', badgeText: 'In Progress' },
            completed: { card: 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50', dot: 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30', line: 'bg-gradient-to-b from-emerald-500 to-emerald-500/30', badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', badgeText: 'Completed' },
          };
          const s = statusStyles[node.status] || statusStyles.pending;

          return (
            <div key={node._id} className="relative flex gap-4 lg:gap-6" style={{ animation: `fadeSlideIn 0.5s ease ${i * 0.08}s both` }}>
              {/* Timeline Line + Dot */}
              <div className="flex flex-col items-center">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg shadow-lg transition-all ${s.dot}`}>
                  {node.status === 'completed' ? '✓' : icon}
                </div>
                {!isLast && <div className={`w-0.5 flex-1 min-h-[40px] my-1 rounded-full ${s.line}`} />}
              </div>

              {/* Card */}
              <div className={`flex-1 mb-6 rounded-2xl border p-5 transition-all duration-300 cursor-pointer group ${s.card} hover:scale-[1.01]`}
                onClick={() => setExpandedNode(isExpanded ? null : node._id)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-gray-500 uppercase">Step {node.order}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${s.badge}`}>{s.badgeText}</span>
                      {node.difficulty && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${DIFFICULTY_badges[node.difficulty]}`}>{node.difficulty}</span>}
                      {node.estimatedDuration && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-gray-400 border border-white/5">⏱ {node.estimatedDuration}</span>}
                    </div>
                    <h3 className="font-extrabold text-white text-lg mb-1">{node.title}</h3>
                    <p className="text-sm text-gray-400 line-clamp-2">{node.description}</p>
                    {node.whyThis && <p className="text-xs text-blue-400/80 mt-2 italic">💡 {node.whyThis}</p>}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {node.status === 'pending' && (
                      <button onClick={(e) => { e.stopPropagation(); handleUpdateNode(node._id, 'in_progress'); }}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-xs font-bold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg shadow-blue-500/20 hover:shadow-xl">
                        Start
                      </button>
                    )}
                    {node.status === 'in_progress' && (
                      <button onClick={(e) => { e.stopPropagation(); handleUpdateNode(node._id, 'completed'); }}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-xs font-bold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/20 hover:shadow-xl">
                        ✓ Complete
                      </button>
                    )}
                    {node.status === 'completed' && (
                      <button onClick={(e) => { e.stopPropagation(); handleUpdateNode(node._id, 'pending'); }}
                        className="px-4 py-2 bg-white/5 text-gray-400 rounded-xl text-xs font-bold hover:bg-white/10 transition-all border border-white/5">
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-white/5 space-y-3" onClick={e => e.stopPropagation()}>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Category</span>
                        <p className="text-sm font-bold text-white capitalize mt-0.5">{node.category}</p>
                      </div>
                      <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Duration</span>
                        <p className="text-sm font-bold text-white mt-0.5">{node.estimatedDuration || 'Flexible'}</p>
                      </div>
                      <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Status</span>
                        <p className={`text-sm font-bold mt-0.5 ${node.status === 'completed' ? 'text-emerald-400' : node.status === 'in_progress' ? 'text-blue-400' : 'text-gray-400'}`}>{s.badgeText}</p>
                      </div>
                    </div>
                    {node.description && (
                      <div className="p-4 bg-white/[0.03] rounded-xl border border-white/5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">What to do</span>
                        <p className="text-sm text-gray-300 leading-relaxed">{node.description}</p>
                      </div>
                    )}
                    {node.tips && (
                      <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/10">
                        <span className="text-[10px] font-bold text-amber-400 uppercase block mb-1">💡 Pro Tip</span>
                        <p className="text-sm text-amber-200/80 leading-relaxed">{node.tips}</p>
                      </div>
                    )}
                    {node.whyThis && (
                      <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
                        <span className="text-[10px] font-bold text-blue-400 uppercase block mb-1">Why this matters</span>
                        <p className="text-sm text-blue-200/80 leading-relaxed">{node.whyThis}</p>
                      </div>
                    )}
                    {node.resources?.length > 0 && (
                      <div className="p-4 bg-white/[0.03] rounded-xl border border-white/5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase block mb-2">Resources</span>
                        <div className="space-y-2">
                          {node.resources.map((r, ri) => (
                            <a key={ri} href={r.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all group">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${r.type === 'free' ? 'bg-emerald-400' : r.type === 'paid' ? 'bg-amber-400' : r.type === 'youtube' ? 'bg-rose-400' : 'bg-blue-400'}`} />
                              <span className="text-sm text-gray-300 group-hover:text-white transition-colors truncate">{r.title}</span>
                              <span className="text-[10px] text-gray-500 uppercase shrink-0">{r.type}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Banner */}
      {roadmap.overallProgress === 100 && (
        <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white text-center overflow-hidden">
          <Particles count={30} />
          <div className="relative z-10">
            <div className="text-7xl mb-4">🎉</div>
            <h2 className="text-3xl font-extrabold mb-2">Congratulations!</h2>
            <p className="text-emerald-100 text-lg">You've completed all steps. You're ready for the next chapter!</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; } 50% { transform: translateY(-20px) rotate(180deg); opacity: 0.6; } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce-in { 0% { transform: scale(0.5); opacity: 0; } 50% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        .animate-shimmer { animation: shimmer 2s infinite; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}