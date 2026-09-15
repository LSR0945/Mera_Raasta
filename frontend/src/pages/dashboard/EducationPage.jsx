import { useState, useEffect } from 'react';
import { educationAPI } from '../../api/education';
import BackButton from '../../components/common/BackButton';

export default function EducationPage() {
  const [tab, setTab] = useState('courses');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const api = { courses: educationAPI.getCourses, colleges: educationAPI.getColleges, scholarships: educationAPI.getScholarships, government: educationAPI.getGovernment }[tab];
    api().then(({ data }) => {
      const key = tab === 'government' ? 'items' : tab;
      setItems(data.data[key] || []);
    }).catch(() => setItems([])).finally(() => setLoading(false));
  }, [tab]);
  return (
    <div><BackButton to="/dashboard" label="Back to Dashboard" />
      <h1 className="text-2xl font-bold mb-6">Education & Opportunities</h1>
      <div className="flex gap-2 mb-6">{['courses', 'colleges', 'scholarships', 'government'].map((t) => (
        <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t}</button>
      ))}</div>
      {loading ? <div className="flex justify-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{items.map((item, i) => (
          <div key={i} className="bg-white rounded-2xl border p-5 hover:shadow-md transition-all">
            <h3 className="font-bold text-gray-900 mb-1">{item.title || item.name}</h3>
            <p className="text-xs text-gray-500 line-clamp-2">{item.shortDescription || item.description}</p>
          </div>
        ))}</div>
      )}</div>
  );
}
