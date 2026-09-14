import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [nba, roadmap, recs, profile] = await Promise.allSettled([
          api.get('/next-best-action'), api.get('/roadmap'), api.get('/careers/recommendations'), api.get('/profile')
        ]);
        setData({
          nba: nba.status === 'fulfilled' ? nba.value.data.data?.nextBestAction : null,
          roadmap: roadmap.status === 'fulfilled' ? roadmap.value.data.data?.roadmap : null,
          recs: recs.status === 'fulfilled' ? recs.value.data.data?.recommendation : null,
          profile: profile.status === 'fulfilled' ? profile.value.data.data?.profile : null,
        });
      } catch {} finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" /></div>;

  const progress = data?.roadmap?.overallProgress || 0;
  const hasOnboarded = data?.profile?.onboardingCompleted;

  return (
    <div className="space-y-8 max-w-[1400px]">
      {/* Welcome Hero */}
      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-3xl p-8 lg:p-10 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10"><div className="absolute -top-10 -right-10 w-64 h-64 bg-white rounded-full blur-3xl" /><div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white rounded-full blur-3xl" /></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">Welcome back,</p>
            <h1 className="text-3xl lg:text-4xl font-extrabold mb-2">{user?.name} 👋</h1>
            <p className="text-blue-100 text-sm">Here's your career journey overview</p>
          </div>
          {!hasOnboarded && (
            <Link to="/dashboard/onboarding" className="bg-white text-indigo-600 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-blue-50 transition-all shadow-xl">Complete Profile →</Link>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Fit Score', value: `${data?.recs?.planA?.fitScores?.overall || 0}%`, icon: '🎯', color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
          { label: 'Roadmap Progress', value: `${progress}%`, icon: '🗺️', color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Steps Done', value: data?.roadmap?.nodes?.filter(n => n.status === 'completed').length || 0, icon: '✅', color: 'from-violet-500 to-violet-600', bg: 'bg-violet-50' },
          { label: 'In Progress', value: data?.roadmap?.nodes?.filter(n => n.status === 'in_progress').length || 0, icon: '⚡', color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 card-hover">
            <div className={`w-12 h-12 ${s.bg} rounded-2xl flex items-center justify-center text-xl mb-3`}>{s.icon}</div>
            <p className="text-2xl font-extrabold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Career Recommendation */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">🎯 Career Recommendation</h2>
              <Link to="/dashboard/careers/recommendations" className="text-xs font-semibold text-blue-600 hover:text-blue-700">View All →</Link>
            </div>
            {data?.recs?.planA?.career ? (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-extrabold text-gray-900">{data.recs.planA.career.title}</h3>
                  <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-xl">{data.recs.planA.fitScores?.overall || 0}%</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{data.recs.planA.reasoning}</p>
                <Link to={`/dashboard/careers/${data.recs.planA.career.slug}`} className="text-sm font-semibold text-blue-600">Explore Career →</Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="text-5xl block mb-3">🎯</span>
                <p className="text-sm text-gray-500 mb-3">Complete onboarding to get career recommendations</p>
                <Link to="/dashboard/onboarding" className="inline-block bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all">Start Now →</Link>
              </div>
            )}
          </div>

          {/* Roadmap */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">🗺️ My Roadmap</h2>
              <Link to="/dashboard/roadmap" className="text-xs font-semibold text-blue-600">Open →</Link>
            </div>
            {data?.roadmap ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">{data.roadmap.title}</span>
                  <span className="text-sm font-bold text-blue-600">{progress}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <div className="space-y-2">
                  {data.roadmap.nodes?.slice(0, 4).map((node, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${node.status === 'completed' ? 'bg-green-50' : node.status === 'in_progress' ? 'bg-blue-50' : 'bg-gray-50'}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${node.status === 'completed' ? 'bg-green-500 text-white' : node.status === 'in_progress' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-white'}`}>{node.status === 'completed' ? '✓' : i + 1}</div>
                      <span className="text-sm font-medium text-gray-700 flex-1">{node.title}</span>
                      <span className="text-[10px] font-semibold text-gray-400 capitalize">{node.status.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <span className="text-4xl block mb-2">🗺️</span>
                <p className="text-sm text-gray-500 mb-3">No roadmap yet</p>
                <Link to="/dashboard/roadmap" className="inline-block bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold">Create Roadmap →</Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">🚀 Quick Actions</h2>
            <div className="space-y-2">
              {[
                { icon: '🎯', label: 'Explore Careers', to: '/dashboard/careers', color: 'bg-blue-50' },
                { icon: '📚', label: 'Education Hub', to: '/dashboard/education', color: 'bg-emerald-50' },
                { icon: '🤖', label: 'AI Career Coach', to: '/dashboard/ai-community', color: 'bg-violet-50' },
                { icon: '📄', label: 'Resume Builder', to: '/dashboard/resume-interview', color: 'bg-amber-50' },
                { icon: '🗺️', label: 'My Roadmap', to: '/dashboard/roadmap', color: 'bg-pink-50' },
              ].map((item) => (
                <Link key={item.to} to={item.to} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 transition-all group">
                  <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center text-lg group-hover:scale-110 transition-transform`}>{item.icon}</div>
                  <span className="text-sm font-semibold text-gray-700">{item.label}</span>
                  <span className="ml-auto text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all">→</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Daily Tip */}
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl p-6 text-white">
            <span className="text-3xl block mb-3">💡</span>
            <h3 className="font-bold mb-2">Daily Tip</h3>
            <p className="text-sm text-violet-100 leading-relaxed">Spend 30 minutes daily on skill development. Small steps lead to big career gains!</p>
          </div>

          {/* Upcoming */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">📅 Upcoming</h2>
            <div className="space-y-3">
              {[
                { title: 'Complete Profile', time: '5 min', icon: '👤' },
                { title: 'Take Career Quiz', time: '10 min', icon: '📝' },
                { title: 'Explore Roadmap', time: '15 min', icon: '🗺️' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="text-lg">{item.icon}</span>
                  <div className="flex-1"><p className="text-sm font-semibold text-gray-700">{item.title}</p><p className="text-[10px] text-gray-400">{item.time}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
