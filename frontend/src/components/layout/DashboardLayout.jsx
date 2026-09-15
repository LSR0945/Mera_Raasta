import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../contexts/LanguageContext';
import Logo from '../common/Logo';
import { careerAPI } from '../../api/career';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
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

  const STUDENT_NAV = [
    { to: '/dashboard', label: t('dashboard'), icon: '🏠', exact: true },
    { to: '/dashboard/careers', label: t('careers'), icon: '🎯' },
    { to: '/dashboard/careers/recommendations', label: t('recommendations'), icon: '⭐' },
    { to: '/dashboard/education', label: t('education'), icon: '📚' },
    { to: '/dashboard/roadmap', label: t('roadmap'), icon: '🗺️' },
    { to: '/dashboard/career-readiness', label: t('careerReadiness'), icon: '💼' },
    { to: '/dashboard/resume-interview', label: t('resumeInterview'), icon: '📄' },
    { to: '/dashboard/ai-community', label: t('aiCoach'), icon: '🤖' },
    { to: '/dashboard/profile', label: t('profile'), icon: '👤' },
  ];

  const PARENT_NAV = [
    { to: '/dashboard', label: t('dashboard'), icon: '🏠', exact: true },
    { to: '/dashboard/children', label: t('myChildren'), icon: '👶' },
    { to: '/dashboard/children/progress', label: t('progressReports'), icon: '📊' },
    { to: '/dashboard/education', label: t('education'), icon: '📚' },
    { to: '/dashboard/ai-community', label: t('aiCoach'), icon: '🤖' },
    { to: '/dashboard/profile', label: t('profile'), icon: '👤' },
  ];

  const MENTOR_NAV = [
    { to: '/dashboard', label: t('dashboard'), icon: '🏠', exact: true },
    { to: '/dashboard/students', label: t('myStudents'), icon: '🎓' },
    { to: '/dashboard/reviews', label: t('reviews'), icon: '⭐' },
    { to: '/dashboard/education', label: t('education'), icon: '📚' },
    { to: '/dashboard/ai-community', label: t('aiCoach'), icon: '🤖' },
    { to: '/dashboard/profile', label: t('profile'), icon: '👤' },
  ];

  const NAV_MAP = { student: STUDENT_NAV, parent: PARENT_NAV, mentor: MENTOR_NAV };
  const ROLE_CONFIG = {
    student: { label: t('dashboard'), gradient: 'from-blue-500 to-indigo-500', text: 'text-blue-600', accentBg: '#3b82f6', labelEn: 'Student' },
    parent: { label: t('myChildren'), gradient: 'from-emerald-500 to-teal-500', text: 'text-emerald-600', accentBg: '#10b981', labelEn: 'Parent' },
    mentor: { label: t('myStudents'), gradient: 'from-violet-500 to-purple-500', text: 'text-violet-600', accentBg: '#8b5cf6', labelEn: 'Mentor' },
  };

  const nav = NAV_MAP[role] || STUDENT_NAV;
  const config = ROLE_CONFIG[role];

  useEffect(() => { setSearchOpen(false); setSearchQuery(''); }, [location.pathname]);

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
    <div className="min-h-screen bg-[#0a0a1a] flex">
      {/* ═══ SIDEBAR ═══ */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[272px] bg-[#1a1d23] flex flex-col transform transition-all duration-300 lg:translate-x-0 ${sidebar ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} lg:sticky lg:top-0 lg:h-screen lg:shadow-none`}>

        <div className="px-5 h-16 flex items-center border-b border-white/5 shrink-0">
          <Logo size="default" className="[&_span]:!text-white [&_span>span]:!text-white [&_span>span>span]:!text-white" />
        </div>

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
                <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-md text-[10px] font-bold uppercase tracking-wider">{config.labelEn}</span>
              </div>
            </div>
          </div>
        </div>

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

        <div className="px-3 pb-4 pt-3 border-t border-white/5 shrink-0 space-y-1">
          {/* Language Toggle */}
          <button onClick={toggleLanguage}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 rounded-xl transition-all group">
            <span className="text-base group-hover:scale-105 transition-transform">🌐</span>
            <span className="flex-1 text-left">{lang === 'hi' ? 'English में बदलें' : 'हिंदी में बदलें'}</span>
            <span className="text-[9px] font-bold bg-indigo-500/20 px-2 py-0.5 rounded-full">{lang === 'hi' ? 'EN' : 'HI'}</span>
          </button>
          <Link to="/" onClick={() => setSidebar(false)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-gray-400 hover:bg-white/5 hover:text-gray-200 rounded-xl transition-all group">
            <svg className="w-[18px] h-[18px] group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            {lang === 'hi' ? 'होम पेज' : 'Back to Home'}
          </Link>
          <button onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all group">
            <span className="text-base group-hover:scale-105 transition-transform">🚪</span>
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {sidebar && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebar(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-[#0a0a1a]/80 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="h-16 flex items-center px-4 lg:px-8 gap-4">
            <button onClick={() => setSidebar(true)} className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition-all active:scale-95">
              <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>

            {/* Search */}
            <div ref={searchRef} className="relative flex-1 max-w-xl">
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
                  placeholder={t('search')}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-white focus:bg-white/[0.1] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 outline-none transition-all placeholder:text-white/30" />
                {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}
              </div>
              {searchOpen && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1d23] rounded-2xl shadow-2xl border border-white/[0.08] overflow-hidden z-50 max-h-80 overflow-y-auto">
                  <div className="p-2">
                    <p className="px-3 py-1.5 text-[10px] font-bold text-white/30 uppercase">{t('careers')}</p>
                    {searchResults.map((career) => (
                      <Link key={career._id} to={`/dashboard/careers/${career.slug}`}
                        onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-all group">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white text-sm shadow-md group-hover:scale-105 transition-transform">
                          {career.title?.[0] || '💼'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{career.title}</p>
                          <p className="text-[11px] text-white/40 truncate">{career.category || 'Career'}</p>
                        </div>
                        <svg className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {searchOpen && searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1d23] rounded-2xl shadow-2xl border border-white/[0.08] p-8 text-center z-50">
                  <div className="text-3xl mb-2">🔍</div>
                  <p className="text-sm font-semibold text-white/50">{lang === 'hi' ? `"${searchQuery}" के लिए कोई परिणाम नहीं` : `No results found for "${searchQuery}"`}</p>
                </div>
              )}
            </div>

            <div className="flex-1" />

            {/* Language Toggle in Header */}
            <button onClick={toggleLanguage}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all text-xs font-bold text-white/50 hover:text-white/80">
              <span>🌐</span>
              <span>{lang === 'hi' ? 'EN' : 'HI'}</span>
            </button>

            {/* User Chip */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2.5 pl-4 border-l border-white/[0.08]">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-xl object-cover shadow-md" />
                ) : (
                  <div className={`w-8 h-8 bg-gradient-to-br ${config.gradient} rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md`}>
                    {user?.name?.[0] || '?'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white/80 truncate max-w-[120px]">{user?.name}</p>
                  <p className="text-[10px] font-bold text-white/40 uppercase">{config.labelEn}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowLogoutConfirm(false)}>
          <div className="bg-[#1a1d23] border border-white/[0.08] rounded-3xl p-8 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5">🚪</div>
            <h3 className="text-xl font-extrabold text-white text-center mb-2">{lang === 'hi' ? 'जाने के लिए तैयार?' : 'Ready to leave?'}</h3>
            <p className="text-sm text-white/40 text-center mb-8">{lang === 'hi' ? 'आप अपने डैशबोर्ड से लॉग आउट हो जाएंगे। क्या आप निश्चित हैं?' : "You'll be logged out of your dashboard. Are you sure?"}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 px-5 py-3 border-2 border-white/10 rounded-2xl text-sm font-bold text-white/70 hover:bg-white/5 transition-all">{t('cancel')}</button>
              <button onClick={handleLogout} className="flex-1 px-5 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-2xl text-sm font-bold hover:from-red-600 hover:to-rose-600 transition-all shadow-lg shadow-red-500/25">{t('logout')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}