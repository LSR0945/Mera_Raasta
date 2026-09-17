import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { locationAPI } from '../../api/location';

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ educationLevel: '12th', interests: [], skills: [], budget: 'medium', state: '', district: '', city: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Location data
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [cities, setCities] = useState([]);

  const interests = ['Technology', 'Science', 'Business', 'Arts', 'Healthcare', 'Engineering', 'Design', 'Law'];
  const skills = ['Programming', 'Mathematics', 'Communication', 'Leadership', 'Writing', 'Analysis', 'Creativity', 'Problem Solving'];

  // Load states on mount
  useEffect(() => {
    locationAPI.getStates().then(res => setStates(res.data?.data?.states || [])).catch(() => {});
  }, []);

  // Load districts when state changes
  useEffect(() => {
    if (form.state) {
      locationAPI.getDistricts(form.state).then(res => {
        setDistricts(res.data?.data?.districts || []);
        setForm(prev => ({ ...prev, district: '', city: '' }));
        setCities([]);
      }).catch(() => {});
    }
  }, [form.state]);

  // Load cities when district changes
  useEffect(() => {
    if (form.state && form.district) {
      locationAPI.getCities(form.state, form.district).then(res => setCities(res.data?.data?.cities || [])).catch(() => {});
    }
  }, [form.district, form.state]);

  const toggleItem = (field, item) => {
    setForm(prev => ({ ...prev, [field]: prev[field].includes(item) ? prev[field].filter(i => i !== item) : [...prev[field], item] }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.put('/profile', form);
      await api.post('/profile/complete-onboarding', form);
      toast.success('Onboarding complete!'); navigate('/dashboard');
    } catch (err) { toast.error('Failed to save'); } finally { setLoading(false); }
  };

  const totalSteps = 6;
  const stepLabels = ['Level', 'Location', 'Interests', 'Skills', 'Budget', 'Done'];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex gap-2 mb-8">{stepLabels.map((l, i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-blue-500' : 'bg-gray-700'}`} />)}</div>

      {/* Step 0: Education Level */}
      {step === 0 && (<div><h1 className="text-2xl font-bold mb-6 text-white">What's your education level?</h1>
        <div className="grid grid-cols-2 gap-3">{['10th', '12th', 'undergraduate', 'postgraduate'].map((l) => (
          <button key={l} onClick={() => { setForm({ ...form, educationLevel: l }); setStep(1); }} className={`p-4 rounded-xl border-2 text-left font-semibold capitalize transition-all ${form.educationLevel === l ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/10 text-gray-300 hover:border-white/20 bg-white/5'}`}>{l}</button>
        ))}</div></div>)}

      {/* Step 1: Location */}
      {step === 1 && (<div><h1 className="text-2xl font-bold mb-6 text-white">Where are you from?</h1>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">State *</label>
            <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50">
              <option value="">Select State</option>
              {states.map(s => <option key={s.stateCode} value={s.stateCode}>{s.state}</option>)}
            </select>
          </div>
          {districts.length > 0 && (
            <div>
              <label className="text-sm text-gray-400 mb-1 block">District *</label>
              <select value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50">
                <option value="">Select District</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}
          {cities.length > 0 && (
            <div>
              <label className="text-sm text-gray-400 mb-1 block">City *</label>
              <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50">
                <option value="">Select City</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
        </div>
        <button onClick={() => setStep(2)} disabled={!form.state || !form.district || !form.city} className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50">Next</button></div>)}

      {/* Step 2: Interests */}
      {step === 2 && (<div><h1 className="text-2xl font-bold mb-6 text-white">Select your interests</h1>
        <div className="flex flex-wrap gap-2">{interests.map((i) => (
          <button key={i} onClick={() => toggleItem('interests', i)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${form.interests.includes(i) ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5'}`}>{i}</button>
        ))}</div>
        <button onClick={() => setStep(3)} disabled={form.interests.length === 0} className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50">Next</button></div>)}

      {/* Step 3: Skills */}
      {step === 3 && (<div><h1 className="text-2xl font-bold mb-6 text-white">Select your skills</h1>
        <div className="flex flex-wrap gap-2">{skills.map((s) => (
          <button key={s} onClick={() => toggleItem('skills', s)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${form.skills.includes(s) ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5'}`}>{s}</button>
        ))}</div>
        <button onClick={() => setStep(4)} disabled={form.skills.length === 0} className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50">Next</button></div>)}

      {/* Step 4: Budget */}
      {step === 4 && (<div><h1 className="text-2xl font-bold mb-6 text-white">Education budget</h1>
        <div className="grid grid-cols-2 gap-3">{['low', 'medium', 'high', 'very_high'].map((b) => (
          <button key={b} onClick={() => setForm({ ...form, budget: b })} className={`p-4 rounded-xl border-2 text-left font-semibold capitalize transition-all ${form.budget === b ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/10 text-gray-300 bg-white/5'}`}>{b.replace('_', ' ')}</button>
        ))}</div>
        <button onClick={handleSubmit} disabled={loading} className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50">{loading ? 'Saving...' : 'Complete Onboarding'}</button></div>)}
    </div>
  );
}