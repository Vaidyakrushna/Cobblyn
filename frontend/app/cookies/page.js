"use client";
import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Cookie, Info, Check, ChevronRight } from 'lucide-react';

export default function CookiePolicy() {
  return (
    <main className="policy-page" style={{ background: '#FCFCFC', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* CSS STYLES FOR THE COOKIES PAGE */}
      <style jsx global>{`
        .policy-hero {
          position: relative;
          background: #111;
          color: #fff;
          padding: 80px 48px;
          text-align: center;
          overflow: hidden;
          margin-bottom: 40px;
        }
        .policy-hero-content {
          max-width: 680px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }
        .policy-hero-title {
          font-family: 'Playfair Display', serif;
          font-size: 2.8rem;
          font-weight: 400;
          line-height: 1.2;
          margin: 12px 0 20px;
          letter-spacing: -0.01em;
        }
        .policy-hero-title em {
          font-style: italic;
          color: #9d2706;
        }
        .policy-hero-sub {
          color: #9CA3AF;
          font-size: 0.95rem;
          line-height: 1.6;
        }
        .policy-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 24px;
          font-family: 'Inter', sans-serif;
        }
        .policy-breadcrumbs {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: #6B7280;
          margin-bottom: 24px;
        }
        .policy-breadcrumbs a {
          color: #6B7280;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .policy-breadcrumbs a:hover {
          color: #9d2706;
        }
        .policy-content {
          background: #fff;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 48px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .policy-section {
          margin-bottom: 36px;
        }
        .policy-section h2 {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          color: #111;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
        }
        .policy-section h2 span.icon {
          color: #9d2706;
        }
        .policy-content p {
          color: #4B5563;
          font-size: 0.95rem;
          line-height: 1.8;
          margin-bottom: 16px;
        }
        .policy-content ul {
          color: #4B5563;
          font-size: 0.95rem;
          line-height: 1.8;
          margin-left: 24px;
          margin-bottom: 20px;
          list-style-type: square;
        }
        .policy-content li {
          margin-bottom: 8px;
        }
        .policy-highlight {
          background: #F9FAFB;
          border-left: 4px solid #9d2706;
          padding: 16px 20px;
          margin: 24px 0;
          border-radius: 0 8px 8px 0;
        }
        .policy-highlight p {
          margin-bottom: 0;
          font-size: 0.92rem;
          color: #374151;
          font-style: italic;
        }
        .policy-footer {
          margin-top: 48px;
          padding-top: 24px;
          border-top: 1px solid #E5E7EB;
          text-align: center;
          font-size: 0.85rem;
          color: #9CA3AF;
        }
      `}</style>

      {/* HERO SECTION */}
      <section className="policy-hero">
        <div className="policy-hero-content">
          <div className="section-label" style={{ color: '#9d2706', fontSize: '0.75rem', letterSpacing: '0.15em', fontWeight: 700, textTransform: 'uppercase' }}>Cookie Policy</div>
          <h1 className="policy-hero-title">Cookie<br /><em>Policy</em></h1>
          <p className="policy-hero-sub">
            Learn how Cobblyn Shoes utilizes cookies, session tokens, and local storage to provide a seamless shopping and custom shoe design experience.
          </p>
        </div>
      </section>

      {/* CONTENT CONTAINER */}
      <div className="policy-container">
        <div className="policy-breadcrumbs">
          <Link href="/">Home</Link>
          <ChevronRight size={12} />
          <span>Cookie Policy</span>
        </div>

        <div className="policy-content">
          <div className="policy-section">
            <h2>
              <span className="icon"><Cookie size={20} /></span>
              1. What Are Cookies?
            </h2>
            <p>
              Cookies are small text files placed on your device when you visit websites. They are widely used to make websites work more efficiently, personalize content, keep you signed in, remember your shopping cart items, and provide analytical data to the website owners.
            </p>
          </div>

          <div className="policy-section">
            <h2>
              <span className="icon"><Info size={20} /></span>
              2. How We Use Cookies & Local Storage
            </h2>
            <p>
              We use both standard cookies and browser local storage to enable essential features:
            </p>
            <ul>
              <li><strong>Authentication & Sessions:</strong> We store secure HTTP-only cookies (`access_token` and `refresh_token`) to maintain your logged-in state across pages. We also utilize local storage (e.g. `byond_token` and user parameters) to verify your credentials programmatically.</li>
              <li><strong>Cart and Wishlist Persistence:</strong> We store your selected shoe styles, sizes, and colors in session variables and local storage to prevent your cart from being cleared when you refresh the page.</li>
              <li><strong>User Preferences:</strong> Keeping track of your selection choices in the 3D Customizer and custom filter configurations.</li>
            </ul>
          </div>

          <div className="policy-section">
            <h2>
              <span className="icon"><Check size={20} /></span>
              3. Categories of Tracking Technologies
            </h2>
            <p>
              The tracking technologies we use fall into three primary categories:
            </p>
            <ul>
              <li><strong>Strictly Necessary:</strong> Critical for core operations such as checking out, logging in, and rate-limiting security checks. Disabling these via browser settings will break core features of our website.</li>
              <li><strong>Functionality & Preferences:</strong> Remember your settings (e.g., active styling chip choices, size recommendations).</li>
              <li><strong>Analytics & Diagnostics:</strong> Help us measure sales parameters, size mismatch exchanges, and popular customizations to refine our production.</li>
            </ul>
          </div>

          <div className="policy-section">
            <h2>
              <span className="icon"><ShieldAlert size={20} /></span>
              4. Managing Your Cookie Preferences
            </h2>
            <p>
              You can control or block cookies at any time through your browser settings. However, please note that blocking strictly necessary cookies will prevent you from logging in, managing your profile, using the shopping cart, or completing checkouts.
            </p>
          </div>

          <div className="policy-footer">
            Last Updated: August 10, 2026 • Cobblyn Shoes Ltd.
          </div>
        </div>
      </div>
    </main>
  );
}
