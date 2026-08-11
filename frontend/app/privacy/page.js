"use client";
import React from 'react';
import Link from 'next/link';
import { Shield, Eye, Lock, FileText, ChevronRight } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <main className="policy-page" style={{ background: '#FCFCFC', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* CSS STYLES FOR THE PREMIUM POLICY PAGE */}
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
          <div className="section-label" style={{ color: '#9d2706', fontSize: '0.75rem', letterSpacing: '0.15em', fontWeight: 700, textTransform: 'uppercase' }}>Security & Trust</div>
          <h1 className="policy-hero-title">Privacy<br /><em>Policy</em></h1>
          <p className="policy-hero-sub">
            Your trust is our most valued asset. Learn how we collect, store, and safeguard your personal information when shopping with Cobblyn Shoes.
          </p>
        </div>
      </section>

      {/* CONTENT CONTAINER */}
      <div className="policy-container">
        <div className="policy-breadcrumbs">
          <Link href="/">Home</Link>
          <ChevronRight size={12} />
          <span>Privacy Policy</span>
        </div>

        <div className="policy-content">
          <div className="policy-section">
            <h2>
              <span className="icon"><Shield size={20} /></span>
              1. Our Privacy Commitment
            </h2>
            <p>
              At Cobblyn, we design and craft premium footwear to last a lifetime, and we hold your personal privacy to the exact same standard. We are committed to transparency and handle all customer data in accordance with the highest data protection standards.
            </p>
            <p>
              This Privacy Policy explains what personal information we collect, how we use it, who we share it with, and how you can exercise your privacy rights under applicable laws.
            </p>
          </div>

          <div className="policy-section">
            <h2>
              <span className="icon"><Eye size={20} /></span>
              2. Information We Collect
            </h2>
            <p>
              We collect information to process your orders, design your custom styles, and provide a personalized experience:
            </p>
            <ul>
              <li><strong>Personal details:</strong> Name, shipping address, billing address, phone number, and email.</li>
              <li><strong>Account credentials:</strong> Password hashes used securely for logging into your Cobblyn account.</li>
              <li><strong>Bespoke measurements:</strong> Physical measurements or 3D Fit Vault foot scans captured during your bespoke consultation.</li>
              <li><strong>Transaction history:</strong> Records of styles purchased, custom order configurations, wallet credit adjustments, and returns.</li>
              <li><strong>Digital diagnostics:</strong> IP addresses, browser agent signatures, and device metrics to detect potential fraud (e.g. self-referral checks).</li>
            </ul>
          </div>

          <div className="policy-section">
            <h2>
              <span className="icon"><Lock size={20} /></span>
              3. How We Secure Your Data
            </h2>
            <p>
              We enforce strict security practices to keep your data safe:
            </p>
            <ul>
              <li><strong>Encryption:</strong> All data in transit is encrypted using Secure Socket Layer (SSL/TLS) technology.</li>
              <li><strong>Secure Passwords:</strong> We encrypt passwords using advanced hashing functions (bcrypt) so your raw password is never stored.</li>
              <li><strong>Transaction Safety:</strong> We do not store your credit/debit card numbers directly on our servers; payments are processed securely by PCI-DSS compliant third-party payment gateways.</li>
            </ul>
            <div className="policy-highlight">
              <p>
                "We implement automatic security diagnostics. For example, our referral system logs IP and device signatures (user-agent) solely to verify the integrity of promotional rewards and prevent self-referral abuse."
              </p>
            </div>
          </div>

          <div className="policy-section">
            <h2>
              <span className="icon"><FileText size={20} /></span>
              4. Data Retention and Sharing
            </h2>
            <p>
              We only share your information with trusted service providers necessary to run our service:
            </p>
            <ul>
              <li><strong>Logistics partners:</strong> Courier services to deliver your shoes and pick up returns/exchanges.</li>
              <li><strong>Communications:</strong> Email utilities to send order confirmations and email verification codes.</li>
              <li><strong>Database storage:</strong> Secure MongoDB instances located in our protected environment.</li>
            </ul>
            <p>
              We will never sell, lease, or distribute your email address or personal details to third-party advertisers.
            </p>
          </div>

          <div className="policy-section">
            <h2>5. Your Rights</h2>
            <p>
              You have the right to request access to, correction of, or deletion of your personal data stored with us. You can manage your account information directly from your My Account page, or email our support desk at hello@cobblynshoes.com for priority assistance.
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
