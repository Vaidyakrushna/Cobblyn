"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight, ChevronDown, RotateCcw, Package, CheckCircle, XCircle,
  Clock, Truck, ArrowRight, AlertCircle, Mail, Phone
} from 'lucide-react';

const RETURN_STEPS = [
  {
    num: '01',
    icon: <Mail size={26} />,
    title: 'Initiate Request',
    desc: 'Email us at returns@cobblyn.in or call within 15 days of delivery. Share your order number and reason.',
  },
  {
    num: '02',
    icon: <Package size={26} />,
    title: 'Pack Securely',
    desc: 'Place the item back in its original dust bag and Cobblyn box. Attach the return label we email you.',
  },
  {
    num: '03',
    icon: <Truck size={26} />,
    title: 'Free Pickup',
    desc: 'We arrange a free doorstep pickup within 2 business days. No need to visit a courier office.',
  },
  {
    num: '04',
    icon: <CheckCircle size={26} />,
    title: 'Refund / Exchange',
    desc: 'Once received and inspected (48 hrs), your refund is processed or your exchange is shipped out.',
  },
];

const ELIGIBLE = [
  'Unused products in original condition',
  'Items in original packaging (box, dust bag, tissue)',
  'Products with all tags and accessories intact',
  'Requests raised within 15 days of delivery',
  'Damaged-on-arrival items (photographic proof required within 48 hrs)',
  'Wrong item received',
];

const NOT_ELIGIBLE = [
  'Worn, used, or washed items',
  'Products without original packaging',
  'Bespoke / Customized orders (unless manufacturing defect)',
  'Sale or final-clearance items marked "non-returnable"',
  'Requests raised after 15 days of delivery',
  'Items with visible signs of damage caused by misuse',
];

const EXCHANGE_INFO = [
  {
    q: 'Can I exchange for a different size?',
    a: 'Yes, it is possible. We\'ll ship the replacement once we receive and verify your return. If your new size isn\'t in stock, we will communicate accordingly.',
  },
  {
    q: 'Can I exchange for a different colour or style?',
    a: 'Yes, within the same product family. If the exchange results in a price difference, the differential is charged or refunded accordingly.',
  },
  {
    q: 'How long does an exchange take?',
    a: 'Allow 7–10 business days total: 2 for pickup, 48 hours for inspection, then 3–5 business days for delivery of the replacement pair.',
  },
  {
    q: 'Can I exchange an accessory?',
    a: 'Accessories can be exchanged within 7 days. Items must be unused and in original packaging. The Shoe Care and Lace categories can be exchanged for a different variant. Please note that unpacked socks cannot be returned or exchanged.',
  },
];

const REFUND_METHODS = [
  { method: 'Original Payment Method', timeline: '5–7 business days', note: 'Credit/debit card, net banking, UPI' },
  { method: 'Store Credit (Cobblyn Wallet)', timeline: 'Instant on approval', note: 'Extra 5% bonus credited' },
  { method: 'Bank Transfer (NEFT)', timeline: '3–5 business days', note: 'For COD orders' },
];

const FAQS = [
  {
    q: 'Do I have to pay for return shipping?',
    a: 'No. We provide free doorstep pickup for all returns and exchanges anywhere in India. You will never be charged for return shipping.',
  },
  {
    q: 'What if I received a damaged item?',
    a: 'Photograph the outer packaging and the product immediately and email returns@cobblyn.in within 48 hours of delivery. We will arrange a replacement or issue a refund upon verification.',
  },
  {
    q: 'How will I know my return has been received?',
    a: 'You\'ll receive an email confirmation the moment our warehouse team accepts your return. A second email is sent once the inspection is complete (within 48 hours of arrival).',
  },
  {
    q: 'Can I return a gifted item?',
    a: 'Yes. Contact us with the original order number (from the gifter) and your preferred outcome (exchange or store credit). We can credit a Cobblyn Wallet to your account.',
  },
  {
    q: 'What happens if my return is rejected?',
    a: 'If an item doesn\'t meet our return criteria, we\'ll explain why in detail and return the item to you free of charge. We aim to be transparent at every step.',
  },
  {
    q: 'Can you pick up the return from a different address?',
    a: 'No. For security and logistics reasons, return orders can only be picked up from the original delivery address used during ordering.',
  },
];

export default function ReturnsPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [openExchange, setOpenExchange] = useState(null);

  return (
    <main className="ret-page" data-testid="returns-page">

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="ret-hero">
        <div className="ret-hero-content">
          <div className="breadcrumbs" style={{ marginBottom: '24px' }}>
            <Link href="/">Home</Link>
            <ChevronRight size={14} />
            <span>Returns & Exchange</span>
          </div>
          <div className="section-label" style={{ color: 'var(--accent)' }}>HASSLE-FREE</div>
          <h1 className="ret-hero-title">
            Returns &<br />
            <em>Exchange Policy</em>
          </h1>
          <p className="ret-hero-sub">
            We stand behind every pair we make. If something isn&apos;t right —
            size, fit, or condition — we&apos;ll make it right. Free pickup. No drama.
          </p>
          <div className="ret-hero-badges">
            <div className="ret-badge"><Clock size={16} /><span>15-Day Window</span></div>
            <div className="ret-badge"><Truck size={16} /><span>Free Pickup</span></div>
            <div className="ret-badge"><RotateCcw size={16} /><span>Easy Exchange</span></div>
          </div>
        </div>
        <div className="ret-hero-visual">
          <RotateCcw size={160} strokeWidth={0.6} color="var(--accent)" style={{ opacity: 0.12 }} />
        </div>
      </section>

      {/* ── PROCESS STEPS ──────────────────────────── */}
      <section className="ret-steps-section section">
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div className="section-label">THE PROCESS</div>
          <h2 className="section-title">How Returns Work</h2>
          <p style={{ color: 'var(--mid-grey)', maxWidth: '480px', margin: '0 auto', fontSize: '0.88rem', lineHeight: '1.85' }}>
            Four simple steps — and you never have to leave your home.
          </p>
        </div>
        <div className="shipping-cards-grid" style={{ marginTop: '48px' }}>
          {RETURN_STEPS.map((step, i) => (
            <div key={i} className="shipping-card">
              <div className="shipping-card-icon">{step.icon}</div>
              <h3 className="shipping-card-title">{step.title}</h3>
              <div className="shipping-card-detail">Step {step.num}</div>
              <div className="shipping-card-note">{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ELIGIBILITY ────────────────────────────── */}
      <section className="ret-eligibility-section" style={{ background: 'var(--off-white)' }}>
        <div className="section" style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div className="section-label">ELIGIBILITY</div>
            <h2 className="section-title">What Can Be Returned?</h2>
          </div>
          <div className="ret-eligibility-grid">
            <div className="ret-elig-col">
              <div className="ret-elig-header ret-elig-yes">
                <CheckCircle size={20} />
                <span>Eligible for Return</span>
              </div>
              <ul className="ret-elig-list">
                {ELIGIBLE.map((item, i) => (
                  <li key={i}><CheckCircle size={14} className="ret-elig-icon-yes" />{item}</li>
                ))}
              </ul>
            </div>
            <div className="ret-elig-col">
              <div className="ret-elig-header ret-elig-no">
                <XCircle size={20} />
                <span>Not Eligible for Return and Exchange</span>
              </div>
              <ul className="ret-elig-list">
                {NOT_ELIGIBLE.map((item, i) => (
                  <li key={i}><XCircle size={14} className="ret-elig-icon-no" />{item}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="ret-elig-note">
            <AlertCircle size={16} />
            <p>Customized / bespoke orders are made to your exact specifications and cannot be returned unless there is a manufacturing defect.</p>
          </div>
          <div className="ret-elig-note" style={{ marginTop: '16px' }}>
            <AlertCircle size={16} />
            <p>For Ready-to-Ship products, you must share 4-5 photos to validate the item's condition. Once our internal team reviews and approves the photos, the return order will be accepted and picked up.</p>
          </div>
        </div>
      </section>

      {/* ── EXCHANGE ───────────────────────────────── */}
      <section className="ret-exchange-section section">
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div className="section-label">EXCHANGES</div>
            <h2 className="section-title">Exchange Details</h2>
          </div>
          <div className="ret-exchange-list">
            {EXCHANGE_INFO.map((item, i) => (
              <div key={i} className="ret-exchange-item">
                <button
                  className="ret-exchange-q"
                  onClick={() => setOpenExchange(openExchange === i ? null : i)}
                  data-testid={`exchange-q-${i}`}
                >
                  <span>{item.q}</span>
                  <ChevronDown size={18} style={{ transform: openExchange === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                {openExchange === i && (
                  <div className="ret-exchange-a" data-testid={`exchange-a-${i}`}>{item.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REFUND METHODS ─────────────────────────── */}
      <section style={{ background: 'var(--black)', padding: '80px 72px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div className="section-label" style={{ color: 'var(--accent)' }}>REFUNDS</div>
            <h2 className="section-title" style={{ color: 'var(--white)' }}>Refund Methods & Timelines</h2>
          </div>
          <div className="ret-refund-table-wrap">
            <table className="ret-refund-table">
              <thead>
                <tr>
                  <th>Refund Method</th>
                  <th>Timeline</th>
                  <th>Applicable To</th>
                </tr>
              </thead>
              <tbody>
                {REFUND_METHODS.map((row, i) => (
                  <tr key={i}>
                    <td className="ret-refund-method">{row.method}</td>
                    <td className="ret-refund-timeline">{row.timeline}</td>
                    <td>{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem', textAlign: 'center', marginTop: '20px', lineHeight: '1.7' }}>
            Timelines begin from the moment your return is accepted and inspected at our warehouse.
            Bank holidays may extend processing by 1–2 business days.
          </p>
        </div>
      </section>

      {/* ── FAQs ───────────────────────────────────── */}
      <section className="ret-faq-section section">
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div className="section-label">QUESTIONS</div>
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>
          <div className="ret-faq-list">
            {FAQS.map((faq, i) => (
              <div key={i} className="ret-faq-item" data-testid={`ret-faq-${i}`}>
                <button
                  className="ret-faq-q"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{faq.q}</span>
                  <ChevronDown size={18} style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                </button>
                {openFaq === i && (
                  <div className="ret-faq-a">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT CTA BAND ───────────────────────── */}
      <section className="ret-cta-band">
        <div className="ret-cta-inner">
          <div>
            <h2 className="ret-cta-title">Need Help With a Return?</h2>
            <p className="ret-cta-sub">Our team responds within 4 business hours on all working days.</p>
          </div>
          <div className="ret-cta-actions">
            <a href="mailto:returns@cobblyn.in" className="btn-hero-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Mail size={15} /> Email Us
            </a>
            <a href="tel:+919876543210" className="btn-hero-ghost" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Phone size={15} /> Call Us
            </a>
            <Link href="/shipping" className="btn-hero-ghost" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Shipping Info <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
