import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { activityAPI } from '../../api/activity';

const CATEGORY_ICONS = {
  login: { icon: '🔑', color: 'bg-green-100 text-green-700', label: 'Login' },
  roadmap: { icon: '🗺️', color: 'bg-blue-100 text-blue-700', label: 'Roadmap' },
  career: { icon: '💼', color: 'bg-violet-100 text-violet-700', label: 'Career' },
  profile: { icon: '👤', color: 'bg-amber-100 text-amber-700', label: 'Profile' },
  course: { icon: '📚', color: 'bg-cyan-100 text-cyan-700', label: 'Course' },
  quiz: { icon: '📝', color: 'bg-pink-100 text-pink-700', label: 'Quiz' },
  system: { icon: '⚙️', color: 'bg-gray-100 text-gray-600', label: 'System' },
};

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  if (s < 604800) return `${Math.floor(s/86400)}d ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export default function ChildDetailPage() {
  const { childId } = useParams();
  const [child, setChild] = useState(null);
  const [profile, setProfile] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [childRes, statsRes, actRes] = await Promise.allSettled([
          api.get(`/parent/children/${childId}`),
          activityAPI.getChildStats(childId),
          activityAPI.getChildActivities(childId, { limit: 50 }),
        ]);
        if (childRes.status === 'fulfilled') {
          const d = childRes.value.data.data;
          setChild(d.child);
          setProfile(d.profile);
          setRoadmap(d.roadmap);
        }
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.data);
        if (actRes.status === 'fulfilled') setActivities(actRes.value.data.data.activities || []);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, [childId]);

  const loadActivities = async (cat) => {
    setFilter(cat);
    try {
      const { data } = await activityAPI.getChildActivities(childId, { limit: 50, category: cat || undefined });
      setActivities(data.data.activities || []);
    } catch {}
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 animate-pulse">👤</div>
        <p className="text-sm font-semibold text-gray-400">Loading child's details...</p>
      </div>
    </div>
  );

  if (!child) return <div className="text-center py-20"><p className="text-gray-500">Child not found</p><Link to="/dashboard" className="text-emerald-600 font-bold">Back to Dashboard</Link></div>;

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Back */}
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"><div className="absolute -top-20 -right-20 w-80 h-80 bg-white rounded-full blur-3xl" /></div>
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center text-3xl font-extrabold border-2 border-white/30">
            {child.name?.[0] || '?'}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-3xl font-extrabold">{child.name}</h1>
            <p className="text-emerald-100/80 text-sm mt-1">{child.email}</p>
            <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start flex-wrap">
              {child.class && <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20">📚 {child.class}</span>}
              {child.lastLogin && <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20">🟢 Last active: {timeAgo(child.lastLogin)}</span>}
              {child.createdAt && <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20">📅 Joined: {new Date(child.createdAt).toLocaleDateString('en-IN')}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Actions', value: stats?.totalActions || 0, icon: '🎯', gradient: 'from-blue-500 to-indigo-500' },
          { label: 'Today', value: stats?.todayActions || 0, icon: '📅', gradient: 'from-emerald-500 to-teal-500' },
          { label: 'This Week', value: stats?.weekActions || 0, icon: '📊', gradient: 'from-violet-500 to-purple-500' },
          { label: 'Progress', value: `${roadmap?.overallProgress || 0}%`, icon: '🏆', gradient: 'from-amber-500 to-orange-500' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all">
            <div className={`w-12 h-12 bg-gradient-to-br ${s.gradient} rounded-xl flex items-center justify-center text-xl mb-3`}>{s.icon}</div>
            <p className="text-2xl font-extrabold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Roadmap Status */}
      {roadmap && (
        <div className="bg-white rounded-3xl border border-gray-100 p-6">
          <h2 className="text-lg font-extrabold text-gray-900 mb-4">🗺️ {roadmap.title}</h2>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Overall Progress</span>
              <span className="font-bold text-emerald-600">{roadmap.overallProgress}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: `${roadmap.overallProgress}%` }} />
            </div>
          </div>
          <div className="space-y-3">
            {roadmap.nodes?.map((node, i) => (
              <div key={i} className={`flex items-center gap-4 p-3 rounded-xl border ${node.status === 'completed' ? 'bg-emerald-50 border-emerald-200' : node.status === 'in_progress' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${node.status === 'completed' ? 'bg-emerald-500 text-white' : node.status === 'in_progress' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {node.status === 'completed' ? '✓' : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{node.title}</p>
                  <p className="text-xs text-gray-500 truncate">{node.description}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${node.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : node.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                  {node.status === 'completed' ? 'Done' : node.status === 'in_progress' ? 'Active' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Feed */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-extrabold text-gray-900">📋 Activity Log</h2>
        </div>
        <div className="flex gap-2 mb-6 flex-wrap">
          {['', 'login', 'roadmap', 'career', 'profile', 'course', 'quiz'].map(cat => {
            const c = CATEGORY_ICONS[cat] || { icon: '🏷️', label: 'All', color: 'bg-gray-100 text-gray-600' };
            return (
              <button key={cat} onClick={() => loadActivities(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filter === cat ? 'bg-emerald-600 text-white shadow-lg' : c.color + ' hover:shadow-md'}`}>
                {c.icon} {cat || 'All'}
              </button>
            );
          })}
        </div>
        {activities.length === 0 ? (
          <div className="text-center py-12"><p className="text-gray-400 text-sm">No activity recorded yet</p></div>
        ) : (
          <div className="space-y-2">
            {activities.map((act, i) => {
              const cat = CATEGORY_ICONS[act.category] || CATEGORY_ICONS.system;
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 ${cat.color}`}>{cat.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{act.action}</p>
                    {act.details && <p className="text-xs text-gray-400">{typeof act.details === 'object' ? Object.values(act.details).filter(Boolean).join(' • ') : act.details}</p>}
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">{timeAgo(act.createdAt)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
