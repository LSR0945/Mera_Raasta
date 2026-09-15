import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { careerAPI } from '../../api/career';
import BackButton from '../../components/common/BackButton';

export default function CareerDetailPage() {
  const { slug } = useParams();
  const [career, setCareer] = useState(null);
  useEffect(() => { careerAPI.getBySlug(slug).then(({ data }) => setCareer(data.data.career)).catch(() => {}); }, [slug]);
  if (!career) return <div className="flex justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>;
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <BackButton to="/dashboard/careers" label="Back to Careers" />
      <div className="bg-white rounded-2xl border p-8">
        <p className="text-xs font-bold text-primary-600 uppercase mb-2">{career.category}</p>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">{career.title}</h1>
        <p className="text-gray-600">{career.description}</p>
      </div>
      {career.pros && <div className="bg-white rounded-2xl border p-6"><h2 className="text-sm font-bold text-gray-400 uppercase mb-3">Pros</h2><ul className="space-y-2">{career.pros.map((p, i) => <li key={i} className="flex items-center gap-2 text-sm"><span className="text-green-500">✓</span>{p}</li>)}</ul></div>}
      {career.cons && <div className="bg-white rounded-2xl border p-6"><h2 className="text-sm font-bold text-gray-400 uppercase mb-3">Cons</h2><ul className="space-y-2">{career.cons.map((c, i) => <li key={i} className="flex items-center gap-2 text-sm"><span className="text-red-500">✗</span>{c}</li>)}</ul></div>}
      {career.salaryRange && <div className="bg-white rounded-2xl border p-6"><h2 className="text-sm font-bold text-gray-400 uppercase mb-3">Salary Range</h2><div className="grid grid-cols-3 gap-4 text-sm"><div><span className="text-gray-500 block">Entry</span><span className="font-bold">₹{(career.salaryRange.entry/100000).toFixed(1)}L</span></div><div><span className="text-gray-500 block">Mid</span><span className="font-bold">₹{(career.salaryRange.mid/100000).toFixed(1)}L</span></div><div><span className="text-gray-500 block">Senior</span><span className="font-bold">₹{(career.salaryRange.senior/100000).toFixed(1)}L</span></div></div></div>}
    </div>
  );
}
