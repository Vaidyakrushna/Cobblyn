"use client";
import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { api } from '../api';

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await api.request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, new_password: password })
      });
      setStatus({ type: 'success', message: res.message || 'Password reset successfully!' });
      setTimeout(() => router.push('/login'), 2500);
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Failed to reset password. The token may be expired.' });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-page" data-testid="reset-password-page">
        <div className="breadcrumbs">
          <Link href="/">Home</Link>
          <ChevronRight size={14} />
          <span>Reset Password</span>
        </div>
        <div className="auth-layout">
          <div className="auth-brand-panel">
            <div className="auth-brand-content">
              <h1 className="auth-brand-logo">BY<span className="text-accent">O</span>ND</h1>
              <p className="auth-brand-tagline">Crafted Beyond the Ordinary</p>
            </div>
          </div>
          <div className="auth-form-panel">
            <div className="auth-form-inner" style={{ textAlign: 'center' }}>
              <div className="forgot-status forgot-status-error" style={{ justifyContent: 'center' }}>
                <AlertCircle size={22} />
                <span>No reset token provided. Please request a new link.</span>
              </div>
              <Link href="/forgot-password" className="auth-submit-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '24px' }}>
                Request New Link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page" data-testid="reset-password-page">
      <div className="breadcrumbs">
        <Link href="/">Home</Link>
        <ChevronRight size={14} />
        <Link href="/login">Login</Link>
        <ChevronRight size={14} />
        <span>Reset Password</span>
      </div>

      <div className="auth-layout">
        {/* ── Left Brand Panel ── */}
        <div className="auth-brand-panel">
          <div className="auth-brand-content">
            <h1 className="auth-brand-logo">BY<span className="text-accent">O</span>ND</h1>
            <p className="auth-brand-tagline">Crafted Beyond the Ordinary</p>

            <div className="auth-benefits">
              <div className="auth-benefit">
                <span className="benefit-num">01</span>
                <div>
                  <strong>Strong Password</strong>
                  <p>Use a mix of letters, numbers and symbols for maximum security</p>
                </div>
              </div>
              <div className="auth-benefit">
                <span className="benefit-num">02</span>
                <div>
                  <strong>One-Time Link</strong>
                  <p>This reset link can only be used once and expires in 1 hour</p>
                </div>
              </div>
              <div className="auth-benefit">
                <span className="benefit-num">03</span>
                <div>
                  <strong>Immediate Access</strong>
                  <p>Log in instantly after setting your new password</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Form Panel ── */}
        <div className="auth-form-panel">
          <div className="auth-form-inner">
            <div className="forgot-icon-wrap">
              <Lock size={36} strokeWidth={1.2} />
            </div>

            <h2 className="auth-form-title">Set a new password</h2>
            <p className="auth-form-sub">
              Choose a strong password for your Cobblyn account.
            </p>

            {/* Success state */}
            {status.type === 'success' && (
              <div className="forgot-status forgot-status-success" data-testid="reset-success">
                <CheckCircle size={20} />
                <div>
                  <strong>Password Updated!</strong>
                  <p>{status.message} Redirecting to login…</p>
                </div>
              </div>
            )}

            {/* Error state */}
            {status.type === 'error' && (
              <div className="forgot-status forgot-status-error" data-testid="reset-error">
                <AlertCircle size={20} />
                <span>{status.message}</span>
              </div>
            )}

            {status.type !== 'success' && (
              <form onSubmit={handleSubmit} className="auth-form" data-testid="reset-form">
                <div className="auth-field">
                  <label htmlFor="reset-password">New Password *</label>
                  <div className="password-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="reset-password"
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength="6"
                      data-testid="reset-password-input"
                    />
                    <button type="button" className="toggle-pw" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="auth-field">
                  <label htmlFor="reset-confirm">Confirm Password *</label>
                  <input
                    type="password"
                    id="reset-confirm"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    data-testid="reset-confirm-input"
                  />
                </div>

                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={loading}
                  data-testid="reset-submit"
                >
                  {loading ? 'Resetting…' : 'Reset Password'}
                </button>
              </form>
            )}

            <Link href="/login" className="forgot-back-link" data-testid="reset-back-login">
              <ArrowLeft size={14} />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
