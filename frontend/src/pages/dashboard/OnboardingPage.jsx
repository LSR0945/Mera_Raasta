import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { INDIAN_STATES } from '../../data/indiaGeography';

// ═══ Onboarding Page — Government real data, instant load ═══
export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ educationLevel: '12th', interests: [], skills: [], budget: 'medium', state: '', district: '', city: '' });
  const [loading, setLoading] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const navigate = useNavigate();

  const interests = ['Technology', 'Science', 'Business', 'Arts', 'Healthcare', 'Engineering', 'Design', 'Law'];
  const skills = ['Programming', 'Mathematics', 'Communication', 'Leadership', 'Writing', 'Analysis', 'Creativity', 'Problem Solving'];

  // ═══ States list — instant load, no API ═══
  const statesList = useMemo(() => INDIAN_STATES.map(s => ({ name: s.state, code: s.stateCode })), []);

  // ═══ Districts — state select karne pe instantly aayenge ═══
  const districtsList = useMemo(() => {
    if (!form.state) return [];
    const found = INDIAN_STATES.find(s => s.state === form.state);
    return found ? found.districts : [];
  }, [form.state]);

  // ═══ Cities — district ke major cities (district name hi city hai for most) ═══
  const citiesList = useMemo(() => {
    if (!form.district) return [];
    // Government data mein district name hi city hai
    // Major district headquarters cities add karo
    const cityMap = {
      'Mumbai': ['Mumbai', 'Andheri', 'Bandra', 'Borivali', 'Dadar', 'Goregaon', 'Kurla', 'Mulund', 'Powai', 'Thane'],
      'Delhi': ['New Delhi', 'Connaught Place', 'Karol Bagh', 'Lajpat Nagar', 'Rohini', 'Dwarka', 'Saket', 'Pitampura'],
      'Chennai': ['Chennai', 'Adyar', 'Anna Nagar', 'T. Nagar', 'Velachery', 'Sholinganallur', 'Porur'],
      'Bangalore': ['Bangalore', 'Whitefield', 'Koramangala', 'HSR Layout', 'Indiranagar', 'Jayanagar', 'Electronic City'],
      'Hyderabad': ['Hyderabad', 'Secunderabad', 'HITEC City', 'Gachibowli', 'Madhapur', 'Kukatpally'],
      'Kolkata': ['Kolkata', 'Salt Lake', 'New Town', 'Park Street', 'Howrah', 'Dum Dum'],
      'Pune': ['Pune', 'Hinjewadi', 'Kharadi', 'Wakad', 'Baner', 'Aundh', 'Viman Nagar'],
      'Ahmedabad': ['Ahmedabad', 'SG Highway', 'Vastrapur', 'Satellite', 'Bopal', 'Gota'],
      'Jaipur': ['Jaipur', 'Malviya Nagar', 'Mansarovar', 'Vaishali Nagar', 'Jagatpura'],
      'Lucknow': ['Lucknow', 'Gomti Nagar', 'Hazratganj', 'Alambagh', 'Indira Nagar'],
      'Kanpur': ['Kanpur', 'Civil Lines', 'Swaroop Nagar', 'Kidwai Nagar'],
      'Nagpur': ['Nagpur', 'Dharampeth', 'Sadar', 'Wardhaman Nagar'],
      'Indore': ['Indore', 'Vijay Nagar', 'Palasia', 'AB Road'],
      'Bhopal': ['Bhopal', 'MP Nagar', 'Kolar Road', 'Habibganj'],
      'Patna': ['Patna', 'Boring Road', 'Bailey Road', 'Kankarbagh'],
      'Visakhapatnam': ['Visakhapatnam', 'MVP Colony', 'Dwaraka Nagar', 'Gajuwaka'],
      'Surat': ['Surat', 'Athwa', 'Vesu', 'Adajan'],
      'Coimbatore': ['Coimbatore', 'RS Puram', 'Gandhipuram', 'Peelamedu'],
      'Kochi': ['Kochi', 'Kakkanad', 'Edappally', 'Palarivattom'],
      'Thiruvananthapuram': ['Thiruvananthapuram', 'Kazhakootam', 'Vattiyoorkavu', 'Neyyattinkara'],
      'Guwahati': ['Guwahati', 'Fatasil', 'GS Road', 'Zoo Road'],
      'Chandigarh': ['Chandigarh', 'Sector 17', 'Sector 22', 'Sector 35'],
    };

    // District ke liye cities dhundho
    const districtCities = cityMap[form.district] || [];
    // Fallback: district name hi city hai
    const baseCities = [form.district, ...districtCities];
    return [...new Set(baseCities)].filter(c =>
      !citySearch || c.toLowerCase().includes(citySearch.toLowerCase())
    );
  }, [form.district, citySearch]);

  const toggleItem = (field, item) => {
    setForm(prev => ({ ...prev, [field]: prev[field].includes(item) ? prev[field].filter(i => i !== item) : [...prev[field], item] }));
  };

  const handleStateChange = (stateName) => {
    setForm(prev => ({ ...prev, state: stateName, district: '', city: '' }));
  };

  const handleDistrictChange = (districtName) => {
    setForm(prev => ({ ...prev, district: districtName, city: '' }));
    setCitySearch('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.put('/profile', form);
      await api.post('/profile/complete-onboarding', form);
      toast.success('Onboarding complete!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = 6;
  const stepLabels = ['Level', 'Location', 'Interests', 'Skills', 'Budget', 'Done'];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="flex gap-2 mb-8">
        {stepLabels.map((l, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-blue-500' : 'bg-gray-700'}`} />
        ))}
      </div>

      {/* Step 0: Education Level */}
      {step === 0 && (
        <div>
          <h1 className="text-2xl font-bold mb-6 text-white">What's your education level?</h1>
          <div className="grid grid-cols-2 gap-3">
            {['10th', '12th', 'undergraduate', 'postgraduate'].map((l) => (
              <button key={l} onClick={() => { setForm({ ...form, educationLevel: l }); setStep(1); }}
                className={`p-4 rounded-xl border-2 text-left font-semibold capitalize transition-all ${form.educationLevel === l ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/10 text-gray-300 hover:border-white/20 bg-white/5'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Location — 100% Government Data */}
      {step === 1 && (
        <div>
          <h1 className="text-2xl font-bold mb-6 text-white">Where are you from?</h1>
          <div className="space-y-4">
            {/* State */}
            <div>
              <label className="text-sm text-gray-400 mb-1 block">State *</label>
              <select value={form.state} onChange={(e) => handleStateChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50">
                <option value="">Select State</option>
                {statesList.map(s => <option key={s.code} value={s.name}>{s.name}</option>)}
              </select>
            </div>

            {/* District */}
            {form.state && districtsList.length > 0 && (
              <div>
                <label className="text-sm text-gray-400 mb-1 block">District *</label>
                <select value={form.district} onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50 max-h-60 overflow-y-auto">
                  <option value="">Select District</option>
                  {districtsList.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <p className="text-xs text-gray-500 mt-1">{districtsList.length} districts in {form.state}</p>
              </div>
            )}

            {/* City */}
            {form.district && citiesList.length > 0 && (
              <div>
                <label className="text-sm text-gray-400 mb-1 block">City *</label>
                <input type="text" value={citySearch} onChange={(e) => setCitySearch(e.target.value)}
                  placeholder="Search city..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm mb-2 focus:outline-none focus:border-blue-500/50" />
                <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50 max-h-60 overflow-y-auto">
                  <option value="">Select City</option>
                  {citiesList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
          </div>
          <button onClick={() => setStep(2)} disabled={!form.state || !form.district || !form.city}
            className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50">
            Next
          </button>
        </div>
      )}

      {/* Step 2: Interests */}
      {step === 2 && (
        <div>
          <h1 className="text-2xl font-bold mb-6 text-white">Select your interests</h1>
          <div className="flex flex-wrap gap-2">
            {interests.map((i) => (
              <button key={i} onClick={() => toggleItem('interests', i)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${form.interests.includes(i) ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5'}`}>
                {i}
              </button>
            ))}
          </div>
          <button onClick={() => setStep(3)} disabled={form.interests.length === 0}
            className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50">
            Next
          </button>
        </div>
      )}

      {/* Step 3: Skills */}
      {step === 3 && (
        <div>
          <h1 className="text-2xl font-bold mb-6 text-white">Select your skills</h1>
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <button key={s} onClick={() => toggleItem('skills', s)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${form.skills.includes(s) ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5'}`}>
                {s}
              </button>
            ))}
          </div>
          <button onClick={() => setStep(4)} disabled={form.skills.length === 0}
            className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50">
            Next
          </button>
        </div>
      )}

      {/* Step 4: Budget */}
      {step === 4 && (
        <div>
          <h1 className="text-2xl font-bold mb-6 text-white">Education budget</h1>
          <div className="grid grid-cols-2 gap-3">
            {['low', 'medium', 'high', 'very_high'].map((b) => (
              <button key={b} onClick={() => setForm({ ...form, budget: b })}
                className={`p-4 rounded-xl border-2 text-left font-semibold capitalize transition-all ${form.budget === b ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/10 text-gray-300 bg-white/5'}`}>
                {b.replace('_', ' ')}
              </button>
            ))}
          </div>
          <button onClick={handleSubmit} disabled={loading}
            className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Saving...' : 'Complete Onboarding'}
          </button>
        </div>
      )}
    </div>
  );
}