"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { api } from '../api';

export default function VerifyEmail() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const hasVerified = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    if (hasVerified.current) return;
    hasVerified.current = true;

    const verifyToken = async () => {
      try {
        const res = await api.request('/auth/verify-email', {
          method: 'POST',
          body: JSON.stringify({ token })
        });
        setStatus('success');
        setMessage(res.message || 'Email verified successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Verification failed. The token may be invalid or expired.');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="auth-page" data-testid="verify-email-page">
      <div className="breadcrumbs">
        <Link href="/">Home</Link>
        <ChevronRight size={14} />
        <span>Verify Email</span>
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
                  <strong>Secure Verification</strong>
                  <p>Your email is being verified with a secure one-time token</p>
                </div>
              </div>
              <div className="auth-benefit">
                <span className="benefit-num">02</span>
                <div>
                  <strong>Account Protection</strong>
                  <p>Email verification helps protect your account from unauthorized access</p>
                </div>
              </div>
              <div className="auth-benefit">
                <span className="benefit-num">03</span>
                <div>
                  <strong>Full Access</strong>
                  <p>Once verified, enjoy complete access to your Cobblyn account</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Status Panel ── */}
        <div className="auth-form-panel">
          <div className="auth-form-inner" style={{ textAlign: 'center' }}>
            
            {status === 'verifying' && (
              <>
                <div className="forgot-icon-wrap" style={{ margin: '0 auto 32px' }}>
                  <Loader size={36} strokeWidth={1.2} className="verify-spinner" />
                </div>
                <h2 className="auth-form-title">Verifying your email…</h2>
                <p className="auth-form-sub">Please wait while we confirm your email address.</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="forgot-status forgot-status-success" style={{ justifyContent: 'center' }}>
                  <CheckCircle size={22} />
                  <div>
                    <strong>Verified!</strong>
                    <p>{message}</p>
                  </div>
                </div>
                <Link href="/login" className="auth-submit-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '24px' }}>
                  Proceed to Login
                </Link>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="forgot-status forgot-status-error" style={{ justifyContent: 'center' }}>
                  <AlertCircle size={22} />
                  <span>{message}</span>
                </div>
                <Link href="/login" className="auth-submit-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '24px' }}>
                  Go to Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
