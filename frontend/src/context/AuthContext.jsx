import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('rentify_token') || null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'

  // Load user profile if token exists
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        if (data.success) {
          setUser(data.user);
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [token]);

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('rentify_token', data.token);
        localStorage.setItem('rentify_user', JSON.stringify(data.user));
        setAuthModalOpen(false);
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed. Please check credentials.'
      };
    }
  };

  const register = async (name, email, password, location, phone) => {
    try {
      const { data } = await api.post('/auth/register', { name, email, password, location, phone });
      if (data.success && data.token) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('rentify_token', data.token);
        localStorage.setItem('rentify_user', JSON.stringify(data.user));
        setAuthModalOpen(false);
        return { success: true, message: data.message };
      }
      return data;
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed.'
      };
    }
  };

  const resendVerificationEmail = async (email) => {
    try {
      const { data } = await api.post('/auth/resend-verification', { email });
      return data;
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to resend verification email.'
      };
    }
  };

  const updateUserProfile = async (fields) => {
    try {
      const { data } = await api.put('/auth/profile', fields);
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('rentify_user', JSON.stringify(data.user));
        return { success: true, user: data.user };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to update profile.'
      };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      return data;
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to request password reset.'
      };
    }
  };

  const resetPassword = async (email, otpCode, newPassword) => {
    try {
      const { data } = await api.post('/auth/reset-password', { email, otpCode, newPassword });
      return data;
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to reset password.'
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('rentify_token');
    localStorage.removeItem('rentify_user');
  };

  const toggleWishlist = async (itemId) => {
    if (!user) {
      setAuthMode('login');
      setAuthModalOpen(true);
      return false;
    }
    try {
      const { data } = await api.post(`/auth/wishlist/${itemId}`);
      if (data.success) {
        setUser((prev) => ({
          ...prev,
          wishlist: data.wishlist
        }));
        return true;
      }
    } catch (err) {
      console.error('Wishlist toggle error:', err);
      return false;
    }
  };

  const isWishlisted = (itemId) => {
    if (!user || !user.wishlist) return false;
    return user.wishlist.some(
      (id) => (typeof id === 'string' ? id : id._id) === itemId
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        token,
        loading,
        authModalOpen,
        setAuthModalOpen,
        authMode,
        setAuthMode,
        login,
        register,
        resendVerificationEmail,
        updateUserProfile,
        forgotPassword,
        resetPassword,
        logout,
        toggleWishlist,
        isWishlisted,
        openAuthModal: (mode = 'login') => {
          setAuthMode(mode);
          setAuthModalOpen(true);
        }
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
