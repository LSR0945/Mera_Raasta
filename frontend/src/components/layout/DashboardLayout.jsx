import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Logo from '../common/Logo';
import { careerAPI } from '../../api/career';

const STUDENT_NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠', exact: true },
  { to: '/dashboard/careers', label: 'Explore Careers', icon: '🎯' },
  { to: '/dashboard/careers/recommendations', label: 'Recommendations', icon: '⭐' },
  { to: '/dashboard/education', label: 'Education Hub', icon: '📚' },
  { to: '/dashboard/roadmap', label: 'My Roadmap', icon: '🗺️' },
  { to: '/dashboard/career-readiness', label: 'Career Readiness', icon: '💼' },
  { to: '/dashboard/resume-interview', label: 'Resume & Interview', icon: '📄' },
  { to: '/dashboard/ai-community', label: 'AI Coach', icon: '🤖' },
  { to: '/dashboard/profile', label: 'Profile', icon: '👤' },
];

const PARENT_NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠', exact: true },
  { to: '/dashboard/children', label: 'My Children', icon: '👶' },
  { to: '/dashboard/children/progress', label: 'Progress Reports', icon: '📊' },
  { to: '/dashboard/education', label: 'Education Info', icon: '📚' },
  { to: '/dashboard/ai-community', label: 'AI Coach', icon: '🤖' },
  { to: '/dashboard/profile', label: 'Profile', icon: '👤' },
];

const MENTOR_NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠', exact: true },
  { to: '/dashboard/students', label: 'My Students', icon: '🎓' },
  { to: '/dashboard/reviews', label: 'Reviews', icon: '⭐' },
  { to: '/dashboard/education', label: 'Education Hub', icon: '📚' },
  { to: '/dashboard/ai-community', label: 'AI Coach', icon: '🤖' },
  { to: '/dashboard/profile', label: 'Profile', icon: '👤' },
];

const NAV_MAP = { student: STUDENT_NAV, parent: PARENT_NAV, mentor: MENTOR_NAV };
const ROLE_CONFIG = {
  student: { label: 'Student', gradient: 'from-blue-500 to-indigo-500', text: 'text-blue-600', accentBg: '#3b82f6' },
  parent: { label: 'Parent', gradient: 'from-emerald-500 to-teal-500', text: 'text-emerald-600', accentBg: '#10b981' },
  mentor: { label: 'Mentor', gradient: 'from-violet-500 to-purple-500', text: 'text-violet-600', accentBg: '#8b5cf6' },
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const [sidebar, setSidebar] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const role = user?.role || 'student';
  const nav = NAV_MAP[role] || STUDENT_NAV;
  const config = ROLE_CONFIG[role];

  // Close search on route change
  useEffect(() => { setSearchOpen(false); setSearchQuery(''); }, [location.pathname]);

  // Close search on outside click
  useEffect(() => {
    const handleClick = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const { data } = await careerAPI.getAll({ search: q, limit: 10 });
      setSearchResults(data.data.careers || []);
      setSearchOpen(true);
    } catch { setSearchResults([]); } finally { setSearching(false); }
  };

  const handleLogout = async () => { await logout(); setShowLogoutConfirm(false); navigate('/'); };

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.to;
    return location.pathname.startsWith(item.to);
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex">
      {/* ═══ SIDEBAR ═══ */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[272px] bg-[#1a1d23] flex flex-col transform transition-all duration-300 lg:translate-x-0 ${sidebar ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} lg:sticky lg:top-0 lg:h-screen lg:shadow-none`}>

        {/* ── Logo ── */}
        <div className="px-5 h-16 flex items-center border-b border-white/5 shrink-0">
          <Logo size="default" className="[&_span]:!text-white [&_span>span]:!text-white [&_span>span>span]:!text-white" />
        </div>

        {/* ── User Card ── */}
        <div className="px-3 pt-4 pb-3 shrink-0">
          <div className={`relative p-4 rounded-2xl bg-gradient-to-br ${config.gradient} text-white overflow-hidden`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8 blur-xl" />
            <div className="relative z-10 flex items-center gap-3">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-11 h-11 rounded-xl object-cover ring-2 ring-white/30 shadow-lg" />
              ) : (
                <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white font-extrabold text-lg ring-2 ring-white/30 shadow-lg">
                  {user?.name?.[0] || '?'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[14px] truncate drop-shadow">{user?.name}</p>
                <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-md text-[10px] font-bold uppercase tracking-wider">{config.label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {nav.map((item) => {
            const active = isActive(item);
            return (
              <Link key={item.to} to={item.to} onClick={() => setSidebar(false)}
                className={`group relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  active ? 'bg-white/10 text-white font-bold' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}>
                {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full" style={{ background: config.accentBg }} />}
                <span className={`text-base transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-105'}`}>{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {active && <div className="w-1.5 h-1.5 rounded-full" style={{ background: config.accentBg }} />}
              </Link>
            );
          })}
        </nav>

        {/* ── Bottom Actions ── */}
        <div className="px-3 pb-4 pt-3 border-t border-white/5 shrink-0 space-y-1">
          <Link to="/" onClick={() => setSidebar(false)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-gray-400 hover:bg-white/5 hover:text-gray-200 rounded-xl transition-all group">
            <svg className="w-[18px] h-[18px] group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            Back to Home
          </Link>
          <button onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all group">
            <span className="text-base group-hover:scale-105 transition-transform">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Overlay ── */}
      {sidebar && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebar(false)} />}

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Header with Search ── */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
          <div className="h-16 flex items-center px-4 lg:px-8 gap-4">
            <button onClick={() => setSidebar(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-all active:scale-95">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <Link to="/" className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-all active:scale-95">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </Link>

            {/* ═══ SEARCH BAR ═══ */}
            <div ref={searchRef} className="relative flex-1 max-w-xl">
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
                  placeholder="Search careers, courses, skills..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-0 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Search Dropdown */}
              {searchOpen && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 max-h-80 overflow-y-auto">
                  <div className="p-2">
                    <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase">Careers</p>
                    {searchResults.map((career) => (
                      <Link key={career._id} to={`/dashboard/careers/${career.slug}`}
                        onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all group">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white text-sm shadow-md group-hover:scale-105 transition-transform">
                          {career.title?.[0] || '💼'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{career.title}</p>
                          <p className="text-[11px] text-gray-500 truncate">{career.category || 'Career'}</p>
                        </div>
                        <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {searchOpen && searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 text-center z-50">
                  <div className="text-3xl mb-2">🔍</div>
                  <p className="text-sm font-semibold text-gray-500">No results found for "{searchQuery}"</p>
                </div>
              )}
            </div>

            <div className="flex-1" />

            {/* Right side — user chip */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2.5 pl-4 border-l border-gray-200">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-xl object-cover shadow-md" />
                ) : (
                  <div className={`w-8 h-8 bg-gradient-to-br ${config.gradient} rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md`}>
                    {user?.name?.[0] || '?'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-700 truncate max-w-[120px]">{user?.name}</p>
                  <p className={`text-[10px] font-bold ${config.text} uppercase`}>{config.label}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* ═══ LOGOUT CONFIRMATION MODAL ═══ */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowLogoutConfirm(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5">🚪</div>
            <h3 className="text-xl font-extrabold text-gray-900 text-center mb-2">Ready to leave?</h3>
            <p className="text-sm text-gray-500 text-center mb-8">You'll be logged out of your dashboard. Are you sure?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 px-5 py-3 border-2 border-gray-200 rounded-2xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={handleLogout} className="flex-1 px-5 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-2xl text-sm font-bold hover:from-red-600 hover:to-rose-600 transition-all shadow-lg shadow-red-500/25">Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
