/**
 * Authentication Context & Provider
 * Manages reactive global user session, profile synchronization, login/register flows,
 * and role-based convenience flags (isSeeker, isBusiness, isAdmin).
 */

import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

/**
 * Custom hook to consume authentication context
 */
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session on mount if token exists in localStorage
  useEffect(() => {
    const token = localStorage.getItem('worknear_token');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch authenticated user details and associated profile
   */
  const loadUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      setProfile(data.profile);
    } catch (err) {
      localStorage.removeItem('worknear_token');
      localStorage.removeItem('worknear_user');
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Authenticate user with credentials
   */
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('worknear_token', data.token);
    localStorage.setItem('worknear_user', JSON.stringify(data.user));
    setUser(data.user);
    await loadUser();
    return data;
  };

  /**
   * Register a new user account
   */
  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    localStorage.setItem('worknear_token', data.token);
    localStorage.setItem('worknear_user', JSON.stringify(data.user));
    setUser(data.user);
    await loadUser();
    return data;
  };

  /**
   * Clear session credentials and invalidate server cookie
   */
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (_) {
      // Gracefully handle network errors during logout
    }
    localStorage.removeItem('worknear_token');
    localStorage.removeItem('worknear_user');
    setUser(null);
    setProfile(null);
  };

  /**
   * Update cached profile state locally
   */
  const updateProfileState = (newProfile) => {
    setProfile(newProfile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        register,
        logout,
        loadUser,
        updateProfileState,
        isAuthenticated: !!user,
        isSeeker: user?.role === 'JOB_SEEKER',
        isBusiness: user?.role === 'BUSINESS',
        isAdmin: user?.role === 'ADMIN',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
