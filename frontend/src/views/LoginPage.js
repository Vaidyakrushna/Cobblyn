"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', phone: '', referralCode: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const router = useRouter();

  const [successMsg, setSuccessMsg] = useState('');

  React.useEffect(() => {
    try {
      const guestData = sessionStorage.getItem('bespoke_guest_data');
      if (guestData) {
        const parsed = JSON.parse(guestData);
        setFormData(prev => ({
          ...prev,
          email: parsed.email || prev.email,
          name: parsed.name || prev.name,
          phone: parsed.phone || prev.phone
        }));
      }
    } catch (e) {
      // ignore parse error
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        sessionStorage.removeItem('bespoke_guest_data');
        router.push('/');
      } else {
        const res = await register(formData.name, formData.email, formData.password, formData.referralCode);
        setSuccessMsg(res.message || 'Registration successful! Please verify your email.');
        // Switch to login tab so they can login after verification
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    }
    setLoading(false);
  };

  const handleResendVerification = async () => {
    if (!formData.email) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.resendVerification({ email: formData.email });
      setSuccessMsg(res.message || 'Verification email sent.');
    } catch (err) {
      setError(err.message || 'Failed to resend verification.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page" data-testid="login-page">
      <div className="breadcrumbs">
        <Link href="/">Home</Link>
        <ChevronRight size={14} />
        <span>{isLogin ? 'Login' : 'Create Account'}</span>
      </div>

      <div className="auth-layout">
        <div className="auth-brand-panel">
          <div className="auth-brand-content">
            <h1 className="auth-brand-logo">BY<span className="text-accent">O</span>ND</h1>
            <p className="auth-brand-tagline">Crafted Beyond the Ordinary</p>
            <div className="auth-benefits">
              <div className="auth-benefit">
                <span className="benefit-num">01</span>
                <div><strong>Exclusive Access</strong><p>Early access to new collections and limited editions</p></div>
              </div>
              <div className="auth-benefit">
                <span className="benefit-num">02</span>
                <div><strong>Order Tracking</strong><p>Track your bespoke shoes from workshop to doorstep</p></div>
              </div>
              <div className="auth-benefit">
                <span className="benefit-num">03</span>
                <div><strong>Saved Preferences</strong><p>Save your size, style preferences and wishlist</p></div>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-form-inner">
            <div className="auth-tabs">
              <button className={`auth-tab ${isLogin ? 'active' : ''}`} onClick={() => { setIsLogin(true); setError(''); }} data-testid="tab-login">Log In</button>
              <button className={`auth-tab ${!isLogin ? 'active' : ''}`} onClick={() => { setIsLogin(false); setError(''); }} data-testid="tab-register">Sign Up</button>
            </div>

            <h2 className="auth-form-title">{isLogin ? 'Welcome back' : 'Create your account'}</h2>
            <p className="auth-form-sub">{isLogin ? 'Log in to access your Cobblyn account' : 'Join Cobblyn and enjoy all the advantages'}</p>

            {error && (
              <div className="auth-error" data-testid="auth-error">
                {error}
                {error.includes('Email not verified') && (
                  <button type="button" onClick={handleResendVerification} className="switch-link" style={{display: 'block', marginTop: '8px', textDecoration: 'underline'}}>
                    Resend Verification Email
                  </button>
                )}
              </div>
            )}
            {successMsg && <div className="auth-alert success" data-testid="auth-success" style={{color: 'green', marginBottom: '15px'}}>{successMsg}</div>}

            <form onSubmit={handleSubmit} className="auth-form" data-testid="auth-form">
              {!isLogin && (
                <div className="auth-field">
                  <label>Full Name *</label>
                  <input type="text" placeholder="Enter your name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required data-testid="register-name" />
                </div>
              )}

              <div className="auth-field">
                <label>Email *</label>
                <input type="email" placeholder="your@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required data-testid="auth-email" />
              </div>

              {!isLogin && (
                <div className="auth-field">
                  <label>Phone Number</label>
                  <input type="tel" placeholder="+91 XXXXX XXXXX" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} data-testid="register-phone" />
                </div>
              )}

              {!isLogin && (
                <div className="auth-field">
                  <label>Referral Code (Optional)</label>
                  <input type="text" placeholder="COBBLYN-XXXXXX" value={formData.referralCode} onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })} data-testid="register-referral" />
                </div>
              )}

              <div className="auth-field">
                <label>Password *</label>
                <div className="password-wrap">
                  <input type={showPassword ? 'text' : 'password'} placeholder="Enter password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required data-testid="auth-password" />
                  <button type="button" className="toggle-pw" onClick={() => setShowPassword(!showPassword)} data-testid="toggle-password">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="auth-extras">
                  <label className="remember-me"><input type="checkbox" /> Remember me</label>
                  <Link href="/forgot-password" className="forgot-link">Forgot password?</Link>
                </div>
              )}

              <button type="submit" className="auth-submit-btn" disabled={loading} data-testid="auth-submit">
                {loading ? 'Please wait...' : (isLogin ? 'Log In' : 'Create Account')}
              </button>
            </form>

            <p className="auth-switch-text">
              {isLogin ? "Not registered? " : "Already have an account? "}
              <button className="switch-link" onClick={() => { setIsLogin(!isLogin); setError(''); }}>
                {isLogin ? 'Create an account' : 'Log in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

