import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { INDIAN_STATES } from '../../data/indiaGeography';

// ═══ Single Select Dark Dropdown ═══
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

// ═══ Multi Select Dark Dropdown — Interests/Skills ke liye ═══
function MultiSelectDropdown({ label, values, options, placeholder, onToggle, searchPlaceholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter(o => !search || o.toLowerCase().includes(search.toLowerCase()));
  const displayText = values.length > 0 ? `${values.length} selected` : placeholder;

  return (
    <div ref={ref} className="relative">
      <label className="text-sm text-gray-400 mb-1 block">{label}</label>
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-left text-sm transition-all hover:border-blue-500/30 focus:border-blue-500/50 focus:outline-none">
        <span className={values.length > 0 ? 'text-white' : 'text-gray-500'}>{displayText}</span>
        <span className="absolute right-4 top-[2.3rem] text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {/* Selected tags */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {values.map(v => (
            <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded-lg text-[10px] text-blue-300">
              {v}
              <button type="button" onClick={(e) => { e.stopPropagation(); onToggle(v); }} className="text-blue-400 hover:text-white">×</button>
            </span>
          ))}
        </div>
      )}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-white/10 rounded-xl shadow-2xl shadow-black/50 max-h-80 overflow-hidden">
          <div className="p-2 border-b border-white/5">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder || 'Search...'} autoFocus
              className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50" />
          </div>
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-gray-500 text-sm">No results found</div>
            ) : filtered.map(opt => {
              const isSelected = values.includes(opt);
              return (
                <button key={opt} type="button" onClick={() => onToggle(opt)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 ${isSelected ? 'bg-blue-600/20 text-blue-300' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
                  <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] shrink-0 ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-white/20'}`}>
                    {isSelected && '✓'}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══ India Government Interests — CBSE + UGC + AICTE + NSQF ═══
const GOVT_INTERESTS = [
  // CBSE Science
  'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'Electronics', 'Biotechnology', 'Environmental Science', 'Statistics',
  // CBSE Commerce
  'Accountancy', 'Business Studies', 'Economics', 'Finance', 'Entrepreneurship',
  // CBSE Humanities
  'History', 'Geography', 'Political Science', 'Sociology', 'Psychology', 'Philosophy', 'English Literature', 'Hindi Literature', 'Sanskrit', 'Tamil Literature', 'Bengali Literature', 'Marathi Literature', 'Gujarati Literature', 'Kannada Literature', 'Malayalam Literature', 'Telugu Literature', 'Punjabi Literature', 'Urdu Literature', 'Maithili', 'Konkani', 'Odia', 'Assamese', 'Kashmiri', 'Sindhi', 'Santhali', 'Dogri', 'Bodo', 'Manipuri', 'Nepali', 'Pali', 'Prakrit', 'Arabic', 'Persian', 'French', 'German', 'Spanish', 'Chinese', 'Japanese', 'Korean', 'Russian',
  // Engineering (AICTE)
  'Computer Science Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Electronics Engineering', 'Electronics & Communication', 'Information Technology', 'Chemical Engineering', 'Aerospace Engineering', 'Automobile Engineering', 'Biomedical Engineering', 'Biotechnology Engineering', 'Mining Engineering', 'Metallurgical Engineering', 'Textile Engineering', 'Food Technology', 'Agricultural Engineering', 'Environmental Engineering', 'Industrial Engineering', 'Production Engineering', 'Mechatronics Engineering', 'Robotics Engineering', 'Petroleum Engineering', 'Naval Architecture', 'Instrumentation Engineering', 'Power Engineering', 'Construction Engineering', 'Structural Engineering', 'Transportation Engineering', 'Water Resources Engineering', 'Geotechnical Engineering', 'Architecture & Planning', 'Urban Planning', 'Interior Design',
  // Medical (NMC)
  'Medicine (MBBS)', 'Dentistry (BDS)', 'Ayurveda (BAMS)', 'Homeopathy (BHMS)', 'Siddha (BSMS)', 'Unani (BUMS)', 'Nursing (B.Sc Nursing)', 'Pharmacy (B.Pharm)', 'Physiotherapy (BPT)', 'Occupational Therapy', 'Optometry', 'Laboratory Technology', 'Radiology & Imaging', 'Anesthesia Technology', 'Cardiac Technology', 'Dialysis Technology', 'Emergency Medicine', 'Forensic Science', 'Medical Lab Technology', 'Nuclear Medicine', 'Prosthetics & Orthotics', 'Speech & Hearing', 'Radiation Therapy',
  // Management (AICTE)
  'MBA', 'BBA', 'B.Com', 'Commerce', 'Hotel Management', 'Tourism Management', 'Hospital Administration', 'Retail Management', 'Supply Chain Management', 'Logistics Management', 'Human Resource Management', 'Marketing Management', 'Finance Management', 'Operations Management', 'International Business', 'Rural Management', 'Healthcare Management', 'Banking & Insurance', 'Digital Business Management',
  // Law (BCI)
  'Law (LLB)', 'Integrated Law (BA LLB)', 'Corporate Law', 'Criminal Law', 'International Law', 'Constitutional Law', 'Cyber Law', 'Intellectual Property Law', 'Taxation Law', 'Labour Law', 'Family Law', 'Environmental Law', 'Human Rights Law',
  // Design (COA/ Council of Architecture)
  'Fashion Design', 'Interior Design', 'Graphic Design', 'Product Design', 'Textile Design', 'UX/UI Design', 'Game Design', 'Animation & VFX', 'Film Making', 'Visual Communication', 'Industrial Design', 'Jewellery Design', 'Footwear Design', 'Ceramic Design', 'Furniture Design', 'Transportation Design',
  // IT/Computer
  'Web Development', 'Mobile App Development', 'Data Science', 'Artificial Intelligence', 'Machine Learning', 'Deep Learning', 'Natural Language Processing', 'Computer Vision', 'Cyber Security', 'Ethical Hacking', 'Cloud Computing', 'AWS', 'Azure', 'DevOps', 'Blockchain', 'IoT (Internet of Things)', 'Big Data Analytics', 'Business Intelligence', 'Software Engineering', 'Database Management', 'Networking', 'System Administration', 'Game Development', 'AR/VR Development',
  // Agriculture (ICAR)
  'Agriculture (B.Sc)', 'Horticulture', 'Forestry', 'Fisheries Science', 'Dairy Science', 'Food Science & Technology', 'Agricultural Biotechnology', 'Agricultural Economics', 'Agricultural Engineering', 'Plant Pathology', 'Entomology', 'Soil Science', 'Agronomy', 'Animal Husbandry', 'Veterinary Science', 'Sericulture', 'Floriculture',
  // Education (NCTE)
  'Teaching (B.Ed)', 'Elementary Education (D.El.Ed)', 'Special Education', 'Physical Education (B.P.Ed)', 'Early Childhood Education', 'Educational Psychology', 'Educational Technology', 'Guidance & Counselling',
  // Media (UGC)
  'Journalism', 'Mass Communication', 'Public Relations', 'Advertising', 'Media Studies', 'Film Studies', 'Theatre', 'Drama', 'Dance', 'Music (Vocal/Instrumental)', 'Fine Arts (BFA)', 'Visual Arts', 'Applied Arts', 'Photography', 'Print Media', 'Broadcast Journalism', 'Digital Media', 'Social Media Management',
  // Defence
  'Defence Studies', 'Military Science', 'Nautical Science', 'Aviation', 'Aeronautical Science', 'Ship Building',
  // Government Exams
  'UPSC Preparation', 'SSC Preparation', 'Banking Preparation', 'Railway Preparation', 'State PSC', 'Teaching (CTET/NET)', 'GATE Preparation', 'CAT Preparation', 'CLAT Preparation', 'NDA Preparation', 'CDS Preparation',
  // Vocational (NSDC/MSDE)
  'Electrical Work', 'Plumbing', 'Welding', 'Carpentry', 'Automobile Repair', 'Beauty & Wellness', 'Healthcare Assistant', 'Paramedical', 'Food Processing', 'Printing Technology', 'Leather Technology', 'Glass & Ceramics', 'Domestic & Tourism', 'Hospitality & Tourism',
  // Sports
  'Sports Science', 'Yoga', 'Physical Fitness', 'Sports Management', 'Coaching',
  // Other
  'Library Science', 'Social Work', 'Criminology', 'Demography', 'Linguistics', 'Translation Studies', 'Genealogy', 'Archaeology', 'Museology',
];

// ═══ India Government Skills — NSQF Aligned ═══
const GOVT_SKILLS = [
  'Programming', 'Web Development', 'Mobile App Development', 'Data Analysis', 'Data Science',
  'Database Management', 'Cloud Computing', 'Cyber Security', 'Network Administration',
  'Mathematics', 'Statistics', 'Physics', 'Chemistry', 'Biology',
  'Communication', 'Public Speaking', 'Presentation Skills', 'Negotiation', 'Team Leadership',
  'Project Management', 'Time Management', 'Critical Thinking', 'Problem Solving',
  'Analytical Thinking', 'Logical Reasoning', 'Decision Making',
  'English Writing', 'Hindi Writing', 'Creative Writing', 'Technical Writing', 'Report Writing',
  'Content Creation', 'Copywriting', 'Editing & Proofreading',
  'Creativity', 'Design Thinking', 'Innovation', 'Research Skills',
  'Financial Literacy', 'Accounting', 'Taxation', 'Auditing', 'Budgeting',
  'Cooking', 'First Aid', 'Swimming', 'Driving', 'Home Management',
  'Fashion Styling', 'Interior Decoration', 'Photography', 'Video Editing',
  'Graphic Design', 'UI/UX Design', 'Animation',
  'Agriculture', 'Animal Husbandry', 'Food Processing',
  'Mechanical Aptitude', 'Electrical Aptitude', 'Computer Hardware', 'Networking Hardware',
  'Marketing', 'Sales', 'Customer Service', 'Retail Management',
  'Foreign Language (English)', 'Foreign Language (French)', 'Foreign Language (German)',
  'Foreign Language (Japanese)', 'Foreign Language (Chinese)', 'Foreign Language (Spanish)',
  'Yoga', 'Meditation', 'Stress Management',
  'Social Media Management', 'SEO', 'Digital Marketing', 'Email Marketing',
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ educationLevel: '12th', interests: [], skills: [], budget: 'medium', state: '', district: '', city: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const statesList = useMemo(() => INDIAN_STATES.map(s => s.state), []);

  const districtsList = useMemo(() => {
    if (!form.state) return [];
    const found = INDIAN_STATES.find(s => s.state === form.state);
    return found ? found.districts : [];
  }, [form.state]);

  const citiesList = useMemo(() => {
    if (!form.district) return [form.district];
    const cityMap = {
      'Mumbai': ['Mumbai', 'Andheri', 'Bandra', 'Borivali', 'Dadar', 'Thane'],
      'Delhi': ['New Delhi', 'Connaught Place', 'Karol Bagh', 'Rohini', 'Dwarka', 'Saket'],
      'Chennai': ['Chennai', 'Adyar', 'Anna Nagar', 'T. Nagar', 'Velachery'],
      'Bangalore Urban': ['Bangalore', 'Whitefield', 'Koramangala', 'HSR Layout', 'Electronic City'],
      'Hyderabad': ['Hyderabad', 'Secunderabad', 'HITEC City', 'Gachibowli', 'Madhapur'],
      'Kolkata': ['Kolkata', 'Salt Lake', 'New Town', 'Park Street', 'Howrah'],
      'Pune': ['Pune', 'Hinjewadi', 'Kharadi', 'Wakad', 'Baner'],
      'Ahmedabad': ['Ahmedabad', 'SG Highway', 'Vastrapur', 'Satellite', 'Bopal'],
      'Jaipur': ['Jaipur', 'Malviya Nagar', 'Mansarovar', 'Vaishali Nagar'],
      'Lucknow': ['Lucknow', 'Gomti Nagar', 'Hazratganj', 'Alambagh'],
      'Kanpur Nagar': ['Kanpur', 'Civil Lines', 'Swaroop Nagar'],
      'Nagpur': ['Nagpur', 'Dharampeth', 'Sadar'],
      'Indore': ['Indore', 'Vijay Nagar', 'Palasia'],
      'Bhopal': ['Bhopal', 'MP Nagar', 'Kolar Road'],
      'Patna': ['Patna', 'Boring Road', 'Bailey Road'],
      'Visakhapatnam': ['Visakhapatnam', 'MVP Colony', 'Dwaraka Nagar'],
      'Surat': ['Surat', 'Athwa', 'Vesu'],
      'Coimbatore': ['Coimbatore', 'RS Puram', 'Gandhipuram'],
      'Ernakulam': ['Kochi', 'Kakkanad', 'Edappally'],
      'Thiruvananthapuram': ['Thiruvananthapuram', 'Kazhakootam'],
      'Kamrup Metro': ['Guwahati', 'GS Road', 'Fatasil'],
      'Chandigarh': ['Chandigarh', 'Sector 17', 'Sector 22'],
      'Gautam Buddha Nagar': ['Noida', 'Greater Noida', 'Dadri'],
      'Ghaziabad': ['Ghaziabad', 'Indirapuram', 'Vaishali'],
      'Gurugram': ['Gurugram', 'Cyber Hub', 'DLF Phase 1-5'],
      'Faridabad': ['Faridabad', 'NIT', 'Sector 15-89'],
      'Dehradun': ['Dehradun', 'Rajpur Road', 'Clock Tower'],
      'Haridwar': ['Haridwar', 'Roorkee', 'BHEL'],
      'Meerut': ['Meerut', 'Saket', 'Modinagar'],
      'Agra': ['Agra', 'Sadar Bazaar', 'Tajganj'],
      'Varanasi': ['Varanasi', 'Lanka', 'Sigra'],
      'Prayagraj': ['Prayagraj', 'Civil Lines', 'Katra'],
      'Ranchi': ['Ranchi', 'Doranda', 'Kanke'],
      'Jodhpur': ['Jodhpur', 'Paota', 'Ratanada'],
      'Udaipur': ['Udaipur', 'Hiran Magri', 'Sukhadia Circle'],
      'Kota': ['Kota', 'Talwandi', 'Vigyan Nagar'],
    };
    const districtCities = cityMap[form.district] || [];
    return [...new Set([form.district, ...districtCities])];
  }, [form.district]);

  const toggleItem = (field, item) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(item) ? prev[field].filter(i => i !== item) : [...prev[field], item]
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.put('/profile', form);
      await api.post('/profile/complete-onboarding', form);
      toast.success('Onboarding complete!');
      navigate('/dashboard');
    } catch (err) { toast.error('Failed to save'); }
    finally { setLoading(false); }
  };

  const stepLabels = ['Level', 'Location', 'Interests', 'Skills', 'Budget', 'Done'];

  return (
    <div className="max-w-2xl mx-auto">
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

      {/* Step 1: Location */}
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
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(0)} className="bg-white/5 text-gray-300 px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/10 border border-white/10">← Back</button>
            <button onClick={() => setStep(2)} disabled={!form.state || !form.district || !form.city}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50">Next</button>
          </div>
        </div>
      )}

      {/* Step 2: Interests — Multi Select Dropdown */}
      {step === 2 && (
        <div>
          <h1 className="text-2xl font-bold mb-2 text-white">Select your interests</h1>
          <p className="text-xs text-gray-400 mb-4">CBSE, UGC, AICTE — India ke saare streams aur career fields</p>
          <MultiSelectDropdown label="Interests *" values={form.interests} options={GOVT_INTERESTS}
            placeholder="Click to select interests..." searchPlaceholder="Search interests..."
            onToggle={(item) => toggleItem('interests', item)} />
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(1)} className="bg-white/5 text-gray-300 px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/10 border border-white/10">← Back</button>
            <button onClick={() => setStep(3)} disabled={form.interests.length === 0}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50">Next</button>
          </div>
        </div>
      )}

      {/* Step 3: Skills — Multi Select Dropdown */}
      {step === 3 && (
        <div>
          <h1 className="text-2xl font-bold mb-2 text-white">Select your skills</h1>
          <p className="text-xs text-gray-400 mb-4">NSQF (National Skills Qualifications Framework) aligned skills</p>
          <MultiSelectDropdown label="Skills *" values={form.skills} options={GOVT_SKILLS}
            placeholder="Click to select skills..." searchPlaceholder="Search skills..."
            onToggle={(item) => toggleItem('skills', item)} />
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(2)} className="bg-white/5 text-gray-300 px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/10 border border-white/10">← Back</button>
            <button onClick={() => setStep(4)} disabled={form.skills.length === 0}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50">Next</button>
          </div>
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
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(3)} className="bg-white/5 text-gray-300 px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/10 border border-white/10">← Back</button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Saving...' : 'Complete Onboarding'}
            </button>
          </div>
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