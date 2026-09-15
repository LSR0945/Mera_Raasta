import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import BackButton from '../../components/common/BackButton';

export default function ChildrenPage() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', class: '', interest: '' });
  const [adding, setAdding] = useState(false);

  const load = () => api.get('/parent/children').then(({ data }) => setChildren(data.data.children || [])).catch(() => {});
  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const handleAdd = async (e) => {
    e.preventDefault(); setAdding(true);
    try { await api.post('/parent/children', form); toast.success('Child added!'); setShowAdd(false); setForm({ name: '', email: '', password: '', class: '', interest: '' }); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); } finally { setAdding(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>;

  return (
    <div className="space-y-6 max-w-[1200px]">
      <BackButton to="/dashboard" label="Back to Dashboard" />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-gray-900">My Children 👶</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-700">
          {showAdd ? 'Cancel' : '+ Add Child'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Add Child</h2>
          <form onSubmit={handleAdd} className="grid sm:grid-cols-2 gap-4">
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Child's name" className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-primary-500 focus:ring-0 outline-none" />
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="Email" className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-primary-500 focus:ring-0 outline-none" />
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} placeholder="Password" className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-primary-500 focus:ring-0 outline-none" />
            <input type="text" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} placeholder="Class (e.g. 12th)" className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-primary-500 focus:ring-0 outline-none" />
            <select value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })} className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-primary-500 focus:ring-0 outline-none">
              <option value="">Select interest</option>
              {['Technology', 'Science', 'Business', 'Arts', 'Healthcare', 'Engineering', 'Design', 'Law'].map(i => <option key={i} value={i}>{i}</option>)}
            </select>
            <button type="submit" disabled={adding} className="bg-primary-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary-700 disabled:opacity-50">{adding ? 'Adding...' : 'Add Child'}</button>
          </form>
        </div>
      )}

      {children.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <span className="text-6xl block mb-4">👨‍👩‍👧‍👦</span>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No children added yet</h3>
          <p className="text-sm text-gray-500 mb-4">Add your children to track their career journey</p>
          <button onClick={() => setShowAdd(true)} className="bg-primary-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary-700">+ Add First Child</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map((child, i) => (
            <Link key={i} to={`/dashboard/children/${child._id}`} className="bg-white rounded-2xl border p-6 hover:shadow-lg hover:border-primary-200 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {child.name?.[0] || '?'}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{child.name}</h3>
                  <p className="text-xs text-gray-500">{child.class || 'Class not set'} • {child.email}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Roadmap Progress</span>
                    <span className="font-bold text-primary-600">{child.progress || 0}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full" style={{ width: `${child.progress || 0}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Interest: <span className="font-medium text-gray-700">{child.interest || 'Not set'}</span></span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${child.hasRoadmap ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {child.hasRoadmap ? 'Active Roadmap' : 'No Roadmap'}
                  </span>
                </div>
                <p className="text-xs text-gray-400">Last active: {child.lastActive ? new Date(child.lastActive).toLocaleDateString() : 'Never'}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
