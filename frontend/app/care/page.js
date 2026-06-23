"use client";
import React, { useState } from 'react';
import { Sparkles, Droplets, Wind, Sun, Shield, AlertTriangle, ChevronDown } from 'lucide-react';

const careTips = [
  {
    icon: <Sparkles size={28} />,
    title: 'Daily Cleaning',
    color: 'var(--accent)',
    steps: [
      'Remove surface dust with a soft horsehair brush — always brush in one direction following the grain.',
      'Use a slightly damp cloth to wipe off any light marks or stains. Avoid soaking the leather.',
      'Allow the shoe to air dry naturally at room temperature. Never use heat sources.',
      'Use cedar shoe trees after every wear to maintain shape and absorb moisture.',
    ],
  },
  {
    icon: <Droplets size={28} />,
    title: 'Deep Conditioning',
    color: 'var(--dark-grey)',
    steps: [
      'Apply a small amount of leather conditioner using a soft cloth in circular motions.',
      'Focus on flex points — the toe box crease and the vamp — where leather is most prone to drying.',
      'Allow the conditioner to absorb for 10–15 minutes, then buff gently with a clean cloth.',
      'Condition every 4–6 weeks, or more frequently in dry climates.',
    ],
  },
  {
    icon: <Sun size={28} />,
    title: 'Polishing',
    color: 'var(--accent)',
    steps: [
      'Choose a wax-based polish that matches your shoe colour. Apply with a dauber brush.',
      'Use circular motions to work the polish into the leather, paying attention to any scuffs.',
      'Let the polish dry for 3–5 minutes, then buff vigorously with a polishing cloth or brush.',
      'For a mirror shine, use the bone of a spoon or a shining bone on the toe cap with a tiny drop of water.',
    ],
  },
  {
    icon: <Wind size={28} />,
    title: 'Drying After Rain',
    color: 'var(--mid-grey)',
    steps: [
      'Stuff shoes with newspaper or paper to absorb moisture and maintain shape.',
      'Allow to air dry slowly at room temperature — never near a radiator or in direct sunlight.',
      'Once fully dry, brush away any salt marks with a slightly damp cloth.',
      'Condition and re-polish once the leather is completely dry.',
    ],
  },
  {
    icon: <Shield size={28} />,
    title: 'Waterproofing',
    color: 'var(--accent)',
    steps: [
      'Apply a quality waterproofing spray designed for full-grain leather before first wear.',
      'Hold the spray 20–30 cm from the shoe and apply in an even coat.',
      'Allow to dry completely (20–30 minutes) before wearing.',
      'Reapply every 2–3 months, or after deep cleaning.',
    ],
  },
  {
    icon: <AlertTriangle size={28} />,
    title: 'Storage',
    color: 'var(--black)',
    steps: [
      'Always store in the provided dust bags to protect from scratches and dust.',
      'Use your original Cobblyn box or a breathable shoe bag — avoid airtight plastic.',
      'Insert cedar shoe trees to maintain shape and prevent creasing.',
      'Store away from direct light, heat, and humidity to prevent fading and cracking.',
    ],
  },
];

const dosDonts = {
  dos: [
    'Use cedar shoe trees after every wear',
    'Rotate between pairs to allow leather to rest',
    'Apply conditioner regularly, especially in dry weather',
    'Use a dedicated brush per colour to avoid cross-contamination',
    'Bring shoes in for professional resoling when needed',
    'Re-polish regularly to maintain the protective wax layer',
  ],
  donts: [
    'Never wear the same pair two days in a row',
    'Avoid excessive moisture — keep away from puddles and rain where possible',
    'Never use household cleaners, acetone, or alcohol on leather',
    'Don\'t dry with a hairdryer or near heat sources',
    'Avoid storing in plastic bags — leather needs to breathe',
    'Never scrub aggressively — always use gentle circular motions',
  ],
};

const leatherTypes = [
  {
    type: 'Full-Grain Calf Leather',
    description: 'Our most used leather. Responds beautifully to wax polish and regular conditioning. Develops a gorgeous patina over time — embrace it.',
    care: 'Brush, condition monthly, wax polish.',
  },
  {
    type: 'Suede & Nubuck',
    description: 'Requires specialised care. Never use standard shoe polish on suede. Use a suede brush and protective spray exclusively.',
    care: 'Suede brush only, specialist waterproof spray.',
  },
  {
    type: 'Patent Leather',
    description: 'The glossy finish is delicate. Avoid contact with darker leathers which can transfer colour. Wipe clean with a damp cloth.',
    care: 'Damp cloth, patent leather cream, no wax polish.',
  },
  {
    type: 'Exotic Leathers',
    description: 'For alligator, ostrich, or python skins, use specialist exotic leather conditioners. Handle with care — these are truly exceptional materials.',
    care: 'Exotic leather conditioner, professional care recommended.',
  },
];

export default function CarePage() {
  const [activeTip, setActiveTip] = useState(null);

  return (
    <main className="care-page">
      {/* HERO */}
      <section className="care-hero">
        <div className="care-hero-content">
          <div className="section-label">SHOE CARE</div>
          <h1 className="care-hero-title">
            Preserve the
            <br />
            <em>Extraordinary</em>
          </h1>
          <p className="care-hero-sub">
            A Cobblyn shoe is made to last decades, not seasons. With the right care, 
            your pair will develop a character and patina that only improves with time.
          </p>
        </div>
        <div className="care-hero-visual">
          <img
            src="/shoe_care_banner.png"
            alt="Shoe care and maintenance banner showcasing premium craftsmanship"
          />
          <div className="care-hero-img-overlay" />
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section className="care-philosophy section">
        <div className="care-phil-inner">
          <div className="care-phil-text">
            <div className="section-label">OUR PHILOSOPHY</div>
            <h2 className="section-title">Great Shoes Reward Great Care</h2>
            <p style={{ color: 'var(--dark-grey)', fontSize: '0.9rem', lineHeight: '1.85', marginBottom: '16px' }}>
              Full-grain leather is a living material — it breathes, ages, and responds to how 
              it is treated. Unlike synthetic materials, it does not wear out; it wears in. 
              Given the right attention, a pair of Cobblyn shoes will outlast trends, seasons, 
              and decades.
            </p>
            <p style={{ color: 'var(--dark-grey)', fontSize: '0.9rem', lineHeight: '1.85' }}>
              The patina your shoes develop — the subtle deepening of colour, the story written 
              in the leather's surface — is considered among shoe enthusiasts to be a mark of 
              true luxury. We encourage you to embrace it.
            </p>
          </div>
          <div className="care-phil-stats">
            {[
              { number: '20+', label: 'Years a well-cared pair can last' },
              { number: '3×', label: 'More durable with regular conditioning' },
              { number: '100%', label: 'Natural materials that love attention' },
            ].map((stat, i) => (
              <div key={i} className="care-phil-stat">
                <div className="care-phil-stat-num">{stat.number}</div>
                <div className="care-phil-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CARE GUIDE */}
      <section className="care-guide section" style={{ background: 'var(--off-white)' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div className="section-label">THE CARE GUIDE</div>
          <h2 className="section-title">Six Pillars of Shoe Care</h2>
          <p style={{ maxWidth: '520px', margin: '0 auto', color: 'var(--mid-grey)', fontSize: '0.88rem', lineHeight: '1.85' }}>
            Follow these six practices and your Cobblyn shoes will thank you for years to come.
          </p>
        </div>
        <div className="care-guide-grid">
          {careTips.map((tip, i) => (
            <div
              key={i}
              className={`care-tip-card ${activeTip === i ? 'care-tip-open' : ''}`}
              onClick={() => setActiveTip(activeTip === i ? null : i)}
            >
              <div className="care-tip-header">
                <div className="care-tip-icon" style={{ color: tip.color }}>{tip.icon}</div>
                <h3 className="care-tip-title">{tip.title}</h3>
                <ChevronDown size={16} className="care-tip-chevron" />
              </div>
              <div className="care-tip-steps">
                {tip.steps.map((step, j) => (
                  <div key={j} className="care-tip-step">
                    <span className="care-tip-step-num">{j + 1}</span>
                    <p>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DOS & DON'TS */}
      <section className="care-dos-donts section">
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div className="section-label">QUICK REFERENCE</div>
          <h2 className="section-title">Dos & Don'ts</h2>
        </div>
        <div className="care-dos-grid">
          <div className="care-dos-col">
            <div className="care-dos-header care-dos-header-green">
              <span>✓</span> Do This
            </div>
            <ul className="care-dos-list">
              {dosDonts.dos.map((item, i) => (
                <li key={i} className="care-dos-item">
                  <span className="care-do-check">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="care-dos-col">
            <div className="care-dos-header care-dos-header-red">
              <span>✕</span> Avoid This
            </div>
            <ul className="care-dos-list">
              {dosDonts.donts.map((item, i) => (
                <li key={i} className="care-dos-item">
                  <span className="care-dont-x">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* LEATHER TYPES */}
      <section className="care-leather section" style={{ background: 'var(--black)' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div className="section-label">BY MATERIAL</div>
          <h2 className="section-title" style={{ color: 'var(--white)' }}>
            Care by Leather Type
          </h2>
        </div>
        <div className="care-leather-grid">
          {leatherTypes.map((lt, i) => (
            <div key={i} className="care-leather-card">
              <h3 className="care-leather-type">{lt.type}</h3>
              <p className="care-leather-desc">{lt.description}</p>
              <div className="care-leather-rec">
                <span className="care-leather-rec-label">How to care:</span>
                <span className="care-leather-rec-value">{lt.care}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROFESSIONAL CARE CTA */}
      <section className="care-service section" style={{ textAlign: 'center' }}>
        <div className="section-label">PROFESSIONAL RESTORATION</div>
        <h2 className="section-title" style={{ maxWidth: '520px', margin: '0 auto 24px' }}>
          We Restore, We Repair, We Resole
        </h2>
        <p style={{ color: 'var(--mid-grey)', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto 40px', lineHeight: '1.85' }}>
          Sometimes your Cobblyn shoes deserve a professional touch. We offer comprehensive 
          restoration, deep cleaning, resoling, and leather repair services — because a 
          great shoe should last a lifetime.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/contact" className="btn-hero-primary" style={{ textDecoration: 'none' }}>
            Book a Restoration
          </a>
          <a href="/contact" className="btn-hero-ghost" style={{ textDecoration: 'none' }}>
            Ask a Question
          </a>
        </div>
      </section>
    </main>
  );
}
