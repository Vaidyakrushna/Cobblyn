"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null = checking, false = not auth, object = auth
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('cobblyn_token');
    if (!token) {
      setUser(false);
      setLoading(false);
      return;
    }
    try {
      const userData = await api.getMe();
      setUser(userData);
    } catch {
      // Try refresh
      try {
        await api.refreshToken();
        const userData = await api.getMe();
        setUser(userData);
      } catch {
        localStorage.removeItem('cobblyn_token');
        setUser(false);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem('cobblyn_token', data.token);
    setUser({
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      referral_code: data.referral_code || "",
      wallet_balance: data.wallet_balance || 0.0
    });
    return data;
  };

  const register = async (name, email, password, referralCode = null) => {
    const data = await api.register({ name, email, password, referral_code: referralCode });
    // Note: Do not automatically log in the user, they must verify their email.
    return data;
  };

  const logout = async () => {
    try { await api.logout(); } catch {}
    localStorage.removeItem('cobblyn_token');
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
