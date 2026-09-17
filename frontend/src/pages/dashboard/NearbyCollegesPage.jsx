import { useState, useEffect } from 'react';
import { collegeAPI } from '../../api/college';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import BackButton from '../../components/common/BackButton';

// ═══ Particles — Background floating dots ═══
function Particles({ count = 15 }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
    size: Math.random() * 3 + 1, delay: Math.random() * 5, duration: Math.random() * 10 + 10,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div key={p.id} className="absolute rounded-full bg-white/10"
          style={{ left: p.left, top: p.top, width: p.size, height: p.size, animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite` }} />
      ))}
    </div>
  );
}

// ═══ College Card ═══
function CollegeCard({ college, onClick }) {
  const typeColors = { government: 'from-emerald-500 to-teal-500', private: 'from-amber-500 to-orange-500', deemed: 'from-violet-500 to-purple-500', autonomous: 'from-blue-500 to-indigo-500' };
  const color = typeColors[college.type] || 'from-gray-500 to-gray-600';
  const minFees = college.courses?.length > 0 ? Math.min(...college.courses.map(c => c.fees)) : 0;
  const maxFees = college.courses?.length > 0 ? Math.max(...college.courses.map(c => c.fees)) : 0;

  return (
    <div onClick={onClick} className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/5 p-5 hover:border-white/15 transition-all duration-300 cursor-pointer group hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-extrabold text-white text-base mb-1 group-hover:text-blue-400 transition-colors line-clamp-1">{college.name}</h3>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <span>📍</span> {college.city}, {college.state}
          </p>
        </div>
        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-r ${color} text-white shrink-0`}>{college.type}</span>
      </div>

      {/* Rating + Established */}
      <div className="flex items-center gap-3 mb-3">
        {college.rating > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-yellow-400 text-sm">★</span>
            <span className="text-sm font-bold text-white">{college.rating}</span>
          </div>
        )}
        {college.established && <span className="text-[10px] text-gray-500">Est. {college.established}</span>}
        <span className="text-[10px] text-gray-500">{college.courses?.length || 0} courses</span>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-400 line-clamp-2 mb-3">{college.description}</p>

      {/* Fees Range */}
      <div className="flex items-center justify-between p-2.5 bg-white/[0.03] rounded-xl border border-white/5">
        <span className="text-[10px] text-gray-500 uppercase font-bold">Fees Range</span>
        <span className="text-xs font-bold text-emerald-400">
          {minFees > 0 ? `₹${(minFees / 1000).toFixed(0)}K - ₹${(maxFees / 100000).toFixed(1)}L/year` : 'N/A'}
        </span>
      </div>

      {/* Tags */}
      {college.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {college.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-white/5 rounded-md text-[10px] text-gray-400 border border-white/5">{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══ College Detail Modal ═══
function CollegeDetailModal({ college, onClose }) {
  if (!college) return null;
  const typeColors = { government: 'from-emerald-500 to-teal-500', private: 'from-amber-500 to-orange-500', deemed: 'from-violet-500 to-purple-500', autonomous: 'from-blue-500 to-indigo-500' };
  const color = typeColors[college.type] || 'from-gray-500 to-gray-600';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-white/10 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={`relative bg-gradient-to-r ${color} rounded-t-3xl p-6 text-white overflow-hidden`}>
          <Particles count={10} />
          <div className="relative z-10">
            <button onClick={onClose} className="absolute top-0 right-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">✕</button>
            <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-bold bg-white/20 mb-3`}>{college.type}</span>
            <h2 className="text-2xl font-extrabold mb-1">{college.name}</h2>
            <p className="text-white/80 text-sm">📍 {college.address}</p>
            <div className="flex items-center gap-4 mt-3">
              {college.rating > 0 && <div className="flex items-center gap-1"><span className="text-yellow-300">★</span><span className="font-bold">{college.rating}</span></div>}
              {college.established && <span className="text-sm text-white/70">Est. {college.established}</span>}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="p-6 border-b border-white/5">
          <p className="text-gray-300 text-sm leading-relaxed">{college.description}</p>
          {college.website && (
            <a href={college.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-3 text-blue-400 text-sm hover:text-blue-300 transition-colors">
              🌐 Visit Website
            </a>
          )}
        </div>

        {/* Courses */}
        <div className="p-6">
          <h3 className="text-lg font-extrabold text-white mb-4">Courses & Fees</h3>
          <div className="space-y-3">
            {college.courses?.map((course, i) => (
              <div key={i} className="p-4 bg-white/[0.03] rounded-xl border border-white/5 hover:border-white/10 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-sm">{course.name}</h4>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded">{course.type}</span>
                      <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded">⏱ {course.duration}</span>
                      {course.stream && <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded">{course.stream}</span>}
                    </div>
                    {course.eligibility && <p className="text-[10px] text-gray-500 mt-1">Eligibility: {course.eligibility}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold text-emerald-400">{course.feesDisplay || 'N/A'}</p>
                    {course.seats > 0 && <p className="text-[10px] text-gray-500 mt-0.5">{course.seats} seats</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══ MAIN PAGE ═══
export default function NearbyCollegesPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [colleges, setColleges] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCollege, setSelectedCollege] = useState(null);

  useEffect(() => { loadColleges(); loadCities(); }, []);

  // ═══ loadColleges — Colleges fetch karo ═══
  const loadColleges = async (cityFilter) => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (cityFilter) params.city = cityFilter;
      if (selectedType) params.type = selectedType;
      const res = await collegeAPI.getByCity(params);
      setColleges(res.data?.data?.colleges || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  // ═══ loadCities — Cities list karo ═══
  const loadCities = async () => {
    try {
      const res = await collegeAPI.getCities();
      setCities(res.data?.data?.cities || []);
    } catch (err) { console.error(err); }
  };

  // ═══ handleSearch — City ya text se search ═══
  const handleSearch = async () => {
    setLoading(true);
    try {
      if (searchText) {
        const res = await collegeAPI.search(searchText);
        setColleges(res.data?.data?.colleges || []);
      } else {
        loadColleges(searchCity);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  // ═══ handleCityClick — City pe click ═══
  const handleCityClick = (city) => {
    setSearchCity(city);
    setSearchText('');
    loadColleges(city);
  };

  // Filtered colleges
  const displayColleges = colleges.filter(c => {
    if (searchText) {
      const q = searchText.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q) || c.tags?.some(t => t.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <BackButton to="/dashboard" label={t('backToDashboard') || 'Back to Dashboard'} />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 rounded-3xl p-8 lg:p-12 text-white overflow-hidden">
        <Particles count={25} />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 bg-white/15 backdrop-blur-sm rounded-3xl flex items-center justify-center text-5xl mx-auto mb-6 border border-white/20 shadow-xl">🏛️</div>
          <h1 className="text-3xl lg:text-5xl font-extrabold mb-3 tracking-tight">Nearby Colleges</h1>
          <p className="text-blue-100/80 text-lg max-w-xl mx-auto">
            Discover <span className="text-white font-bold">government and private colleges</span> near you — courses, fees, and details.
          </p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-gray-900/50 backdrop-blur-xl rounded-3xl border border-white/5 p-6">
        {/* Search Bar */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search colleges, courses, cities..."
              className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors" />
          </div>
          <button onClick={handleSearch} className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-sm font-bold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg shadow-blue-500/20">
            Search
          </button>
        </div>

        {/* Type Filter */}
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { setSelectedType(''); loadColleges(searchCity); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${!selectedType ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'}`}>
            All
          </button>
          {['government', 'private', 'deemed', 'autonomous'].map(type => (
            <button key={type} onClick={() => { setSelectedType(type); loadColleges(searchCity); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${selectedType === type ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'}`}>
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Cities Quick Access */}
      <div className="bg-gray-900/50 backdrop-blur-xl rounded-3xl border border-white/5 p-6">
        <h3 className="text-sm font-extrabold text-white mb-3">Quick Access — Cities</h3>
        <div className="flex gap-2 flex-wrap">
          {cities.map(city => (
            <button key={city} onClick={() => handleCityClick(city)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${searchCity === city ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10 hover:text-white'}`}>
              📍 {city}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-extrabold text-white">
            {searchCity ? `Colleges in ${searchCity}` : searchText ? 'Search Results' : 'All Colleges'}
            <span className="text-sm text-gray-400 ml-2">({displayColleges.length})</span>
          </h3>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-gray-900/50 rounded-2xl border border-white/5 p-5 animate-pulse">
                <div className="h-5 bg-white/5 rounded w-3/4 mb-3" />
                <div className="h-3 bg-white/5 rounded w-1/2 mb-2" />
                <div className="h-3 bg-white/5 rounded w-full mb-4" />
                <div className="h-10 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        ) : displayColleges.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayColleges.map(college => (
              <CollegeCard key={college._id} college={college} onClick={() => setSelectedCollege(college)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏛️</div>
            <p className="text-gray-400 text-lg">No colleges found</p>
            <p className="text-gray-500 text-sm mt-1">Try a different city or search term</p>
          </div>
        )}
      </div>

      {/* College Detail Modal */}
      {selectedCollege && <CollegeDetailModal college={selectedCollege} onClose={() => setSelectedCollege(null)} />}

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; } 50% { transform: translateY(-20px) rotate(180deg); opacity: 0.6; } }
      `}</style>
    </div>
  );
}