"use client";
import React from 'react';
import Link from 'next/link';
import { 
  Shield, Eye, Lock, FileText, ChevronRight, UserCheck, 
  Globe, Phone, AlertTriangle, Database, Clock, 
  RotateCcw, Cpu, Users, Award
} from 'lucide-react';

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
          <div className="section-label" style={{ color: '#9d2706', fontSize: '0.75rem', letterSpacing: '0.15em', fontWeight: 700, textTransform: 'uppercase' }}>Privacy, Trust & Integrity</div>
          <h1 className="policy-hero-title">Privacy<br /><em>Policy</em></h1>
          <p className="policy-hero-sub">
            Your trust is our craftsmanship foundation. Learn how Cobcult collects, safeguards, uses, and respects your personal data with complete transparency.
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
          {/* QUICK SUMMARY / TABLE OF CONTENTS */}
          <div className="policy-toc">
            <div className="policy-toc-title">
              <FileText size={18} color="#9d2706" />
              Quick Index of Sections
            </div>
            <div className="policy-toc-grid">
              <a href="#consent">1. Your Consent</a>
              <a href="#info-we-collect">2. What Info We Collect</a>
              <a href="#source-of-collection">3. Source of Collection</a>
              <a href="#purpose-of-collection">4. Purpose of Collection</a>
              <a href="#how-we-use-info">5. How We Use Your Info</a>
              <a href="#who-has-access">6. Who Has Access</a>
              <a href="#security">7. Security Measures</a>
              <a href="#cookies">8. Cookies & Tracking</a>
              <a href="#retention">9. Data Retention Policy</a>
              <a href="#how-long">10. How Long Cobcult Treats Data</a>
              <a href="#your-rights">11. Your Rights</a>
              <a href="#withdraw-consent">12. How to Withdraw Consent</a>
              <a href="#automated-decisions">13. Automated Decision-Making</a>
              <a href="#childrens-privacy">14. Children's Privacy</a>
              <a href="#country-of-origin">15. Country of Origin & Jurisdiction</a>
              <a href="#policy-changes">16. Changes to This Policy</a>
              <a href="#contact-info">17. Contact & Grievance Info</a>
            </div>
          </div>

          {/* 1. YOUR CONSENT */}
          <div id="consent" className="policy-section">
            <h2>
              <span className="icon"><UserCheck size={20} /></span>
              1. Your Consent
            </h2>
            <p>
              By visiting the <strong>Cobcult</strong> website (<Link href="/" style={{ color: '#9d2706', textDecoration: 'underline' }}>cobcult.com</Link>), creating a customer profile, configuring footwear via our 3D customizer, booking bespoke studio appointments, or purchasing our products, you give clear and informed consent to the collection, storage, and processing of your personal information in accordance with this Privacy Policy.
            </p>
            <div className="policy-highlight">
              <p>
                <strong>Customer-First Promise:</strong> We only collect data that is strictly necessary to deliver handcrafted footwear, ensure custom fitting precision, and maintain your customer account. You can withdraw your consent at any time (see Section 12).
              </p>
            </div>
          </div>

          {/* 2. WHAT INFO WE COLLECT */}
          <div id="info-we-collect" className="policy-section">
            <h2>
              <span className="icon"><Eye size={20} /></span>
              2. What Info We Collect About You
            </h2>
            <p>
              Depending on how you interact with Cobcult, we collect the following categories of information:
            </p>
            <ul>
              <li><strong>Contact & Identity Details:</strong> Full name, email address, mobile phone number, delivery address, and billing address.</li>
              <li><strong>Account Credentials:</strong> Securely hashed passwords for account access. We never store raw plain-text passwords.</li>
              <li><strong>Bespoke & Fit Data:</strong> Foot length, width, arch measurements, 3D Fit Vault scan data, bespoke last profiles, and size preference notes.</li>
              <li><strong>Transaction & Purchase History:</strong> Details of shoes ordered, customized leather choices, sole selections, order status, invoice history, wallet balance, and return/exchange records.</li>
              <li><strong>Payment Information:</strong> Transaction identifiers and payment status. <em>Please note: We do NOT store your credit/debit card numbers, CVVs, or net banking passwords. All payments are processed directly by RBI-authorized, PCI-DSS compliant payment gateways.</em></li>
              <li><strong>Technical & Diagnostic Data:</strong> IP address, browser type, operating system, device signatures, and referral attribution tags (used to verify rewards and prevent abuse).</li>
            </ul>
          </div>

          {/* 3. SOURCE OF COLLECTION */}
          <div id="source-of-collection" className="policy-section">
            <h2>
              <span className="icon"><Database size={20} /></span>
              3. Source of Collection
            </h2>
            <p>
              We collect your personal information through three transparent channels:
            </p>
            <div className="policy-card-grid">
              <div className="policy-card">
                <h4>1. Directly From You</h4>
                <p>When you register, place an order, configure shoes in the customizer, book a bespoke consultation, contact customer support, or participate in our Refer & Earn program.</p>
              </div>
              <div className="policy-card">
                <h4>2. Automatically Through Site Use</h4>
                <p>Via cookies, server logs, and browser diagnostics as you navigate our pages, save items to your wishlist, or customize designs.</p>
              </div>
              <div className="policy-card">
                <h4>3. Trusted Service Partners</h4>
                <p>From authorized payment gateways (confirming successful transaction status) and logistics partners (delivery confirmations and tracking status).</p>
              </div>
            </div>
          </div>

          {/* 4. PURPOSE OF COLLECTION */}
          <div id="purpose-of-collection" className="policy-section">
            <h2>
              <span className="icon"><Award size={20} /></span>
              4. Purpose of Collection
            </h2>
            <p>
              We collect and process your personal data strictly for legitimate business and craftsmanship purposes:
            </p>
            <ul>
              <li><strong>Fulfillment & Craftsmanship:</strong> Handcrafting your shoes to exact specifications and delivering them to your doorstep.</li>
              <li><strong>Bespoke Precision:</strong> Retaining your sizing and fit parameters so reordering or resoling your pairs is effortless.</li>
              <li><strong>Customer Support:</strong> Responding to inquiries, order changes within the 12-hour modification window, and warranty service requests.</li>
              <li><strong>Account Management & Security:</strong> Enabling login, safeguarding your order history, and preventing fraudulent transactions or referral abuse.</li>
              <li><strong>Statutory Compliance:</strong> Issuing tax invoices and complying with Indian GST and accounting requirements.</li>
              <li><strong>Communications:</strong> Sending transactional alerts (order confirmation, dispatch tracking) and, only with your permission, special releases and styling advice.</li>
            </ul>
          </div>

          {/* 5. HOW WE USE THE INFO */}
          <div id="how-we-use-info" className="policy-section">
            <h2>
              <span className="icon"><FileText size={20} /></span>
              5. How We Use the Info Collected From You
            </h2>
            <p>
              We use your information only in direct alignment with the purpose for which you provided it:
            </p>
            <ul>
              <li>To prepare and cut leathers, assemble footwear lasts, and craft bespoke footwear.</li>
              <li>To coordinate with logistics couriers for delivery and doorstep pickup for returns/exchanges.</li>
              <li>To notify you in real-time about your shoe production stages (e.g., "Pattern Cut", "Lasting", "Finishing", "Dispatched").</li>
              <li>To credit referral incentives and promotional wallet credits to verified customer accounts.</li>
              <li>To analyze aggregate trends (e.g. popular sizes or sole types) to optimize our material sourcing and prevent shoe waste.</li>
            </ul>
          </div>

          {/* 6. WHO HAS ACCESS TO YOUR INFO */}
          <div id="who-has-access" className="policy-section">
            <h2>
              <span className="icon"><Users size={20} /></span>
              6. Who Has Access to Your Info
            </h2>
            <p>
              Access to your personal information is strictly restricted on a <em>need-to-know</em> basis:
            </p>
            <ul>
              <li><strong>Internal Cobcult Team:</strong> Master craftsmen, bespoke shoe consultants, and customer support specialists who need the details to craft and deliver your orders.</li>
              <li><strong>Logistics & Courier Partners:</strong> Trusted delivery partners (e.g., Blue Dart, Shiprocket, Delhivery) who receive only your shipping address, name, and contact phone number for delivery.</li>
              <li><strong>Payment Gateways:</strong> PCI-DSS certified payment processors (e.g., Razorpay, Cashfree, Stripe) that securely handle transactions.</li>
              <li><strong>Infrastructure & Email Providers:</strong> Secure cloud servers hosting our database and transactional email delivery services (e.g., ZeptoMail).</li>
              <li><strong>Statutory & Legal Authorities:</strong> Government or legal entities only when strictly required by applicable Indian law or valid court order.</li>
            </ul>
            <div className="policy-highlight">
              <p>
                <strong>Zero Data Selling:</strong> Cobcult has never sold, leased, or rented personal customer data to third-party advertisers or data brokers, and we never will.
              </p>
            </div>
          </div>

          {/* 7. SECURITY */}
          <div id="security" className="policy-section">
            <h2>
              <span className="icon"><Lock size={20} /></span>
              7. Security Measures
            </h2>
            <p>
              We protect your data using industry-leading security practices:
            </p>
            <ul>
              <li><strong>Encryption in Transit:</strong> 256-bit SSL/TLS encryption for all website communications and API transactions.</li>
              <li><strong>Password Hashing:</strong> Passwords are protected using robust <code>bcrypt</code> cryptographic hashing with random salts.</li>
              <li><strong>Payment Security:</strong> Tokenized payment interfaces where financial information never touches or resides on Cobcult servers.</li>
              <li><strong>Database Protection:</strong> Isolated, firewall-protected database instances with restricted internal administrative access and multi-factor authentication.</li>
            </ul>
          </div>

          {/* 8. COOKIES & TRACKING */}
          <div id="cookies" className="policy-section">
            <h2>
              <span className="icon"><Clock size={20} /></span>
              8. How We Use Cookies & Tracking Technologies
            </h2>
            <p>
              We use standard cookies, session tokens, and browser local storage to ensure our website functions smoothly:
            </p>
            <ul>
              <li><strong>Essential Cookies:</strong> Keep you securely logged in, remember your cart items, and protect checkout forms.</li>
              <li><strong>Preference Storage:</strong> Remember your choices in the 3D Customizer, size filters, and currency displays.</li>
              <li><strong>Diagnostics & Performance:</strong> Help us identify technical bugs and optimize page load speeds.</li>
            </ul>
            <p>
              For complete details on each cookie category and how to manage your cookie preferences, please read our dedicated <Link href="/cookies" style={{ color: '#9d2706', textDecoration: 'underline' }}>Cookie Policy</Link>.
            </p>
          </div>

          {/* 9. DATA RETENTION */}
          <div id="retention" className="policy-section">
            <h2>
              <span className="icon"><Database size={20} /></span>
              9. Data Retention (We Store Personal Details Until You Instruct Us to Delete)
            </h2>
            <p>
              <strong>Our Policy is Simple:</strong> We store your personal details and fit profiles until you instruct us to delete them.
            </p>
            <p>
              Because fine footwear requires maintenance, resoling, and recrafting over years, keeping your fit profile active allows you to reorder shoes or request repairs seamlessly without repeating the sizing process.
            </p>
            <div className="policy-highlight">
              <p>
                <strong>Right to Delete:</strong> If at any point you wish to close your account or have your personal details erased, simply inform us (see Section 12). Upon receiving your deletion request, your profile and personal identifiable information will be permanently deleted, except where retention of specific transactional invoices is mandated by Indian tax and GST laws.
              </p>
            </div>
          </div>

          {/* 10. HOW LONG COBCULT TREATS PERSONAL DATA */}
          <div id="how-long" className="policy-section">
            <h2>
              <span className="icon"><Clock size={20} /></span>
              10. How Long Will Cobcult Treat Personal Data?
            </h2>
            <p>
              Cobcult treats personal data across clear timelines:
            </p>
            <ul>
              <li><strong>Active Customer Profile:</strong> Treated continuously for as long as your Cobcult account remains active and open.</li>
              <li><strong>Bespoke Fit Vault Profiles:</strong> Maintained for your lifetime re-orders and resoling services, or until you request its deletion.</li>
              <li><strong>Tax Invoices & Accounting Records:</strong> Retained for 8 years to fulfill mandatory legal obligations under the Indian Goods and Services Tax (GST) Act and Income Tax regulations.</li>
              <li><strong>Guest Sessions & Temporary Logs:</strong> Automatically purged within 30 to 90 days.</li>
            </ul>
          </div>

          {/* 11. YOUR RIGHTS */}
          <div id="your-rights" className="policy-section">
            <h2>
              <span className="icon"><Shield size={20} /></span>
              11. Your Rights
            </h2>
            <p>
              Under applicable data protection regulations (including India's Digital Personal Data Protection Act), you enjoy full control over your personal data:
            </p>
            <ul>
              <li><strong>Right to Access:</strong> Request a full summary of the personal data Cobcult holds about you.</li>
              <li><strong>Right to Rectification:</strong> Update or correct any outdated contact, address, or sizing information at any time via your account dashboard.</li>
              <li><strong>Right to Erasure ("Right to be Forgotten"):</strong> Request the complete deletion of your customer profile, fit records, and stored addresses.</li>
              <li><strong>Right to Data Portability:</strong> Request an electronic copy of your purchase history and personal data.</li>
              <li><strong>Right to Restrict or Object:</strong> Opt-out of non-essential marketing emails, SMS, or promotional communications at any time.</li>
              <li><strong>Right to Grievance Redressal:</strong> Raise any privacy concerns directly to our designated Grievance Officer.</li>
            </ul>
          </div>

          {/* 12. WITHDRAW CONSENT */}
          <div id="withdraw-consent" className="policy-section">
            <h2>
              <span className="icon"><RotateCcw size={20} /></span>
              12. How Do I Withdraw My Consent?
            </h2>
            <p>
              Withdrawing your consent is straightforward and hassle-free:
            </p>
            <ul>
              <li><strong>Marketing Communications:</strong> Click the "Unsubscribe" link included at the bottom of any Cobcult promotional email, or toggle your communication preferences under your Account Settings.</li>
              <li><strong>Account & Data Deletion:</strong> Send an email to <a href="mailto:privacy@cobcult.com" style={{ color: '#9d2706', textDecoration: 'underline' }}>privacy@cobcult.com</a> or <a href="mailto:care@cobcult.com" style={{ color: '#9d2706', textDecoration: 'underline' }}>care@cobcult.com</a> with the subject line <em>"Withdraw Consent / Delete My Data"</em> from your registered email address.</li>
            </ul>
            <p>
              Our privacy team will verify your request and execute the deletion within <strong>48 to 72 business hours</strong>, sending you a final confirmation once completed.
            </p>
          </div>

          {/* 13. AUTOMATED DECISIONS */}
          <div id="automated-decisions" className="policy-section">
            <h2>
              <span className="icon"><Cpu size={20} /></span>
              13. Automatic Decision-Making & Profiling
            </h2>
            <p>
              Cobcult values human connection. We do <strong>NOT</strong> subject our customers to automated decision-making or profiling algorithms that produce legal or similarly significant adverse effects.
            </p>
            <p>
              Automated diagnostics are limited strictly to:
            </p>
            <ul>
              <li><strong>Anti-Fraud & Security Checks:</strong> Detecting automated bot checkout attacks or duplicate self-referrals in our loyalty program.</li>
              <li><strong>Sizing Recommendations:</strong> Suggesting standard shoe sizes based on your foot length inputs in our digital sizing tool.</li>
            </ul>
            <p>
              All sizing suggestions and security reviews can be personally inspected and adjusted by our team upon your request.
            </p>
          </div>

          {/* 14. CHILDREN'S PRIVACY */}
          <div id="childrens-privacy" className="policy-section">
            <h2>
              <span className="icon"><AlertTriangle size={20} /></span>
              14. Children's Privacy
            </h2>
            <p>
              Cobcult exclusively creates handcrafted adult luxury footwear and bespoke leather goods. Our website and services are not intended for individuals under <strong>18 years of age</strong>.
            </p>
            <p>
              We do not knowingly collect or solicit personal information from minors. If you believe a minor has registered an account or provided personal details without parental consent, please contact us immediately at <a href="mailto:privacy@cobcult.com" style={{ color: '#9d2706', textDecoration: 'underline' }}>privacy@cobcult.com</a>, and we will promptly delete the data from our servers.
            </p>
          </div>

          {/* 15. COUNTRY OF ORIGIN & JURISDICTION */}
          <div id="country-of-origin" className="policy-section">
            <h2>
              <span className="icon"><Globe size={20} /></span>
              15. Country of Origin & Jurisdiction
            </h2>
            <p>
              <strong>Country of Origin:</strong> Cobcult is proudly based in and operated from <strong>India</strong>. All of our shoes are handcrafted by Indian artisans, and your data is processed and stored in compliance with the laws of the Republic of India, including the <em>Digital Personal Data Protection Act (DPDP Act)</em> and the <em>Information Technology Act, 2000</em>.
            </p>
            <p>
              Any disputes or legal inquiries arising out of this policy or data processing shall be subject to the exclusive jurisdiction of the competent courts in India.
            </p>
          </div>

          {/* 16. CHANGES TO PRIVACY POLICY */}
          <div id="policy-changes" className="policy-section">
            <h2>
              <span className="icon"><Clock size={20} /></span>
              16. Changes to Our Privacy Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time to reflect improvements in our crafting services, website updates, or changes in data protection legislation.
            </p>
            <p>
              When changes are published:
            </p>
            <ul>
              <li>The "Last Updated" date at the bottom of this page will be revised.</li>
              <li>For substantial updates affecting how your data is treated, we will provide a prominent notice on our homepage or notify registered users via email prior to the changes taking effect.</li>
            </ul>
          </div>

          {/* 17. CONTACT & GRIEVANCE */}
          <div id="contact-info" className="policy-section">
            <h2>
              <span className="icon"><Phone size={20} /></span>
              17. Contact Info & Grievance Officer
            </h2>
            <p>
              If you have any questions, wish to exercise your data rights, or want to withdraw your consent, please contact our dedicated team:
            </p>
            <div className="policy-card-grid">
              <div className="policy-card">
                <h4>Privacy & Data Protection</h4>
                <p>
                  <strong>Email:</strong> <a href="mailto:privacy@cobcult.com" style={{ color: '#9d2706' }}>privacy@cobcult.com</a><br />
                  <strong>Subject:</strong> Data Rights Request<br />
                  <strong>Response Time:</strong> Within 24-48 business hours
                </p>
              </div>
              <div className="policy-card">
                <h4>Customer Care Desk</h4>
                <p>
                  <strong>Email:</strong> <a href="mailto:care@cobcult.com" style={{ color: '#9d2706' }}>care@cobcult.com</a><br />
                  <strong>Hours:</strong> Mon – Sat, 10:00 AM – 7:00 PM IST<br />
                  <strong>Assistance:</strong> Orders, Fit Consultation & Resoling
                </p>
              </div>
            </div>
            <p style={{ marginTop: '16px', fontSize: '0.9rem', color: '#6B7280' }}>
              <strong>Grievance Officer:</strong> In accordance with the Information Technology Act and DPDP Act, you may address grievances directly to our Grievance Officer via email at <a href="mailto:grievance@cobcult.com" style={{ color: '#9d2706' }}>grievance@cobcult.com</a>.
            </p>
          </div>

          <div className="policy-footer">
            Last Updated: September 11, 2026 • Cobcult Shoes (Cobcult Ltd.) • Handcrafted in India
          </div>
        </div>
      </div>
    </main>
  );
}

