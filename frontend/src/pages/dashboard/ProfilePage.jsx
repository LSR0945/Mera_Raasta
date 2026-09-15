import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import BackButton from '../../components/common/BackButton';

const INTEREST_OPTIONS = ['Technology', 'Science', 'Mathematics', 'Commerce', 'Arts', 'Medicine', 'Engineering', 'Law', 'Design', 'Business', 'Education', 'Agriculture'];
const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced'];
const EDUCATION_LEVELS = ['10th', '12th', 'undergraduate', 'postgraduate'];
const BUDGET_OPTIONS = ['low', 'medium', 'high', 'very_high'];
const BUDGET_LABELS = { low: '₹ Budget-Friendly', medium: '₹₹ Moderate', high: '₹₹₹ Premium', very_high: '₹₹₹₹ No Limit' };

function PhotoUpload({ currentAvatar, onUpload, role }) {
  const [preview, setPreview] = useState(currentAvatar || null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const GRADIENT = { student: 'from-blue-500 to-indigo-600', parent: 'from-emerald-500 to-teal-600', mentor: 'from-violet-500 to-purple-600' };

  const compressImage = (file) => new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      const max = 800;
      if (width > max || height > max) { const s = max / Math.max(width, height); width = Math.round(width * s); height = Math.round(height * s); }
      const c = document.createElement('canvas'); c.width = width; c.height = height;
      c.getContext('2d').drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      c.toBlob((blob) => {
        if (!blob) return reject(new Error('Compression failed'));
        const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(blob);
      }, 'image/jpeg', 0.7);
    };
    img.onerror = reject; img.src = url;
  });

  const processFile = async (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error('Max 2MB!');
    setUploading(true);
    try { const b = await compressImage(file); setPreview(b); await onUpload(b); toast.success('Photo updated!'); }
    catch (e) { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  return (
    <div className="flex flex-col items-center">
      <div onDragOver={(e) => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); e.dataTransfer.files?.[0] && processFile(e.dataTransfer.files[0]); }}
        onClick={() => inputRef.current?.click()}
        className={`relative group cursor-pointer w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-4 transition-all duration-300 ${dragActive ? 'border-blue-500 scale-105 shadow-xl shadow-blue-500/25' : 'border-white/20 shadow-xl hover:shadow-2xl hover:scale-105'}`}>
        {preview ? <img src={preview} alt="Profile" className="w-full h-full object-cover" /> : (
          <div className={`w-full h-full bg-gradient-to-br ${GRADIENT[role] || GRADIENT.student} flex items-center justify-center`}>
            <svg className="w-12 h-12 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {uploading ? <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (
            <span className="text-xs font-bold text-white">Change Photo</span>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} className="hidden" />
      </div>
      <p className="text-[11px] text-white/40 mt-2">Click or drag to upload</p>
    </div>
  );
}

function SectionCard({ title, icon, children, className = '' }) {
  return (
    <div className={`bg-white rounded-3xl border border-gray-100 overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <h3 className="text-base font-extrabold text-gray-900">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text', disabled = false, ...props }) {
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed" {...props} />;
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={onChange}
      className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm font-medium text-gray-900 focus:border-blue-500 focus:ring-0 outline-none transition-all bg-white appearance-none">
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>{typeof o === 'string' ? o : o.label}</option>)}
    </select>
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 outline-none resize-none transition-all" />;
}

function ChipSelect({ options, selected, onToggle, multi = true }) {
  const toggle = (val) => {
    if (multi) {
      onToggle(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
    } else {
      onToggle(selected === val ? '' : val);
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => {
        const val = typeof o === 'string' ? o : o.value;
        const label = typeof o === 'string' ? o : o.label;
        const active = multi ? selected.includes(val) : selected === val;
        return (
          <button key={val} type="button" onClick={() => toggle(val)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2 ${active ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-100'}`}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  const [form, setForm] = useState({
    name: user?.name || '', phone: user?.phone || '', bio: user?.bio || '',
  });

  const [edu, setEdu] = useState({
    educationLevel: '', board: '', college: '', stream: '', yearOfStudy: '',
    tenthMarks: { percentage: '', year: '', board: '' },
    twelfthMarks: { percentage: '', year: '', board: '', stream: '' },
  });

  const [interests, setInterests] = useState([]);
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState({ name: '', level: 'beginner' });
  const [career, setCareer] = useState({ shortTerm: '', longTerm: '', dreamJob: '', preferredWorkType: '' });
  const [prefs, setPrefs] = useState({ budget: '', studyHoursPerDay: '', preferredStudyTime: '', preferredLanguage: '' });
  const [location, setLocation] = useState({ city: '', state: '', willingToRelocate: false });

  const updateTenth = (field, val) => setEdu(e => ({ ...e, tenthMarks: { ...e.tenthMarks, [field]: val } }));
  const update12th = (field, val) => setEdu(e => ({ ...e, twelfthMarks: { ...e.twelfthMarks, [field]: val } }));

  useEffect(() => {
    api.get('/profile').then(({ data }) => {
      const p = data.data.profile;
      if (p) {
        setProfile(p);
        setForm({ name: user?.name || '', phone: p.phone || user?.phone || '', bio: p.bio || user?.bio || '' });
        setEdu({
          educationLevel: p.educationLevel || '', board: p.board || '', college: p.college || '',
          stream: p.stream || '', yearOfStudy: p.yearOfStudy || '',
          tenthMarks: p.tenthMarks || { percentage: '', year: '', board: '' },
          twelfthMarks: p.twelfthMarks || { percentage: '', year: '', board: '', stream: '' },
        });
        setInterests(p.interests || []);
        setSkills(p.skills || []);
        setCareer(p.careerGoals || { shortTerm: '', longTerm: '', dreamJob: '', preferredWorkType: '' });
        setPrefs({ budget: p.budget || '', studyHoursPerDay: p.studyHoursPerDay || '', preferredStudyTime: p.preferredStudyTime || '', preferredLanguage: p.preferredLanguage || '' });
        setLocation(p.location || { city: '', state: '', willingToRelocate: false });
      }
      setForm(f => ({ ...f, name: user?.name || f.name }));
    }).catch(() => {});
  }, [user]);

  const handlePhotoUpload = async (base64) => { await updateProfile({ avatar: base64 }); };

  const saveSection = async (section) => {
    setSaving(true);
    try {
      if (section === 'personal') {
        await updateProfile({ name: form.name, phone: form.phone, bio: form.bio });
        await api.put('/profile', { phone: form.phone, bio: form.bio });
      } else if (section === 'education') {
        await api.put('/profile', {
          educationLevel: edu.educationLevel, board: edu.board, college: edu.college,
          stream: edu.stream, yearOfStudy: edu.yearOfStudy ? Number(edu.yearOfStudy) : undefined,
          tenthMarks: edu.tenthMarks.percentage ? { percentage: Number(edu.tenthMarks.percentage), year: Number(edu.tenthMarks.year), board: edu.tenthMarks.board } : undefined,
          twelfthMarks: edu.twelfthMarks.percentage ? { percentage: Number(edu.twelfthMarks.percentage), year: Number(edu.twelfthMarks.year), board: edu.twelfthMarks.board, stream: edu.twelfthMarks.stream } : undefined,
        });
        await updateProfile({ name: form.name, class: edu.educationLevel === '12th' ? '12th' : edu.educationLevel === '10th' ? '10th' : edu.college || '' });
      } else if (section === 'interests') {
        await api.put('/profile', { interests });
      } else if (section === 'skills') {
        await api.put('/profile', { skills });
      } else if (section === 'career') {
        await api.put('/profile', { careerGoals: career });
      } else if (section === 'preferences') {
        await api.put('/profile', { ...prefs, location });
      }
      toast.success('Saved!');
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const addSkill = () => {
    if (!newSkill.name.trim()) return;
    setSkills([...skills, { name: newSkill.name.trim(), level: newSkill.level }]);
    setNewSkill({ name: '', level: 'beginner' });
  };
  const removeSkill = (i) => setSkills(skills.filter((_, idx) => idx !== i));

  const TABS = [
    { id: 'personal', label: 'Personal', icon: '👤' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'interests', label: 'Interests', icon: '💡' },
    { id: 'skills', label: 'Skills', icon: '⚡' },
    { id: 'career', label: 'Career Goals', icon: '🎯' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
  ];

  const completionPct = () => {
    let filled = 0, total = 10;
    if (form.name) filled++; if (edu.educationLevel) filled++; if (interests.length) filled++;
    if (skills.length) filled++; if (career.dreamJob) filled++; if (career.shortTerm) filled++;
    if (career.longTerm) filled++; if (prefs.budget) filled++; if (location.city) filled++;
    if (edu.tenthMarks.percentage || edu.twelfthMarks.percentage) filled++;
    return Math.round((filled / total) * 100);
  };

  return (
    <div className="max-w-[1100px] mx-auto space-y-6">
      <BackButton to="/dashboard" label="Back to Dashboard" />

      {/* Header */}
      <div className="relative bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 rounded-3xl p-6 sm:p-8 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-400 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-400 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
          <PhotoUpload currentAvatar={user?.avatar} onUpload={handlePhotoUpload} role={user?.role || 'student'} />
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold">{user?.name}</h1>
            <p className="text-gray-400 text-sm mt-1">{user?.email}</p>
            <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-sm border border-white/10 capitalize">{user?.role}</span>
              {profile?.onboardingCompleted && <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">✓ Complete</span>}
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/20">{completionPct()}% Filled</span>
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="relative z-10 mt-6">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-400 to-violet-400 rounded-full transition-all duration-700" style={{ width: `${completionPct()}%` }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === t.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-100'}`}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Personal */}
      {activeTab === 'personal' && (
        <SectionCard title="Personal Information" icon="👤">
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Full Name"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your full name" /></Field>
            <Field label="Email Address"><Input value={user?.email} disabled /></Field>
            <Field label="Phone Number"><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" type="tel" /></Field>
            <Field label="Class / Grade"><Input value={user?.class || ''} disabled placeholder="Set via education" /></Field>
          </div>
          <div className="mt-5"><Field label="Bio"><TextArea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Tell us about yourself and your goals..." rows={4} /></Field></div>
          <div className="mt-6 flex justify-end">
            <button onClick={() => saveSection('personal')} disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2">
              {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : <>Save Personal Info <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></>}
            </button>
          </div>
        </SectionCard>
      )}

      {/* Education */}
      {activeTab === 'education' && (
        <SectionCard title="Education Details" icon="🎓">
          <Field label="Education Level" className="mb-5">
            <ChipSelect options={EDUCATION_LEVELS} selected={edu.educationLevel} onToggle={(v) => setEdu({ ...edu, educationLevel: v })} multi={false} />
          </Field>
          {edu.educationLevel && (
            <>
              {edu.educationLevel === '10th' && (
                <div className="grid sm:grid-cols-3 gap-5 mb-5">
                  <Field label="Board"><Input value={edu.board} onChange={e => setEdu({ ...edu, board: e.target.value })} placeholder="CBSE / ICSE / State" /></Field>
                  <Field label="Percentage / CGPA"><Input value={edu.tenthMarks.percentage} onChange={e => updateTenth('percentage', e.target.value)} placeholder="e.g. 85" type="number" /></Field>
                  <Field label="Year of Passing"><Input value={edu.tenthMarks.year} onChange={e => updateTenth('year', e.target.value)} placeholder="2023" type="number" /></Field>
                </div>
              )}
              {edu.educationLevel === '12th' && (
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <Field label="Board"><Input value={edu.board} onChange={e => setEdu({ ...edu, board: e.target.value })} placeholder="CBSE / ICSE / State" /></Field>
                    <Field label="Stream"><Input value={edu.stream} onChange={e => setEdu({ ...edu, stream: e.target.value })} placeholder="Science / Commerce / Arts" /></Field>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <Field label="Percentage / CGPA"><Input value={edu.twelfthMarks.percentage} onChange={e => update12th('percentage', e.target.value)} placeholder="e.g. 88" type="number" /></Field>
                    <Field label="Year of Passing"><Input value={edu.twelfthMarks.year} onChange={e => update12th('year', e.target.value)} placeholder="2025" type="number" /></Field>
                  </div>
                </div>
              )}
              {(edu.educationLevel === 'undergraduate' || edu.educationLevel === 'postgraduate') && (
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <Field label="College / University"><Input value={edu.college} onChange={e => setEdu({ ...edu, college: e.target.value })} placeholder="IIT / NIT / University name" /></Field>
                    <Field label="Stream / Branch"><Input value={edu.stream} onChange={e => setEdu({ ...edu, stream: e.target.value })} placeholder="CSE / ECE / Mechanical" /></Field>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <Field label="Year of Study"><Input value={edu.yearOfStudy} onChange={e => setEdu({ ...edu, yearOfStudy: e.target.value })} placeholder="2" type="number" /></Field>
                    <Field label="Board (12th)"><Input value={edu.board} onChange={e => setEdu({ ...edu, board: e.target.value })} placeholder="Previous board" /></Field>
                  </div>
                </div>
              )}
            </>
          )}
          <div className="mt-6 flex justify-end">
            <button onClick={() => saveSection('education')} disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2">
              {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : <>Save Education <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></>}
            </button>
          </div>
        </SectionCard>
      )}

      {/* Interests */}
      {activeTab === 'interests' && (
        <SectionCard title="Your Interests" icon="💡">
          <p className="text-sm text-gray-500 mb-4">Select areas that excite you — we'll personalize your career recommendations.</p>
          <ChipSelect options={INTEREST_OPTIONS} selected={interests} onToggle={setInterests} />
          <div className="mt-6 flex justify-end">
            <button onClick={() => saveSection('interests')} disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2">
              {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : <>Save Interests <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></>}
            </button>
          </div>
        </SectionCard>
      )}

      {/* Skills */}
      {activeTab === 'skills' && (
        <SectionCard title="Your Skills" icon="⚡">
          <div className="flex flex-wrap gap-2 mb-6">
            {skills.map((s, i) => (
              <span key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-sm font-semibold text-blue-700">
                {s.name} <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-100 px-1.5 py-0.5 rounded">{s.level}</span>
                <button onClick={() => removeSkill(i)} className="text-blue-400 hover:text-red-500 transition-colors ml-1">×</button>
              </span>
            ))}
            {!skills.length && <p className="text-sm text-gray-400">No skills added yet</p>}
          </div>
          <div className="flex gap-3 items-end">
            <Field label="Skill Name" className="flex-1"><Input value={newSkill.name} onChange={e => setNewSkill({ ...newSkill, name: e.target.value })} placeholder="e.g. Python, React, Public Speaking" /></Field>
            <Field label="Level">
              <select value={newSkill.level} onChange={e => setNewSkill({ ...newSkill, level: e.target.value })}
                className="px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm font-medium focus:border-blue-500 focus:ring-0 outline-none bg-white">
                {SKILL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>
            <button onClick={addSkill} className="px-5 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25 whitespace-nowrap">+ Add</button>
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={() => saveSection('skills')} disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2">
              {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : <>Save Skills <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></>}
            </button>
          </div>
        </SectionCard>
      )}

      {/* Career Goals */}
      {activeTab === 'career' && (
        <SectionCard title="Career Goals" icon="🎯">
          <div className="space-y-5">
            <Field label="Dream Job"><Input value={career.dreamJob} onChange={e => setCareer({ ...career, dreamJob: e.target.value })} placeholder="e.g. Software Engineer at Google" /></Field>
            <Field label="Short-Term Goal (1 year)"><TextArea value={career.shortTerm} onChange={e => setCareer({ ...career, shortTerm: e.target.value })} placeholder="What do you want to achieve in the next year?" rows={2} /></Field>
            <Field label="Long-Term Goal (5+ years)"><TextArea value={career.longTerm} onChange={e => setCareer({ ...career, longTerm: e.target.value })} placeholder="Where do you see yourself in 5 years?" rows={2} /></Field>
            <Field label="Preferred Work Type">
              <ChipSelect options={['Remote', 'Hybrid', 'Office', 'Freelance', 'Startup', 'Government']} selected={career.preferredWorkType} onToggle={(v) => setCareer({ ...career, preferredWorkType: v })} multi={false} />
            </Field>
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={() => saveSection('career')} disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2">
              {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : <>Save Goals <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></>}
            </button>
          </div>
        </SectionCard>
      )}

      {/* Preferences */}
      {activeTab === 'preferences' && (
        <SectionCard title="Study Preferences" icon="⚙️">
          <div className="space-y-5">
            <Field label="Budget">
              <ChipSelect options={BUDGET_OPTIONS.map(b => ({ value: b, label: BUDGET_LABELS[b] }))} selected={prefs.budget} onToggle={(v) => setPrefs({ ...prefs, budget: v })} multi={false} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Study Hours / Day"><Input value={prefs.studyHoursPerDay} onChange={e => setPrefs({ ...prefs, studyHoursPerDay: e.target.value })} placeholder="e.g. 4" type="number" /></Field>
              <Field label="Preferred Study Time">
                <ChipSelect options={['Morning', 'Afternoon', 'Evening', 'Night']} selected={prefs.preferredStudyTime} onToggle={(v) => setPrefs({ ...prefs, preferredStudyTime: v })} multi={false} />
              </Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Preferred Language"><Input value={prefs.preferredLanguage} onChange={e => setPrefs({ ...prefs, preferredLanguage: e.target.value })} placeholder="Hindi / English / Both" /></Field>
              <Field label="City"><Input value={location.city} onChange={e => setLocation({ ...location, city: e.target.value })} placeholder="e.g. Delhi, Mumbai" /></Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="State"><Input value={location.state} onChange={e => setLocation({ ...location, state: e.target.value })} placeholder="e.g. Maharashtra" /></Field>
              <Field label="Willing to Relocate?" className="flex items-end pb-1">
                <button type="button" onClick={() => setLocation({ ...location, willingToRelocate: !location.willingToRelocate })}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm border-2 transition-all ${location.willingToRelocate ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                  {location.willingToRelocate ? '✓ Yes' : 'No'}
                </button>
              </Field>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={() => saveSection('preferences')} disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2">
              {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : <>Save Preferences <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></>}
            </button>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
