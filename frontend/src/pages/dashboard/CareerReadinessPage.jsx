import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function CareerReadinessPage() {
  const [tab, setTab] = useState('projects');
  const [items, setItems] = useState([]);
  useEffect(() => { api.get(`/${tab}`).then(({ data }) => setItems(data.data[tab] || [])).catch(() => setItems([])); }, [tab]);
  return (
    <div><h1 className="text-2xl font-bold mb-6">Career Readiness</h1>
      <div className="flex gap-2 mb-6">{['projects', 'internships', 'jobs'].map((t) => (
        <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize ${tab === t ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{t}</button>
      ))}</div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{items.map((item, i) => (
        <div key={i} className="bg-white rounded-2xl border p-5 hover:shadow-md transition-all">
          <p className="text-xs font-bold text-primary-600 uppercase mb-1">{item.difficulty || item.type}</p>
          <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
          <p className="text-xs text-gray-500 line-clamp-2">{item.shortDescription}</p>
          {item.company && <p className="text-xs text-gray-400 mt-2">{item.company}</p>}
        </div>
      ))}</div></div>
  );
}
