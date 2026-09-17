import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { INDIAN_STATES } from '../../data/indiaGeography';

// ═══ Custom Dark Dropdown — Native select ki jagah ═══
function DarkDropdown({ label, value, options, placeholder, onSelect, searchPlaceholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = options.filter(o => !search || o.toLowerCase().includes(search.toLowerCase()));
  const displayValue = value || placeholder;

  return (
    <div ref={ref} className="relative">
      <label className="text-sm text-gray-400 mb-1 block">{label}</label>
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-left text-sm transition-all hover:border-blue-500/30 focus:border-blue-500/50 focus:outline-none">
        <span className={value ? 'text-white' : 'text-gray-500'}>{displayValue}</span>
        <span className="absolute right-4 top-[2.3rem] text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
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

// ═══ Onboarding Page — Government real data ═══
export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ educationLevel: '12th', interests: [], skills: [], budget: 'medium', state: '', district: '', city: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const interests = ['Technology', 'Science', 'Business', 'Arts', 'Healthcare', 'Engineering', 'Design', 'Law'];
  const skills = ['Programming', 'Mathematics', 'Communication', 'Leadership', 'Writing', 'Analysis', 'Creativity', 'Problem Solving'];

  const statesList = useMemo(() => INDIAN_STATES.map(s => s.state), []);

  const districtsList = useMemo(() => {
    if (!form.state) return [];
    const found = INDIAN_STATES.find(s => s.state === form.state);
    return found ? found.districts : [];
  }, [form.state]);

  const citiesList = useMemo(() => {
    if (!form.district) return [form.district];
    const cityMap = {
      'Mumbai': ['Mumbai', 'Andheri', 'Bandra', 'Borivali', 'Dadar', 'Goregaon', 'Kurla', 'Powai', 'Thane'],
      'Delhi': ['New Delhi', 'Connaught Place', 'Karol Bagh', 'Lajpat Nagar', 'Rohini', 'Dwarka', 'Saket'],
      'Chennai': ['Chennai', 'Adyar', 'Anna Nagar', 'T. Nagar', 'Velachery', 'Sholinganallur'],
      'Bangalore Urban': ['Bangalore', 'Whitefield', 'Koramangala', 'HSR Layout', 'Indiranagar', 'Electronic City'],
      'Hyderabad': ['Hyderabad', 'Secunderabad', 'HITEC City', 'Gachibowli', 'Madhapur', 'Kukatpally'],
      'Kolkata': ['Kolkata', 'Salt Lake', 'New Town', 'Park Street', 'Howrah'],
      'Pune': ['Pune', 'Hinjewadi', 'Kharadi', 'Wakad', 'Baner', 'Viman Nagar'],
      'Ahmedabad': ['Ahmedabad', 'SG Highway', 'Vastrapur', 'Satellite', 'Bopal'],
      'Jaipur': ['Jaipur', 'Malviya Nagar', 'Mansarovar', 'Vaishali Nagar', 'Jagatpura'],
      'Lucknow': ['Lucknow', 'Gomti Nagar', 'Hazratganj', 'Alambagh', 'Indira Nagar'],
      'Kanpur Nagar': ['Kanpur', 'Civil Lines', 'Swaroop Nagar', 'Kidwai Nagar'],
      'Nagpur': ['Nagpur', 'Dharampeth', 'Sadar', 'Wardhaman Nagar'],
      'Indore': ['Indore', 'Vijay Nagar', 'Palasia', 'AB Road'],
      'Bhopal': ['Bhopal', 'MP Nagar', 'Kolar Road', 'Habibganj'],
      'Patna': ['Patna', 'Boring Road', 'Bailey Road', 'Kankarbagh'],
      'Visakhapatnam': ['Visakhapatnam', 'MVP Colony', 'Dwaraka Nagar', 'Gajuwaka'],
      'Surat': ['Surat', 'Athwa', 'Vesu', 'Adajan'],
      'Coimbatore': ['Coimbatore', 'RS Puram', 'Gandhipuram', 'Peelamedu'],
      'Ernakulam': ['Kochi', 'Kakkanad', 'Edappally', 'Palarivattom'],
      'Thiruvananthapuram': ['Thiruvananthapuram', 'Kazhakootam', 'Vattiyoorkavu'],
      'Kamrup Metro': ['Guwahati', 'Fatasil', 'GS Road', 'Zoo Road'],
      'Chandigarh': ['Chandigarh', 'Sector 17', 'Sector 22', 'Sector 35'],
      'Gautam Buddha Nagar': ['Noida', 'Greater Noida', 'Dadri', 'Jalpura'],
      'Ghaziabad': ['Ghaziabad', 'Indirapuram', 'Vaishali', 'Kaushambi'],
      'Gurugram': ['Gurugram', 'Cyber Hub', 'DLF Phase 1-5', 'Sohna Road'],
      'Faridabad': ['Faridabad', 'NIT', 'Sector 15-89', 'Badkhal'],
      'Howrah': ['Howrah', 'Shibpur', 'Bally', 'Belgharia'],
      'Nainital': ['Haldwani', 'Nainital', 'Ramnagar', 'Kathgodam'],
      'Dehradun': ['Dehradun', 'Rajpur Road', 'Clock Tower', 'Mussoorie Road'],
      'Haridwar': ['Haridwar', 'Roorkee', 'BHEL', 'Jwalapur'],
      'Meerut': ['Meerut', 'Saket', 'Shastri Nagar', 'Modinagar'],
      'Agra': ['Agra', 'Sadar Bazaar', 'Kamla Nagar', 'Tajganj'],
      'Varanasi': ['Varanasi', 'Lanka', 'Assi Ghat', 'Sigra'],
      'Prayagraj': ['Prayagraj', 'Civil Lines', 'Katra', 'Jhusi'],
      'Ranchi': ['Ranchi', 'Doranda', 'Kanke', 'Namkum'],
      'Dhanbad': ['Dhanbad', 'Jharia', 'Sindri', 'Katras'],
      'Bilaspur': ['Bilaspur', 'Ratanpur', 'Takhatpur', 'Bilha'],
      'Raipur': ['Raipur', 'Shankar Nagar', 'Devendra Nagar', 'Amlidih'],
      'Jodhpur': ['Jodhpur', 'Paota', 'Ratanada', 'Sardarpura'],
      'Udaipur': ['Udaipur', 'Hiran Magri', 'Sukhadia Circle', 'Bapu Bazaar'],
      'Kota': ['Kota', 'Talwandi', 'Vigyan Nagar', 'Dadabari'],
      'Shimla': ['Shimla', 'The Ridge', 'Mall Road', 'Chota Shimla'],
      'Manali': ['Manali', 'Old Manali', 'Vashisht', 'Kullu'],
      'Gangtok': ['Gangtok', 'MG Marg', 'Tadong', 'Ranipool'],
      'Imphal': ['Imphal', 'Thangal Bazaar', 'Paona Bazaar', 'Keishampat'],
      'Aizawl': ['Aizawl', 'Dawrkawn', 'Chaltlang', 'Reiek'],
      'Kohima': ['Kohima', 'DIMAPUR', 'Mokokchung', 'Wokha'],
      'Shillong': ['Shillong', 'Laitumkhrah', 'Police Bazaar', 'European Ward'],
      'Agartala': ['Agartala', 'Banamalipur', 'Nagarjala', 'Badharghat'],
      'Itanagar': ['Itanagar', 'Naharlagun', 'Doimukh', 'Khonsa'],
      'Dibrugarh': ['Dibrugarh', 'Chowkidingee', 'Niz-Mora', 'Chakua'],
      'Jorhat': ['Jorhat', 'Gar-Ali', 'Fancy Bazar', 'Kumarigaon'],
      'Siliguri': ['Siliguri', 'Sevoke Road', 'Matigara', 'Naxalbari'],
      'Nellore': ['Nellore', 'Venkoji palem', 'Buchireddy palem', 'Kovur'],
      'Tirupati': ['Tirupati', 'Renigunta', 'Chandragiri', 'Tiruchanur'],
      'Guntur': ['Guntur', 'Brodipet', 'Arundelpet', 'Narasaravupeta'],
      'Vijayawada': ['Vijayawada', 'Benz Circle', 'Governorpet', 'Patamata'],
      'Rajahmundry': ['Rajahmundry', 'Dwarakanagar', 'Satyanarayana puram', 'Kotagummam'],
      'Kakinada': ['Kakinada', 'Jagannadhapuram', 'Sarpavaram', 'Pithapuram'],
      'Warangal Urban': ['Warangal', 'Hanamkonda', 'Kazipet', 'Narsampet'],
      'Karimnagar': ['Karimnagar', 'Jammikunta', 'Huzurabad', 'Manthani'],
      'Nizamabad': ['Nizamabad', 'Bodhan', 'Armoor', 'Banswada'],
      'Mahabubnagar': ['Mahabubnagar', 'Gadwal', 'Wanaparthy', 'Jadcherla'],
    };
    const districtCities = cityMap[form.district] || [];
    const base = [form.district, ...districtCities];
    return [...new Set(base)];
  }, [form.district]);

  const toggleItem = (field, item) => {
    setForm(prev => ({ ...prev, [field]: prev[field].includes(item) ? prev[field].filter(i => i !== item) : [...prev[field], item] }));
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
    } finally { setLoading(false); }
  };

  const stepLabels = ['Level', 'Location', 'Interests', 'Skills', 'Budget', 'Done'];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex gap-2 mb-8">
        {stepLabels.map((l, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-blue-500' : 'bg-gray-700'}`} />
        ))}
      </div>

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

      {step === 1 && (
        <div>
          <h1 className="text-2xl font-bold mb-6 text-white">Where are you from?</h1>
          <div className="space-y-4">
            <DarkDropdown label="State *" value={form.state} options={statesList} placeholder="Select State"
              searchPlaceholder="Search state..." onSelect={(val) => setForm({ ...form, state: val, district: '', city: '' })} />

            {form.state && districtsList.length > 0 && (
              <DarkDropdown label="District *" value={form.district} options={districtsList} placeholder="Select District"
                searchPlaceholder="Search district..." onSelect={(val) => setForm({ ...form, district: val, city: '' })} />
            )}

            {form.district && citiesList.length > 0 && (
              <DarkDropdown label="City *" value={form.city} options={citiesList} placeholder="Select City"
                searchPlaceholder="Search city..." onSelect={(val) => setForm({ ...form, city: val })} />
            )}
          </div>
          <button onClick={() => setStep(2)} disabled={!form.state || !form.district || !form.city}
            className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50">
            Next
          </button>
        </div>
      )}

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

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}