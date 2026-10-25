"use client";
import React from 'react';
import Link from 'next/link';

const CustomizationSection = () => {
  return (
    <section className="custom-section" id="customisation" data-testid="customization-section">
      <div>
        <div className="custom-label">Bespoke Atelier</div>
        <h2 className="custom-title">Craft Your <em>Perfect</em> Pair</h2>
        <p className="custom-desc">Our custom atelier allows you to select every element of your shoe, from the premium Italian leather type to the signature hand-burnished outsole details.</p>
        
        <div className="custom-steps">
          <div className="custom-step">
            <div className="custom-step-num">1</div>
            <div>
              <div className="custom-step-title">Design Your Silhouette</div>
              <div className="custom-step-desc">Choose from our curated library of classics including Oxfords, Loafers, and Jutis. Configure the details.</div>
            </div>
          </div>
          <div className="custom-step">
            <div className="custom-step-num">2</div>
            <div>
              <div className="custom-step-title">Select Premium Materials</div>
              <div className="custom-step-desc">Pick from full-grain calfskins, premium suede, or embroidered silk brocades in over 15 hand-tailored shades.</div>
            </div>
          </div>
          <div className="custom-step">
            <div className="custom-step-num">3</div>
            <div>
              <div className="custom-step-title">Bespoke Fit & Crafting</div>
              <div className="custom-step-desc">Our master artisans hand-stitch and polish your pair over a period of 4-6 weeks for an impeccable bespoke finish.</div>
            </div>
          </div>
        </div>

        <Link href="/customize" className="btn-custom" data-testid="start-customizing-btn">
          Start Customizing
        </Link>
      </div>

      <div className="custom-video-wrap" style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px' }}>
        <video 
          src="/customization_guide/cobcult_customization_flow_walkthrough.mp4" 
          poster="/customization_guide/cobcult_customization_journey_infographic.png"
          autoPlay 
          loop 
          muted 
          playsInline 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
        <div className="video-label" style={{ pointerEvents: 'none' }}>
          <div className="video-label-text">Interactive Customization Flow</div>
          <div className="video-label-sub">Inside the CobCult Atelier</div>
        </div>
      </div>
    </section>
  );
};

export default CustomizationSection;
