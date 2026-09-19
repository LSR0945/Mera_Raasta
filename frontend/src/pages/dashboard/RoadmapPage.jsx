import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { roadmapAPI } from '../../api/roadmap';
import { useLanguage } from '../../contexts/LanguageContext';
import toast from 'react-hot-toast';
import BackButton from '../../components/common/BackButton';

const STEP_ICONS = { setup: '\u2699\uFE0F', education: '\uD83D\uDCD6', course: '\uD83C\uDF93', project: '\uD83D\uDD28', skill: '\u26A1', interview: '\uD83C\uDFA4', resume: '\uD83D\uDCC4', internship: '\uD83D\uDCBC', job: '\uD83D\uDE80', practice: '\uD83C\uDFCB\uFE0F', application: '\uD83D\uDCE3', milestone: '\uD83C\uDFC1', profile: '\uD83D\uDC64', general: '\uD83D\uDCCC' };
const DIFFICULTY_badges = { easy: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', medium: 'bg-amber-500/20 text-amber-400 border border-amber-500/30', hard: 'bg-rose-500/20 text-rose-400 border border-rose-500/30' };

const CAREER_OPTIONS = [
  'Software Engineer', 'Data Scientist', 'Doctor', 'MBA', 'Law',
  'Teacher', 'Civil Services (UPSC)', 'Banking', 'Designer',
  'Fashion Design', 'Graphic Design', 'Interior Design',
  'AI/ML Engineer', 'Cyber Security', 'Cloud Computing',
  'Nursing', 'Pharmacy', 'Agriculture', 'Journalism',
  'Hotel Management', 'Chartered Accountant', 'Company Secretary',
  'Mechanical Engineer', 'Civil Engineer', 'Electrical Engineer',
  'Digital Marketing', 'Content Creator', 'Photographer',
  'Defence (NDA/CDS)', 'Police (SSC)', 'Railways',
];

function DarkDropdown({ label, value, options, placeholder, onSelect, searchPlaceholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const filtered = options.filter(o => !search || o.toLowerCase().includes(search.toLowerCase()));
  return (
    <div ref={ref} className="relative">
      <label className="text-sm text-gray-400 mb-1 block">{label}</label>
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-left text-sm transition-all hover:border-blue-500/30 focus:border-blue-500/50 focus:outline-none">
        <span className={value ? 'text-white' : 'text-gray-500'}>{value || placeholder}</span>
        <span className="absolute right-4 top-[2.3rem] text-gray-400 text-xs">{open ? '\u25B2' : '\u25BC'}</span>
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-white/10 rounded-xl shadow-2xl shadow-black/50 max-h-72 overflow-hidden">
          {options.length > 10 && (
            <div className="p-2 border-b border-white/5">
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder || 'Search...'} autoFocus
                className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50" />
            </div>
          )}
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-gray-500 text-sm">No results found</div>
            ) : filtered.map(opt => (
              <button key={opt} type="button"
                onClick={() => { onSelect(opt); setOpen(false); setSearch(''); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${value === opt ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CountUp({ target, suffix = '' }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    let start = 0;
    const step = Math.max(1, Math.floor(target / 30));
    const timer = setInterval(() => { start += step; if (start >= target) { setVal(target); clearInterval(timer); } else setVal(start); }, 30);
    return () => clearInterval(timer);
  }, [target]);
  return <>{val}{suffix}</>;
}

function Particles({ count = 20 }) {
  const particles = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
    size: Math.random() * 4 + 1, delay: Math.random() * 5, duration: Math.random() * 10 + 10,
  })), [count]);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div key={p.id} className="absolute rounded-full bg-white/10"
          style={{ left: p.left, top: p.top, width: p.size, height: p.size, animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite` }} />
      ))}
    </div>
  );
}

function MilestonePopup({ milestone }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10 rounded-3xl p-10 text-center max-w-sm mx-4 animate-bounce-in shadow-2xl shadow-amber-500/20">
        <div className="text-7xl mb-4">{'\uD83C\uDF89'}</div>
        <h3 className="text-2xl font-extrabold text-white mb-2">Milestone Reached!</h3>
        <p className="text-amber-400 text-lg font-bold">{milestone.percent}% Complete</p>
        <p className="text-gray-400 text-sm mt-2">Keep going!</p>
      </div>
    </div>
  );
}

function GenerateForm({ onGenerate, loading }) {
  const [careerGoal, setCareerGoal] = useState('');
  const [timeline, setTimeline] = useState('moderate');
  const [budget, setBudget] = useState('medium');

  const handleSubmit = () => {
    if (!careerGoal) { toast.error('Please select a career goal'); return; }
    onGenerate({ careerGoal, timeline, budget });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <BackButton to="/dashboard" label="Back to Dashboard" />
      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 rounded-3xl p-8 lg:p-12 text-white overflow-hidden">
        <Particles count={25} />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 bg-white/15 backdrop-blur-sm rounded-3xl flex items-center justify-center text-5xl mx-auto mb-6 border border-white/20 shadow-xl">{'\uD83C\uDFD7\uFE0F'}</div>
          <h1 className="text-3xl lg:text-5xl font-extrabold mb-3 tracking-tight">Create Your Roadmap</h1>
          <p className="text-blue-100/80 text-lg max-w-xl mx-auto">
            Tell us about your <span className="text-white font-bold">career goal</span> and we'll build a personalized step-by-step path just for you.
          </p>
        </div>
      </div>

      <div className="bg-gray-900/50 backdrop-blur-xl rounded-3xl border border-white/5 p-8 lg:p-10 space-y-6">
        <h2 className="text-xl font-extrabold text-white mb-2">Your Career Details</h2>
        <p className="text-sm text-gray-400">Fill in below and we'll auto-generate a personalized roadmap for you.</p>

        <DarkDropdown label="Career Goal *" value={careerGoal} options={CAREER_OPTIONS}
          placeholder="Select your career goal..." searchPlaceholder="Search careers..."
          onSelect={(val) => setCareerGoal(val)} />

        <div>
          <label className="text-sm text-gray-400 mb-3 block">Timeline</label>
          <div className="grid grid-cols-3 gap-3">
            {[{ v: 'fast', l: 'Fast', d: 'Intense, shorter durations' }, { v: 'moderate', l: 'Moderate', d: 'Balanced pace (Recommended)' }, { v: 'relaxed', l: 'Relaxed', d: 'More time, deeper learning' }].map(t => (
              <button key={t.v} onClick={() => setTimeline(t.v)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${timeline === t.v ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                <span className={`block font-bold text-sm ${timeline === t.v ? 'text-white' : 'text-gray-300'}`}>{t.l}</span>
                <span className="block text-[11px] text-gray-500 mt-1">{t.d}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-3 block">Budget</label>
          <div className="grid grid-cols-4 gap-3">
            {[{ v: 'low', l: 'Low', i: 'Free resources' }, { v: 'medium', l: 'Medium', i: 'Mix free + paid' }, { v: 'high', l: 'High', i: 'Premium courses' }, { v: 'very_high', l: 'Very High', i: 'No limits' }].map(b => (
              <button key={b.v} onClick={() => setBudget(b.v)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${budget === b.v ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                <span className={`block font-bold text-xs ${budget === b.v ? 'text-white' : 'text-gray-300'}`}>{b.l}</span>
                <span className="block text-[10px] text-gray-500 mt-0.5">{b.i}</span>
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading || !careerGoal}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-base hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 transition-all shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:-translate-y-0.5 flex items-center justify-center gap-3">
          {loading ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
              Generating Your Roadmap...
            </>
          ) : (
            <>{'\uD83D\uDE80'} Generate My Roadmap</>
          )}
        </button>
      </div>
    </div>
  );
}
function EditMode({ roadmap, onSave, onCancel }) {
  const [editNodes, setEditNodes] = useState(JSON.parse(JSON.stringify(roadmap.nodes || [])));
  const [editTitle, setEditTitle] = useState(roadmap.title || '');
  const [editDesc, setEditDesc] = useState(roadmap.description || '');
  const [saving, setSaving] = useState(false);

  const updateNode = (idx, field, val) => {
    setEditNodes(prev => { const n = [...prev]; n[idx] = { ...n[idx], [field]: val }; return n; });
  };

  const removeNode = (idx) => {
    setEditNodes(prev => prev.filter((_, i) => i !== idx));
  };

  const addNode = () => {
    setEditNodes(prev => [...prev, {
      title: 'New Step', description: '', type: 'general', category: 'learning',
      status: 'pending', progress: 0, difficulty: 'medium', estimatedDuration: '',
      resources: [], tips: '', whyThis: '', order: prev.length + 1,
    }]);
  };

  const moveNode = (idx, dir) => {
    setEditNodes(prev => {
      const n = [...prev];
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= n.length) return n;
      [n[idx], n[newIdx]] = [n[newIdx], n[idx]];
      return n;
    });
  };

  const handleSave = async () => {
    if (!editNodes.length) { toast.error('Add at least one step'); return; }
    setSaving(true);
    try {
      await onSave({ title: editTitle, description: editDesc, nodes: editNodes });
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-white">Edit Roadmap</h2>
        <div className="flex gap-2">
          <button onClick={onCancel} className="bg-white/5 text-gray-300 px-4 py-2 rounded-xl text-sm font-bold hover:bg-white/10 border border-white/10">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="bg-gray-900/50 backdrop-blur-xl rounded-3xl border border-white/5 p-6 space-y-4">
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Roadmap Title</label>
          <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50" />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Description</label>
          <input value={editDesc} onChange={e => setEditDesc(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50" />
        </div>
      </div>

      <div className="space-y-4">
        {editNodes.map((node, idx) => (
          <div key={idx} className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-gray-500">Step {idx + 1}</span>
              <div className="flex gap-1">
                <button onClick={() => moveNode(idx, -1)} disabled={idx === 0}
                  className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-30 text-xs">{'\u2191'}</button>
                <button onClick={() => moveNode(idx, 1)} disabled={idx === editNodes.length - 1}
                  className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-30 text-xs">{'\u2193'}</button>
                <button onClick={() => removeNode(idx)}
                  className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs">{'\u2715'}</button>
              </div>
            </div>
            <input value={node.title} onChange={e => updateNode(idx, 'title', e.target.value)} placeholder="Step title"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" />
            <textarea value={node.description} onChange={e => updateNode(idx, 'description', e.target.value)} placeholder="Description"
              rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 resize-none" />
            <div className="grid grid-cols-3 gap-3">
              <select value={node.difficulty} onChange={e => updateNode(idx, 'difficulty', e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none">
                <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
              </select>
              <select value={node.category} onChange={e => updateNode(idx, 'category', e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none">
                <option value="learning">Learning</option><option value="project">Project</option><option value="practice">Practice</option>
                <option value="interview">Interview</option><option value="application">Application</option>
              </select>
              <input value={node.estimatedDuration} onChange={e => updateNode(idx, 'estimatedDuration', e.target.value)} placeholder="Duration"
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none" />
            </div>
            <input value={node.tips || ''} onChange={e => updateNode(idx, 'tips', e.target.value)} placeholder="Pro tips"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-blue-500/50" />
          </div>
        ))}
      </div>

      <button onClick={addNode}
        className="w-full py-3 border-2 border-dashed border-white/10 rounded-2xl text-gray-400 text-sm font-bold hover:border-blue-500/30 hover:text-blue-400 transition-all">
        + Add New Step
      </button>

      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 bg-white/5 text-gray-300 px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/10 border border-white/10">Cancel</button>
        <button onClick={handleSave} disabled={saving}
          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

function ResetModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/10 rounded-3xl p-8 max-w-md mx-4 text-center shadow-2xl">
        <div className="text-5xl mb-4">{'\u26A0\uFE0F'}</div>
        <h3 className="text-xl font-extrabold text-white mb-2">Reset Roadmap?</h3>
        <p className="text-gray-400 text-sm mb-6">Your current roadmap and all progress will be deleted. You'll create a fresh new roadmap from the form.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 bg-white/5 text-gray-300 px-5 py-3 rounded-xl font-bold text-sm hover:bg-white/10 border border-white/10">Cancel</button>
          <button onClick={onConfirm} className="flex-1 bg-red-600 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-red-700">Yes, Reset</button>
        </div>
      </div>
    </div>
  );
}
export default function RoadmapPage() {
  const { t } = useLanguage();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [view, setView] = useState('loading');
  const [editMode, setEditMode] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showMilestone, setShowMilestone] = useState(null);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState({});

  const loadRoadmap = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roadmapAPI.get();
      if (res.data && res.data._id) {
        setRoadmap(res.data);
        setView('roadmap');
      } else {
        setRoadmap(null);
        setView('form');
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setRoadmap(null);
        setView('form');
      } else {
        toast.error('Failed to load roadmap');
        setView('form');
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadRoadmap(); }, [loadRoadmap]);

  const handleGenerate = async (data) => {
    setGenerating(true);
    try {
      const res = await roadmapAPI.generate(data);
      setRoadmap(res.data);
      setView('roadmap');
      toast.success('Roadmap generated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate roadmap');
    } finally { setGenerating(false); }
  };

  const handleSaveEdit = async (data) => {
    try {
      const res = await roadmapAPI.update(data);
      setRoadmap(res.data);
      setEditMode(false);
      toast.success('Roadmap updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update roadmap');
    }
  };

  const handleReset = async () => {
    try {
      await roadmapAPI.delete();
      setRoadmap(null);
      setView('form');
      setShowReset(false);
      toast.success('Roadmap deleted');
    } catch (err) {
      toast.error('Failed to delete roadmap');
    }
  };

  const toggleExpand = (idx) => {
    setExpanded(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const nodes = roadmap?.nodes || [];
  const filteredNodes = filter === 'all' ? nodes : nodes.filter(n => n.status === filter);
  const completedCount = nodes.filter(n => n.status === 'completed').length;
  const progressPercent = nodes.length ? Math.round((completedCount / nodes.length) * 100) : 0;

  const handleStatusToggle = async (idx, newStatus) => {
    const newNodes = [...nodes];
    newNodes[idx] = { ...newNodes[idx], status: newStatus };
    const updatedRoadmap = { ...roadmap, nodes: newNodes };
    setRoadmap(updatedRoadmap);
    const newCompleted = newNodes.filter(n => n.status === 'completed').length;
    const newPercent = newNodes.length ? Math.round((newCompleted / newNodes.length) * 100) : 0;
    if (newStatus === 'completed') {
      if (newPercent >= 25 && (newCompleted === 1 || newPercent === 25)) {
        setShowMilestone({ percent: 25 });
        setTimeout(() => setShowMilestone(null), 3000);
      } else if (newPercent >= 50 && (newPercent === 50)) {
        setShowMilestone({ percent: 50 });
        setTimeout(() => setShowMilestone(null), 3000);
      } else if (newPercent >= 75 && (newPercent === 75)) {
        setShowMilestone({ percent: 75 });
        setTimeout(() => setShowMilestone(null), 3000);
      } else if (newPercent >= 100) {
        setShowMilestone({ percent: 100 });
        setTimeout(() => setShowMilestone(null), 3000);
      }
    }
    try {
      await roadmapAPI.updateNode(newNodes[idx]._id || idx, { status: newStatus });
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (view === 'form') {
    return (
      <div className="min-h-screen bg-gray-950 py-8 px-4">
        <GenerateForm onGenerate={handleGenerate} loading={generating} />
      </div>
    );
  }

  if (editMode) {
    return (
      <div className="min-h-screen bg-gray-950 py-8 px-4">
        <EditMode roadmap={roadmap} onSave={handleSaveEdit} onCancel={() => setEditMode(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4 relative">
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce-in { 0% { transform: scale(0.5); opacity: 0; } 60% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-bounce-in { animation: bounce-in 0.5s ease-out; }
        .animate-fade-slide-in { animation: fadeSlideIn 0.3s ease-out; }
      `}</style>
      {showMilestone && <MilestonePopup milestone={showMilestone} />}
      {showReset && <ResetModal onConfirm={handleReset} onCancel={() => setShowReset(false)} />}
      <div className="max-w-4xl mx-auto space-y-6">
        <BackButton to="/dashboard" label="Back to Dashboard" />

        <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 rounded-3xl p-8 lg:p-12 text-white overflow-hidden">
          <Particles count={20} />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-white rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-extrabold mb-2 tracking-tight">{roadmap?.title || 'Your Roadmap'}</h1>
                <p className="text-blue-100/80 text-sm max-w-lg">{roadmap?.description || 'Your personalized career roadmap'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditMode(true)}
                  className="bg-white/15 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-white/25 transition-all">
                  {'\u2699\uFE0F'} Edit
                </button>
                <button onClick={() => setShowReset(true)}
                  className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-300 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-500/30 transition-all">
                  {'\u26A0\uFE0F'} Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/5 p-5 text-center">
            <div className="text-3xl font-extrabold text-white"><CountUp target={nodes.length} /></div>
            <div className="text-xs text-gray-400 mt-1">Total Steps</div>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/5 p-5 text-center">
            <div className="text-3xl font-extrabold text-emerald-400"><CountUp target={completedCount} /></div>
            <div className="text-xs text-gray-400 mt-1">Completed</div>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/5 p-5 text-center">
            <div className="text-3xl font-extrabold text-blue-400"><CountUp target={progressPercent} suffix="%" /></div>
            <div className="text-xs text-gray-400 mt-1">Progress</div>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/5 p-5 text-center">
            <div className="text-3xl font-extrabold text-amber-400"><CountUp target={nodes.length - completedCount} /></div>
            <div className="text-xs text-gray-400 mt-1">Remaining</div>
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/5 p-2 flex gap-2 overflow-x-auto scrollbar-hide">
          {['all', 'pending', 'in_progress', 'completed'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${filter === f ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              {f === 'all' ? 'All' : f === 'pending' ? 'Pending' : f === 'in_progress' ? 'In Progress' : 'Completed'}
              <span className="ml-1.5 text-xs opacity-60">
                {f === 'all' ? nodes.length : nodes.filter(n => n.status === f).length}
              </span>
            </button>
          ))}
        </div>

        <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="space-y-4">
          {filteredNodes.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">{'\uD83D\uDCCC'}</div>
              <p className="text-gray-400 text-sm">No steps found for this filter.</p>
            </div>
          ) : filteredNodes.map((node, fIdx) => {
            const realIdx = nodes.indexOf(node);
            const icon = STEP_ICONS[node.type] || STEP_ICONS.general;
            const isExpanded = expanded[realIdx];
            return (
              <div key={node._id || realIdx}
                className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden transition-all animate-fade-slide-in">
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl shrink-0 border border-white/10">
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-gray-500">Step {realIdx + 1}</span>
                        {node.difficulty && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${DIFFICULTY_badges[node.difficulty] || ''}`}>
                            {node.difficulty}
                          </span>
                        )}
                        {node.estimatedDuration && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/10 text-gray-300 border border-white/10">
                            {node.estimatedDuration}
                          </span>
                        )}
                      </div>
                      <h3 className="text-white font-bold text-sm mt-1">{node.title}</h3>
                      {node.description && !isExpanded && (
                        <p className="text-gray-400 text-xs mt-1 line-clamp-2">{node.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => toggleExpand(realIdx)}
                        className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 text-xs">
                        {isExpanded ? '\u25B2' : '\u25BC'}
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
                      {node.description && <p className="text-gray-300 text-sm">{node.description}</p>}
                      {node.tips && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                          <p className="text-amber-400 text-xs font-bold mb-1">{'\uD83D\uDCA1'} Pro Tips</p>
                          <p className="text-gray-300 text-xs">{node.tips}</p>
                        </div>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        {node.status !== 'completed' && (
                          <button onClick={() => handleStatusToggle(realIdx, 'completed')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/30 border border-emerald-500/30">
                            {'\u2714'} Complete
                          </button>
                        )}
                        {node.status !== 'in_progress' && node.status !== 'completed' && (
                          <button onClick={() => handleStatusToggle(realIdx, 'in_progress')}
                            className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-bold hover:bg-blue-500/30 border border-blue-500/30">
                            {'\u25B6'} Start
                          </button>
                        )}
                        {node.status !== 'pending' && (
                          <button onClick={() => handleStatusToggle(realIdx, 'pending')}
                            className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-xs font-bold hover:bg-white/10 border border-white/10">
                            {'\u21BA'} Reset
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}