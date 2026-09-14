import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function MentorStudentDetailPage() {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.allSettled([api.get(`/mentor/students/${studentId}`), api.get(`/mentor/students/${studentId}/roadmap`), api.get(`/mentor/students/${studentId}/notes`)])
      .then(([s, r, n]) => {
        if (s.status === 'fulfilled') setStudent(s.value.data.data?.student);
        if (r.status === 'fulfilled') setRoadmap(r.value.data.data?.roadmap);
        if (n.status === 'fulfilled') setNotes(n.value.data.data?.notes || []);
      }).finally(() => setLoading(false));
  }, [studentId]);

  const handleAddNote = async (e) => {
    e.preventDefault(); if (!note.trim()) return; setSaving(true);
    try { await api.post(`/mentor/students/${studentId}/notes`, { content: note }); setNote(''); toast.success('Note added'); const { data } = await api.get(`/mentor/students/${studentId}/notes`); setNotes(data.data.data?.notes || []); }
    catch { toast.error('Failed'); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>;
  if (!student) return <div className="text-center py-20"><p className="text-gray-500">Student not found</p></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/dashboard/students" className="text-sm font-semibold text-primary-600 hover:text-primary-700">← Back to Students</Link>

      <div className="bg-white rounded-2xl border p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-400 to-violet-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
            {student.name?.[0] || '?'}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">{student.name}</h1>
            <p className="text-sm text-gray-500">{student.email} • {student.class || 'Class not set'}</p>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border p-5 text-center">
          <p className="text-3xl font-extrabold text-primary-600">{roadmap?.overallProgress || 0}%</p>
          <p className="text-xs text-gray-500 mt-1">Roadmap Progress</p>
        </div>
        <div className="bg-white rounded-2xl border p-5 text-center">
          <p className="text-3xl font-extrabold text-green-600">{roadmap?.nodes?.filter(n => n.status === 'completed').length || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Completed</p>
        </div>
        <div className="bg-white rounded-2xl border p-5 text-center">
          <p className="text-3xl font-extrabold text-orange-600">{roadmap?.nodes?.filter(n => n.status === 'in_progress').length || 0}</p>
          <p className="text-xs text-gray-500 mt-1">In Progress</p>
        </div>
      </div>

      {roadmap && (
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">🗺️ Roadmap: {roadmap.title}</h2>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-6">
            <div className="h-full bg-primary-500 rounded-full" style={{ width: `${roadmap.overallProgress}%` }} />
          </div>
          <div className="space-y-2">
            {roadmap.nodes.map((node, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${node.status === 'completed' ? 'bg-green-50' : node.status === 'in_progress' ? 'bg-primary-50' : 'bg-gray-50'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${node.status === 'completed' ? 'bg-green-500 text-white' : node.status === 'in_progress' ? 'bg-primary-500 text-white' : 'bg-gray-300 text-white'}`}>
                  {node.status === 'completed' ? '✓' : i + 1}
                </div>
                <span className="text-sm font-medium text-gray-700">{node.title}</span>
                <span className="ml-auto text-xs text-gray-500 capitalize">{node.status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border p-6">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">📝 Notes for Student</h2>
        <form onSubmit={handleAddNote} className="flex gap-2 mb-4">
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Write a note..." className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-primary-500 focus:ring-0 outline-none" />
          <button type="submit" disabled={saving} className="bg-primary-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-50">{saving ? '...' : 'Add'}</button>
        </form>
        {notes.length === 0 ? (
          <p className="text-sm text-gray-400">No notes yet</p>
        ) : (
          <div className="space-y-2">
            {notes.map((n, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-700">{n.content}</p>
                <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
