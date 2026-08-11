"use client";
import React from 'react';
import Link from 'next/link';
import { FileText, Hammer, Scale, AlertCircle, ChevronRight } from 'lucide-react';

export default function TermsOfService() {
  return (
    <main className="policy-page" style={{ background: '#FCFCFC', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* CSS STYLES FOR THE TERMS PAGE */}
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
          <div className="section-label" style={{ color: '#9d2706', fontSize: '0.75rem', letterSpacing: '0.15em', fontWeight: 700, textTransform: 'uppercase' }}>User Agreement</div>
          <h1 className="policy-hero-title">Terms of<br /><em>Service</em></h1>
          <p className="policy-hero-sub">
            Welcome to Cobblyn Shoes. By browsing or purchasing from our store, you agree to comply with and be bound by the following terms.
          </p>
        </div>
      </section>

      {/* CONTENT CONTAINER */}
      <div className="policy-container">
        <div className="policy-breadcrumbs">
          <Link href="/">Home</Link>
          <ChevronRight size={12} />
          <span>Terms of Service</span>
        </div>

        <div className="policy-content">
          <div className="policy-section">
            <h2>
              <span className="icon"><Scale size={20} /></span>
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing this website, creating a customer profile, scheduling visits, or completing purchases at Cobblyn Shoes, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </div>

          <div className="policy-section">
            <h2>
              <span className="icon"><Hammer size={20} /></span>
              2. Custom & Bespoke Policies
            </h2>
            <p>
              Cobblyn specializes in bespoke and custom footwear, crafted to individual specifications:
            </p>
            <ul>
              <li><strong>Modification Window:</strong> Because custom pairs are handcrafted from scratch, changes to custom sole configurations, leather, or sizing options can only be made within 12 hours of order confirmation. Once your status moves to "In Production", the materials are cut and changes are no longer allowed.</li>
              <li><strong>Fit Guarantee:</strong> Bespoke orders include complimentary fitting adjustments. In the rare case of a sizing error, we will adjust or remake your shoe to ensure a glove-like fit.</li>
              <li><strong>Exclusions:</strong> We do not offer returns, cancellations, or refunds on customized or bespoke footwear once production has commenced, except in the case of manufacturing defects verified by our quality control team.</li>
            </ul>
          </div>

          <div className="policy-section">
            <h2>
              <span className="icon"><AlertCircle size={20} /></span>
              3. Order Cancellation & Returns
            </h2>
            <p>
              For standard catalogue products, the following terms apply:
            </p>
            <ul>
              <li><strong>Cancellation:</strong> Standard orders can be cancelled online within 12 hours of placement.</li>
              <li><strong>Returns & Exchanges:</strong> Unworn standard shoes in original, undamaged packaging can be returned or exchanged within 15 days of delivery. Free doorstep pickup is provided across India.</li>
              <li><strong>Warranty:</strong> Select Goodwin welted shoes are eligible for our paid resoling and recrafting services. Email hello@cobblynshoes.com for bookings.</li>
            </ul>
          </div>

          <div className="policy-section">
            <h2>
              <span className="icon"><FileText size={20} /></span>
              4. Referral & Wallet Credit Terms
            </h2>
            <p>
              Cobblyn offers a Refer & Earn promotional program. Points, credits, and virtual wallets are subject to the following rules:
            </p>
            <ul>
              <li><strong>Verification:</strong> Referral rewards are pending/held until the referred referee completes their first order. Self-referrals (matching IP addresses, device user-agents, or registration details) are flagged as fraudulent and voided.</li>
              <li><strong>Limits:</strong> Wallet credits cannot be exchanged for cash, and max discount caps apply when applying wallet credits at checkout (e.g. max ₹500 for shoes and ₹100 for accessories).</li>
            </ul>
          </div>

          <div className="policy-section">
            <h2>5. Intellectual Property</h2>
            <p>
              All website designs, 3D customizer assets, photographs, shoe lasts, patterns, logos, and written content are the exclusive intellectual property of Cobblyn Shoes. Unauthorized duplication or distribution is strictly prohibited.
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
