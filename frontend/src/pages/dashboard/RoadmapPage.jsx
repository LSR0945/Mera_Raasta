import { useState, useEffect } from 'react';
import { roadmapAPI } from '../../api/roadmap';
import { careerAPI } from '../../api/career';
import toast from 'react-hot-toast';
import BackButton from '../../components/common/BackButton';

const STEP_ICONS = { profile: '👤', education: '📖', course: '🎓', project: '🔨', skill: '⚡', interview: '🎤', resume: '📄', internship: '💼', job: '🚀' };

export default function RoadmapPage() {
  const [roadmap, setRoadmap] = useState(null);
  const [careers, setCareers] = useState([]);
  const [selectedCareer, setSelectedCareer] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [expandedNode, setExpandedNode] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [roadmapRes, careersRes] = await Promise.allSettled([
        roadmapAPI.get().catch(() => null),
        careerAPI.getAll({ limit: 50 }).catch(() => null)
      ]);
      if (roadmapRes.status === 'fulfilled' && roadmapRes.value?.data?.data?.roadmap) {
        setRoadmap(roadmapRes.value.data.data.roadmap);
      }
      if (careersRes.status === 'fulfilled' && careersRes.value?.data?.data?.careers) {
        setCareers(careersRes.value.data.data.careers);
      }
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedCareer) {
      toast.error('Please select a career first!');
      return;
    }
    setCreating(true);
    try {
      const res = await roadmapAPI.create({ careerId: selectedCareer });
      if (res.data?.data?.roadmap) {
        toast.success('Roadmap created successfully!');
        setRoadmap(res.data.data.roadmap);
      } else {
        toast.error('Failed to create roadmap');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create roadmap');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateNode = async (nodeId, newStatus) => {
    try {
      const progress = newStatus === 'completed' ? 100 : newStatus === 'in_progress' ? 50 : 0;
      await roadmapAPI.updateNode(nodeId, { status: newStatus, progress });
      toast.success(
        newStatus === 'completed' ? 'Step completed! Great job! 🎉'
        : newStatus === 'in_progress' ? 'Step started! Keep going! 💪'
        : 'Step reset'
      );
      // Reload roadmap
      const { data } = await roadmapAPI.get();
      setRoadmap(data.data.roadmap);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update step');
    }
  };

  // ═══ LOADING ═══
  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 animate-pulse">🗺️</div>
        <p className="text-sm font-semibold text-gray-400">Loading your roadmap...</p>
      </div>
    </div>
  );

  // ═══ NO ROADMAP — Career Selection ═══
  if (!roadmap) return (
    <div className="max-w-4xl mx-auto space-y-8">
      <BackButton to="/dashboard" label="Back to Dashboard" />
      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-3xl p-8 lg:p-12 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 bg-white/15 backdrop-blur-sm rounded-3xl flex items-center justify-center text-5xl mx-auto mb-6 border border-white/20">🗺️</div>
          <h1 className="text-3xl lg:text-4xl font-extrabold mb-3">Create Your Career Roadmap</h1>
          <p className="text-blue-100/80 text-lg max-w-lg mx-auto">Choose your dream career and get a personalized step-by-step path to achieve it.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-6 lg:p-8">
        <h2 className="text-xl font-extrabold text-gray-900 mb-2">Choose Your Career</h2>
        <p className="text-sm text-gray-500 mb-6">Select the career you want to pursue — we'll create a roadmap just for you.</p>

        {careers.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {careers.map((career) => (
              <button key={career._id} onClick={() => setSelectedCareer(career._id)}
                className={`text-left p-5 rounded-2xl border-2 transition-all duration-200 group ${
                  selectedCareer === career._id
                    ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10'
                    : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                }`}>
                <div className="text-2xl mb-3">{career.icon || '💼'}</div>
                <h3 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{career.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-2">{career.shortDescription || career.description || 'Build your career path'}</p>
                {selectedCareer === career._id && (
                  <div className="mt-3 flex items-center gap-1.5 text-blue-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                    <span className="text-xs font-bold">Selected</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 mb-6">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-500 mb-2">No careers available yet.</p>
            <p className="text-xs text-gray-400">The admin needs to seed career data first.</p>
          </div>
        )}

        <button onClick={handleCreate} disabled={creating || !selectedCareer}
          className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2">
          {creating ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
              Generating...
            </>
          ) : 'Generate My Roadmap'}
        </button>
      </div>
    </div>
  );

  // ═══ ROADMAP EXISTS — Timeline ═══
  const nodes = roadmap.nodes || [];
  const completed = nodes.filter(n => n.status === 'completed').length;
  const inProgress = nodes.filter(n => n.status === 'in_progress').length;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <BackButton to="/dashboard" label="Back to Dashboard" />
      {/* Header */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 rounded-3xl p-8 lg:p-10 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4 border border-white/20">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span></span>
              <span className="text-xs font-semibold">Active Roadmap</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold mb-2">{roadmap.title}</h1>
            <p className="text-purple-100/80 text-sm">{roadmap.description}</p>
          </div>
          <button onClick={() => setRoadmap(null)} className="bg-white/15 backdrop-blur-sm border border-white/20 text-white px-5 py-2.5 rounded-2xl text-sm font-bold hover:bg-white/25 transition-all shrink-0">
            New Roadmap
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Steps', value: nodes.length, icon: '📍', gradient: 'from-gray-500 to-gray-600' },
          { label: 'Completed', value: completed, icon: '✅', gradient: 'from-emerald-500 to-teal-500' },
          { label: 'In Progress', value: inProgress, icon: '🔄', gradient: 'from-blue-500 to-indigo-500' },
          { label: 'Progress', value: `${roadmap.overallProgress || 0}%`, icon: '📊', gradient: 'from-violet-500 to-purple-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 text-center hover:shadow-lg transition-all">
            <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center text-xl mx-auto mb-3 shadow-lg`}>{stat.icon}</div>
            <p className="text-2xl font-extrabold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6">
        <div className="flex justify-between mb-3">
          <span className="text-sm font-bold text-gray-700">Overall Progress</span>
          <span className="text-sm font-bold text-indigo-600">{roadmap.overallProgress || 0}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 rounded-full transition-all duration-700" style={{ width: `${roadmap.overallProgress || 0}%` }} />
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {nodes.map((node, i) => {
          const isExpanded = expandedNode === node._id;
          const isLast = i === nodes.length - 1;
          const icon = STEP_ICONS[node.type] || '📌';

          const statusStyles = {
            pending: { card: 'border-gray-100 bg-white hover:border-gray-200', dot: 'bg-gray-200 text-gray-400', line: 'bg-gray-200', badge: 'bg-gray-100 text-gray-500', badgeText: 'Pending' },
            in_progress: { card: 'border-blue-200 bg-blue-50/50 hover:border-blue-300 shadow-md', dot: 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-blue-500/25', line: 'bg-gradient-to-b from-blue-400 to-gray-200', badge: 'bg-blue-100 text-blue-600', badgeText: 'In Progress' },
            completed: { card: 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-300', dot: 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-emerald-500/25', line: 'bg-gradient-to-b from-emerald-400 to-emerald-200', badge: 'bg-emerald-100 text-emerald-600', badgeText: 'Completed' },
          };
          const s = statusStyles[node.status] || statusStyles.pending;

          return (
            <div key={node._id} className="relative flex gap-4 lg:gap-6">
              {/* Timeline Line + Dot */}
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-md transition-all ${s.dot} ${node.status === 'in_progress' ? 'animate-pulse' : ''}`}>
                  {node.status === 'completed' ? '✓' : icon}
                </div>
                {!isLast && <div className={`w-0.5 flex-1 min-h-[40px] my-1 rounded-full ${s.line}`} />}
              </div>

              {/* Card */}
              <div className={`flex-1 mb-6 rounded-2xl border-2 p-5 transition-all duration-300 cursor-pointer group ${s.card}`}
                onClick={() => setExpandedNode(isExpanded ? null : node._id)}>

                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Step {node.order}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.badge}`}>{s.badgeText}</span>
                      {node.metadata?.duration && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">⏱ {node.metadata.duration}</span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-gray-900 text-lg">{node.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{node.description}</p>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    {node.status === 'pending' && (
                      <button onClick={(e) => { e.stopPropagation(); handleUpdateNode(node._id, 'in_progress'); }}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-xs font-bold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md shadow-blue-500/20">
                        Start
                      </button>
                    )}
                    {node.status === 'in_progress' && (
                      <button onClick={(e) => { e.stopPropagation(); handleUpdateNode(node._id, 'completed'); }}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-xs font-bold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md shadow-emerald-500/20">
                        ✓ Complete
                      </button>
                    )}
                    {node.status === 'completed' && (
                      <button onClick={(e) => { e.stopPropagation(); handleUpdateNode(node._id, 'pending'); }}
                        className="px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all">
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-200/50 space-y-3">
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-white rounded-xl border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Type</span>
                        <p className="text-sm font-bold text-gray-900 capitalize mt-0.5">{node.type}</p>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Duration</span>
                        <p className="text-sm font-bold text-gray-900 mt-0.5">{node.metadata?.duration || 'Flexible'}</p>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Status</span>
                        <p className={`text-sm font-bold mt-0.5 ${s.badge.split(' ')[1]}`}>{s.badgeText}</p>
                      </div>
                    </div>
                    {node.description && (
                      <div className="p-4 bg-white rounded-xl border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Description</span>
                        <p className="text-sm text-gray-700 leading-relaxed">{node.description}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {roadmap.overallProgress === 100 && (
        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl p-8 text-white text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-extrabold mb-2">Congratulations!</h2>
          <p className="text-emerald-100">You've completed all steps in your roadmap. Amazing work!</p>
        </div>
      )}
    </div>
  );
}
