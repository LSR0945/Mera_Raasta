import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function ChildrenProgressPage() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/parent/children').then(({ data }) => setChildren(data.data.children || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>;

  return (
    <div className="space-y-6 max-w-[1200px]">
      <h1 className="text-2xl font-extrabold text-gray-900">Progress Reports 📊</h1>

      {children.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <span className="text-6xl block mb-4">📊</span>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No data yet</h3>
          <p className="text-sm text-gray-500">Add children to see their progress reports</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Overall Summary</h2>
            <div className="grid sm:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-3xl font-extrabold text-blue-600">{children.length}</p>
                <p className="text-xs text-gray-500 mt-1">Total Children</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <p className="text-3xl font-extrabold text-green-600">{children.length ? Math.round(children.reduce((a, c) => a + (c.progress || 0), 0) / children.length) : 0}%</p>
                <p className="text-xs text-gray-500 mt-1">Avg Progress</p>
              </div>
              <div className="text-center p-4 bg-violet-50 rounded-xl">
                <p className="text-3xl font-extrabold text-violet-600">{children.filter(c => c.hasRoadmap).length}</p>
                <p className="text-xs text-gray-500 mt-1">Active Roadmaps</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-xl">
                <p className="text-3xl font-extrabold text-orange-600">{children.filter(c => c.onboardingCompleted).length}</p>
                <p className="text-xs text-gray-500 mt-1">Onboarding Done</p>
              </div>
            </div>
          </div>

          {children.map((child, i) => (
            <Link key={i} to={`/dashboard/children/${child._id}`} className="bg-white rounded-2xl border p-5 flex items-center gap-4 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {child.name?.[0] || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900">{child.name}</h3>
                <p className="text-xs text-gray-500">{child.class || 'Class not set'}</p>
              </div>
              <div className="text-right w-48">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-bold text-primary-600">{child.progress || 0}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 rounded-full" style={{ width: `${child.progress || 0}%` }} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
