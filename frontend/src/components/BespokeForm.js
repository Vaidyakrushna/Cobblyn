"use client";
import React, { useState } from 'react';
import { CalendarDays, MapPin, Ruler, Package2 } from 'lucide-react';
import { api } from '../api';

const styleOptions = ['Oxford', 'Loafer', 'Monk Strap', 'Derby', 'Wing Tip', 'Desert Boot', 'Jutis', 'Mojaris', 'Mule', 'Boat'];
const materialOptions = ['Full-Grain Leather', 'Suede', 'Nubuck', 'Patent Leather', 'Italian Calfskin', 'Shell Cordovan', 'Silk Brocade'];

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  firstName: '', lastName: '', email: '', contactNumber: '',
  visitDate: '', style: '', material: '', materialType: '',
  visitFor: '', pinCode: '', notes: ''
};

const ScheduleVisitForm = () => {
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

  // Today + 1 as min for visit date
  const minDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return (
    <section id="bespoke" data-testid="schedule-visit-section">
      <div className="bespoke-layout">
        <div className="bespoke-info">
          <div className="section-label">SCHEDULE A VISIT</div>
          <h2 className="section-title">Our Artisan, At Your Doorstep.</h2>
          <p className="bespoke-desc">
            Skip the showroom. Our trained craftsman visits you at your home or office,
            takes precise foot measurements, walks you through fabric & leather samples,
            and finalises your order — all offline, all unhurried.
          </p>

          <div className="bespoke-steps">
            <div className="bspk-step">
              <div className="bspk-num">01</div>
              <div>
                <div className="bspk-title"><CalendarDays size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Schedule</div>
                <div className="bspk-desc">Pick a convenient date and share your address. Our team confirms within a few hours.</div>
              </div>
            </div>
            <div className="bspk-step">
              <div className="bspk-num">02</div>
              <div>
                <div className="bspk-title"><MapPin size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Visit</div>
                <div className="bspk-desc">A worker visits you with material swatches, sample shoes, and the style catalogue.</div>
              </div>
            </div>
            <div className="bspk-step">
              <div className="bspk-num">03</div>
              <div>
                <div className="bspk-title"><Ruler size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Measure & Order</div>
                <div className="bspk-desc">We take precise foot measurements, finalise design details, and lock the order offline.</div>
              </div>
            </div>
            <div className="bspk-step">
              <div className="bspk-num">04</div>
              <div>
                <div className="bspk-title"><Package2 size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Handcrafted & Delivered</div>
                <div className="bspk-desc">Master cobblers handcraft your pair in 15-20 days. Shipped free, in the signature Cobblyn box.</div>
              </div>
            </div>
          </div>
        </div>

        {submitted ? (
          <div className="bespoke-form" data-testid="visit-success" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: 480 }}>
            <div style={{ fontSize: 56, color: '#9d2706', marginBottom: 16 }}>✓</div>
            <h3 className="form-title">Visit Scheduled</h3>
            <p className="bespoke-desc" style={{ marginTop: 16, marginBottom: 24 }}>
              Thank you. Our representative will call you within 24 hours to confirm
              the date, time, and your address.
            </p>
            {!isAuthenticated && (
              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '24px', borderRadius: '8px', marginBottom: '24px', width: '100%' }}>
                <h4 style={{ fontSize: '15px', color: '#111827', marginBottom: '8px', fontWeight: 600 }}>Track Your Visit</h4>
                <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#4B5563', lineHeight: 1.5 }}>
                  Sign up now to easily track this visit and view your complete visit schedule directly from your account dashboard.
                </p>
                <Link href="/login" className="btn-submit" data-testid="visit-signup-prompt" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 'auto', padding: '10px 24px', background: '#1a1a1a', color: '#fff', textDecoration: 'none', borderRadius: '4px' }}>
                  Sign Up / Log In
                </Link>
              </div>
            )}
            <button type="button" className="btn-submit" onClick={() => setSubmitted(false)} data-testid="visit-schedule-another" style={{ background: isAuthenticated ? '#1a1a1a' : 'transparent', color: isAuthenticated ? '#fff' : '#1a1a1a', border: isAuthenticated ? 'none' : '1px solid #1a1a1a' }}>
              Schedule Another Visit
            </button>
          </div>
        ) : (
          <form className="bespoke-form" onSubmit={handleSubmit} data-testid="schedule-visit-form">
            <h3 className="form-title">Schedule Your Visit</h3>

            <div className="frow">
              <div className="fg">
                <label className="flabel">First Name <span style={{ color: '#EF4444' }}>*</span></label>
                <input type="text" className="finput" placeholder="Arjun" value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)} required data-testid="visit-first-name" />
              </div>
              <div className="fg">
                <label className="flabel">Last Name <span style={{ color: '#EF4444' }}>*</span></label>
                <input type="text" className="finput" placeholder="Mehta" value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)} required data-testid="visit-last-name" />
              </div>
            </div>

            <div className="frow" style={{ marginTop: 24 }}>
              <div className="fg">
                <label className="flabel">Email Address <span style={{ color: '#EF4444' }}>*</span></label>
                <input type="email" className="finput" placeholder="arjun@example.com" value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)} required data-testid="visit-email" />
              </div>
              <div className="fg">
                <label className="flabel">Contact Number <span style={{ color: '#EF4444' }}>*</span></label>
                <input type="tel" className="finput" placeholder="+91 98765 43210" value={formData.contactNumber}
                  onChange={(e) => handleChange('contactNumber', e.target.value)} required data-testid="visit-contact" />
              </div>
            </div>

            <div className="fg" style={{ marginTop: 24 }}>
              <label className="flabel">Visit Date <span style={{ color: '#EF4444' }}>*</span></label>
              <input type="date" className="finput" value={formData.visitDate} min={minDate}
                onChange={(e) => handleChange('visitDate', e.target.value)} required data-testid="visit-date" />
            </div>

            <div className="fg" style={{ marginTop: 24 }}>
              <label className="flabel">Choose Style</label>
              <div className="style-chips" data-testid="visit-style-chips">
                {styleOptions.map(s => (
                  <button key={s} type="button"
                    className={`style-chip ${formData.style === s ? 'active' : ''}`}
                    onClick={() => handleChange('style', s)}
                    data-testid={`visit-style-${s.toLowerCase().replace(/\s/g, '-')}`}
                  >{s}</button>
                ))}
              </div>
            </div>

            <div className="frow" style={{ marginTop: 24 }}>
              <div className="fg">
                <label className="flabel">Material</label>
                <select className="fselect" value={formData.material}
                  onChange={(e) => handleChange('material', e.target.value)} data-testid="visit-material">
                  <option value="">Select material</option>
                  {materialOptions.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="fg">
                <label className="flabel">Material Type</label>
                <select className="fselect" value={formData.materialType}
                  onChange={(e) => handleChange('materialType', e.target.value)} data-testid="visit-material-type">
                  <option value="">Select type</option>
                  <option value="Premium">Premium</option>
                  <option value="Semi Premium">Semi Premium</option>
                </select>
              </div>
            </div>

            <div className="frow" style={{ marginTop: 24 }}>
              <div className="fg">
                <label className="flabel">For</label>
                <select className="fselect" value={formData.visitFor}
                  onChange={(e) => handleChange('visitFor', e.target.value)} data-testid="visit-for">
                  <option value="">Select</option>
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                </select>
              </div>
              <div className="fg">
                <label className="flabel">PIN Code <span style={{ color: '#EF4444' }}>*</span></label>
                <input type="text" inputMode="numeric" pattern="[0-9]{4,10}" className="finput" placeholder="400001"
                  value={formData.pinCode} onChange={(e) => handleChange('pinCode', e.target.value)} required data-testid="visit-pin" />
              </div>
            </div>

            <div className="fg" style={{ marginTop: 24 }}>
              <label className="flabel">Notes (optional)</label>
              <textarea className="ftextarea" rows="3" placeholder="Preferred time of visit, special requirements..."
                value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} data-testid="visit-notes" />
            </div>

            {error && <div className="form-error" data-testid="visit-error" style={{ color: '#EF4444', marginTop: 16 }}>{error}</div>}

            <button type="submit" className="btn-submit" disabled={submitting} data-testid="visit-submit-btn" style={{ marginTop: 24 }}>
              {submitting ? 'Scheduling…' : 'Schedule My Visit'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

export default ScheduleVisitForm;
