import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/axios';
import BackButton from '../../components/common/BackButton';

function DetailModal({ item, onClose }) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <span className="inline-block px-2 py-0.5 bg-primary-50 text-primary-600 text-[10px] font-bold rounded-full uppercase mb-3">{item.difficulty || item.type || 'Info'}</span>
        <h2 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h2>
        {item.shortDescription && <p className="text-sm text-gray-500 mb-3 leading-relaxed">{item.shortDescription}</p>}
        {item.fullDescription && <p className="text-sm text-gray-600 mb-4 leading-relaxed">{item.fullDescription}</p>}
        {item.company && <p className="text-xs text-gray-400 mb-1"><span className="font-semibold text-gray-500">Company:</span> {item.company}</p>}
        {item.duration && <p className="text-xs text-gray-400 mb-1"><span className="font-semibold text-gray-500">Duration:</span> {item.duration}</p>}
        {item.stipend && <p className="text-xs text-gray-400 mb-1"><span className="font-semibold text-gray-500">Stipend:</span> {item.stipend}</p>}
        {item.salary && <p className="text-xs text-gray-400 mb-1"><span className="font-semibold text-gray-500">Salary:</span> {item.salary}</p>}
        {item.requirements && item.requirements.length > 0 && (
          <div className="mt-3"><p className="text-xs font-semibold text-gray-500 mb-1">Requirements:</p>
            <ul className="list-disc list-inside text-xs text-gray-400 space-y-0.5">{item.requirements.map((r, i) => <li key={i}>{r}</li>)}</ul></div>
        )}
        {item.category && <p className="text-xs text-gray-400 mt-2"><span className="font-semibold text-gray-500">Category:</span> {item.category}</p>}
      </div>
    </div>
  );
}

export default function CareerReadinessPage() {
  const [tab, setTab] = useState('projects');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/${tab}`).then(({ data }) => { setItems(data.data[tab] || []); setLoading(false); }).catch(() => { setItems([]); setLoading(false); });
  }, [tab]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <BackButton to="/dashboard" label="Back to Dashboard" />
      <h1 className="text-2xl font-bold mb-6">Career Readiness</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        {[{ key: 'projects', label: 'Projects', icon: '🔧' }, { key: 'internships', label: 'Internships', icon: '💼' }, { key: 'jobs', label: 'Jobs', icon: '🏢' }, { key: 'interviews', label: 'Interviews', icon: '🎤' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t.key ? 'bg-primary-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'}`}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No items found.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-primary-200 transition-all cursor-pointer group"
              onClick={() => setSelected(item)}>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-primary-50 text-primary-600 text-[10px] font-bold rounded-full uppercase">{item.difficulty || item.type || 'N/A'}</span>
                {item.category && <span className="text-[10px] text-gray-400">{item.category}</span>}
              </div>
              <h3 className="font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">{item.title}</h3>
              <p className="text-xs text-gray-500 line-clamp-2 mb-2">{item.shortDescription}</p>
              {item.company && <p className="text-xs text-gray-400">{item.company}</p>}
              <div className="mt-3 flex items-center gap-1 text-[11px] text-primary-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                View Details <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </div>
          ))}
        </div>
      )}

      <DetailModal item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
