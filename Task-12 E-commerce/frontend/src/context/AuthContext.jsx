import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if session is already active on initial load
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await api.get('/api/me');
      if (response.data && response.data.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const response = await api.post('/api/login', { email, password });
    if (response.data && response.data.user) {
      setUser(response.data.user);
    }
    return response.data;
  }

  async function register(name, email, password, role = 'customer') {
    const response = await api.post('/api/register', { name, email, password, role });
    if (response.data && response.data.user) {
      setUser(response.data.user);
    }
    return response.data;
  }

  async function logout() {
    try {
      await api.get('/api/logout');
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      setUser(null);
    }
  }

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAdmin,
      isAuthenticated,
      login,
      register,
      logout,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
