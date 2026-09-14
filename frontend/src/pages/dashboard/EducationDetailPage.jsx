import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { educationAPI } from '../../api/education';

export default function EducationDetailPage() {
  const { type, slug } = useParams();
  const [item, setItem] = useState(null);
  useEffect(() => {
    const api = { courses: educationAPI.getCourseBySlug, colleges: educationAPI.getCollegeBySlug, scholarships: educationAPI.getScholarshipBySlug, government: educationAPI.getGovernmentBySlug }[type];
    if (api) api(slug).then(({ data }) => setItem(data.data.item || data.data.career)).catch(() => {});
  }, [type, slug]);
  if (!item) return <div className="flex justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>;
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl border p-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-4">{item.title || item.name}</h1>
      <p className="text-gray-600 mb-6">{item.description}</p>
      {item.fee && <p className="text-sm text-gray-500">Fee: ₹{item.fee.min?.toLocaleString()} - ₹{item.fee.max?.toLocaleString()}</p>}
      {item.eligibility && <p className="text-sm text-gray-500 mt-2">Eligibility: {item.eligibility}</p>}
      {item.duration && <p className="text-sm text-gray-500 mt-2">Duration: {item.duration.value} {item.duration.unit}</p>}
    </div>
  );
}
