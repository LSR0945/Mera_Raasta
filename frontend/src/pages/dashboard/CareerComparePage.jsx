import { useState, useEffect } from 'react';
import { careerAPI } from '../../api/career';
import BackButton from '../../components/common/BackButton';

export default function CareerComparePage() {
  const [careers, setCareers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null);
  useEffect(() => { careerAPI.getAll().then(({ data }) => setCareers(data.data.careers)).catch(() => {}); }, []);
  const handleCompare = async () => { if (selected.length < 2) return; const { data } = await careerAPI.compare(selected.join(',')); setResult(data.data.careers); };
  return (
    <div className="space-y-6"><BackButton to="/dashboard/careers" label="Back to Careers" />
      <h1 className="text-2xl font-bold">Compare Careers</h1>
      <div className="bg-white rounded-2xl border p-6"><p className="text-sm text-gray-500 mb-4">Select at least 2 careers to compare</p>
        <div className="flex flex-wrap gap-2 mb-4">{careers.map((c) => (
          <button key={c._id} onClick={() => setSelected(prev => prev.includes(c._id) ? prev.filter(id => id !== c._id) : [...prev, c._id])} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selected.includes(c._id) ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{c.title}</button>
        ))}</div>
        <button onClick={handleCompare} disabled={selected.length < 2} className="bg-primary-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-700 disabled:opacity-50">Compare ({selected.length})</button></div>
      {result && <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{result.map((c) => (
        <div key={c._id} className="bg-white rounded-2xl border p-5"><h3 className="font-bold text-gray-900 mb-2">{c.title}</h3><p className="text-xs text-gray-500">{c.description}</p></div>
      ))}</div>}
    </div>
  );
}
