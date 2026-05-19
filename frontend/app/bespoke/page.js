"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, CalendarDays, MapPin, Ruler, Package2, Sparkles, Shield, Clock, Phone } from 'lucide-react';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/api';

const styleOptions = ['Oxford', 'Loafer', 'Monk Strap', 'Derby', 'Wing Tip', 'Desert Boot', 'Jutis', 'Mojaris', 'Mule', 'Boat'];
const materialOptions = ['Full-Grain Leather', 'Suede', 'Nubuck', 'Patent Leather', 'Italian Calfskin', 'Shell Cordovan', 'Silk Brocade'];

const initialForm = {
  firstName: '', lastName: '', email: '', contactNumber: '',
  visitDate: '', style: '', material: '', materialType: '',
  visitFor: '', pinCode: '', notes: ''
};

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
      {/* Hero Banner */}
      <div className="bespoke-hero">
        <div className="bespoke-hero-overlay" />
        <div className="bespoke-hero-content">
          <div className="bespoke-hero-breadcrumbs">
            <Link href="/">Home</Link>
            <ChevronRight size={14} />
            <span>Bespoke Experience</span>
          </div>
          <div className="bespoke-hero-label">THE BESPOKE EXPERIENCE</div>
          <h1 className="bespoke-hero-title">Your Shoes,<br />Crafted At Your<br />Doorstep</h1>
          <p className="bespoke-hero-sub">
            No showroom. No compromise. Our master artisan visits you personally — 
            with swatches, samples, and decades of craftsmanship.
          </p>
        </div>
      </div>

      {/* Trust Bar */}
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

      {/* How It Works */}
      <div className="bespoke-how-it-works">
        <div className="bespoke-section-label">HOW IT WORKS</div>
        <h2 className="bespoke-section-title">Four Simple Steps to Your Dream Pair</h2>
        <div className="bespoke-steps-grid">
          <div className="bespoke-step-card">
            <div className="bespoke-step-number">01</div>
            <div className="bespoke-step-icon"><CalendarDays size={28} /></div>
            <h3>Schedule</h3>
            <p>Pick a convenient date and share your address. Our team confirms within a few hours.</p>
          </div>
          <div className="bespoke-step-card">
            <div className="bespoke-step-number">02</div>
            <div className="bespoke-step-icon"><MapPin size={28} /></div>
            <h3>Visit</h3>
            <p>A trained artisan visits you with material swatches, sample shoes, and the complete style catalogue.</p>
          </div>
          <div className="bespoke-step-card">
            <div className="bespoke-step-number">03</div>
            <div className="bespoke-step-icon"><Ruler size={28} /></div>
            <h3>Measure &amp; Order</h3>
            <p>We take precise foot measurements, finalise design details, and lock the order — all offline.</p>
          </div>
          <div className="bespoke-step-card">
            <div className="bespoke-step-number">04</div>
            <div className="bespoke-step-icon"><Package2 size={28} /></div>
            <h3>Handcrafted &amp; Delivered</h3>
            <p>Master cobblers handcraft your pair in 15–20 days. Shipped free, in the signature BYOND box.</p>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="bespoke-form-section" id="bespoke-form">
        <div className="bespoke-form-wrapper">
          <div className="bespoke-form-left">
            <div className="bespoke-section-label">SCHEDULE A VISIT</div>
            <h2 className="bespoke-section-title" style={{ textAlign: 'left' }}>Ready to Begin<br />Your Journey?</h2>
            <p className="bespoke-form-intro">
              Fill out the form and our team will reach out within 24 hours to confirm your visit. 
              No obligations — just the first step towards your perfect pair.
            </p>
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
                    <Link href="/login" className="bespoke-btn-signup" data-testid="visit-signup-prompt">Sign Up / Log In</Link>
                  </div>
                )}
                <button type="button" className="bespoke-btn-another" onClick={() => setSubmitted(false)} data-testid="visit-schedule-another">
                  Schedule Another Visit
                </button>
              </div>
            ) : (
              <form className="bespoke-form-card" onSubmit={handleSubmit} data-testid="schedule-visit-form">
                <h3 className="bespoke-form-card-title">Schedule Your Visit</h3>

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
                  <textarea rows="3" placeholder="Preferred time, special requirements..."
                    value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} data-testid="visit-notes" />
                </div>

                {error && <div className="bespoke-error" data-testid="visit-error">{error}</div>}

                <button type="submit" className="bespoke-submit-btn" disabled={submitting} data-testid="visit-submit-btn">
                  {submitting ? 'Scheduling…' : 'Schedule My Visit'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}