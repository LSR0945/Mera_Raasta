import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ educationLevel: '12th', interests: [], skills: [], budget: 'medium' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const interests = ['Technology', 'Science', 'Business', 'Arts', 'Healthcare', 'Engineering', 'Design', 'Law'];
  const skills = ['Programming', 'Mathematics', 'Communication', 'Leadership', 'Writing', 'Analysis', 'Creativity', 'Problem Solving'];

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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex gap-2 mb-8">{['Level', 'Interests', 'Skills', 'Budget'].map((l, i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary-500' : 'bg-gray-200'}`} />)}</div>
      {step === 0 && (<div><h1 className="text-2xl font-bold mb-6">What's your education level?</h1>
        <div className="grid grid-cols-2 gap-3">{['10th', '12th', 'undergraduate', 'postgraduate'].map((l) => (
          <button key={l} onClick={() => { setForm({ ...form, educationLevel: l }); setStep(1); }} className={`p-4 rounded-xl border-2 text-left font-semibold capitalize transition-all ${form.educationLevel === l ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>{l}</button>
        ))}</div></div>)}
      {step === 1 && (<div><h1 className="text-2xl font-bold mb-6">Select your interests</h1>
        <div className="flex flex-wrap gap-2">{interests.map((i) => (
          <button key={i} onClick={() => toggleItem('interests', i)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${form.interests.includes(i) ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{i}</button>
        ))}</div>
        <button onClick={() => setStep(2)} disabled={form.interests.length === 0} className="mt-6 bg-primary-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary-700 disabled:opacity-50">Next</button></div>)}
      {step === 2 && (<div><h1 className="text-2xl font-bold mb-6">Select your skills</h1>
        <div className="flex flex-wrap gap-2">{skills.map((s) => (
          <button key={s} onClick={() => toggleItem('skills', s)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${form.skills.includes(s) ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s}</button>
        ))}</div>
        <button onClick={() => setStep(3)} disabled={form.skills.length === 0} className="mt-6 bg-primary-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary-700 disabled:opacity-50">Next</button></div>)}
      {step === 3 && (<div><h1 className="text-2xl font-bold mb-6">Education budget</h1>
        <div className="grid grid-cols-2 gap-3">{['low', 'medium', 'high', 'very_high'].map((b) => (
          <button key={b} onClick={() => setForm({ ...form, budget: b })} className={`p-4 rounded-xl border-2 text-left font-semibold capitalize transition-all ${form.budget === b ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>{b.replace('_', ' ')}</button>
        ))}</div>
        <button onClick={handleSubmit} disabled={loading} className="mt-6 bg-primary-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary-700 disabled:opacity-50">{loading ? 'Saving...' : 'Complete Onboarding'}</button></div>)}
    </div>
  );
}
