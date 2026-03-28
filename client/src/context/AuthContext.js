import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchUserData } from '../services/userService';
import { api } from '../api/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      // 1. Check for "Auth Hint" in localStorage to avoid UI flickers
      const savedUser = localStorage.getItem('userInfo');
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch (e) {
          localStorage.removeItem('userInfo');
        }
      }

      // 2. Verify actual session status with the server
      try {
        const user = await fetchUserData(); // No token needed, cookies are sent automatically
        setCurrentUser(user);
        localStorage.setItem('userInfo', JSON.stringify(user));
      } catch (error) {
        console.error('Failed to verify session on mount:', error);
        setCurrentUser(null);
        localStorage.removeItem('userInfo');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);


  const login = (user) => {
    localStorage.setItem('userInfo', JSON.stringify(user));
    setCurrentUser(user);
  };

  const logout = async () => {
    try {
      await api.post('/api/users/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('userInfo');
      setCurrentUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => useContext(AuthContext);