"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Ruler, Info, ArrowRight, PenTool, Footprints, CheckCircle } from 'lucide-react';

const SIZE_TABLE_MEN = [
  { uk: 6,  us: 7,    eu: 39, ind: 7,  cm: 24.5 },
  { uk: 7,  us: 8,    eu: 40, ind: 8,  cm: 25.4 },
  { uk: 8,  us: 9,    eu: 41, ind: 9,  cm: 26.2 },
  { uk: 9,  us: 10,   eu: 42, ind: 10, cm: 27.1 },
  { uk: 10, us: 11,   eu: 43, ind: 11, cm: 27.9 },
  { uk: 11, us: 12,   eu: 44, ind: 12, cm: 28.8 },
  { uk: 12, us: 13,   eu: 45, ind: 13, cm: 29.6 },
];

const SIZE_TABLE_WOMEN = [
  { uk: 3, us: 5,    eu: 36, ind: 4,  cm: 21.6 },
  { uk: 4, us: 6,    eu: 37, ind: 5,  cm: 22.5 },
  { uk: 5, us: 6.5,  eu: 38, ind: 6,  cm: 23.5 },
  { uk: 6, us: 7.5,  eu: 39, ind: 7,  cm: 24.5 },
  { uk: 7, us: 8.5,  eu: 40, ind: 8,  cm: 25.4 },
  { uk: 8, us: 9.5,  eu: 41, ind: 9,  cm: 26.2 },
  { uk: 9, us: 10.5, eu: 42, ind: 10, cm: 27.1 },
];

const HOW_TO_STEPS = [
  {
    num: '01',
    icon: <PenTool size={26} />,
    title: 'Gather Your Tools',
    desc: 'You need a blank sheet of paper (larger than your foot), a pen or pencil, and a ruler or measuring tape.',
  },
  {
    num: '02',
    icon: <Footprints size={26} />,
    title: 'Trace Your Foot',
    desc: 'Stand on the paper with your full weight on your foot. Hold the pen upright and trace around the outside edge of your foot.',
  },
  {
    num: '03',
    icon: <Ruler size={26} />,
    title: 'Measure the Length',
    desc: 'Draw a straight line from the tip of your longest toe to the back of your heel. Measure this length in centimetres.',
  },
  {
    num: '04',
    icon: <CheckCircle size={26} />,
    title: 'Find Your Size',
    desc: 'Match your measurement (cm) to the size chart above. If between sizes, always size up for all-day comfort.',
  },
];

const FIT_TIPS = [
  { scenario: 'Between two sizes', advice: 'Choose the smaller size. High-quality leather will naturally stretch and mold to the shape of your foot over time.' },
  { scenario: 'Wide feet', advice: 'Size up by ½ for extra room across the metatarsals.' },
  { scenario: 'Narrow feet', advice: 'Stay true to size; add a half-insole for a snug fit.' },
  { scenario: 'High arch', advice: 'Opt for Derby or Monk Strap styles, which provide more adjustability over the instep than closed-lace Oxfords.' },
  { scenario: 'One foot slightly larger', advice: 'Always fit to your larger foot. Never the other way.' },
];

const STYLE_NOTES = [
  {
    style: 'Oxfords & Derbies',
    note: 'True to size. The closed lacing gives a secure fit — no need to size up.',
  },
  {
    style: 'Loafers',
    note: 'Stay true to size or size down half a size. A snug initial fit prevents heel slippage as the leather softens.',
  },
  {
    style: 'Monk Straps',
    note: 'True to size. Strap adjustment allows fine-tuning for width.',
  },
  {
    style: 'Chelsea & Desert Boots',
    note: 'True to size. Elastic gusset accommodates varying instep heights.',
  },
  {
    style: 'Jutis & Mojaris',
    note: 'Size up by one full size. Traditional constructions run narrow.',
  },
];

export default function SizeGuidePage() {
  const [tab, setTab] = useState('men');
  const table = tab === 'women' ? SIZE_TABLE_WOMEN : SIZE_TABLE_MEN;

  return (
    <main className="sg-page" data-testid="size-guide-page">

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="sg-hero">
        <div className="sg-hero-content">
          <div className="breadcrumbs" style={{ marginBottom: '24px' }}>
            <Link href="/">Home</Link>
            <ChevronRight size={14} />
            <span>Size Guide</span>
          </div>
          <div className="section-label" style={{ color: 'var(--accent)' }}>FIND YOUR PERFECT FIT</div>
          <h1 className="sg-hero-title">
            Size Guide
          </h1>
          <p className="sg-hero-sub">
            Cobblyn uses UK sizing as standard. Use this guide to find your perfect fit across
            all international sizing systems — and learn how to measure your feet at home.
          </p>
        </div>
        <div className="sg-hero-visual">
          <Ruler size={160} strokeWidth={0.6} color="var(--accent)" style={{ opacity: 0.15 }} />
        </div>
      </section>

      {/* ── SIZE CHART ─────────────────────────────── */}
      <section className="sg-chart-section section">
        <div className="sg-chart-inner">
          <div className="sg-section-header">
            <div>
              <div className="section-label">CONVERSION CHART</div>
              <h2 className="section-title" style={{ textAlign: 'left' }}>International Size Chart</h2>
            </div>
            <div className="sg-tabs">
              <button
                className={`sg-tab ${tab === 'men' ? 'active' : ''}`}
                onClick={() => setTab('men')}
                data-testid="sg-tab-men"
              >
                Men
              </button>
              <button
                className={`sg-tab ${tab === 'women' ? 'active' : ''}`}
                onClick={() => setTab('women')}
                data-testid="sg-tab-women"
              >
                Women
              </button>
            </div>
          </div>

          <div className="sg-table-wrapper">
            <table className="sg-table" data-testid="sg-conversion-table">
              <thead>
                <tr>
                  <th>UK <span>(Cobblyn Default)</span></th>
                  <th>US</th>
                  <th>EU</th>
                  <th>India</th>
                  <th>Foot Length (cm)</th>
                </tr>
              </thead>
              <tbody>
                {table.map((row) => (
                  <tr key={row.uk}>
                    <td className="sg-uk-size">{row.uk}</td>
                    <td>{row.us}</td>
                    <td>{row.eu}</td>
                    <td>{row.ind}</td>
                    <td>{row.cm} cm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sg-chart-note">
            <Info size={14} />
            <span>All Cobblyn products are labelled in UK sizes. When in doubt, measure your foot (see below).</span>
          </div>
        </div>
      </section>

      {/* ── HOW TO MEASURE ─────────────────────────── */}
      <section className="sg-measure-section" style={{ background: 'var(--black)' }}>
        <div className="section" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div className="section-label" style={{ color: 'var(--accent)' }}>AT HOME</div>
            <h2 className="section-title" style={{ color: 'var(--white)' }}>How to Measure Your Foot</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', maxWidth: '520px', margin: '0 auto', fontSize: '0.88rem', lineHeight: '1.85' }}>
              Always measure both feet — use the larger measurement.
            </p>
          </div>
          <div className="shipping-cards-grid" style={{ marginTop: '48px' }}>
            {HOW_TO_STEPS.map((step) => (
              <div key={step.num} className="shipping-card shipping-card-highlight" style={{ cursor: 'default' }}>
                <div className="shipping-card-icon">{step.icon}</div>
                <h3 className="shipping-card-title">{step.title}</h3>
                <div className="shipping-card-detail">Step {step.num}</div>
                <div className="shipping-card-note">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FIT TIPS ───────────────────────────────── */}
      <section className="sg-tips-section section">
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div className="section-label">BUYING ADVICE</div>
            <h2 className="section-title">Fit Recommendations</h2>
          </div>
          <div className="sg-tips-grid">
            {FIT_TIPS.map((tip, i) => (
              <div key={i} className="sg-tip-card group hover:bg-[#2A2826] transition-colors duration-300 cursor-default">
                <div className="sg-tip-scenario group-hover:text-white transition-colors duration-300">{tip.scenario}</div>
                <div className="sg-tip-advice group-hover:text-white/80 transition-colors duration-300">{tip.advice}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STYLE-SPECIFIC NOTES ───────────────────── */}
      <section style={{ background: 'var(--off-white)', padding: '80px 72px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div className="section-label">BY STYLE</div>
            <h2 className="section-title">Style-Specific Sizing Notes</h2>
            <p style={{ color: 'var(--mid-grey)', fontSize: '0.88rem', lineHeight: '1.85', maxWidth: '480px', margin: '0 auto' }}>
              Different shoe constructions fit differently. Here are our recommendations by style.
            </p>
          </div>
          <div className="sg-style-grid">
            {STYLE_NOTES.map((item, i) => (
              <div key={i} className="sg-style-card">
                <div className="sg-style-name">{item.style}</div>
                <div className="sg-style-note">{item.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STILL UNSURE CTA ───────────────────────── */}
      <section className="sg-cta-band">
        <div className="sg-cta-inner">
          <div>
            <h2 className="sg-cta-title">Still Unsure About Your Size?</h2>
            <p className="sg-cta-sub">
              Book a bespoke visit — our master artisan measures your feet at home, perfectly.
            </p>
          </div>
          <div className="sg-cta-actions">
            <Link href="/bespoke" className="btn-hero-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#9d2706', color: '#ffffff', border: 'none' }}>
              Book a Home Visit <ArrowRight size={14} />
            </Link>
            <Link href="/contact" className="btn-hero-ghost" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fff', color: '#fff', backgroundColor: 'transparent', padding: '0 24px' }}>
              Contact Us
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
