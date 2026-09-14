import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { careerAPI } from '../../api/career';

export default function RecommendationsPage() {
  const [recs, setRecs] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { careerAPI.getRecommendations().then(({ data }) => setRecs(data.data.recommendation)).catch(() => {}).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="flex justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>;
  if (!recs) return <div className="text-center py-20"><p className="text-gray-500">Complete your onboarding first.</p></div>;
  return (
    <div className="space-y-6"><h1 className="text-2xl font-bold">Your Career Recommendations</h1>
      <div className="grid md:grid-cols-3 gap-4">{[recs.planA, recs.planB, recs.planC].filter(Boolean).map((plan, i) => (
        <div key={i} className="bg-white rounded-2xl border p-6 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${i === 0 ? 'bg-green-50 text-green-700' : i === 1 ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'}`}>Plan {String.fromCharCode(65 + i)}</span><span className="text-lg font-extrabold text-primary-600">{plan.fitScores?.overall || 0}%</span></div>
          <h3 className="text-base font-bold text-gray-900 mb-1">{plan.career?.title}</h3>
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{plan.reasoning}</p>
          <Link to={`/dashboard/careers/${plan.career?.slug}`} className="text-xs font-semibold text-primary-600 hover:text-primary-700">Explore →</Link>
        </div>
      ))}</div></div>
  );
}
