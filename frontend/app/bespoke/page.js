"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight, CalendarDays, MapPin, Ruler, Package2,
  Sparkles, Shield, Clock, Phone, Star, Quote, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/api';

const styleOptions = ['Oxford', 'Loafer', 'Monk Strap', 'Derby', 'Wing Tip', 'Desert Boot', 'Jutis', 'Mojaris', 'Mule', 'Boat'];
const materialOptions = ['Full-Grain Leather', 'Suede', 'Nubuck', 'Patent Leather', 'Italian Calfskin', 'Shell Cordovan', 'Silk Brocade'];

const initialForm = {
  firstName: '', lastName: '', email: '', contactNumber: '',
  visitDate: '', style: '', material: '', materialType: '',
  visitFor: '', pinCode: '', notes: ''
};

const TESTIMONIALS = [
  {
    name: 'Rohan Mehta',
    city: 'Mumbai',
    rating: 5,
    text: 'The artisan arrived exactly on time. Within an hour we had chosen leather, style, and measurements. My Oxfords arrived in 18 days — perfect fit, first try.',
  },
  {
    name: 'Ananya Kapoor',
    city: 'Delhi',
    rating: 5,
    text: 'I was gifted a Cobblyn bespoke visit for my birthday. It was genuinely one of the most luxurious experiences I\'ve had. The Jutis are extraordinary.',
  },
  {
    name: 'Vikram Singhania',
    city: 'Bengaluru',
    rating: 5,
    text: 'Three bespoke pairs in two years. The quality keeps improving. Heirloom-grade shoes at an honest price — nothing else like it in India.',
  },
];

const PROCESS_STEPS = [
  {
    num: '01',
    icon: <CalendarDays size={32} />,
    title: 'You Schedule',
    sub: '5 minutes',
    desc: 'Fill out the form below. Pick a date that suits you — weekdays or weekends. Our team confirms within a few hours.',
  },
  {
    num: '02',
    icon: <MapPin size={32} />,
    title: 'We Come to You',
    sub: 'At your home or office',
    desc: 'A trained Cobblyn artisan visits with a full swatch library, sample shoes in every major style, and all necessary tools.',
  },
  {
    num: '03',
    icon: <Ruler size={32} />,
    title: 'Design & Measure',
    sub: '60–90 minutes',
    desc: 'We take 12 precise measurements of each foot. You select leather, lining, sole, colour, and every detail — guided by our expert.',
  },
  {
    num: '04',
    icon: <Package2 size={32} />,
    title: 'Handcrafted & Delivered',
    sub: '15–20 working days',
    desc: 'Master cobblers handcraft your pair in our Jaipur atelier. Shipped free in the signature Cobblyn box, directly to your door.',
  },
];

export default function BespokePage() {
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.scheduleVisit({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        contact_number: formData.contactNumber,
        visit_date: formData.visitDate,
        style: formData.style,
        material: formData.material,
        material_type: formData.materialType,
        visit_for: formData.visitFor,
        pin_code: formData.pinCode,
        notes: formData.notes,
      });
      if (!isAuthenticated) {
        sessionStorage.setItem('bespoke_guest_data', JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          phone: formData.contactNumber
        }));
      }
      setSubmitted(true);
      setFormData(initialForm);
    } catch (err) {
      setError(err.message || 'Could not schedule visit. Please try again.');
    }
    setSubmitting(false);
  };

  const minDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return (
    <div className="bespoke-standalone" data-testid="bespoke-page">

      {/* ── CINEMATIC HERO ──────────────────────────────────── */}
      <section className="bespoke-hero-v2">
        <div className="bespoke-hero-v2-bg">
          <img
            src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&q=85&fit=crop"
            alt="Cobblyn Bespoke"
          />
          <div className="bespoke-hero-v2-overlay" />
        </div>
        <div className="bespoke-hero-v2-content">
          <div className="breadcrumbs bespoke-breadcrumbs">
            <Link href="/">Home</Link>
            <ChevronRight size={14} />
            <span>Bespoke Experience</span>
          </div>
          <div className="section-label" style={{ color: 'var(--accent)', marginBottom: '20px' }}>THE BESPOKE EXPERIENCE</div>
          <h1 className="bespoke-hero-v2-title">
            Your Shoes,<br />
            <em>Crafted at Your</em><br />
            Doorstep
          </h1>
          <p className="bespoke-hero-v2-sub">
            No showroom. No compromise. Our master artisan visits you personally —
            with swatches, samples, and decades of craftsmanship in hand.
          </p>
          <div className="bespoke-hero-v2-actions">
            <a href="#bespoke-form" className="btn-hero-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Schedule My Visit <ArrowRight size={15} />
            </a>
            <Link href="/size-guide" className="btn-hero-ghost" style={{ textDecoration: 'none' }}>
              <Ruler size={14} /> Size Guide
            </Link>
          </div>
        </div>
        {/* Floating stat cards */}
        <div className="bespoke-hero-v2-stats">
          <div className="bespoke-stat-card">
            <div className="bespoke-stat-num">500+</div>
            <div className="bespoke-stat-label">Bespoke pairs crafted</div>
          </div>
          <div className="bespoke-stat-card">
            <div className="bespoke-stat-num">15–20</div>
            <div className="bespoke-stat-label">Days to delivery</div>
          </div>
          <div className="bespoke-stat-card">
            <div className="bespoke-stat-num">12</div>
            <div className="bespoke-stat-label">Precise measurements</div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ───────────────────────────────────────── */}
      <div className="bespoke-trust-bar">
        <div className="bespoke-trust-item">
          <Sparkles size={20} />
          <span>Handcrafted to Perfection</span>
        </div>
        <div className="bespoke-trust-item">
          <Shield size={20} />
          <span>100% Genuine Leather</span>
        </div>
        <div className="bespoke-trust-item">
          <Clock size={20} />
          <span>Delivered in 15–20 Days</span>
        </div>
        <div className="bespoke-trust-item">
          <Package2 size={20} />
          <span>Free Shipping Pan-India</span>
        </div>
      </div>

      {/* ── PROCESS STEPS ───────────────────────────────────── */}
      <section className="bespoke-how-it-works">
        <div className="bespoke-section-label">HOW IT WORKS</div>
        <h2 className="bespoke-section-title">Four Steps to Your Dream Pair</h2>
        <p style={{ textAlign: 'center', color: 'var(--mid-grey)', maxWidth: '520px', margin: '0 auto 56px', fontSize: '0.88rem', lineHeight: '1.85' }}>
          From scheduling to delivery — a seamless, unhurried experience designed around you.
        </p>
        <div className="bespoke-steps-v2-grid">
          {PROCESS_STEPS.map((step, i) => (
            <div key={i} className="bespoke-step-v2-card">
              <div className="bespoke-step-v2-number">{step.num}</div>
              <div className="bespoke-step-v2-icon">{step.icon}</div>
              <h3 className="bespoke-step-v2-title">{step.title}</h3>
              <div className="bespoke-step-v2-sub">{step.sub}</div>
              <p className="bespoke-step-v2-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── MATERIALS STRIP ─────────────────────────────────── */}
      <section className="bespoke-materials-strip">
        <div className="bespoke-materials-inner">
          <div className="bespoke-materials-content">
            <div className="bespoke-section-label" style={{ textAlign: 'left', color: 'var(--accent)' }}>OUR LEATHERS</div>
            <h2 className="bespoke-section-title" style={{ textAlign: 'left', color: 'var(--white)' }}>Sourced from the World&apos;s Finest Tanneries</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: '1.85', marginBottom: '32px', maxWidth: '440px' }}>
              From Italian full-grain calf to rare shell cordovan — our artisan brings
              over 40 leather swatches, so you can feel every option before you decide.
            </p>
            <div className="bespoke-materials-tags">
              {materialOptions.map(m => (
                <span key={m} className="bespoke-material-tag">{m}</span>
              ))}
            </div>
          </div>
          <div className="bespoke-materials-img">
            <img
              src="https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=700&q=85&fit=crop"
              alt="Leather swatches"
            />
            <div className="bespoke-materials-badge">
              <Shield size={16} fill="currentColor" />
              <span>100% Genuine Leather</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────── */}
      <section className="bespoke-testimonials">
        <div className="bespoke-section-label">CLIENT STORIES</div>
        <h2 className="bespoke-section-title">What Our Bespoke Clients Say</h2>
        <div className="bespoke-testimonials-grid">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="bespoke-testimonial-card">
              <Quote size={28} className="bespoke-quote-icon" />
              <p className="bespoke-testimonial-text">{t.text}</p>
              <div className="bespoke-testimonial-footer">
                <div className="bespoke-testimonial-stars">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={12} fill="#9d2706" color="#9d2706" />
                  ))}
                </div>
                <div className="bespoke-testimonial-author">
                  <strong>{t.name}</strong>
                  <span>{t.city}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FORM SECTION ────────────────────────────────────── */}
      <div className="bespoke-form-section" id="bespoke-form">
        <div className="bespoke-form-wrapper">

          {/* Left column — context */}
          <div className="bespoke-form-left">
            <div className="bespoke-section-label" style={{ textAlign: 'left' }}>SCHEDULE A VISIT</div>
            <h2 className="bespoke-section-title" style={{ textAlign: 'left' }}>
              Ready to Begin<br />Your Journey?
            </h2>
            <p className="bespoke-form-intro">
              Fill out the form and our team will reach out within 24 hours to confirm
              your visit. No obligations — just the first step towards your perfect pair.
            </p>

            {/* What to expect */}
            <div className="bespoke-expect-list">
              {[
                'Our artisan arrives with 40+ leather swatches',
                'All major shoe styles available to try on',
                '12 precise foot measurements taken',
                'Full design customisation in one visit',
                'No payment collected until your order is confirmed',
              ].map((item, i) => (
                <div key={i} className="bespoke-expect-item">
                  <span className="bespoke-expect-tick">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="bespoke-form-contact">
              <div className="bespoke-contact-item">
                <Phone size={18} />
                <div>
                  <strong>Need help?</strong>
                  <span>+91 98765 43210</span>
                </div>
              </div>
              <div className="bespoke-contact-item">
                <MapPin size={18} />
                <div>
                  <strong>Studio</strong>
                  <span>Mumbai, Maharashtra</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right column — form card */}
          <div className="bespoke-form-right">
            {submitted ? (
              <div className="bespoke-success-card" data-testid="visit-success">
                <div className="bespoke-success-check">✓</div>
                <h3>Visit Scheduled Successfully</h3>
                <p>Thank you. Our representative will call you within 24 hours to confirm the date, time, and your address.</p>
                {!isAuthenticated && (
                  <div className="bespoke-success-signup">
                    <h4>Track Your Visit</h4>
                    <p>Sign up to easily track this visit from your account dashboard.</p>
                    <Link href="/login" className="bespoke-btn-signup" data-testid="visit-signup-prompt">
                      Sign Up / Log In
                    </Link>
                  </div>
                )}
                <button type="button" className="bespoke-btn-another" onClick={() => setSubmitted(false)} data-testid="visit-schedule-another">
                  Schedule Another Visit
                </button>
              </div>
            ) : (
              <form className="bespoke-form-card bespoke-form-card-v2" onSubmit={handleSubmit} data-testid="schedule-visit-form">
                <div className="bespoke-form-card-header">
                  <h3 className="bespoke-form-card-title">Schedule Your Visit</h3>
                  <p style={{ color: 'var(--mid-grey)', fontSize: '0.82rem', margin: 0 }}>All fields marked * are required</p>
                </div>

                <div className="bespoke-form-row">
                  <div className="bespoke-field">
                    <label>First Name <span className="req">*</span></label>
                    <input type="text" placeholder="Arjun" value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)} required data-testid="visit-first-name" />
                  </div>
                  <div className="bespoke-field">
                    <label>Last Name <span className="req">*</span></label>
                    <input type="text" placeholder="Mehta" value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)} required data-testid="visit-last-name" />
                  </div>
                </div>

                <div className="bespoke-form-row">
                  <div className="bespoke-field">
                    <label>Email Address <span className="req">*</span></label>
                    <input type="email" placeholder="arjun@example.com" value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)} required data-testid="visit-email" />
                  </div>
                  <div className="bespoke-field">
                    <label>Contact Number <span className="req">*</span></label>
                    <input type="tel" placeholder="+91 98765 43210" value={formData.contactNumber}
                      onChange={(e) => handleChange('contactNumber', e.target.value)} required data-testid="visit-contact" />
                  </div>
                </div>

                <div className="bespoke-form-row">
                  <div className="bespoke-field">
                    <label>Visit Date <span className="req">*</span></label>
                    <input type="date" value={formData.visitDate} min={minDate}
                      onChange={(e) => handleChange('visitDate', e.target.value)} required data-testid="visit-date" />
                  </div>
                  <div className="bespoke-field">
                    <label>PIN Code <span className="req">*</span></label>
                    <input type="text" inputMode="numeric" pattern="[0-9]{4,10}" placeholder="400001"
                      value={formData.pinCode} onChange={(e) => handleChange('pinCode', e.target.value)} required data-testid="visit-pin" />
                  </div>
                </div>

                <div className="bespoke-field">
                  <label>Choose Style</label>
                  <div className="bespoke-style-chips" data-testid="visit-style-chips">
                    {styleOptions.map(s => (
                      <button key={s} type="button"
                        className={`bespoke-chip ${formData.style === s ? 'active' : ''}`}
                        onClick={() => handleChange('style', formData.style === s ? '' : s)}
                        data-testid={`visit-style-${s.toLowerCase().replace(/\s/g, '-')}`}
                      >{s}</button>
                    ))}
                  </div>
                </div>

                <div className="bespoke-form-row">
                  <div className="bespoke-field">
                    <label>Material</label>
                    <select value={formData.material}
                      onChange={(e) => handleChange('material', e.target.value)} data-testid="visit-material">
                      <option value="">Select material</option>
                      {materialOptions.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="bespoke-field">
                    <label>Material Type</label>
                    <select value={formData.materialType}
                      onChange={(e) => handleChange('materialType', e.target.value)} data-testid="visit-material-type">
                      <option value="">Select type</option>
                      <option value="Premium">Premium</option>
                      <option value="Semi Premium">Semi Premium</option>
                    </select>
                  </div>
                </div>

                <div className="bespoke-field">
                  <label>For</label>
                  <div className="bespoke-gender-toggle">
                    <button type="button" className={`bespoke-gender-btn ${formData.visitFor === 'men' ? 'active' : ''}`}
                      onClick={() => handleChange('visitFor', formData.visitFor === 'men' ? '' : 'men')}>Men</button>
                    <button type="button" className={`bespoke-gender-btn ${formData.visitFor === 'women' ? 'active' : ''}`}
                      onClick={() => handleChange('visitFor', formData.visitFor === 'women' ? '' : 'women')}>Women</button>
                  </div>
                </div>

                <div className="bespoke-field">
                  <label>Notes (optional)</label>
                  <textarea rows="3" placeholder="Preferred time of day, special requirements, occasion..."
                    value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} data-testid="visit-notes" />
                </div>

                {error && <div className="bespoke-error" data-testid="visit-error">{error}</div>}

                <button type="submit" className="bespoke-submit-btn" disabled={submitting} data-testid="visit-submit-btn">
                  {submitting ? 'Scheduling…' : 'Schedule My Visit →'}
                </button>

                <p className="bespoke-form-disclaimer">
                  By submitting, you agree to be contacted by our team. Your data is never shared with third parties.
                  View our <Link href="/privacy" style={{ color: 'var(--accent)' }}>Privacy Policy</Link>.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}