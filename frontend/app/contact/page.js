"use client";
import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Instagram, Facebook, Twitter, Linkedin, ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'What is your standard delivery time?',
    a: 'Ready-to-ship orders are delivered within 5–7 business days. Bespoke and customised orders take 15–20 days to craft before dispatch.',
  },
  {
    q: 'Can I visit the studio?',
    a: 'Yes — our studio is open by appointment. You can book a visit through this page or call us directly. We\'d love to show you the craft in person.',
  },
  {
    q: 'Do you offer alterations or repairs?',
    a: 'Absolutely. We believe in the longevity of our shoes and offer a full restoration and repair service. Contact us with your requirements.',
  },
  {
    q: 'How do I know my size for a bespoke order?',
    a: 'We provide a comprehensive size guide and measurement template. For bespoke orders, we arrange a dedicated fitting consultation — in-studio or via video call.',
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: 'General Enquiry', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <main className="contact-page">
      {/* HERO */}
      <section className="contact-hero">
        <div className="contact-hero-content">
          <div className="section-label">GET IN TOUCH</div>
          <h1 className="contact-hero-title">How Can We<br /><em>Help You?</em></h1>
          <p className="contact-hero-sub">
            Whether you have a question about an order, want to commission a bespoke pair, 
            or simply wish to talk craft — we are here and we are listening.
          </p>
        </div>
      </section>

      {/* QUICK HELP CARDS */}
      <section className="contact-help-cards section">
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div className="section-label">QUICK HELP</div>
          <h2 className="section-title" style={{ marginBottom: '8px' }}>Find What You Need</h2>
        </div>
        <div className="contact-cards-grid">
          {[
            { icon: '📦', title: 'Order Status', desc: 'Track your order or look up a past purchase.', link: '/account', cta: 'Track Order' },
            { icon: '📏', title: 'Size Guide', desc: 'Find your perfect fit with our detailed size chart.', link: '/size-guide', cta: 'View Guide' },
            { icon: '🔄', title: 'Returns & Exchange', desc: 'Hassle-free returns within 7 days of delivery.', link: '/returns', cta: 'Learn More' },
            { icon: '✂️', title: 'Bespoke & Custom', desc: 'Commission a pair that\'s uniquely yours.', link: '/bespoke', cta: 'Start Now' },
            { icon: '🚚', title: 'Shipping Info', desc: 'Everything you need to know about delivery.', link: '/shipping', cta: 'View Policy' },
            { icon: '👟', title: 'Shoe Care', desc: 'Keep your Cobblyn shoes looking their finest.', link: '/care', cta: 'Learn More' },
          ].map((card, i) => (
            <a key={i} href={card.link} className="contact-help-card">
              <div className="contact-help-card-icon">{card.icon}</div>
              <h3 className="contact-help-card-title">{card.title}</h3>
              <p className="contact-help-card-desc">{card.desc}</p>
              <span className="contact-help-card-cta">{card.cta} →</span>
            </a>
          ))}
        </div>
      </section>

      {/* CONTACT CHANNELS + FORM */}
      <section className="contact-main-section" style={{ background: 'var(--off-white)' }}>
        <div className="section contact-main-inner">
          {/* Channels */}
          <div className="contact-channels">
            <div className="section-label">REACH US</div>
            <h2 className="section-title">Need More Help?</h2>
            <p style={{ color: 'var(--mid-grey)', fontSize: '0.88rem', marginBottom: '40px', lineHeight: '1.85' }}>
              Get in touch with us and we'll be more than happy to guide you through.
            </p>

            <div className="contact-channel-list">
              <div className="contact-channel-item">
                <div className="contact-channel-icon"><Mail size={20} /></div>
                <div>
                  <div className="contact-channel-label">Email</div>
                  <a href="mailto:hello@cobblynshoes.com" className="contact-channel-value">hello@cobblynshoes.com</a>
                  <div className="contact-channel-note">We reply within 24 hours, Monday–Saturday</div>
                </div>
              </div>
              <div className="contact-channel-item">
                <div className="contact-channel-icon"><Phone size={20} /></div>
                <div>
                  <div className="contact-channel-label">Phone</div>
                  <a href="tel:+918001234567" className="contact-channel-value">+91 800 123 4567</a>
                  <div className="contact-channel-note">Monday to Saturday, 10 AM – 6 PM IST</div>
                </div>
              </div>
              <div className="contact-channel-item">
                <div className="contact-channel-icon"><MapPin size={20} /></div>
                <div>
                  <div className="contact-channel-label">Studio Address</div>
                  <div className="contact-channel-value" style={{ color: 'var(--black)', cursor: 'default' }}>
                    Cobblyn Atelier<br />
                    12, Craft Lane, Johari Bazaar<br />
                    Jaipur, Rajasthan — 302003
                  </div>
                  <div className="contact-channel-note">Open by appointment only</div>
                </div>
              </div>
              <div className="contact-channel-item">
                <div className="contact-channel-icon"><Clock size={20} /></div>
                <div>
                  <div className="contact-channel-label">Studio Hours</div>
                  <div className="contact-channel-value" style={{ color: 'var(--black)', cursor: 'default' }}>
                    Mon–Sat: 10:00 AM – 6:00 PM
                  </div>
                  <div className="contact-channel-note">Closed on Sundays and public holidays</div>
                </div>
              </div>
            </div>

            <div className="contact-social-row">
              <div className="contact-channel-label" style={{ marginBottom: '16px' }}>Follow Us</div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {[
                  { icon: <Instagram size={18} />, href: 'https://instagram.com', label: 'Instagram' },
                  { icon: <Facebook size={18} />, href: 'https://facebook.com', label: 'Facebook' },
                  { icon: <Twitter size={18} />, href: 'https://twitter.com', label: 'Twitter' },
                  { icon: <Linkedin size={18} />, href: 'https://linkedin.com', label: 'LinkedIn' },
                ].map((s, i) => (
                  <a key={i} href={s.href} className="social-btn" aria-label={s.label}>{s.icon}</a>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="contact-form-wrap">
            <h3 className="contact-form-title">Send Us a Message</h3>
            {submitted ? (
              <div className="contact-success">
                <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>✓</div>
                <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', marginBottom: '8px' }}>Message Received</h4>
                <p style={{ color: 'var(--mid-grey)', fontSize: '0.88rem' }}>
                  Thank you for reaching out. One of our team members will be in touch within 24 hours.
                </p>
                <button onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', phone: '', subject: 'General Enquiry', message: '' }); }} className="btn-hero-primary" style={{ marginTop: '24px' }}>
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form" id="contact-form">
                <div className="contact-form-row">
                  <div className="contact-field">
                    <label htmlFor="contact-name">Full Name *</label>
                    <input id="contact-name" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your full name" required />
                  </div>
                  <div className="contact-field">
                    <label htmlFor="contact-email">Email Address *</label>
                    <input id="contact-email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="your@email.com" required />
                  </div>
                </div>
                <div className="contact-form-row">
                  <div className="contact-field">
                    <label htmlFor="contact-phone">Phone Number</label>
                    <input id="contact-phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 00000 00000" />
                  </div>
                  <div className="contact-field">
                    <label htmlFor="contact-subject">Subject</label>
                    <select id="contact-subject" name="subject" value={formData.subject} onChange={handleChange}>
                      <option>General Enquiry</option>
                      <option>Order Support</option>
                      <option>Bespoke Commission</option>
                      <option>Studio Visit</option>
                      <option>Returns & Exchange</option>
                      <option>Wholesale & Partnership</option>
                    </select>
                  </div>
                </div>
                <div className="contact-field">
                  <label htmlFor="contact-message">Message *</label>
                  <textarea id="contact-message" name="message" value={formData.message} onChange={handleChange} placeholder="Tell us how we can help..." rows={5} required />
                </div>
                <button type="submit" className="btn-hero-primary" style={{ width: '100%' }}>
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="contact-faq section">
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div className="section-label">FAQ</div>
            <h2 className="section-title">Common Questions</h2>
          </div>
          <div className="contact-faq-list">
            {faqs.map((faq, i) => (
              <div key={i} className={`contact-faq-item ${openFaq === i ? 'open' : ''}`}>
                <button className="contact-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i}>
                  <span>{faq.q}</span>
                  <ChevronDown size={18} className="contact-faq-chevron" />
                </button>
                <div className="contact-faq-a">
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
