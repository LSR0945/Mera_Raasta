import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function MentorStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/mentor/students').then(({ data }) => setStudents(data.data.students || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = students.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>;

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-gray-900">My Students 🎓</h1>
        <div className="text-sm text-gray-500">{students.length} student{students.length !== 1 ? 's' : ''}</div>
      </div>

      <div className="bg-white rounded-2xl border p-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students..." className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-primary-500 focus:ring-0 outline-none bg-gray-50 focus:bg-white" />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <span className="text-6xl block mb-4">📚</span>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{search ? 'No students found' : 'No students yet'}</h3>
          <p className="text-sm text-gray-500">{search ? 'Try a different search' : 'Students will appear when assigned to you'}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((student, i) => (
            <Link key={i} to={`/dashboard/students/${student._id}`} className="bg-white rounded-2xl border p-6 hover:shadow-lg hover:border-primary-200 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-violet-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {student.name?.[0] || '?'}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{student.name}</h3>
                  <p className="text-xs text-gray-500">{student.email}</p>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Class</span>
                  <span className="font-semibold text-gray-700">{student.class || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Interest</span>
                  <span className="font-semibold text-gray-700">{student.interest || 'Not set'}</span>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-bold text-primary-600">{student.progress || 0}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full" style={{ width: `${student.progress || 0}%` }} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
