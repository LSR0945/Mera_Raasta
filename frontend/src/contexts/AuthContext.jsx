import { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      setUser(data.data.user);
    } catch { localStorage.removeItem('accessToken'); setUser(null); } finally { setLoading(false); }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const login = async (email, password) => {
    const { data } = await axios.post(`${API_URL}/auth/login`, { email, password }, { withCredentials: true });
    localStorage.setItem('accessToken', data.data.accessToken);
    setUser(data.data.user);
    return data;
  };

  const register = async ({ name, email, password, role }) => {
    const { data } = await axios.post(`${API_URL}/auth/register`, { name, email, password, role }, { withCredentials: true });
    localStorage.setItem('accessToken', data.data.accessToken);
    setUser(data.data.user);
    return data;
  };

  const logout = async () => {
    const token = localStorage.getItem('accessToken');
    try { await axios.post(`${API_URL}/auth/logout`, {}, { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }); } finally { localStorage.removeItem('accessToken'); setUser(null); }
  };

  const updateProfile = async (profileData) => {
    const token = localStorage.getItem('accessToken');
    const { data } = await axios.put(`${API_URL}/auth/profile`, profileData, { headers: { Authorization: `Bearer ${token}` }, withCredentials: true });
    setUser(data.data.user);
    return data;
  };

  const changePassword = async (currentPassword, newPassword) => {
    const token = localStorage.getItem('accessToken');
    const { data } = await axios.put(`${API_URL}/auth/change-password`, { currentPassword, newPassword }, { headers: { Authorization: `Bearer ${token}` }, withCredentials: true });
    localStorage.setItem('accessToken', data.data.accessToken);
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}
