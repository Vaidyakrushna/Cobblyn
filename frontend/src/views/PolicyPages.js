"use client";
import React, { useState } from 'react';
import './PolicyPages.css';

const PrivacyPolicy = () => (
  <div className="policy-content">
    <h2>Privacy Policy</h2>
    <p>Last updated: June 2026</p>
    <p>At Cobblyn, we respect your privacy and are committed to protecting your personal data. This privacy policy informs you how we collect, use, store, and protect your data when interacting with our website, 3D Customizer, and Virtual Atelier services.</p>
    
    <h3>1. Information We Collect</h3>
    <p><strong>Personal Identification Information:</strong> Name, billing/shipping address, email address, and phone number.</p>
    <p><strong>Biometric & Fitting Data:</strong> Detailed foot measurements, sizing profiles, and 3D scans submitted via the Virtual Atelier. This data is strictly used for the bespoke crafting process.</p>
    <p><strong>Financial Data:</strong> We do not store raw credit card numbers. All payments are securely processed via certified third-party payment gateways (e.g., Stripe, Razorpay).</p>
    <p><strong>Technical Data:</strong> IP address, browser type, device identifiers, and interaction data within our 3D Customizer.</p>
    
    <h3>2. How We Use Your Data</h3>
    <p>We use your data to: (a) Craft and fulfill your bespoke footwear orders. (b) Maintain your foot profile for seamless future orders. (c) Process transactions and combat fraud. (d) Send critical order updates and, if opted in, exclusive marketing communications.</p>
    
    <h3>3. Data Sharing & Third Parties</h3>
    <p>We strictly do not sell your personal or biometric data. We only share necessary data with trusted partners essential to fulfilling your order, such as logistics/shipping providers and secure payment processors, who are contractually obligated to protect your data.</p>
    
    <h3>4. Data Retention & Security</h3>
    <p>Your foot profile is retained indefinitely to allow for seamless future bespoke orders unless you request its deletion. We employ industry-standard encryption (SSL/TLS) and secure server environments to prevent unauthorized access, alteration, or data breaches.</p>

    <h3>5. Your Rights (GDPR/CCPA Compliance)</h3>
    <p>Depending on your jurisdiction, you have the right to access, correct, or request the deletion of your personal data. You may opt out of marketing communications at any time. To exercise these rights, please contact our Data Protection Officer at privacy@cobblyn.com.</p>
  </div>
);

const TermsOfUse = () => (
  <div className="policy-content">
    <h2>Terms of Use</h2>
    <p>Welcome to Cobblyn. By accessing our website, 3D Customizer, or purchasing our products, you agree to be bound by these comprehensive Terms of Use.</p>
    
    <h3>1. Bespoke Order Finality</h3>
    <p>All bespoke orders are explicitly crafted to your unique specifications. Once an order enters the production phase (typically within 24 hours of payment), the order cannot be modified, cancelled, or altered. By submitting a bespoke order, you accept full responsibility for the design choices made in the 3D Customizer.</p>
    
    <h3>2. Pricing, Errors, and Dynamic Pricing</h3>
    <p>Our bespoke engine dynamically calculates pricing based on real-time material costs, artisan labor, and customization complexity. While we strive for accuracy, in the event of a critical pricing error due to systemic glitches, Cobblyn reserves the right to cancel or refuse any order placed at the incorrect price, issuing a full refund.</p>
    
    <h3>3. Material Variations & Handcrafting</h3>
    <p>Because we use premium natural leathers (including full-grain calfskin and Shell Cordovan) and hand-dyeing techniques (patina), slight variations in color, texture, and grain are inherent to the luxury crafting process. These are hallmarks of authentic bespoke craftsmanship, not defects.</p>
    
    <h3>4. Intellectual Property & User Content</h3>
    <p>The 3D models, website graphics, proprietary fitting algorithms, and branding are the exclusive intellectual property of Cobblyn. Any designs you create using our 3D Customizer remain the property of Cobblyn for production purposes. You may not reverse-engineer our customizer or scrape our 3D assets.</p>

    <h3>5. Force Majeure & Production Delays</h3>
    <p>Cobblyn is not liable for delays or failures in delivery caused by events beyond our reasonable control, including but not limited to global supply chain disruptions for exotic leathers, natural disasters, or logistical strikes.</p>

    <h3>6. Governing Law & Dispute Resolution</h3>
    <p>These terms shall be governed by the laws of India. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts in Jaipur, Rajasthan. We encourage resolving disputes informally through our concierge team before seeking legal arbitration.</p>
  </div>
);

const WarrantyPolicy = () => (
  <div className="policy-content">
    <h2>Warranty Policy</h2>
    <p>At Cobblyn, we stand behind the generational quality of our craftsmanship.</p>
    
    <h3>1. 180-Day Craftsmanship Guarantee</h3>
    <p>Every pair of Cobblyn shoes comes with a comprehensive warranty against structural manufacturing defects valid for <strong>180 days from the day of delivery</strong>. This includes issues such as sole delamination, structural stitching failure, and hardware malfunction (e.g., broken buckles on monk straps) under normal wear conditions.</p>
    
    <h3>2. Condition-Based Exclusions (What is Not Covered)</h3>
    <p>The warranty strictly excludes: (a) Normal wear and tear, including sole wear and heel drag. (b) Creasing of the leather, which is a natural characteristic of how shoes adapt to your feet. (c) Changes in the natural patina, scuffs, scratches, or water damage. (d) Damage resulting from improper care (e.g., failure to condition leather, exposure to extreme heat, or using harsh chemicals). (e) Fit issues arising from significant weight changes or medical foot conditions developed post-purchase.</p>
    
    <h3>3. Product Exclusions (Items Not Under Warranty)</h3>
    <p>The following products and categories are explicitly excluded from the 180-day footwear warranty:</p>
    <ul>
      <li><strong>Shoe Care Products & Accessories:</strong> Shoe trees, creams, brushes, laces, and removable insoles.</li>
      <li><strong>Leather Accessories:</strong> Belts, wallets, and bags (unless a separate specific warranty is provided for that item).</li>
      <li><strong>Clearance & Final Sale Items:</strong> Any product purchased at a heavily discounted clearance price.</li>
      <li><strong>Promotional/Free Items:</strong> Gifts or promotional merchandise included with an order.</li>
    </ul>

    <h3>4. Voiding the Warranty</h3>
    <p>Any modifications, repairs, or resoling performed by an unauthorized third-party cobbler will immediately void the Cobblyn warranty. We strongly recommend using our official Cobblyn Refurbishment Service for resoling.</p>
    
    <h3>5. Claim Process & Shipping</h3>
    <p>To initiate a claim, submit high-resolution photos and your Order ID to our concierge. If the claim is validated as a manufacturing defect, Cobblyn will cover the shipping costs for the repair or replacement. If the issue is deemed wear-and-tear, the customer is responsible for shipping and repair fees.</p>
  </div>
);

const ReturnPolicy = () => (
  <div className="policy-content">
    <h2>Returns, Exchanges, and Refund Policy</h2>
    <p>Due to the hyper-personalized nature of our business, our return policies strictly differentiate between bespoke and ready-to-ship items.</p>
    
    <h3>1. Bespoke & Custom-Made Footwear</h3>
    <p><strong>Strict Policy:</strong> Any shoe created via our 3D Customizer or Virtual Atelier is crafted uniquely for you. Therefore, <strong>bespoke items are strictly non-refundable and cannot be returned or exchanged for a change of mind, style, or color.</strong> Refunds are only issued in the exceedingly rare event of an unrepairable manufacturing defect.</p>
    
    <h3>2. The Cobblyn Fit Guarantee</h3>
    <p>We understand the anxiety of bespoke sizing. If your bespoke shoe does not fit perfectly despite correctly following our Virtual Atelier scanning process, we offer complimentary fit adjustments (e.g., stretching, insole modification) within 30 days of delivery. If the poor fit is due to the customer providing intentionally false measurements, adjustment fees will apply.</p>
    
    <h3>3. Ready-to-Ship Products & Accessories</h3>
    <p>Non-customized, ready-to-ship items may be returned within 14 days of delivery. To qualify for a full refund or exchange, the shoes must be in pristine, unworn condition with absolutely no creases on the vamp or scratches on the sole. We recommend trying them on a carpeted surface only. If the item shows signs of wear, it will be rejected and shipped back at your expense.</p>
    
    <h3>4. Cash on Delivery (COD) & Failed Deliveries</h3>
    <p>COD is strictly available only for Ready-to-Ship items and Accessories. Bespoke orders require 100% upfront payment. If a customer refuses a COD delivery at the door without valid reason, their account will be permanently banned from using the COD payment method in the future.</p>

    <h3>5. International Orders & Customs Duties</h3>
    <p>For international shipments, Cobblyn is not responsible for any import duties, customs taxes, or clearance delays levied by the destination country. In the event of an authorized international return, original shipping costs and customs duties are non-refundable.</p>
  </div>
);

const CookiePolicy = () => (
  <div className="policy-content">
    <h2>Cookie Policy</h2>
    <p>This policy outlines how Cobblyn utilizes cookies and similar tracking technologies to provide a premium online experience.</p>
    
    <h3>1. What are Cookies?</h3>
    <p>Cookies are small encrypted text files stored on your device that allow our servers to recognize your browser, maintain your session, and remember your preferences.</p>
    
    <h3>2. Essential Cookies</h3>
    <p>These are strictly necessary for the website to function securely. They maintain your logged-in state, keep your bespoke designs saved in the shopping cart across sessions, and securely process your payment. The website cannot function properly without these.</p>
    
    <h3>3. Performance & 3D Customizer Cookies</h3>
    <p>We use specialized cookies to cache 3D assets (textures, models) to drastically improve the load times and performance of the 3D Customizer upon your return visits. We also use analytics tools (like Google Analytics) to anonymously track user flow and identify UI bottlenecks.</p>

    <h3>4. Advertising & Marketing Cookies</h3>
    <p>With your consent, we may use third-party tracking cookies (e.g., Meta Pixel) to deliver highly relevant advertisements for Cobblyn products across other platforms, based on your browsing behavior on our site.</p>
    
    <h3>5. Managing Your Preferences</h3>
    <p>You can adjust your browser settings to block or delete cookies at any time. However, please be warned that disabling Essential or Performance cookies will likely cause the 3D Customizer to malfunction and prevent you from completing bespoke orders.</p>
  </div>
);

const ShippingPolicy = () => (
  <div className="policy-content">
    <h2>Shipping & Delivery Policy</h2>
    <p>At Cobblyn, we take immense pride in handcrafting your bespoke footwear and ensuring it arrives securely at your doorstep.</p>
    
    <h3>1. Crafting & Delivery Timeframes</h3>
    <p><strong>Bespoke Orders:</strong> True craftsmanship takes time. Once your bespoke order is placed and your foot profile is verified, our artisans immediately begin the crafting process. Please allow <strong>15 to 20 business days</strong> for your bespoke shoes to be crafted, quality-checked, and delivered to you.</p>
    <p><strong>Ready-to-Ship & Accessories:</strong> Standard non-customized items are typically processed within 1-2 business days and delivered within 3-7 business days, depending on your location.</p>
    
    <h3>2. Domestic Shipping Only</h3>
    <p>Currently, Cobblyn operates exclusively within India. We do not offer international shipping or process international deliveries at this time.</p>
    
    <h3>3. Shipping Costs</h3>
    <p>We provide complimentary standard shipping on all bespoke footwear orders across India. For ready-to-ship items or accessories, standard shipping rates may apply based on your location and will be calculated at checkout.</p>
    
    <h3>4. Order Tracking & Security</h3>
    <p>Given the high value of our products, all shipments are fully insured during transit. Once your order is dispatched, you will receive an email and WhatsApp notification with your courier tracking details. A signature will be required upon delivery to ensure your luxury item reaches you safely.</p>
  </div>
);

const PolicyPages = () => {
  const [activeTab, setActiveTab] = useState('privacy');

  React.useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (['privacy', 'terms', 'warranty', 'returns', 'shipping', 'cookie'].includes(hash)) {
      setActiveTab(hash);
    }

    const handleHashChange = () => {
      const newHash = window.location.hash.replace('#', '');
      if (['privacy', 'terms', 'warranty', 'returns', 'shipping', 'cookie'].includes(newHash)) {
        setActiveTab(newHash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    window.location.hash = tab;
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'privacy': return <PrivacyPolicy />;
      case 'terms': return <TermsOfUse />;
      case 'warranty': return <WarrantyPolicy />;
      case 'returns': return <ReturnPolicy />;
      case 'shipping': return <ShippingPolicy />;
      case 'cookie': return <CookiePolicy />;
      default: return <PrivacyPolicy />;
    }
  };

  return (
    <div className="policy-page-container">
      <div className="policy-sidebar">
        <h3>Cobblyn Policies</h3>
        <ul>
          <li className={activeTab === 'privacy' ? 'active' : ''} onClick={() => handleTabClick('privacy')}>Privacy Policy</li>
          <li className={activeTab === 'terms' ? 'active' : ''} onClick={() => handleTabClick('terms')}>Terms of Use</li>
          <li className={activeTab === 'warranty' ? 'active' : ''} onClick={() => handleTabClick('warranty')}>Warranty Policy</li>
          <li className={activeTab === 'returns' ? 'active' : ''} onClick={() => handleTabClick('returns')}>Returns & Exchanges</li>
          <li className={activeTab === 'shipping' ? 'active' : ''} onClick={() => handleTabClick('shipping')}>Shipping Policy</li>
          <li className={activeTab === 'cookie' ? 'active' : ''} onClick={() => handleTabClick('cookie')}>Cookie Policy</li>
        </ul>
      </div>
      <div className="policy-content-area">
        {renderContent()}
      </div>
    </div>
  );
};

export default PolicyPages;
