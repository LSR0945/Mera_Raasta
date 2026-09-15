import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';

export default function ParentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddChild, setShowAddChild] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', class: '', interest: '' });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    api.get('/parent/stats').then(({ data }) => setStats(data.data.children || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleAddChild = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post('/parent/children', form);
      toast.success('Child added!');
      setShowAddChild(false);
      setForm({ name: '', email: '', password: '', class: '', interest: '' });
      const { data } = await api.get('/parent/stats');
      setStats(data.data.children || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add child');
    } finally {
      setAdding(false);
    }
  };

  const totalChildren = stats.length;
  const totalCompleted = stats.reduce((a, s) => a + (s.roadmap?.completedNodes || 0), 0);
  const totalNodes = stats.reduce((a, s) => a + (s.roadmap?.totalNodes || 0), 0);
  const avgProgress = totalChildren ? Math.round(stats.reduce((a, s) => a + (s.roadmap?.overallProgress || 0), 0) / totalChildren) : 0;
  const activeCount = stats.filter(s => s.roadmap && s.roadmap.overallProgress > 0).length;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 animate-pulse">👨‍👩‍👧</div>
        <p className="text-sm font-semibold text-gray-400">Loading your dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-[1400px]">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-8 lg:p-12 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white rounded-full blur-3xl" />
        </div>
        <div className="absolute top-6 right-6 text-5xl opacity-20 animate-bounce">👨‍👩‍👧‍👦</div>
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4 border border-white/20">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span></span>
              <span className="text-xs font-semibold">Parent Portal Active</span>
            </div>
            <h1 className="text-3xl lg:text-5xl font-extrabold mb-3 leading-tight">Welcome back,<br /><span className="text-emerald-100">{user?.name}!</span></h1>
            <p className="text-emerald-100/80 text-lg max-w-lg">Track your children's career journey, monitor their growth, and stay involved in their success.</p>
          </div>
          <button onClick={() => setShowAddChild(true)} className="inline-flex items-center gap-2 bg-white text-emerald-600 px-8 py-4 rounded-2xl font-bold text-sm hover:bg-emerald-50 transition-all shadow-2xl hover:-translate-y-0.5">
            <span className="text-lg">+</span> Add Child
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total Children', value: totalChildren, icon: '👶', gradient: 'from-blue-500 to-indigo-500', shadow: 'shadow-blue-500/20' },
          { label: 'Active Learners', value: activeCount, icon: '🔥', gradient: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/20' },
          { label: 'Avg Progress', value: `${avgProgress}%`, icon: '📊', gradient: 'from-violet-500 to-purple-500', shadow: 'shadow-violet-500/20' },
          { label: 'Steps Done', value: `${totalCompleted}/${totalNodes}`, icon: '🏆', gradient: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-14 h-14 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center text-2xl shadow-lg ${stat.shadow}`}>{stat.icon}</div>
            </div>
            <p className="text-3xl font-extrabold text-gray-900 mb-1">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Children Detail Cards */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">My Children</h2>
            <p className="text-sm text-gray-500 mt-1">Detailed view of each child's career progress</p>
          </div>
        </div>

        {stats.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-6 shadow-lg">👨‍👩‍👧‍👦</div>
            <h3 className="text-2xl font-extrabold text-gray-900 mb-3">No children added yet</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">Add your children to track their career development and monitor their progress.</p>
            <button onClick={() => setShowAddChild(true)} className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 rounded-2xl font-bold text-sm hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25">
              <span className="text-lg">+</span> Add Your First Child
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {stats.map((s, i) => (
              <Link key={i} to={`/dashboard/children/${s.child.id}`} className="block group border-2 border-gray-100 rounded-2xl p-6 hover:border-emerald-300 hover:shadow-xl transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                  {/* Avatar + Name */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-emerald-500/25 shrink-0">
                      {s.child.name?.[0] || '?'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-gray-900 text-lg">{s.child.name}</h3>
                      <p className="text-xs text-gray-500">{s.child.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {s.child.class && <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">📚 {s.child.class}</span>}
                        {s.child.lastLogin && <span className="text-[10px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded-full">🟢 Active</span>}
                      </div>
                    </div>
                  </div>

                  {/* Progress Ring */}
                  <div className="flex items-center gap-6">
                    {s.roadmap ? (
                      <>
                        <div className="text-center">
                          <div className="relative w-20 h-20">
                            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                              <circle cx="40" cy="40" r="35" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                              <circle cx="40" cy="40" r="35" fill="none" stroke="url(#grad)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 35}`} strokeDashoffset={`${2 * Math.PI * 35 * (1 - (s.roadmap.overallProgress || 0) / 100)}`} />
                              <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#06b6d4" /></linearGradient></defs>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-lg font-extrabold text-gray-900">{s.roadmap.overallProgress || 0}%</span>
                            </div>
                          </div>
                          <p className="text-[10px] font-bold text-gray-400 mt-1">Progress</p>
                        </div>
                        <div className="space-y-2 min-w-[140px]">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                            <span className="text-xs text-gray-600">Completed: <b>{s.roadmap.completedNodes}</b></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full" />
                            <span className="text-xs text-gray-600">In Progress: <b>{s.roadmap.inProgressNodes}</b></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-gray-300 rounded-full" />
                            <span className="text-xs text-gray-600">Remaining: <b>{s.roadmap.totalNodes - s.roadmap.completedNodes - s.roadmap.inProgressNodes}</b></span>
                          </div>
                          <p className="text-[10px] font-bold text-gray-400">🗺️ {s.roadmap.title}</p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center px-4">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-3xl mb-1">⏳</div>
                        <p className="text-xs font-bold text-gray-400">No Roadmap Yet</p>
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="hidden sm:block text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>

                {/* Profile info */}
                {s.profile && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
                    {s.profile.educationLevel && <span className="text-[10px] font-bold bg-violet-50 text-violet-600 px-2.5 py-1 rounded-full">🎓 {s.profile.educationLevel}</span>}
                    {s.profile.interests?.slice(0, 3).map((int, j) => (
                      <span key={j} className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full">💡 {int}</span>
                    ))}
                    {s.profile.onboardingCompleted && <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full">✅ Onboarded</span>}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Add Child Modal */}
      {showAddChild && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddChild(false)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-extrabold text-gray-900 mb-6">Add Child</h2>
            <form onSubmit={handleAddChild} className="space-y-4">
              <input type="text" required placeholder="Child's name" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm focus:border-emerald-500 focus:ring-0 outline-none" />
              <input type="email" required placeholder="Email for child's account" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm focus:border-emerald-500 focus:ring-0 outline-none" />
              <input type="password" required minLength={8} placeholder="Password (min 8 chars)" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm focus:border-emerald-500 focus:ring-0 outline-none" />
              <input type="text" placeholder="Class / Grade (optional)" value={form.class} onChange={e => setForm({...form, class: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm focus:border-emerald-500 focus:ring-0 outline-none" />
              <input type="text" placeholder="Main interest (optional)" value={form.interest} onChange={e => setForm({...form, interest: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm focus:border-emerald-500 focus:ring-0 outline-none" />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddChild(false)} className="flex-1 py-3 border-2 border-gray-200 rounded-2xl font-bold text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={adding} className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-bold text-sm hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50">
                  {adding ? 'Adding...' : 'Add Child'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
