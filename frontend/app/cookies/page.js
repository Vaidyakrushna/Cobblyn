"use client";
import React from 'react';
import Link from 'next/link';
import { 
  Cookie, Info, Check, ShieldAlert, ChevronRight, 
  Lock, Database, Clock, RotateCcw, Cpu, Globe, Phone, FileText
} from 'lucide-react';

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
          <div className="section-label" style={{ color: '#9d2706', fontSize: '0.75rem', letterSpacing: '0.15em', fontWeight: 700, textTransform: 'uppercase' }}>Tracking, Sessions & Local Storage</div>
          <h1 className="policy-hero-title">Cookie<br /><em>Policy</em></h1>
          <p className="policy-hero-sub">
            Understand how Cobcult utilizes cookies, secure authentication tokens, and browser local storage to power your custom footwear experience.
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
          {/* QUICK INDEX */}
          <div className="policy-toc">
            <div className="policy-toc-title">
              <FileText size={18} color="#9d2706" />
              Cookie Policy Index
            </div>
            <div className="policy-toc-grid">
              <a href="#what-are-cookies">1. What Are Cookies?</a>
              <a href="#your-consent">2. Your Consent</a>
              <a href="#what-info">3. What Cookies & Info We Collect</a>
              <a href="#source-collection">4. Source of Collection</a>
              <a href="#purpose-collection">5. Purpose of Collection</a>
              <a href="#security">6. Security of Cookies</a>
              <a href="#retention">7. Retention & Storage Duration</a>
              <a href="#automatic-decisions">8. Automated Diagnostics</a>
              <a href="#withdraw-consent">9. How to Withdraw Consent & Manage</a>
              <a href="#country-origin">10. Country of Origin & Hosting</a>
              <a href="#policy-changes">11. Changes to This Policy</a>
              <a href="#contact-info">12. Contact Information</a>
            </div>
          </div>

          {/* 1. WHAT ARE COOKIES */}
          <div id="what-are-cookies" className="policy-section">
            <h2>
              <span className="icon"><Cookie size={20} /></span>
              1. What Are Cookies & Local Storage?
            </h2>
            <p>
              Cookies are small text data files placed onto your computer, tablet, or smartphone when you visit a website. In modern web applications, they are often paired with <strong>Browser Local Storage</strong> and <strong>Session Storage</strong>.
            </p>
            <p>
              At <strong>Cobcult</strong>, these technologies allow our website to remember who you are, keep your cart items intact when you browse multiple pages, retain your custom shoe specifications in our 3D customizer, and load pages rapidly.
            </p>
          </div>

          {/* 2. YOUR CONSENT */}
          <div id="your-consent" className="policy-section">
            <h2>
              <span className="icon"><Check size={20} /></span>
              2. Your Consent
            </h2>
            <p>
              When you first visit <Link href="/" style={{ color: '#9d2706', textDecoration: 'underline' }}>cobcult.com</Link>, essential cookies and session tokens are initialized so the website functions correctly. By continuing to navigate our catalogue, configuring shoes, and using our services, you consent to our use of cookies and tracking technologies as described in this policy.
            </p>
            <div className="policy-highlight">
              <p>
                <strong>Freedom of Choice:</strong> You have full authority over non-essential cookies. You can modify or withdraw your consent at any time via your browser settings (see Section 9).
              </p>
            </div>
          </div>

          {/* 3. WHAT INFO WE COLLECT */}
          <div id="what-info" className="policy-section">
            <h2>
              <span className="icon"><Info size={20} /></span>
              3. What Cookies & Storage Information We Collect
            </h2>
            <p>
              We collect minimal, privacy-centric data through browser storage:
            </p>
            <ul>
              <li><strong>Authentication Tokens:</strong> Secure cryptographic JWT access and refresh tokens that authenticate your logged-in customer session.</li>
              <li><strong>Cart & Wishlist Cache:</strong> Selected shoe models, leather colorways, sole configurations, and size selections.</li>
              <li><strong>3D Customizer State:</strong> Real-time customization choices (e.g. burnished toe patina, Goodyear welt thread color, monogram initials) so you never lose progress.</li>
              <li><strong>Display Preferences:</strong> Currency choices, active filter selections, and recently viewed styles.</li>
              <li><strong>Technical Logs:</strong> IP address snippets, browser user-agent signatures, and session timestamps for security diagnostics.</li>
            </ul>
          </div>

          {/* 4. SOURCE OF COLLECTION */}
          <div id="source-collection" className="policy-section">
            <h2>
              <span className="icon"><Database size={20} /></span>
              4. Source of Collection
            </h2>
            <p>
              Cookies on Cobcult come from two origins:
            </p>
            <div className="policy-card-grid">
              <div className="policy-card">
                <h4>1. First-Party Cookies</h4>
                <p>Created and read directly by Cobcult to preserve your shopping session, manage authentication, and run the 3D customizer.</p>
              </div>
              <div className="policy-card">
                <h4>2. Trusted Third-Party Services</h4>
                <p>Originating from certified partners such as secure payment gateways (e.g., Razorpay/Stripe for fraud detection during checkout) and cloud CDNs for fast asset loading.</p>
              </div>
            </div>
          </div>

          {/* 5. PURPOSE OF COLLECTION */}
          <div id="purpose-collection" className="policy-section">
            <h2>
              <span className="icon"><Check size={20} /></span>
              5. Purpose of Collection: Categories We Use
            </h2>
            <p>
              We group all browser tracking technologies into three distinct categories:
            </p>
            <ul>
              <li>
                <strong>1. Strictly Necessary (Essential):</strong>
                <br />These are critical for the website to function. They handle secure customer login, shopping cart persistence across tabs, rate-limiting against bot attacks, and payment checkout security. <em>These cannot be turned off as the website will cease to function without them.</em>
              </li>
              <li>
                <strong>2. Functional & Customizer Cookies:</strong>
                <br />These remember your personalized settings—such as shoe size preferences, saved leather swatch choices in our 3D studio, and custom footwear drafts.
              </li>
              <li>
                <strong>3. Performance & Diagnostics:</strong>
                <br />These help us monitor page rendering speeds, detect broken links or sizing errors, and understand which footwear categories are most viewed so we can optimize inventory.
              </li>
            </ul>
          </div>

          {/* 6. SECURITY */}
          <div id="security" className="policy-section">
            <h2>
              <span className="icon"><Lock size={20} /></span>
              6. Security of Cookies & Storage
            </h2>
            <p>
              We implement industry-standard safeguards to protect all cookie and session data:
            </p>
            <ul>
              <li><strong>Secure & HTTP-Only Flags:</strong> Authentication cookies are marked with <code>HttpOnly</code> and <code>Secure</code> flags, preventing malicious scripts or unauthorized third-party JavaScript from reading your session keys.</li>
              <li><strong>Cryptographic Salting:</strong> Session identifiers are cryptographically signed using high-entropy secret keys.</li>
              <li><strong>Cross-Site Request Forgery (CSRF) Protection:</strong> Built-in token verification prevents unauthorized cross-site requests.</li>
            </ul>
          </div>

          {/* 7. RETENTION */}
          <div id="retention" className="policy-section">
            <h2>
              <span className="icon"><Clock size={20} /></span>
              7. Retention: How Long Are Cookies Stored?
            </h2>
            <p>
              The lifespan of our cookies and local storage tokens varies according to their purpose:
            </p>
            <ul>
              <li><strong>Session Cookies:</strong> Temporary files that expire and are automatically deleted the moment you close your browser tab.</li>
              <li><strong>Cart & Customizer Storage:</strong> Stored locally in your browser so you can resume your custom footwear design across days. This remains stored until you complete your order, clear your browser cache, or request account deletion.</li>
              <li><strong>Authentication Tokens:</strong> Persistent login tokens expire automatically after 30 days of inactivity for your security.</li>
            </ul>
          </div>

          {/* 8. AUTOMATIC DECISION MAKING */}
          <div id="automatic-decisions" className="policy-section">
            <h2>
              <span className="icon"><Cpu size={20} /></span>
              8. Automated Diagnostics & Anti-Fraud Checks
            </h2>
            <p>
              Cobcult uses cookie and session diagnostic data solely for automated security validation:
            </p>
            <ul>
              <li><strong>Anti-Abuse Checks:</strong> Verifying that promotional referral credits are not being self-referred through duplicate browser sessions.</li>
              <li><strong>Rate-Limiting:</strong> Protecting our website against automated credential-stuffing attacks or bot scraper abuse.</li>
            </ul>
            <p>
              We do <strong>NOT</strong> use cookies for automated behavioral advertising or discriminatory profiling algorithms.
            </p>
          </div>

          {/* 9. WITHDRAW CONSENT */}
          <div id="withdraw-consent" className="policy-section">
            <h2>
              <span className="icon"><RotateCcw size={20} /></span>
              9. How Do I Withdraw My Consent & Manage Cookies?
            </h2>
            <p>
              You can restrict, block, or delete cookies at any time directly through your web browser. Here is how you can manage them on popular browsers:
            </p>
            <ul>
              <li><strong>Google Chrome:</strong> Click Menu (⋮) → Settings → Privacy and Security → Third-Party Cookies → Choose "Block third-party cookies" or "See all site data and permissions".</li>
              <li><strong>Apple Safari (Mac / iOS):</strong> Open Safari → Preferences / Settings → Privacy → Check "Block all cookies" or click "Manage Website Data".</li>
              <li><strong>Mozilla Firefox:</strong> Click Menu (☰) → Settings → Privacy & Security → Enhanced Tracking Protection → Select "Strict" or manage Cookies and Site Data.</li>
              <li><strong>Microsoft Edge:</strong> Click Menu (...) → Settings → Cookies and site permissions → Manage and delete cookies and site data.</li>
            </ul>
            <div className="policy-highlight">
              <p>
                <em>Important Note:</em> If you disable or clear all cookies and local storage, you will be logged out of your Cobcult account, and your shopping bag and 3D customizer drafts will be cleared.
              </p>
            </div>
          </div>

          {/* 10. COUNTRY OF ORIGIN */}
          <div id="country-origin" className="policy-section">
            <h2>
              <span className="icon"><Globe size={20} /></span>
              10. Country of Origin & Data Hosting
            </h2>
            <p>
              Cobcult operates from <strong>India</strong>. All first-party cookie records, authentication sessions, and customer storage tokens are managed on secure cloud infrastructure hosted in accordance with the laws of the Republic of India and the Digital Personal Data Protection Act (DPDP Act).
            </p>
          </div>

          {/* 11. POLICY CHANGES */}
          <div id="policy-changes" className="policy-section">
            <h2>
              <span className="icon"><Clock size={20} /></span>
              11. Changes to This Cookie Policy
            </h2>
            <p>
              We may update this Cookie Policy periodically to reflect changes in the technologies we use, new website features, or regulatory compliance standards. Any revisions will be published on this page with an updated "Last Updated" timestamp.
            </p>
          </div>

          {/* 12. CONTACT INFO */}
          <div id="contact-info" className="policy-section">
            <h2>
              <span className="icon"><Phone size={20} /></span>
              12. Contact Information
            </h2>
            <p>
              If you have any questions, concerns, or requests regarding our use of cookies or tracking technologies, please contact our team:
            </p>
            <div className="policy-card-grid">
              <div className="policy-card">
                <h4>Privacy & Data Protection</h4>
                <p>
                  <strong>Email:</strong> <a href="mailto:privacy@cobcult.com" style={{ color: '#9d2706' }}>privacy@cobcult.com</a><br />
                  <strong>Assistance:</strong> Cookie preferences, data rights, and consent withdrawal
                </p>
              </div>
              <div className="policy-card">
                <h4>Customer Support Desk</h4>
                <p>
                  <strong>Email:</strong> <a href="mailto:care@cobcult.com" style={{ color: '#9d2706' }}>care@cobcult.com</a><br />
                  <strong>Hours:</strong> Monday – Saturday, 10:00 AM – 7:00 PM IST
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

