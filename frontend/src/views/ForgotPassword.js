"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      await api.register; // ensure api is loaded
      const res = await fetch(
        (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000') + '/api/auth/forgot-password',
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Something went wrong');
      setStatus({ type: 'success', message: data.message || 'If the email exists, a reset link has been sent.' });
      setEmail('');
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Failed to request password reset' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" data-testid="forgot-password-page">
      <div className="breadcrumbs">
        <Link href="/">Home</Link>
        <ChevronRight size={14} />
        <Link href="/login">Login</Link>
        <ChevronRight size={14} />
        <span>Forgot Password</span>
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
                  <strong>Secure Process</strong>
                  <p>We'll send a one-time link to reset your password safely</p>
                </div>
              </div>
              <div className="auth-benefit">
                <span className="benefit-num">02</span>
                <div>
                  <strong>Quick Recovery</strong>
                  <p>The reset link arrives within seconds — check your inbox</p>
                </div>
              </div>
              <div className="auth-benefit">
                <span className="benefit-num">03</span>
                <div>
                  <strong>Need Help?</strong>
                  <p>Contact us at support@cobblyn.com for assistance</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Form Panel ── */}
        <div className="auth-form-panel">
          <div className="auth-form-inner">
            <div className="forgot-icon-wrap">
              <Mail size={36} strokeWidth={1.2} />
            </div>

            <h2 className="auth-form-title">Reset your password</h2>
            <p className="auth-form-sub">
              Enter the email address linked to your account and we'll send you a secure reset link.
            </p>

            {/* Success state */}
            {status.type === 'success' && (
              <div className="forgot-status forgot-status-success" data-testid="forgot-success">
                <CheckCircle size={20} />
                <div>
                  <strong>Email sent!</strong>
                  <p>{status.message}</p>
                </div>
              </div>
            )}

            {/* Error state */}
            {status.type === 'error' && (
              <div className="forgot-status forgot-status-error" data-testid="forgot-error">
                <AlertCircle size={20} />
                <span>{status.message}</span>
              </div>
            )}

            {status.type !== 'success' && (
              <form onSubmit={handleSubmit} className="auth-form" data-testid="forgot-form">
                <div className="auth-field">
                  <label htmlFor="forgot-email">Email Address *</label>
                  <input
                    type="email"
                    id="forgot-email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="forgot-email-input"
                  />
                </div>

                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={loading}
                  data-testid="forgot-submit"
                >
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            )}

            {status.type === 'success' && (
              <button
                className="auth-submit-btn"
                onClick={() => setStatus({ type: '', message: '' })}
                style={{ marginTop: 24 }}
                data-testid="forgot-try-another"
              >
                Try Another Email
              </button>
            )}

            <Link href="/login" className="forgot-back-link" data-testid="forgot-back-login">
              <ArrowLeft size={14} />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
