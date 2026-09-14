import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';

export default function MentorDashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/mentor/students').then(({ data }) => setStudents(data.data.students || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 animate-pulse">🧑‍🏫</div>
        <p className="text-sm font-semibold text-gray-400">Loading your mentor dashboard...</p>
      </div>
    </div>
  );

  const avgProgress = students.length ? Math.round(students.reduce((a, s) => a + (s.progress || 0), 0) / students.length) : 0;
  const activeStudents = students.filter(s => (s.progress || 0) > 0).length;
  const topStudents = [...students].sort((a, b) => (b.progress || 0) - (a.progress || 0)).slice(0, 5);

  return (
    <div className="space-y-8 max-w-[1400px]">
      {/* Premium Hero */}
      <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 rounded-3xl p-8 lg:p-12 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>
        {/* Floating decorations */}
        <div className="absolute top-6 right-6 text-5xl opacity-20 animate-bounce" style={{ animationDelay: '0.5s' }}>🎓</div>
        <div className="absolute bottom-6 right-24 text-4xl opacity-15 animate-bounce" style={{ animationDelay: '1s' }}>⭐</div>
        <div className="absolute top-1/2 right-48 text-3xl opacity-10 animate-bounce" style={{ animationDelay: '1.5s' }}>📚</div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4 border border-white/20">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span></span>
              <span className="text-xs font-semibold">Mentor Dashboard Active</span>
            </div>
            <h1 className="text-3xl lg:text-5xl font-extrabold mb-3 leading-tight">Welcome back,<br /><span className="text-violet-100">{user?.name}!</span></h1>
            <p className="text-violet-100/80 text-lg max-w-lg">Guide students, track their growth, and shape the next generation of leaders.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/dashboard/students" className="inline-flex items-center gap-2 bg-white text-violet-600 px-6 py-4 rounded-2xl font-bold text-sm hover:bg-violet-50 transition-all shadow-2xl hover:shadow-3xl hover:-translate-y-0.5">
              View Students
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Premium Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'My Students', value: students.length, icon: '🎓', gradient: 'from-blue-500 to-indigo-500', shadow: 'shadow-blue-500/20', sub: 'Assigned' },
          { label: 'Active Learners', value: activeStudents, icon: '🔥', gradient: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/20', sub: 'In progress' },
          { label: 'Avg Progress', value: `${avgProgress}%`, icon: '📊', gradient: 'from-violet-500 to-purple-500', shadow: 'shadow-violet-500/20', sub: 'Overall' },
          { label: 'Reviews Given', value: '0', icon: '⭐', gradient: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20', sub: 'Pending' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-14 h-14 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center text-2xl shadow-lg ${stat.shadow} group-hover:scale-110 transition-transform`}>{stat.icon}</div>
              <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">{stat.sub}</span>
            </div>
            <p className="text-3xl font-extrabold text-gray-900 mb-1">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Students List — Premium */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 p-6 lg:p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">My Students</h2>
              <p className="text-sm text-gray-500 mt-1">Guide and monitor their progress</p>
            </div>
            <Link to="/dashboard/students" className="inline-flex items-center gap-2 text-sm font-bold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-4 py-2 rounded-xl transition-all">
              View All
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
          {students.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gradient-to-br from-violet-100 to-purple-100 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-6 shadow-lg">📚</div>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-3">No students yet</h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">Students will appear here once they are assigned to you. Start mentoring and watch them grow!</p>
              <Link to="/dashboard/students" className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-sm hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/25 hover:shadow-xl hover:-translate-y-0.5">
                View Students
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {topStudents.map((student, i) => (
                <Link key={i} to={`/dashboard/students/${student._id}`} className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-violet-50/50 transition-all duration-300 border border-transparent hover:border-violet-100">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform">
                      {student.name?.[0] || '?'}
                    </div>
                    {i === 0 && students.length > 1 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-[10px] shadow-lg">🏆</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-gray-900 truncate">{student.name}</h4>
                      {i === 0 && students.length > 1 && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Top Performer</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{student.interest || 'Interest not set'} • {student.class || 'Class not set'}</p>
                  </div>
                  <div className="text-right min-w-[100px]">
                    <div className="flex items-center justify-end gap-2 mb-1">
                      <span className="text-sm font-bold text-violet-600">{student.progress || 0}%</span>
                      {(student.progress || 0) >= 75 && <span className="text-xs">🔥</span>}
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${student.progress || 0}%` }} />
                    </div>
                  </div>
                </Link>
              ))}
              {students.length > 5 && (
                <Link to="/dashboard/students" className="flex items-center justify-center py-3 text-sm font-bold text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-xl transition-all">
                  +{students.length - 5} more students
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Right Column — Premium */}
        <div className="space-y-6">
          {/* Quick Actions — Premium */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-5">Quick Actions</h2>
            <div className="space-y-2.5">
              {[
                { icon: '📋', label: 'Review Assignments', desc: 'Grade & feedback', to: '/dashboard/reviews', gradient: 'from-blue-500 to-indigo-500' },
                { icon: '💬', label: 'Messages', desc: 'Chat with students', to: '/dashboard/ai-community', gradient: 'from-emerald-500 to-teal-500' },
                { icon: '📊', label: 'Analytics', desc: 'Deep insights', to: '/dashboard/students', gradient: 'from-violet-500 to-purple-500' },
                { icon: '📝', label: 'Create Content', desc: 'Lessons & materials', to: '/dashboard/education', gradient: 'from-amber-500 to-orange-500' },
              ].map((item) => (
                <Link key={item.to} to={item.to} className="group flex items-center gap-3 p-3.5 rounded-2xl hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-100">
                  <div className={`w-11 h-11 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center text-lg shadow-md group-hover:scale-110 transition-transform`}>{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold text-gray-700 block">{item.label}</span>
                    <span className="text-[10px] text-gray-400">{item.desc}</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Mentor Tip — Premium */}
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <span className="text-4xl block mb-4">🎯</span>
            <h3 className="text-lg font-extrabold mb-3">Mentor Tip</h3>
            <p className="text-sm text-violet-100 leading-relaxed mb-5">Schedule weekly check-ins with your students. Consistent guidance helps them stay on track and builds lasting mentor-student relationships.</p>
            <div className="flex gap-2">
              <Link to="/dashboard/students" className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/30 transition-all border border-white/20">
                View Students
              </Link>
              <Link to="/dashboard/ai-community" className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/30 transition-all border border-white/20">
                Messages
              </Link>
            </div>
          </div>

          {/* Performance Summary — Premium */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-5">Performance</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Students &gt; 50%</span>
                <span className="text-sm font-bold text-emerald-600">{students.filter(s => (s.progress || 0) > 50).length}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: `${students.length ? (students.filter(s => (s.progress || 0) > 50).length / students.length * 100) : 0}%` }} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Students &gt; 25%</span>
                <span className="text-sm font-bold text-blue-600">{students.filter(s => (s.progress || 0) > 25).length}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: `${students.length ? (students.filter(s => (s.progress || 0) > 25).length / students.length * 100) : 0}%` }} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Inactive Students</span>
                <span className="text-sm font-bold text-gray-500">{students.filter(s => (s.progress || 0) === 0).length}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-gray-400 to-gray-500 rounded-full" style={{ width: `${students.length ? (students.filter(s => (s.progress || 0) === 0).length / students.length * 100) : 0}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
