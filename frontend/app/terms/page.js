"use client";
import React from 'react';
import Link from 'next/link';
import { 
  FileText, Hammer, Scale, AlertCircle, ChevronRight, 
  Shield, Globe, Phone, Award, Users, Cpu, Clock, CheckCircle
} from 'lucide-react';

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
          max-width: 720px;
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
          font-size: 0.98rem;
          line-height: 1.6;
        }
        .policy-container {
          max-width: 860px;
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
        .policy-toc {
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 40px;
        }
        .policy-toc-title {
          font-size: 1rem;
          font-weight: 700;
          color: #111;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .policy-toc-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 8px 16px;
          font-size: 0.88rem;
        }
        .policy-toc-grid a {
          color: #4B5563;
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .policy-toc-grid a:hover {
          color: #9d2706;
          text-decoration: underline;
        }
        .policy-section {
          margin-bottom: 40px;
          scroll-margin-top: 40px;
        }
        .policy-section h2 {
          font-family: 'Playfair Display', serif;
          font-size: 1.45rem;
          color: #111;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
        }
        .policy-section h2 span.icon {
          color: #9d2706;
          display: inline-flex;
          align-items: center;
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
          font-style: normal;
        }
        .policy-card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin: 20px 0;
        }
        .policy-card {
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 16px;
        }
        .policy-card h4 {
          font-size: 0.92rem;
          font-weight: 700;
          color: #111;
          margin-bottom: 8px;
        }
        .policy-card p {
          font-size: 0.85rem;
          color: #6B7280;
          line-height: 1.6;
          margin-bottom: 0;
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
          <div className="section-label" style={{ color: '#9d2706', fontSize: '0.75rem', letterSpacing: '0.15em', fontWeight: 700, textTransform: 'uppercase' }}>User Agreement & Craftsmanship Charter</div>
          <h1 className="policy-hero-title">Terms of<br /><em>Service</em></h1>
          <p className="policy-hero-sub">
            Welcome to Cobcult. By exploring our collections, using our 3D design studio, or commissioning handcrafted footwear, you agree to the following terms.
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
          {/* QUICK INDEX */}
          <div className="policy-toc">
            <div className="policy-toc-title">
              <FileText size={18} color="#9d2706" />
              Terms of Service Index
            </div>
            <div className="policy-toc-grid">
              <a href="#acceptance">1. Acceptance & Your Consent</a>
              <a href="#eligibility">2. Age Eligibility (18+)</a>
              <a href="#country-origin">3. Country of Origin & Law</a>
              <a href="#bespoke-terms">4. Bespoke Footwear Policies</a>
              <a href="#catalogue-terms">5. Ready-to-Wear Orders & Returns</a>
              <a href="#pricing-gst">6. Pricing, GST & Payments</a>
              <a href="#warranty-resoling">7. Warranty & Resoling Program</a>
              <a href="#referral-wallet">8. Referral & Wallet Credits</a>
              <a href="#automated-checks">9. Automated Fraud Checks</a>
              <a href="#intellectual-property">10. Intellectual Property</a>
              <a href="#retention-terms">11. Account Retention & Deletion</a>
              <a href="#disclaimers">12. Disclaimers & Liability</a>
              <a href="#changes-terms">13. Changes to Terms</a>
              <a href="#contact-concierge">14. Concierge Contact</a>
            </div>
          </div>

          {/* 1. ACCEPTANCE & CONSENT */}
          <div id="acceptance" className="policy-section">
            <h2>
              <span className="icon"><Scale size={20} /></span>
              1. Acceptance of Terms & Your Consent
            </h2>
            <p>
              By accessing <Link href="/" style={{ color: '#9d2706', textDecoration: 'underline' }}>cobcult.com</Link>, creating a customer account, designing footwear in our 3D customizer, booking an artisan studio consultation, or purchasing products from <strong>Cobcult</strong> (Cobcult Shoes Ltd.), you give your express consent and agree to be contractually bound by these Terms of Service.
            </p>
            <p>
              If you do not agree with any provision of these terms, please do not use our website or services.
            </p>
          </div>

          {/* 2. ELIGIBILITY */}
          <div id="eligibility" className="policy-section">
            <h2>
              <span className="icon"><Users size={20} /></span>
              2. Age Eligibility & Children's Purchase Policy
            </h2>
            <p>
              You must be at least <strong>18 years of age</strong> (or the age of legal majority in your jurisdiction) to create a customer account, enter into a binding sales contract, or make purchases on Cobcult.
            </p>
            <p>
              If you are under 18, you may browse our footwear collections only with the active involvement and consent of a parent or legal guardian.
            </p>
          </div>

          {/* 3. COUNTRY OF ORIGIN & GOVERNING LAW */}
          <div id="country-origin" className="policy-section">
            <h2>
              <span className="icon"><Globe size={20} /></span>
              3. Country of Origin & Governing Law
            </h2>
            <p>
              <strong>Country of Origin:</strong> Cobcult is founded, owned, and operated in <strong>India</strong>. Every pair of shoes is meticulously handcrafted by skilled Indian artisans using premium full-grain leathers and traditional welted constructions.
            </p>
            <p>
              These Terms of Service and all related transactions are governed by the laws of the Republic of India. Any dispute, claim, or controversy arising out of these terms shall be subject to the exclusive jurisdiction of the competent courts in India.
            </p>
          </div>

          {/* 4. BESPOKE TERMS */}
          <div id="bespoke-terms" className="policy-section">
            <h2>
              <span className="icon"><Hammer size={20} /></span>
              4. Bespoke & Made-to-Order Footwear Policies
            </h2>
            <p>
              Because our bespoke footwear is individually cut, lasted, and customized to your specific measurements and patina choices:
            </p>
            <ul>
              <li>
                <strong>12-Hour Modification Window:</strong> You may modify your leather choice, sole type, or size parameters within <strong>12 hours</strong> of order confirmation. Once your order enters "In Production", leather hides are cut and customized lasts are locked, after which modifications cannot be accepted.
              </li>
              <li>
                <strong>Master Artisan Fit Guarantee:</strong> All bespoke orders include complimentary fitting adjustments. In the rare event of a fit discrepancy, our team will adjust or recraft the shoe to achieve a bespoke fit.
              </li>
              <li>
                <strong>Custom Exclusions:</strong> Personalized, engraved, or made-to-order bespoke pairs cannot be cancelled or returned once production begins, except in verified cases of manufacturing defects.
              </li>
            </ul>
          </div>

          {/* 5. READY-TO-WEAR ORDERS & RETURNS */}
          <div id="catalogue-terms" className="policy-section">
            <h2>
              <span className="icon"><CheckCircle size={20} /></span>
              5. Ready-to-Wear Orders, Cancellations & 15-Day Returns
            </h2>
            <p>
              For our standard catalogue footwear, belts, and leather accessories:
            </p>
            <ul>
              <li><strong>Cancellation:</strong> Standard orders may be cancelled online within 12 hours of placement.</li>
              <li><strong>15-Day Unworn Returns:</strong> You may exchange or return unworn shoes in their original, pristine packaging with dust bags and shoehorns intact within <strong>15 days</strong> of delivery.</li>
              <li><strong>Complimentary Doorstep Pickup:</strong> We arrange free return pickup directly from your doorstep anywhere in India.</li>
            </ul>
          </div>

          {/* 6. PRICING, GST & PAYMENTS */}
          <div id="pricing-gst" className="policy-section">
            <h2>
              <span className="icon"><Shield size={20} /></span>
              6. Pricing, GST Invoicing & Secure Payments
            </h2>
            <p>
              All prices displayed on Cobcult are in Indian Rupees (INR) and include applicable Goods and Services Tax (GST) unless explicitly noted otherwise:
            </p>
            <ul>
              <li><strong>Tax Invoices:</strong> A valid GST-compliant invoice is generated and provided electronically for every completed order.</li>
              <li><strong>Payment Gateways:</strong> We partner with RBI-licensed, PCI-DSS Level 1 compliant payment gateways (such as Razorpay, Cashfree, and Stripe) to process UPI, credit cards, debit cards, and net banking. Cobcult never stores your card CVV or payment passwords.</li>
            </ul>
          </div>

          {/* 7. LIFETIME WARRANTY & RESOLING */}
          <div id="warranty-resoling" className="policy-section">
            <h2>
              <span className="icon"><Award size={20} /></span>
              7. Craftsmanship Warranty & Lifetime Resoling Program
            </h2>
            <p>
              We build shoes designed to last a lifetime. All Goodyear welted and Blake stitched Cobcult shoes qualify for our <strong>Lifetime Care Program</strong>:
            </p>
            <ul>
              <li><strong>Manufacturing Warranty:</strong> 1-year complimentary warranty covering structural heel separation, shank integrity, and stitching defects under normal wear.</li>
              <li><strong>Recrafting & Resoling:</strong> When your leather soles naturally wear down after years of use, send your shoes back to our studio for our paid Resoling Service. Our artisans will strip the old sole, inspect the cork bed, stitch a fresh Vibram or Italian leather sole, and re-burnish the uppers.</li>
            </ul>
          </div>

          {/* 8. REFERRAL & WALLET */}
          <div id="referral-wallet" className="policy-section">
            <h2>
              <span className="icon"><FileText size={20} /></span>
              8. Referral Program & Promotional Wallet Credits
            </h2>
            <p>
              Cobcult’s Refer & Earn program rewards customers who introduce friends to fine craftsmanship:
            </p>
            <ul>
              <li><strong>Anti-Abuse Guidelines:</strong> Referral credits are awarded only after the referred recipient completes their first verified order. Self-referrals (using duplicate IP addresses, shared devices, or self-owned contact numbers) are flagged and voided.</li>
              <li><strong>Redemption Rules:</strong> Wallet credits cannot be encashed, transferred, or refunded. Checkout caps apply (e.g. up to ₹500 discount on footwear and ₹100 on accessories per order).</li>
            </ul>
          </div>

          {/* 9. AUTOMATED CHECKS */}
          <div id="automated-checks" className="policy-section">
            <h2>
              <span className="icon"><Cpu size={20} /></span>
              9. Automated Decision-Making & Anti-Fraud Security
            </h2>
            <p>
              To safeguard our artisans and buyers, our systems execute automated checks:
            </p>
            <ul>
              <li><strong>Bot Mitigation:</strong> Blocking automated scripts from manipulating high-demand product drops.</li>
              <li><strong>Payment Fraud Prevention:</strong> Checking risk scores during online transactions to prevent card unauthorized usage.</li>
            </ul>
            <p>
              If you believe an order or reward was incorrectly flagged by an automated security check, contact our concierge desk for immediate manual review.
            </p>
          </div>

          {/* 10. INTELLECTUAL PROPERTY */}
          <div id="intellectual-property" className="policy-section">
            <h2>
              <span className="icon"><Award size={20} /></span>
              10. Intellectual Property Rights
            </h2>
            <p>
              All website content—including our 3D footwear customizer, last profiles, leather finish patterns, photographs, brand trademarks, logos, and UI designs—are the exclusive intellectual property of Cobcult. You may not reproduce, reverse-engineer, scrape, or distribute our proprietary assets without written permission.
            </p>
          </div>

          {/* 11. RETENTION */}
          <div id="retention-terms" className="policy-section">
            <h2>
              <span className="icon"><Clock size={20} /></span>
              11. Customer Account Retention & Deletion
            </h2>
            <p>
              We maintain your customer account, order history, and bespoke foot measurements to provide you with seamless reorders and lifetime resoling support.
            </p>
            <p>
              <strong>Your Right to Delete:</strong> You can request the permanent closure of your account and erasure of your personal records at any time by contacting <a href="mailto:care@cobcult.com" style={{ color: '#9d2706' }}>care@cobcult.com</a>. Once received, your profile will be permanently deleted, retaining only statutory financial invoices required under Indian tax laws.
            </p>
          </div>

          {/* 12. DISCLAIMERS */}
          <div id="disclaimers" className="policy-section">
            <h2>
              <span className="icon"><AlertCircle size={20} /></span>
              12. Disclaimers & Limitation of Liability
            </h2>
            <p>
              Because our footwear is crafted from authentic, premium full-grain natural leathers, subtle variations in grain texture, character markings, and hand-applied patina shading are the hallmarks of genuine craftsmanship, not defects.
            </p>
            <p>
              To the maximum extent permitted by Indian law, Cobcult shall not be liable for indirect, incidental, or consequential damages resulting from the use or inability to use our website or footwear products.
            </p>
          </div>

          {/* 13. CHANGES TO TERMS */}
          <div id="changes-terms" className="policy-section">
            <h2>
              <span className="icon"><Clock size={20} /></span>
              13. Changes to These Terms of Service
            </h2>
            <p>
              We reserve the right to revise or amend these Terms of Service at our discretion. Any modifications will be posted on this page with an updated effective date. Continued use of Cobcult following any updates signifies your agreement to the modified terms.
            </p>
          </div>

          {/* 14. CONTACT CONCIERGE */}
          <div id="contact-concierge" className="policy-section">
            <h2>
              <span className="icon"><Phone size={20} /></span>
              14. Customer Concierge & Inquiries
            </h2>
            <p>
              For questions regarding our terms, bespoke orders, fitting advice, or recrafting inquiries, our concierge is here to assist:
            </p>
            <div className="policy-card-grid">
              <div className="policy-card">
                <h4>Customer Concierge</h4>
                <p>
                  <strong>Email:</strong> <a href="mailto:care@cobcult.com" style={{ color: '#9d2706' }}>care@cobcult.com</a><br />
                  <strong>Hours:</strong> Mon – Sat, 10:00 AM – 7:00 PM IST<br />
                  <strong>Support:</strong> Orders, Fit Advice, Resoling
                </p>
              </div>
              <div className="policy-card">
                <h4>Privacy & Legal Matters</h4>
                <p>
                  <strong>Email:</strong> <a href="mailto:privacy@cobcult.com" style={{ color: '#9d2706' }}>privacy@cobcult.com</a><br />
                  <strong>Grievance:</strong> <a href="mailto:grievance@cobcult.com" style={{ color: '#9d2706' }}>grievance@cobcult.com</a><br />
                  <strong>Location:</strong> India
                </p>
              </div>
            </div>
          </div>

          <div className="policy-footer">
            Last Updated: September 11, 2026 • Cobcult Shoes (Cobcult Ltd.) • Handcrafted in India
          </div>
        </div>
      </div>
    </main>
  );
}

