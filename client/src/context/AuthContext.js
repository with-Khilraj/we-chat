// context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchUserData } from '../utils/userStore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const user = await fetchUserData(token);
        setCurrentUser(user); // { _id, username, ... }
      } catch (error) {
        console.error('Failed to fetch current user:', error);
        localStorage.removeItem('accessToken');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);


  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);