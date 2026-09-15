import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { careerAPI } from '../../api/career';
import BackButton from '../../components/common/BackButton';

export default function CareerListPage() {
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { careerAPI.getAll().then(({ data }) => setCareers(data.data.careers)).catch(() => {}).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="flex justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>;
  return (
    <div><BackButton to="/dashboard" label="Back to Dashboard" />
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Explore Careers</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{careers.map((c) => (
        <Link key={c._id} to={`/dashboard/careers/${c.slug}`} className="bg-white rounded-2xl border p-5 hover:shadow-md transition-all">
          <p className="text-xs font-bold text-primary-600 uppercase mb-2">{c.category}</p>
          <h3 className="text-base font-bold text-gray-900 mb-1">{c.title}</h3>
          <p className="text-xs text-gray-500 line-clamp-2">{c.shortDescription}</p>
        </Link>
      ))}</div></div>
  );
}
