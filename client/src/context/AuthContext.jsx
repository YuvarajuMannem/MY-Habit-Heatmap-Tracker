import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// API URL from environment variable
const API_URL = process.env.REACT_APP_API_URL || '';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      console.log('AuthContext: Loading user...');
      console.log('API_URL:', API_URL || '(using proxy)');
      console.log('Token exists:', !!storedToken);
      console.log('User exists:', !!storedUser);
      
      if (storedToken && storedUser) {
        try {
          // Set token in axios headers
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          
          // Verify token by making a test request
          console.log('AuthContext: Verifying token...');
          await axios.get(`${API_URL}/api/habits`);
          
          // If successful, set the user
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setToken(storedToken);
          console.log('AuthContext: User loaded successfully');
        } catch (error) {
          console.error('AuthContext: Token validation failed:', error.response?.status, error.message);
          
          // Clear invalid data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
          delete axios.defaults.headers.common['Authorization'];
        }
      } else {
        console.log('AuthContext: No stored credentials found');
        setUser(null);
        setToken(null);
      }
      
      setLoading(false);
    };

    loadUser();
  }, []); // Run only once on mount

  const signup = async (name, email, password) => {
    try {
      console.log('Attempting signup...');
      const response = await axios.post(`${API_URL}/api/auth/signup`, {
        name,
        email,
        password
      });

      const { token, user } = response.data;
      
      console.log('Signup successful, saving credentials');
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token);
      setUser(user);

      return { success: true };
    } catch (error) {
      console.error('Signup failed:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.message || 'Signup failed'
      };
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Attempting login...');
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });

      const { token, user } = response.data;
      
      console.log('Login successful, saving credentials');
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token);
      setUser(user);

      return { success: true };
    } catch (error) {
      console.error('Login failed:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const logout = () => {
    console.log('Logging out...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const verifyPassword = async (password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/verify-password`, {
        password
      });
      return response.data.verified;
    } catch (error) {
      return false;
    }
  };

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    verifyPassword,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};