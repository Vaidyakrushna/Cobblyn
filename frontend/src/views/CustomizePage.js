"use client";
﻿import React, { useState } from 'react';
import Link from 'next/link';

import { ChevronRight, ArrowRight } from 'lucide-react';

const CustomizePage = () => {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState({ gender: '', model: '', leather: '', color: '', sole: '' });

  const models = {
    men: [
      { name: 'Oxford', desc: 'Classic closed-lacing elegance', img: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=400&q=80&fit=crop' },
      { name: 'Loafer', desc: 'Slip-on sophistication', img: 'https://images.pexels.com/photos/29258015/pexels-photo-29258015.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { name: 'Monk Strap', desc: 'Bold buckle statement', img: 'https://images.unsplash.com/photo-1770198408387-7f45e5d6c056?w=400&q=80&fit=crop' },
      { name: 'Derby', desc: 'Open-lacing versatility', img: 'https://images.unsplash.com/photo-1616696038562-574c18066055?w=400&q=80&fit=crop' },
      { name: 'Boots', desc: 'Ankle-height confidence', img: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&q=80&fit=crop' },
      { name: 'Jutis', desc: 'Traditional Indian craft', img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80&fit=crop' },
    ],
    women: [
      { name: 'Ballerina', desc: 'Graceful flat elegance', img: 'https://images.unsplash.com/photo-1774802536876-88b0e1ca7453?w=400&q=80&fit=crop' },
      { name: 'Boots', desc: 'Sculpted ankle silhouette', img: 'https://images.unsplash.com/photo-1720603989488-1f3d16b7be9d?w=400&q=80&fit=crop' },
      { name: 'Loafers', desc: 'Polished everyday ease', img: 'https://images.unsplash.com/photo-1583264739275-656ff57a087f?w=400&q=80&fit=crop' },
      { name: 'Jutis', desc: 'Festive embroidered beauty', img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80&fit=crop' },
      { name: 'Peep Toes', desc: 'Glamorous open-toe heels', img: 'https://images.unsplash.com/photo-1720604083961-88336789791e?w=400&q=80&fit=crop' },
    ]
  };

  const leathers = [
    { name: 'Full-Grain Italian', desc: 'Finest quality, natural grain visible', swatch: '#3E2723' },
    { name: 'Nappa Leather', desc: 'Soft and supple, buttery finish', swatch: '#1A1A1A' },
    { name: 'Suede', desc: 'Velvety napped finish', swatch: '#8B7355' },
    { name: 'Patent Leather', desc: 'High-gloss mirror finish', swatch: '#0A0A0A' },
    { name: 'Cordovan', desc: 'Shell cordovan, ultra-premium', swatch: '#800020' },
    { name: 'Embroidered Silk', desc: 'Traditional handwoven silk', swatch: '#C9A84C' },
  ];

  const colors = [
    { name: 'Black', hex: '#0A0A0A' }, { name: 'Dark Brown', hex: '#3E2723' },
    { name: 'Tan', hex: '#D2B48C' }, { name: 'Burgundy', hex: '#800020' },
    { name: 'Navy', hex: '#1A1A40' }, { name: 'Olive', hex: '#556B2F' },
    { name: 'Cognac', hex: '#9A4E1C' }, { name: 'Oxblood', hex: '#4A0000' },
  ];

  const soles = [
    { name: 'Leather Sole', desc: 'Traditional elegance, dress occasions' },
    { name: 'Rubber Sole', desc: 'Durable grip, all-weather' },
    { name: 'Dainite Sole', desc: 'Studded rubber, smart-casual' },
    { name: 'Crepe Sole', desc: 'Natural comfort, casual wear' },
  ];

  const steps = ['Gender', 'Model', 'Leather', 'Color', 'Sole', 'Summary'];

  return (
    <div className="customize-page" data-testid="customize-page">
      <div className="breadcrumbs">
        <Link href="/">Home</Link>
        <ChevronRight size={14} />
        <span>Customize</span>
      </div>

      {/* Header */}
      <div className="customize-hero">
        <div className="section-label">MADE TO ORDER</div>
        <h1 className="customize-heading">Custom Dress Shoes</h1>
        <p className="customize-sub">Design your dream pair. Choose every detail from model to sole.</p>
      </div>

      {/* Progress */}
      <div className="customize-progress">
        {steps.map((s, i) => (
          <div key={i} className={`progress-step ${i <= step ? 'active' : ''} ${i === step ? 'current' : ''}`} data-testid={`step-${i}`}>
            <div className="progress-num">{String(i + 1).padStart(2, '0')}</div>
            <div className="progress-label">{s}</div>
          </div>
        ))}
        <div className="progress-line">
          <div className="progress-fill" style={{ width: `${(step / (steps.length - 1)) * 100}%` }}></div>
        </div>
      </div>

      {/* Step 0: Gender */}
      {step === 0 && (
        <div className="customize-step" data-testid="step-gender">
          <h2 className="step-question">Who are the shoes for?</h2>
          <div className="gender-cards">
            <button className={`gender-card ${config.gender === 'men' ? 'active' : ''}`} onClick={() => { setConfig({ ...config, gender: 'men' }); setStep(1); }} data-testid="gender-men">
              <img src="https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=500&q=80&fit=crop" alt="Men" />
              <div className="gender-overlay">
                <h3>MEN</h3>
                <p>Classic & contemporary styles</p>
              </div>
            </button>
            <button className={`gender-card ${config.gender === 'women' ? 'active' : ''}`} onClick={() => { setConfig({ ...config, gender: 'women' }); setStep(1); }} data-testid="gender-women">
              <img src="https://images.unsplash.com/photo-1774802536876-88b0e1ca7453?w=500&q=80&fit=crop" alt="Women" />
              <div className="gender-overlay">
                <h3>WOMEN</h3>
                <p>Elegant & refined designs</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Model */}
      {step === 1 && (
        <div className="customize-step" data-testid="step-model">
          <h2 className="step-question">Choose your model</h2>
          <div className="model-grid">
            {(models[config.gender] || models.men).map((m) => (
              <button key={m.name} className={`model-card ${config.model === m.name ? 'active' : ''}`} onClick={() => { setConfig({ ...config, model: m.name }); setStep(2); }} data-testid={`model-${m.name.toLowerCase().replace(/\s+/g, '-')}`}>
                <img src={m.img} alt={m.name} />
                <div className="model-info">
                  <h3>{m.name}</h3>
                  <p>{m.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Leather */}
      {step === 2 && (
        <div className="customize-step" data-testid="step-leather">
          <h2 className="step-question">Select your leather</h2>
          <div className="leather-grid">
            {leathers.map((l) => (
              <button key={l.name} className={`leather-card ${config.leather === l.name ? 'active' : ''}`} onClick={() => { setConfig({ ...config, leather: l.name }); setStep(3); }} data-testid={`leather-${l.name.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="leather-swatch" style={{ backgroundColor: l.swatch }}></div>
                <div className="leather-info">
                  <h3>{l.name}</h3>
                  <p>{l.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Color */}
      {step === 3 && (
        <div className="customize-step" data-testid="step-color">
          <h2 className="step-question">Pick your color</h2>
          <div className="color-picker-grid">
            {colors.map((c) => (
              <button key={c.name} className={`color-pick-card ${config.color === c.name ? 'active' : ''}`} onClick={() => { setConfig({ ...config, color: c.name }); setStep(4); }} data-testid={`pick-color-${c.name.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="color-pick-swatch" style={{ backgroundColor: c.hex }}></div>
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Sole */}
      {step === 4 && (
        <div className="customize-step" data-testid="step-sole">
          <h2 className="step-question">Choose your sole</h2>
          <div className="sole-grid">
            {soles.map((s) => (
              <button key={s.name} className={`sole-card ${config.sole === s.name ? 'active' : ''}`} onClick={() => { setConfig({ ...config, sole: s.name }); setStep(5); }} data-testid={`sole-${s.name.toLowerCase().replace(/\s+/g, '-')}`}>
                <h3>{s.name}</h3>
                <p>{s.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 5: Summary */}
      {step === 5 && (
        <div className="customize-step" data-testid="step-summary">
          <h2 className="step-question">Your Custom Configuration</h2>
          <div className="summary-card">
            <div className="summary-rows">
              <div className="summary-row"><span className="summary-label">For</span><span className="summary-value">{config.gender === 'men' ? "Men's" : "Women's"}</span></div>
              <div className="summary-row"><span className="summary-label">Model</span><span className="summary-value">{config.model}</span></div>
              <div className="summary-row"><span className="summary-label">Leather</span><span className="summary-value">{config.leather}</span></div>
              <div className="summary-row"><span className="summary-label">Color</span><span className="summary-value">{config.color}</span></div>
              <div className="summary-row"><span className="summary-label">Sole</span><span className="summary-value">{config.sole}</span></div>
              <div className="summary-row price-row"><span className="summary-label">Estimated Price</span><span className="summary-value summary-price">From â‚¹8,500</span></div>
            </div>
            <button className="btn-place-order" data-testid="place-custom-order">
              Place Custom Order <ArrowRight size={18} />
            </button>
            <p className="summary-note">Our design team will contact you within 24 hours to finalize details.</p>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      {step > 0 && (
        <div className="customize-nav-btns">
          <button className="btn-back" onClick={() => setStep(step - 1)} data-testid="customize-back">Back</button>
          {step < 5 && <button className="btn-skip" onClick={() => setStep(step + 1)}>Skip</button>}
        </div>
      )}
    </div>
  );
};

export default CustomizePage;

