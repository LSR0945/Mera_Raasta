import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function PublicLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <span className="text-lg font-extrabold text-gray-900">Mera Raasta</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              {user ? (
                <>
                  <Link to="/dashboard" className="text-sm font-semibold text-gray-600 hover:text-primary-600">Dashboard</Link>
                  <button onClick={logout} className="text-sm font-semibold text-gray-500 hover:text-red-600">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-semibold text-gray-600 hover:text-primary-600">Login</Link>
                  <Link to="/register" className="text-sm font-semibold bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700">Get Started</Link>
                </>
              )}
            </div>
            <button onClick={() => setOpen(!open)} className="md:hidden p-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} /></svg>
            </button>
          </div>
        </div>
        {open && (
          <div className="md:hidden border-t px-4 py-3 space-y-2">
            {user ? (
              <>
                <Link to="/dashboard" className="block text-sm font-semibold py-2" onClick={() => setOpen(false)}>Dashboard</Link>
                <button onClick={() => { logout(); setOpen(false); }} className="block text-sm font-semibold py-2 text-red-600">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block text-sm font-semibold py-2" onClick={() => setOpen(false)}>Login</Link>
                <Link to="/register" className="block text-sm font-semibold py-2 text-primary-600" onClick={() => setOpen(false)}>Get Started</Link>
              </>
            )}
          </div>
        )}
      </nav>
      <Outlet />
    </div>
  );
}
