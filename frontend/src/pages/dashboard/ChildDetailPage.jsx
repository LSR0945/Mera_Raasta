import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';

export default function ChildDetailPage() {
  const { childId } = useParams();
  const [child, setChild] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([api.get(`/parent/children/${childId}`), api.get(`/parent/children/${childId}/roadmap`)])
      .then(([c, r]) => {
        if (c.status === 'fulfilled') setChild(c.value.data.data?.child);
        if (r.status === 'fulfilled') setRoadmap(r.value.data.data?.roadmap);
      }).finally(() => setLoading(false));
  }, [childId]);

  if (loading) return <div className="flex justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>;
  if (!child) return <div className="text-center py-20"><p className="text-gray-500">Child not found</p></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/dashboard/children" className="text-sm font-semibold text-primary-600 hover:text-primary-700">← Back to Children</Link>

      <div className="bg-white rounded-2xl border p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
            {child.name?.[0] || '?'}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">{child.name}</h1>
            <p className="text-sm text-gray-500">{child.class || 'Class not set'} • {child.email}</p>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border p-5 text-center">
          <p className="text-3xl font-extrabold text-primary-600">{roadmap?.overallProgress || 0}%</p>
          <p className="text-xs text-gray-500 mt-1">Roadmap Progress</p>
        </div>
        <div className="bg-white rounded-2xl border p-5 text-center">
          <p className="text-3xl font-extrabold text-green-600">{roadmap?.nodes?.filter(n => n.status === 'completed').length || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Completed Steps</p>
        </div>
        <div className="bg-white rounded-2xl border p-5 text-center">
          <p className="text-3xl font-extrabold text-violet-600">{roadmap?.nodes?.filter(n => n.status === 'in_progress').length || 0}</p>
          <p className="text-xs text-gray-500 mt-1">In Progress</p>
        </div>
      </div>

      {roadmap && (
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">🗺️ {roadmap.title}</h2>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-6">
            <div className="h-full bg-primary-500 rounded-full" style={{ width: `${roadmap.overallProgress}%` }} />
          </div>
          <div className="space-y-2">
            {roadmap.nodes.map((node, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${node.status === 'completed' ? 'bg-green-50' : node.status === 'in_progress' ? 'bg-primary-50' : 'bg-gray-50'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${node.status === 'completed' ? 'bg-green-500 text-white' : node.status === 'in_progress' ? 'bg-primary-500 text-white' : 'bg-gray-300 text-white'}`}>
                  {node.status === 'completed' ? '✓' : i + 1}
                </div>
                <span className="text-sm font-medium text-gray-700">{node.title}</span>
                <span className="ml-auto text-xs text-gray-500 capitalize">{node.status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border p-6">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">📊 Activity Summary</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: 'Interests', value: child.interests?.join(', ') || 'None set' },
            { label: 'Skills', value: child.skills?.map(s => s.name || s).join(', ') || 'None set' },
            { label: 'Education Level', value: child.educationLevel || 'Not set' },
            { label: 'Onboarding', value: child.onboardingCompleted ? '✅ Completed' : '❌ Pending' },
          ].map((item, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
