"use client";

import React, { useState } from 'react';
import { Sparkles, MessageCircle, Calendar, Mail, X, Compass, PhoneCall } from 'lucide-react';

export default function ConciergeWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleConcierge = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* CSS Styles for animations and premium look */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float-pulse {
          0% { box-shadow: 0 0 0 0 rgba(157, 39, 6, 0.5); transform: scale(1); }
          70% { box-shadow: 0 0 0 15px rgba(157, 39, 6, 0); transform: scale(1.05); }
          100% { box-shadow: 0 0 0 0 rgba(157, 39, 6, 0); transform: scale(1); }
        }
        
        .concierge-float-btn {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #111;
          border: 2px solid #9d2706;
          color: #9d2706;
          display: flex;
          alignItems: center;
          justifyContent: center;
          cursor: pointer;
          z-index: 999;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
          animation: float-pulse 2.5s infinite;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .concierge-float-btn:hover {
          background: #9d2706;
          color: #fff;
          transform: translateY(-4px) scale(1.05);
        }

        .concierge-drawer {
          position: fixed;
          bottom: 96px;
          right: 24px;
          width: 350px;
          max-width: calc(100vw - 48px);
          border-radius: 16px;
          z-index: 1000;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: bottom right;
        }

        .concierge-drawer.open {
          transform: scale(1);
          opacity: 1;
          visibility: visible;
        }

        .concierge-drawer.closed {
          transform: scale(0.85);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
        }

        .glass-dark-gilded {
          background: rgba(17, 17, 17, 0.9) !important;
          backdrop-filter: blur(16px) saturate(180%) !important;
          -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
          border: 1px solid rgba(157, 39, 6, 0.35) !important;
          box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.4) !important;
        }

        .concierge-link-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #fff;
          text-decoration: none;
          transition: all 0.3s ease;
          margin-bottom: 12px;
        }

        .concierge-link-card:hover {
          background: rgba(157, 39, 6, 0.08);
          border-color: rgba(157, 39, 6, 0.5);
          transform: translateX(4px);
        }

        .concierge-link-card .icon-box {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(157, 39, 6, 0.15);
          color: #9d2706;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .concierge-link-card:hover .icon-box {
          background: #9d2706;
          color: #fff;
        }
      `}} />

      {/* Floating Button */}
      <button 
        onClick={toggleConcierge} 
        className="concierge-float-btn"
        aria-label="Atelier Luxury Concierge"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {isOpen ? <X size={24} /> : <Compass size={24} />}
      </button>

      {/* Glassmorphic Concierge Card Drawer */}
      <div className={`concierge-drawer glass-dark-gilded ${isOpen ? 'open' : 'closed'}`}>
        <div style={{ padding: '24px 20px', position: 'relative' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Sparkles size={16} color="#9d2706" />
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#9d2706', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Atelier Concierge</span>
          </div>
          
          <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', fontWeight: 600 }}>
            Luxury Stylist & Consultation
          </h3>
          
          <p style={{ margin: '0 0 20px 0', color: '#a1a1aa', fontSize: '0.78rem', lineHeight: 1.4 }}>
            Connect with our master artisans and private stylists to customize your handcrafted pair, resolve sizing concerns, or book a bespoke virtual walkthrough.
          </p>

          {/* Consultation Links */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            
            {/* WhatsApp Artisan Chat */}
            <a 
              href="https://wa.me/919999999999?text=Hello%20Atelier!%20I'd%20like%20to%20speak%20with%20an%20Artisan%20Stylist%20about%20customizing%20my%20footwear."
              target="_blank"
              rel="noopener noreferrer"
              className="concierge-link-card"
            >
              <div className="icon-box">
                <MessageCircle size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Speak to an Artisan Stylist</span>
                <span style={{ fontSize: '0.68rem', color: '#a1a1aa' }}>WhatsApp Business (Placeholder)</span>
              </div>
            </a>

            {/* Video Consultation (Calendly) */}
            <a 
              href="https://calendly.com/cobblynstudio-luxury-consultation"
              target="_blank"
              rel="noopener noreferrer"
              className="concierge-link-card"
            >
              <div className="icon-box">
                <Calendar size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Book 1-on-1 Consultation</span>
                <span style={{ fontSize: '0.68rem', color: '#a1a1aa' }}>10-Minute Video Call (Placeholder)</span>
              </div>
            </a>

            {/* Email Contact */}
            <a 
              href="mailto:concierge@cobblynstudio.com?subject=Bespoke%20Luxury%20Inquiry"
              className="concierge-link-card"
            >
              <div className="icon-box">
                <Mail size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Email Atelier Stylists</span>
                <span style={{ fontSize: '0.68rem', color: '#a1a1aa' }}>concierge@cobblynstudio.com</span>
              </div>
            </a>

            {/* Bespoke Fit Guide */}
            <a 
              href="/size-guide"
              className="concierge-link-card"
              style={{ marginBottom: 0 }}
            >
              <div className="icon-box">
                <Compass size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Atelier Fitting Suite</span>
                <span style={{ fontSize: '0.68rem', color: '#a1a1aa' }}>Explore Sizing Fit Guides</span>
              </div>
            </a>

          </div>

          {/* Footer Text */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '20px', paddingTop: '12px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.6rem', color: '#78716c', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <PhoneCall size={10} color="#9d2706" /> Handcrafted in Atelier Workshops
            </span>
          </div>

        </div>
      </div>
    </>
  );
}
