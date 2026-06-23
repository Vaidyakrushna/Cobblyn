"use client";
import React from 'react';
import { Scissors, Award, Clock, Users, MapPin, Star, Gem, Heart, Video } from 'lucide-react';

const craftSteps = [
  {
    number: '01',
    title: 'Pattern Making',
    description: 'Every shoe begins as a precise paper pattern, hand-drawn by our master pattern-makers with decades of experience in luxury footwear design.',
  },
  {
    number: '02',
    title: 'Leather Selection',
    description: 'We source only the finest full-grain calf leather from Italian tanneries, Spanish suede, and exotic skins — chosen for both beauty and longevity.',
  },
  {
    number: '03',
    title: 'Cutting & Skiving',
    description: 'Each leather piece is meticulously cut by hand and skived to the exact thickness needed for the perfect join — no shortcuts, no machinery.',
  },
  {
    number: '04',
    title: 'Lasting & Welting',
    description: 'Our artisans use the Goodyear welt method — a centuries-old technique that gives each shoe its distinctive silhouette and unparalleled durability.',
  },
  {
    number: '05',
    title: 'Hand Stitching',
    description: 'Over 200 individual stitches hold each shoe together. Every stitch is placed with intention, creating seams that are both structural and beautiful.',
  },
  {
    number: '06',
    title: 'Finishing & Polish',
    description: 'Multiple rounds of hand-polishing using natural waxes and dyes bring out the leather\'s true depth. Each pair leaves our studio in pristine condition.',
  },
];

const values = [
  {
    icon: <Gem size={28} />,
    title: 'Material Excellence',
    description: 'We reject synthetic substitutes. Every hide, thread, and sole is sourced from the world\'s finest suppliers — because luxury starts at the source.',
  },
  {
    icon: <Scissors size={28} />,
    title: 'Artisan Heritage',
    description: 'Our craftsmen carry forward a tradition that spans generations. Apprenticeships last years, not weeks — skill cannot be rushed.',
  },
  {
    icon: <Clock size={28} />,
    title: 'Unhurried Process',
    description: 'A single pair of Cobblyn shoes takes 15–20 days to complete. We believe the finest things in life cannot be manufactured overnight.',
  },
  {
    icon: <Heart size={28} />,
    title: 'Made with Meaning',
    description: 'Every shoe carries the fingerprints — quite literally — of its maker. We celebrate this human touch as the highest form of luxury.',
  },
];

const studioStats = [
  { number: '20+', label: 'Years of Excellence' },
  { number: '200+', label: 'Hand Stitches Per Pair' },
  { number: '15', label: 'Days to Craft One Pair' },
  { number: '100%', label: 'Full-Grain Leather' },
];

export default function StudioPage() {
  return (
    <main className="studio-page">
      {/* HERO */}
      <section className="studio-hero">
        <div className="studio-hero-bg">
          <img
            src="/studio_hero_banner.png"
            alt="Cobblyn Atelier - Craftsmanship and Culture"
          />
          <div className="studio-hero-overlay" />
        </div>
        <div className="studio-hero-content">
          <div className="section-label" style={{ color: 'var(--accent)' }}>OUR ATELIER</div>
          <h1 className="studio-hero-title">
            Where Craft Becomes
            <br />
            <em>Culture</em>
          </h1>
          <p className="studio-hero-sub">
            Nestled in the heart of India, the Cobblyn studio is where the world's finest leathers 
            meet the hands of master craftsmen to become something extraordinary.
          </p>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="studio-stats-bar">
        {studioStats.map((stat, i) => (
          <div key={i} className="studio-stat">
            <div className="studio-stat-num">{stat.number}</div>
            <div className="studio-stat-label">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* PHILOSOPHY */}
      <section className="studio-philosophy section">
        <div className="studio-phil-grid">
          <div className="studio-phil-left">
            <div className="section-label">OUR PHILOSOPHY</div>
            <h2 className="section-title">
              Craftsmanship Is Our Culture, Not Just Our Method
            </h2>
            <p className="studio-phil-text">
              At Cobblyn, we believe a shoe is more than footwear — it is a statement of 
              identity, a celebration of craft, and a piece of art meant to be worn. Our 
              studio was founded on a single conviction: that the world needs more objects 
              made with genuine care and absolute mastery.
            </p>
            <p className="studio-phil-text">
              We bring together India's finest leather craftsmen, contemporary European 
              design sensibilities, and the ancient traditions of bespoke shoemaking. 
              The result is footwear that honours the past while feeling completely modern.
            </p>
            <a href="/story" className="studio-phil-link">
              Read Our Story <span>→</span>
            </a>
          </div>
          <div className="studio-phil-right">
            <div className="studio-phil-img-main">
              <img
                src="/studio_craft_main.png"
                alt="Master craftsman stitching premium leather"
              />
            </div>
            <div className="studio-phil-img-accent">
              <img
                src="/studio_leather_accent.png"
                alt="Rolls of premium full-grain leather"
              />
              <div className="studio-phil-badge">
                <Star size={16} fill="currentColor" />
                <span>Est. 2018</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CRAFT PROCESS */}
      <section className="studio-process" style={{ background: 'var(--off-white)' }}>
        <div className="section">
          <div style={{ textAlign: 'center', marginBottom: '72px' }}>
            <div className="section-label">THE PROCESS</div>
            <h2 className="section-title" style={{ margin: '0 auto', maxWidth: '600px' }}>
              Six Stages of Perfection
            </h2>
            <p style={{ maxWidth: '560px', margin: '0 auto', color: 'var(--mid-grey)', fontSize: '0.9rem', lineHeight: '1.85' }}>
              Every pair of Cobblyn shoes passes through six distinct stages — each one a 
              testament to the patience and precision that defines our craft.
            </p>
          </div>
          <div className="studio-process-grid">
            {craftSteps.map((step, i) => (
              <div key={i} className="studio-process-card">
                <div className="studio-process-num">{step.number}</div>
                <h3 className="studio-process-title">{step.title}</h3>
                <p className="studio-process-desc">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="studio-values section">
        <div style={{ textAlign: 'center', marginBottom: '72px' }}>
          <div className="section-label">WHAT WE STAND FOR</div>
          <h2 className="section-title">Our Core Values</h2>
        </div>
        <div className="studio-values-grid">
          {values.map((val, i) => (
            <div key={i} className="studio-value-card">
              <div className="studio-value-icon">{val.icon}</div>
              <h3 className="studio-value-title">{val.title}</h3>
              <p className="studio-value-desc">{val.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* VIRTUAL ATELIER BAND */}
      <section className="studio-location-band">
        <div className="studio-location-inner">
          <div className="studio-location-content">
            <Video size={24} color="var(--accent)" />
            <div>
              <div className="section-label" style={{ marginBottom: '4px', color: 'var(--accent)', fontSize: '0.75rem', letterSpacing: '0.15em', fontWeight: 'bold' }}>DIGITAL ATELIER</div>
              <h2 className="studio-location-title">Experience Our Virtual Studio</h2>
              <p className="studio-location-desc">
                While our physical atelier is currently under construction in Jaipur, we bring the bespoke experience directly to you. Book a virtual consultation with our master stylists to explore premium leathers, discuss fits, and commission your unique pair from anywhere in the world.
              </p>
              <a href="/fitting-experience" className="btn-hero-primary" style={{ display: 'inline-block', marginTop: '24px', textDecoration: 'none', background: 'var(--accent)', color: 'var(--white)', padding: '12px 24px', borderRadius: '4px', fontWeight: 'bold' }}>
                Book Virtual Consultation
              </a>
            </div>
          </div>
          <div className="studio-location-img">
            <img
              src="/studio_virtual_consultation.png"
              alt="Virtual bespoke consultation workspace"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
