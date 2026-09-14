import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';

export default function DashboardPage() {
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
    if (user?.role === 'student') load(); else setLoading(false);
  }, [user]);

  if (user?.role !== 'student') return <div className="bg-white rounded-2xl p-8 border"><h1 className="text-2xl font-bold">Welcome, {user?.name}!</h1><p className="text-gray-500 mt-2">Role: <span className="font-semibold capitalize">{user?.role}</span></p></div>;

  const actions = data?.nba?.actions?.filter(a => a.status === 'pending') || [];
  const progress = data?.roadmap?.overallProgress || 0;

  return (
    <div className="space-y-6 max-w-[1400px]">
      {!data?.profile?.onboardingCompleted && !loading && (
        <Link to="/dashboard/onboarding" className="block bg-gradient-to-r from-primary-50 to-violet-50 border border-primary-100 rounded-2xl p-5 hover:shadow-md transition-all">
          <p className="text-sm font-bold text-gray-900">Complete your profile to unlock personalized recommendations.</p>
        </Link>
      )}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border p-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Career Snapshot</h2>
          {data?.recs?.planA?.career ? (
            <div><p className="text-lg font-bold">{data.recs.planA.career.title}</p><p className="text-sm text-gray-500 mt-1">Fit Score: {data.recs.planA.fitScores?.overall || 0}%</p></div>
          ) : <p className="text-sm text-gray-400">Complete onboarding to get career recommendations.</p>}
        </div>
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Next Best Action</h2>
          {actions.length > 0 ? <div><p className="text-sm font-bold">{actions[0].title}</p><p className="text-xs text-gray-500 mt-1">{actions[0].description}</p></div> : <p className="text-sm text-gray-400">All caught up!</p>}
        </div>
      </div>
      <div className="bg-white rounded-2xl border p-6">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Roadmap Progress</h2>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
        <p className="text-xs text-gray-500 mt-2">{progress}% complete</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ icon: '🗺️', label: 'My Roadmap', href: '/dashboard/roadmap' }, { icon: '📚', label: 'Learning', href: '/dashboard/education' }, { icon: '📄', label: 'Resume', href: '/dashboard/resume-interview' }, { icon: '🤖', label: 'AI Coach', href: '/dashboard/ai-community' }].map((item) => (
          <Link key={item.href} to={item.href} className="bg-white rounded-2xl border p-5 hover:shadow-md transition-all text-center"><span className="text-2xl mb-2 block">{item.icon}</span><p className="text-sm font-bold">{item.label}</p></Link>
        ))}
      </div>
    </div>
  );
}
