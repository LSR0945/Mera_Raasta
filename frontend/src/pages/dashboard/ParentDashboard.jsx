import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';

export default function ParentDashboard() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/parent/children').then(({ data }) => setChildren(data.data.children || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 animate-pulse">👨‍👩‍👧</div>
        <p className="text-sm font-semibold text-gray-400">Loading your dashboard...</p>
      </div>
    </div>
  );

  const totalProgress = children.length ? Math.round(children.reduce((a, c) => a + (c.progress || 0), 0) / children.length) : 0;
  const activeChildren = children.filter(c => (c.progress || 0) > 0).length;
  const roadmapCount = children.filter(c => c.hasRoadmap).length;

  return (
    <div className="space-y-8 max-w-[1400px]">
      {/* Premium Hero */}
      <div className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-8 lg:p-12 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>
        {/* Floating decorations */}
        <div className="absolute top-6 right-6 text-5xl opacity-20 animate-bounce" style={{ animationDelay: '0.5s' }}>👨‍👩‍👧‍👦</div>
        <div className="absolute bottom-6 right-24 text-4xl opacity-15 animate-bounce" style={{ animationDelay: '1s' }}>🎓</div>
        <div className="absolute top-1/2 right-48 text-3xl opacity-10 animate-bounce" style={{ animationDelay: '1.5s' }}>⭐</div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4 border border-white/20">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span></span>
              <span className="text-xs font-semibold">Parent Portal Active</span>
            </div>
            <h1 className="text-3xl lg:text-5xl font-extrabold mb-3 leading-tight">Welcome back,<br /><span className="text-emerald-100">{user?.name}!</span></h1>
            <p className="text-emerald-100/80 text-lg max-w-lg">Track your children's career journey, monitor their growth, and stay involved in their success.</p>
          </div>
          <Link to="/dashboard/children" className="inline-flex items-center gap-2 bg-white text-emerald-600 px-8 py-4 rounded-2xl font-bold text-sm hover:bg-emerald-50 transition-all shadow-2xl hover:shadow-3xl hover:-translate-y-0.5">
            <span className="text-lg">+</span> Add Child
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        </div>
      </div>

      {/* Premium Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total Children', value: children.length, icon: '👶', gradient: 'from-blue-500 to-indigo-500', shadow: 'shadow-blue-500/20', change: 'Registered', changeColor: 'text-blue-600' },
          { label: 'Active Learners', value: activeChildren, icon: '🔥', gradient: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/20', change: 'In progress', changeColor: 'text-emerald-600' },
          { label: 'Avg Progress', value: `${totalProgress}%`, icon: '📊', gradient: 'from-violet-500 to-purple-500', shadow: 'shadow-violet-500/20', change: 'Overall', changeColor: 'text-violet-600' },
          { label: 'Active Roadmaps', value: roadmapCount, icon: '🗺️', gradient: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20', change: 'Tracking', changeColor: 'text-amber-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-14 h-14 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center text-2xl shadow-lg ${stat.shadow} group-hover:scale-110 transition-transform`}>{stat.icon}</div>
              <span className={`text-xs font-bold ${stat.changeColor} bg-gray-50 px-2.5 py-1 rounded-full`}>{stat.change}</span>
            </div>
            <p className="text-3xl font-extrabold text-gray-900 mb-1">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Children Section */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">My Children</h2>
            <p className="text-sm text-gray-500 mt-1">Track each child's career development</p>
          </div>
          <Link to="/dashboard/children" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-all">
            View All
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>

        {children.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-6 shadow-lg">👨‍👩‍👧‍👦</div>
            <h3 className="text-2xl font-extrabold text-gray-900 mb-3">No children added yet</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">Add your children to track their career development, monitor their progress, and guide them toward success.</p>
            <Link to="/dashboard/children" className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 rounded-2xl font-bold text-sm hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:-translate-y-0.5">
              <span className="text-lg">+</span> Add Your First Child
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {children.map((child, i) => (
              <Link key={i} to={`/dashboard/children/${child._id}`} className="group relative border-2 border-gray-100 rounded-2xl p-6 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 overflow-hidden">
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/0 to-teal-50/0 group-hover:from-emerald-50/50 group-hover:to-teal-50/50 transition-all duration-300" />
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform">
                      {child.name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-lg">{child.name}</h3>
                      <p className="text-xs text-gray-500">{child.class || 'Class not set'}</p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500 font-medium">Progress</span>
                      <span className="font-bold text-emerald-600">{child.progress || 0}%</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500" style={{ width: `${child.progress || 0}%` }} />
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold">📚 {child.interest || 'Interest TBD'}</span>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${child.hasRoadmap ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {child.hasRoadmap ? '🗺️ Active Roadmap' : '⏳ No Roadmap'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Premium Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[
          { icon: '📊', title: 'Progress Reports', desc: 'Detailed analytics & growth insights', to: '/dashboard/children/progress', gradient: 'from-blue-500 to-indigo-500', shadow: 'shadow-blue-500/25' },
          { icon: '💬', title: 'AI Career Coach', desc: 'Get AI guidance for your family', to: '/dashboard/ai-community', gradient: 'from-violet-500 to-purple-500', shadow: 'shadow-violet-500/25' },
          { icon: '📚', title: 'Education Hub', desc: 'Courses, colleges & scholarships', to: '/dashboard/education', gradient: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/25' },
        ].map((item, i) => (
          <Link key={i} to={item.to} className="group relative bg-white rounded-2xl border border-gray-100 p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300" style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }} />
            <div className={`w-14 h-14 bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center text-2xl shadow-lg ${item.shadow} mb-5 group-hover:scale-110 transition-transform`}>{item.icon}</div>
            <h3 className="font-extrabold text-gray-900 text-lg mb-2">{item.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            <div className="flex items-center gap-1 mt-4 text-emerald-600 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
              Open
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Premium Tips Section */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <span className="text-4xl block mb-4">💡</span>
          <h3 className="text-xl font-extrabold mb-3">Parenting Tip</h3>
          <p className="text-emerald-100 text-sm leading-relaxed mb-6">Encourage your children to explore different career paths. Let them experiment and discover their true interests — it's the key to long-term success!</p>
          <Link to="/dashboard/children" className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-white/30 transition-all border border-white/20">
            View Children
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        </div>

        <div className="bg-gradient-to-br from-violet-600 to-purple-600 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
          <span className="text-4xl block mb-4">🏆</span>
          <h3 className="text-xl font-extrabold mb-3">Milestone Tracker</h3>
          <p className="text-violet-100 text-sm leading-relaxed mb-6">Celebrate every achievement! Small wins build confidence. Check your children's progress and acknowledge their efforts regularly.</p>
          <Link to="/dashboard/children/progress" className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-white/30 transition-all border border-white/20">
            View Progress
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
