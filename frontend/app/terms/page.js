"use client";
import React from 'react';
import Link from 'next/link';
import { 
  FileText, Hammer, Scale, AlertCircle, ChevronRight, 
  Shield, Globe, Phone, Award, Users, Cpu, Clock, CheckCircle,
  CreditCard, DollarSign, ExternalLink, Wrench, ShieldCheck, FileCheck
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
          max-width: 760px;
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
          max-width: 880px;
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
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
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
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
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
          <div className="section-label" style={{ color: '#9d2706', fontSize: '0.75rem', letterSpacing: '0.15em', fontWeight: 700, textTransform: 'uppercase' }}>Customer Agreement & Terms</div>
          <h1 className="policy-hero-title">Terms of<br /><em>Service</em></h1>
          <p className="policy-hero-sub">
            Welcome to Cobcult. By exploring our collections, using our 3D customizer, or commissioning bespoke footwear, you agree to the following terms and conditions.
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
              <a href="#overview">1. Overview</a>
              <a href="#general-conditions">2. General Conditions & Eligibility</a>
              <a href="#products-services">3. Products & Services</a>
              <a href="#bespoke-terms">4. Bespoke & Made-to-Order Policies</a>
              <a href="#modifications-prices">5. Modification to Service & Prices</a>
              <a href="#billing-accuracy">6. Accuracy of Billing & Accounting</a>
              <a href="#tax-gst">7. Tax & GST Compliance</a>
              <a href="#payment-cod">8. Payment & COD Policy</a>
              <a href="#orders-returns">9. Catalogue Orders & 15-Day Returns</a>
              <a href="#warranty-resoling">10. Craftsmanship Warranty & Resoling</a>
              <a href="#optional-tools">11. Optional Tools</a>
              <a href="#third-party-links">12. Third-Party Links</a>
              <a href="#security">13. Account Security</a>
              <a href="#referral-wallet">14. Referral & Wallet Credit Terms</a>
              <a href="#intellectual-property">15. Intellectual Property</a>
              <a href="#disclaimer-warranty">16. Disclaimer of Warranties & Liability</a>
              <a href="#indemnification-severability">17. Indemnification, Severability & Termination</a>
              <a href="#governing-law">18. Governing Law & Country of Origin</a>
              <a href="#changes-terms">19. Changes to Terms of Service</a>
              <a href="#contact-concierge">20. Concierge Contact Info</a>
            </div>
          </div>

          {/* 1. OVERVIEW */}
          <div id="overview" className="policy-section">
            <h2>
              <span className="icon"><Scale size={20} /></span>
              1. Overview
            </h2>
            <p>
              This website is operated by <strong>Cobcult</strong> (Cobcult Shoes Ltd.). Throughout the site, the terms "we", "us", and "our" refer to Cobcult. Cobcult offers this website—including all information, bespoke 3D design tools, and services available from this site to you, the user, conditioned upon your acceptance of all terms, conditions, policies, and notices stated here.
            </p>
            <p>
              By visiting our site, configuring custom footwear, or purchasing goods from us, you engage in our "Service" and agree to be bound by these Terms of Service ("Terms"), including those additional terms and conditions and policies referenced herein and/or available by hyperlink.
            </p>
          </div>

          {/* 2. GENERAL CONDITIONS */}
          <div id="general-conditions" className="policy-section">
            <h2>
              <span className="icon"><Users size={20} /></span>
              2. General Conditions & Eligibility
            </h2>
            <p>
              By agreeing to these Terms of Service, you represent that you are at least <strong>18 years of age</strong> (or the age of legal majority in your jurisdiction) and possess the legal capacity to enter into binding commercial contracts. Minors may only browse our site under the direct supervision and consent of a parent or guardian.
            </p>
            <p>
              <strong>Right to Refuse Service:</strong> We reserve the right to refuse service to anyone for any legitimate reason at any time (e.g. fraudulent activity, abusive behavior toward our artisans or support staff, or violation of applicable laws).
            </p>
            <p>
              You understand that your content (excluding payment card details) may be transferred unencrypted and involve transmissions over various networks. Credit and debit card information is always encrypted during transfer over networks via PCI-DSS compliant gateways.
            </p>
          </div>

          {/* 3. PRODUCTS OR SERVICES */}
          <div id="products-services" className="policy-section">
            <h2>
              <span className="icon"><CheckCircle size={20} /></span>
              3. Products or Services
            </h2>
            <p>
              Certain footwear styles, bespoke customizations, or limited-run leathers may be available exclusively online through our website. These products may have limited quantities and are subject to return or exchange strictly in accordance with our Return Policy.
            </p>
            <ul>
              <li><strong>Natural Leather Variations:</strong> We craft shoes from authentic, full-grain natural hides. Subtle grain marks, natural creases, and handcrafted patina shading are authentic hallmarks of artisanal leather, not defects.</li>
              <li><strong>Color & Display Accuracy:</strong> We make every effort to display the colors and textures of our leathers as accurately as possible in our photography and 3D Customizer. However, we cannot guarantee that your monitor or mobile device's display of any color will be 100% exact.</li>
              <li><strong>Sales Limitations:</strong> We reserve the right to limit the sales of our products or services to any person, geographic region, or jurisdiction on a case-by-case basis.</li>
            </ul>
          </div>

          {/* 4. BESPOKE FOOTWEAR POLICIES */}
          <div id="bespoke-terms" className="policy-section">
            <h2>
              <span className="icon"><Hammer size={20} /></span>
              4. Bespoke & Made-to-Order Footwear Policies
            </h2>
            <p>
              Because our bespoke footwear is individually cut, lasted, and tailored to your specific measurements and style preferences:
            </p>
            <ul>
              <li>
                <strong>12-Hour Modification Cutoff:</strong> You may adjust your leather, sole type, or size parameters within <strong>12 hours</strong> of order confirmation. Once your order status transitions to "In Production", raw hides are cut and customized lasts are locked, after which modifications cannot be accommodated.
              </li>
              <li>
                <strong>Master Artisan Fit Guarantee:</strong> Bespoke orders include complimentary fitting adjustments. In the rare event of a sizing variance, our artisans will adjust or remake your shoe to ensure a bespoke fit.
              </li>
              <li>
                <strong>Custom Exclusions:</strong> Personalized, engraved, or made-to-order bespoke pairs cannot be cancelled or returned once production begins, except in verified cases of manufacturing defects.
              </li>
            </ul>
          </div>

          {/* 5. MODIFICATIONS TO SERVICE AND PRICES */}
          <div id="modifications-prices" className="policy-section">
            <h2>
              <span className="icon"><Clock size={20} /></span>
              5. Modification to the Service and Prices
            </h2>
            <p>
              Prices for our footwear, accessories, and recrafting services are subject to change without prior notice.
            </p>
            <p>
              We reserve the right at any time to modify, update, or discontinue the Service (or any product line or customization feature thereof) without liability to you or any third party. Any price changes will not affect orders that have already been confirmed and paid for.
            </p>
          </div>

          {/* 6. ACCURACY OF BILLING AND ACCOUNT INFO */}
          <div id="billing-accuracy" className="policy-section">
            <h2>
              <span className="icon"><FileCheck size={20} /></span>
              6. Accuracy of Billing and Accounting Information
            </h2>
            <p>
              You agree to provide current, complete, and accurate purchase, address, and account information for all purchases made at our store. You agree to promptly update your account, email address, phone number, and delivery details so we can complete your transactions and contact you as needed.
            </p>
            <p>
              We reserve the right to refuse, limit, or cancel any order placed with us. In the event that we make a change to or cancel an order, we will attempt to notify you by contacting the email, billing address, or phone number provided at checkout.
            </p>
          </div>

          {/* 7. TAX & GST COMPLIANCE */}
          <div id="tax-gst" className="policy-section">
            <h2>
              <span className="icon"><DollarSign size={20} /></span>
              7. Tax & GST Compliance
            </h2>
            <p>
              Cobcult operates in full compliance with the tax regulations of India:
            </p>
            <ul>
              <li><strong>GST Included:</strong> All prices listed on our website are in Indian Rupees (INR) and are inclusive of Goods and Services Tax (GST) unless stated otherwise.</li>
              <li><strong>Valid Tax Invoices:</strong> A GST-compliant tax invoice displaying our GSTIN, HSN codes (e.g. HSN 6403 for leather footwear), applicable CGST/SGST/IGST breakdown, and your billing details is provided electronically for every completed order.</li>
              <li><strong>B2B Invoices:</strong> If you require a B2B tax invoice with your company's GSTIN for input tax credit, please provide your verified GST number during checkout.</li>
            </ul>
          </div>

          {/* 8. PAYMENT & COD POLICY */}
          <div id="payment-cod" className="policy-section">
            <h2>
              <span className="icon"><CreditCard size={20} /></span>
              8. Payment Methods & Cash on Delivery (COD) Policy
            </h2>
            <p>
              We provide secure prepaid payment options and Cash on Delivery (COD) under clear guidelines:
            </p>
            <div className="policy-card-grid">
              <div className="policy-card">
                <h4>1. Prepaid Transactions</h4>
                <p>We accept all major Credit/Debit Cards (Visa, MasterCard, RuPay, Amex), UPI (Google Pay, PhonePe, Paytm), and Net Banking via PCI-DSS certified gateways (Razorpay/Stripe).</p>
              </div>
              <div className="policy-card">
                <h4>2. Cash on Delivery (COD) Rules</h4>
                <p>Available on standard catalogue footwear up to ₹10,000 for serviceable Indian pincodes. COD orders require telephone or OTP verification prior to dispatch.</p>
              </div>
            </div>
            <div className="policy-highlight">
              <p>
                <strong>COD Policy Terms:</strong>
                <br />• <strong>Custom Footwear Exclusion:</strong> Made-to-measure, personalized, and bespoke footwear require 100% advance prepayment and are strictly ineligible for Cash on Delivery.
                <br />• <strong>Delivery Inspection:</strong> Handover of the parcel by courier agents occurs only upon full cash receipt. Couriers do not offer "open-box inspection" prior to payment collection.
                <br />• <strong>Refusal of Delivery:</strong> Repeated refusal of verified COD orders without valid justification will result in suspension of COD privileges for that customer account.
              </p>
            </div>
          </div>

          {/* 9. ORDERS & RETURNS */}
          <div id="orders-returns" className="policy-section">
            <h2>
              <span className="icon"><CheckCircle size={20} /></span>
              9. Ready-to-Wear Orders, Cancellations & 15-Day Returns
            </h2>
            <p>
              For standard catalogue items (non-custom shoes and accessories):
            </p>
            <ul>
              <li><strong>Cancellation:</strong> Standard orders can be cancelled online within 12 hours of placement.</li>
              <li><strong>15-Day Unworn Returns:</strong> You may exchange or return unworn shoes in their original, pristine packaging with dust bags intact within <strong>15 days</strong> of delivery.</li>
              <li><strong>Free Doorstep Pickup:</strong> We provide complimentary return shipping and doorstep pickup across India.</li>
              <li><strong>Refund Method:</strong> Approved refunds are credited directly to your original payment method within 5–7 business days, or instantly to your Cobcult Wallet.</li>
            </ul>
          </div>

          {/* 10. WARRANTY & RESOLING */}
          <div id="warranty-resoling" className="policy-section">
            <h2>
              <span className="icon"><Award size={20} /></span>
              10. Craftsmanship Warranty & Lifetime Resoling Program
            </h2>
            <p>
              All Goodyear welted and Blake stitched Cobcult shoes qualify for our <strong>Lifetime Care Program</strong>:
            </p>
            <ul>
              <li><strong>1-Year Craftsmanship Warranty:</strong> Covers manufacturing defects including structural welt separation, heel detachment, and broken shanks under normal usage.</li>
              <li><strong>Lifetime Resoling Service:</strong> Once your soles naturally wear down over years of wear, send your shoes back to our studio for our paid Resoling Service. Our cobblers will install fresh Vibram or Italian leather outsoles and re-condition the uppers.</li>
            </ul>
          </div>

          {/* 11. OPTIONAL TOOLS */}
          <div id="optional-tools" className="policy-section">
            <h2>
              <span className="icon"><Wrench size={20} /></span>
              11. Optional Tools
            </h2>
            <p>
              We may provide you with access to optional third-party or digital tools (such as 3D foot scan uploaders, size converters, or customizer renderers) over which we neither monitor nor have any direct control.
            </p>
            <p>
              You acknowledge and agree that we provide access to such tools "as is" and "as available" without any warranties, representations, or conditions of any kind. Cobcult shall have no liability whatsoever arising from or relating to your use of optional digital tools.
            </p>
          </div>

          {/* 12. THIRD-PARTY LINKS */}
          <div id="third-party-links" className="policy-section">
            <h2>
              <span className="icon"><ExternalLink size={20} /></span>
              12. Third-Party Links & Integrations
            </h2>
            <p>
              Certain content, products, and services available via our Service may include materials from third parties (e.g. payment processors, delivery trackers, social media embeds).
            </p>
            <p>
              Third-party links on this site may direct you to third-party websites that are not affiliated with us. We are not responsible for examining or evaluating the content or accuracy and we do not warrant and will not have any liability for any third-party materials, products, or services. Please review carefully the third party's policies and practices before you engage in any transaction.
            </p>
          </div>

          {/* 13. SECURITY */}
          <div id="security" className="policy-section">
            <h2>
              <span className="icon"><ShieldCheck size={20} /></span>
              13. Account Security & Customer Responsibilities
            </h2>
            <p>
              When you create an account on Cobcult, you are responsible for maintaining the confidentiality of your account credentials, password, and restricted access to your device.
            </p>
            <p>
              You agree to accept responsibility for all activities that occur under your account. If you suspect that your login credentials have been compromised, you must immediately notify us at <a href="mailto:care@cobcult.com" style={{ color: '#9d2706' }}>care@cobcult.com</a>.
            </p>
          </div>

          {/* 14. REFERRAL & WALLET */}
          <div id="referral-wallet" className="policy-section">
            <h2>
              <span className="icon"><FileText size={20} /></span>
              14. Referral Program & Promotional Wallet Terms
            </h2>
            <p>
              Cobcult’s Refer & Earn program rewards customers who introduce friends to artisanal footwear:
            </p>
            <ul>
              <li><strong>Anti-Abuse Verification:</strong> Referral rewards are credited only after the referred recipient completes their first verified order. Self-referrals (matching IP addresses, device signatures, or phone numbers) are flagged and voided.</li>
              <li><strong>Redemption Limits:</strong> Wallet credits cannot be encashed, transferred, or refunded. Checkout caps apply (e.g. up to ₹500 discount on footwear and ₹100 on accessories per order).</li>
            </ul>
          </div>

          {/* 15. INTELLECTUAL PROPERTY */}
          <div id="intellectual-property" className="policy-section">
            <h2>
              <span className="icon"><Award size={20} /></span>
              15. Intellectual Property Rights
            </h2>
            <p>
              All website content—including our 3D footwear models, shoe patterns, wooden lasts, photography, brand trademarks, logos, and UI designs—are the exclusive intellectual property of Cobcult. You may not copy, reproduce, reverse-engineer, scrape, or distribute our proprietary assets without prior written consent.
            </p>
          </div>

          {/* 16. DISCLAIMER OF WARRANTIES & LIABILITY */}
          <div id="disclaimer-warranty" className="policy-section">
            <h2>
              <span className="icon"><AlertCircle size={20} /></span>
              16. Disclaimer of Warranties & Limitation of Liability
            </h2>
            <p>
              We do not guarantee, represent, or warrant that your use of our service will be uninterrupted, timely, secure, or completely error-free.
            </p>
            <p>
              You expressly agree that your use of, or inability to use, the service is at your sole risk. The service and all products delivered to you are (except as expressly stated by us) provided "as is" and "as available" for your use, without any representation, warranties, or conditions of any kind, either express or implied, including all implied warranties of merchantability, fitness for a particular purpose, and durability.
            </p>
            <p>
              In no case shall Cobcult, our directors, officers, employees, craftsmen, or affiliates be liable for any injury, loss, claim, or any direct, indirect, incidental, punitive, special, or consequential damages of any kind arising from your use of any service or product.
            </p>
          </div>

          {/* 17. INDEMNIFICATION, SEVERABILITY, TERMINATION */}
          <div id="indemnification-severability" className="policy-section">
            <h2>
              <span className="icon"><Shield size={20} /></span>
              17. Indemnification, Severability & Termination
            </h2>
            <div className="policy-card-grid">
              <div className="policy-card">
                <h4>1. Indemnification</h4>
                <p>You agree to indemnify, defend, and hold harmless Cobcult, our affiliates, and team members from any claim or demand, including reasonable legal fees, made by any third party due to or arising out of your breach of these Terms or your violation of any law.</p>
              </div>
              <div className="policy-card">
                <h4>2. Severability</h4>
                <p>In the event that any provision of these Terms is determined to be unlawful, void, or unenforceable, such provision shall nonetheless be enforceable to the fullest extent permitted by applicable law, and the remaining provisions shall remain valid and in full effect.</p>
              </div>
              <div className="policy-card">
                <h4>3. Termination</h4>
                <p>The obligations and liabilities of the parties incurred prior to the termination date shall survive the termination of this agreement. These Terms are effective unless and until terminated by either you or us. You may terminate these Terms at any time by notifying us that you wish to close your account.</p>
              </div>
            </div>
          </div>

          {/* 18. GOVERNING LAW */}
          <div id="governing-law" className="policy-section">
            <h2>
              <span className="icon"><Globe size={20} /></span>
              18. Governing Law & Country of Origin
            </h2>
            <p>
              <strong>Country of Origin:</strong> Cobcult is founded, owned, and operated in <strong>India</strong>. All shoes are handcrafted by Indian artisans.
            </p>
            <p>
              These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed in accordance with the laws of the Republic of India. Any legal dispute, claim, or proceeding shall be subject to the exclusive jurisdiction of the competent courts in India.
            </p>
          </div>

          {/* 19. CHANGES TO TERMS */}
          <div id="changes-terms" className="policy-section">
            <h2>
              <span className="icon"><Clock size={20} /></span>
              19. Changes to Terms of Service
            </h2>
            <p>
              You can review the most current version of the Terms of Service at any time on this page. We reserve the right, at our sole discretion, to update, change, or replace any part of these Terms of Service by posting updates to our website. It is your responsibility to check our website periodically for changes.
            </p>
          </div>

          {/* 20. CONTACT CONCIERGE */}
          <div id="contact-concierge" className="policy-section">
            <h2>
              <span className="icon"><Phone size={20} /></span>
              20. Concierge Contact & Customer Desk
            </h2>
            <p>
              Questions about the Terms of Service, bespoke consultations, orders, or recrafting should be sent to:
            </p>
            <div className="policy-card-grid">
              <div className="policy-card">
                <h4>Customer Concierge</h4>
                <p>
                  <strong>Email:</strong> <a href="mailto:care@cobcult.com" style={{ color: '#9d2706' }}>care@cobcult.com</a><br />
                  <strong>Hours:</strong> Mon – Sat, 10:00 AM – 7:00 PM IST<br />
                  <strong>Support:</strong> Orders, COD Verification, Resoling
                </p>
              </div>
              <div className="policy-card">
                <h4>Privacy & Grievance Desk</h4>
                <p>
                  <strong>Email:</strong> <a href="mailto:privacy@cobcult.com" style={{ color: '#9d2706' }}>privacy@cobcult.com</a><br />
                  <strong>Grievance:</strong> <a href="mailto:grievance@cobcult.com" style={{ color: '#9d2706' }}>grievance@cobcult.com</a><br />
                  <strong>Location:</strong> India
                </p>
              </div>
            </div>
          </div>

          <div className="policy-footer">
            Last Updated: September 17, 2026 • Cobcult Shoes (Cobcult Ltd.) • Handcrafted in India
          </div>
        </div>
      </div>
    </main>
  );
}


