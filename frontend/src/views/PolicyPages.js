"use client";
import React, { useState } from 'react';
import './PolicyPages.css';

const PrivacyPolicy = () => (
  <div className="policy-content">
    <h2>Privacy Policy</h2>
    <p>Last updated: June 2026</p>
    <p>At Cobblyn, we respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website (regardless of where you visit it from) and tell you about your privacy rights and how the law protects you.</p>
    <h3>1. Information We Collect</h3>
    <p>We collect information you provide directly to us when you create an account, use the 3D Customizer, submit your foot measurements (such as via our Virtual Atelier), or communicate with us. This may include your name, email address, shipping address, and payment information.</p>
    <h3>2. How We Use Your Information</h3>
    <p>We use the information we collect to process your bespoke orders, communicate with you about your order status, and to personalize your experience. Your foot profile data is strictly used for crafting your custom footwear and is never sold to third parties.</p>
    <h3>3. Data Security</h3>
    <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed.</p>
  </div>
);

const TermsOfUse = () => (
  <div className="policy-content">
    <h2>Terms of Use</h2>
    <p>Welcome to Cobblyn. By accessing or using our website, 3D Customizer, or Virtual Atelier, you agree to be bound by these Terms of Use.</p>
    <h3>1. Bespoke Orders</h3>
    <p>All bespoke orders are crafted specifically to your requested specifications and foot profile. Once an order is placed and production begins, modifications may not be possible.</p>
    <h3>2. Intellectual Property</h3>
    <p>The designs, 3D models, graphics, and content on this website are the intellectual property of Cobblyn. You may not reproduce, distribute, or create derivative works without our express written consent.</p>
    <h3>3. Limitation of Liability</h3>
    <p>Cobblyn shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use our products or services.</p>
  </div>
);

const WarrantyPolicy = () => (
  <div className="policy-content">
    <h2>Warranty Policy</h2>
    <p>We stand behind the craftsmanship of every Cobblyn shoe.</p>
    <h3>1. Craftsmanship Guarantee</h3>
    <p>All Cobblyn bespoke and ready-to-ship footwear comes with a 1-year warranty against manufacturing defects (e.g., sole delamination, stitching failure under normal wear).</p>
    <h3>2. What is Not Covered</h3>
    <p>The warranty does not cover normal wear and tear, intentional damage, damage from improper care (e.g., lack of conditioning for Shell Cordovan leather), or changes in the natural patina of the leather.</p>
    <h3>3. Claim Process</h3>
    <p>To initiate a warranty claim, please contact our support team with your Order ID and detailed photographs of the issue. Our artisans will review the claim and, if approved, we will repair or replace the item at our discretion.</p>
  </div>
);

const ReturnPolicy = () => (
  <div className="policy-content">
    <h2>Returns, Exchanges, and Refund Policy</h2>
    <p>At Cobblyn, we strive for perfection in every pair we craft.</p>
    <h3>1. Bespoke and Customized Orders</h3>
    <p><strong>Strict Policy:</strong> Because bespoke and customized orders are crafted specifically for your foot profile and aesthetic choices, <strong>they cannot be returned, exchanged, or refunded</strong> unless there is a clear manufacturing defect.</p>
    <h3>2. Ready-to-Ship Products</h3>
    <p>Ready-to-ship products (non-customized) can be returned or exchanged within 14 days of delivery, provided they are unworn, in pristine condition, and in their original packaging.</p>
    <h3>3. Fit Guarantee (Bespoke)</h3>
    <p>If your bespoke shoe does not fit perfectly despite following our Virtual Atelier sizing process, we offer complimentary adjustments within 30 days of receipt. We do not offer full refunds for sizing issues on custom orders.</p>
    <h3>4. Cash on Delivery (COD)</h3>
    <p>COD is strictly restricted to 'Ready-to-Ship' products and 'Accessories'. COD is not available for bespoke orders, and refunds for COD orders will be processed via bank transfer.</p>
  </div>
);

const CookiePolicy = () => (
  <div className="policy-content">
    <h2>Cookie Policy</h2>
    <p>Cobblyn uses cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic.</p>
    <h3>1. What are Cookies?</h3>
    <p>Cookies are small text files placed on your device to store data that can be recalled by a web server in the domain that placed the cookie.</p>
    <h3>2. How We Use Cookies</h3>
    <p>We use essential cookies to maintain your session (e.g., keeping your bespoke shoe in the cart) and analytics cookies to understand how you interact with our 3D Customizer so we can improve performance.</p>
    <h3>3. Managing Cookies</h3>
    <p>You can set your browser to refuse all or some browser cookies, or to alert you when websites set or access cookies. Note that disabling cookies may affect the functionality of the 3D Customizer.</p>
  </div>
);

const PolicyPages = () => {
  const [activeTab, setActiveTab] = useState('privacy');

  React.useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (['privacy', 'terms', 'warranty', 'returns', 'cookie'].includes(hash)) {
      setActiveTab(hash);
    }

    const handleHashChange = () => {
      const newHash = window.location.hash.replace('#', '');
      if (['privacy', 'terms', 'warranty', 'returns', 'cookie'].includes(newHash)) {
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
