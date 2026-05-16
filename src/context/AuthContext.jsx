'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('crunz_token');
    if (token) {
      api.get('/auth/me')
        .then(d => setUser(d.user))
        .catch(() => localStorage.removeItem('crunz_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('crunz_token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('crunz_token');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const d = await api.get('/auth/me');
      setUser(d.user);
    } catch {}
  };

  const openAuthModal  = () => setAuthModalOpen(true);
  const closeAuthModal = () => setAuthModalOpen(false);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, authModalOpen, openAuthModal, closeAuthModal }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
