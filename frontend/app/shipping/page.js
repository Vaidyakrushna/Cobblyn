"use client";
import React, { useState } from 'react';
import { Package, Truck, Clock, RefreshCcw, MapPin, AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';

const shippingFaqs = [
  {
    q: 'Can I change my delivery address after placing an order?',
    a: 'Address changes can be requested within 12 hours of placing the order by contacting our support team. After the order has been dispatched, we are unable to make changes.',
  },
  {
    q: 'What if my package is damaged on arrival?',
    a: 'Please photograph the damaged packaging and product immediately and contact us within 48 hours. We will arrange a replacement or full refund at no charge.',
  },
  {
    q: 'Do you ship internationally?',
    a: 'We currently ship within India only. International shipping to select countries is in the works — subscribe to our newsletter to be notified when it launches.',
  },
  {
    q: 'How is my package packaged?',
    a: 'Every Cobblyn order is packed in our signature dust-bag and handcrafted box, wrapped in acid-free tissue. We use eco-friendly outer packaging to minimise environmental impact.',
  },
];

export default function ShippingPage() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <main className="shipping-page">
      {/* HERO */}
      <section className="shipping-hero">
        <div className="shipping-hero-content">
          <div className="section-label">SHIPPING INFORMATION</div>
          <h1 className="shipping-hero-title">
            From Our Hands
            <br />
            <em>to Your Door</em>
          </h1>
          <p className="shipping-hero-sub">
            Every Cobblyn order is packed with the same care that goes into crafting the 
            shoes themselves. Here's everything you need to know.
          </p>
        </div>
        <div className="shipping-hero-visual">
          <Truck size={120} strokeWidth={0.8} color="var(--accent)" style={{ opacity: 0.3 }} />
        </div>
      </section>

      {/* SHIPPING SUMMARY CARDS */}
      <section className="shipping-cards section">
        <div className="shipping-cards-grid">
          {[
            {
              icon: <Package size={28} />,
              title: 'Standard Shipping',
              detail: '5–7 Business Days',
              note: 'Free on orders above ₹2,999',
              highlight: false,
            },
            {
              icon: <Truck size={28} />,
              title: 'Express Delivery',
              detail: '2–3 Business Days',
              note: 'Flat ₹199 across India',
              highlight: true,
            },
            {
              icon: <Clock size={28} />,
              title: 'Bespoke Orders',
              detail: '15–20 Crafting Days',
              note: 'Complimentary shipping',
              highlight: false,
            },
            {
              icon: <RefreshCcw size={28} />,
              title: 'Returns',
              detail: '7 Days from Delivery',
              note: 'Free return pick-up',
              highlight: false,
            },
          ].map((card, i) => (
            <div key={i} className={`shipping-card ${card.highlight ? 'shipping-card-highlight' : ''}`}>
              <div className="shipping-card-icon">{card.icon}</div>
              <h3 className="shipping-card-title">{card.title}</h3>
              <div className="shipping-card-detail">{card.detail}</div>
              <div className="shipping-card-note">{card.note}</div>
            </div>
          ))}
        </div>
      </section>

      {/* DETAILED POLICY */}
      <section className="shipping-policy section" style={{ background: 'var(--off-white)' }}>
        <div className="shipping-policy-inner">
          <div>
            <div className="section-label">OUR COMMITMENT</div>
            <h2 className="section-title">About Shipping</h2>
            <p className="shipping-policy-text">
              At Cobblyn, we are committed to providing you with a smooth and delightful 
              unboxing experience. Our policies are crafted for your convenience — we 
              invite you to review them so you can shop with full confidence.
            </p>
            <p className="shipping-policy-text">
              We recognise how crucial timely and secure delivery is, which is why we 
              collaborate with India's most reliable courier partners — ensuring your 
              order arrives safely and on schedule.
            </p>
          </div>

          <div className="shipping-policy-sections">
            {[
              {
                icon: <Package size={22} />,
                title: 'Processing Your Order',
                content: 'All orders placed before 12:00 PM IST on a business day are processed the same day. Orders placed after noon or on weekends are processed the next business day. You will receive a confirmation email with tracking details once your order is dispatched.',
              },
              {
                icon: <Truck size={22} />,
                title: 'Shipping Charges',
                content: 'Standard shipping is complimentary on all orders above ₹2,999 within India. For orders below ₹2,999, a flat shipping fee of ₹99 applies. Express delivery (2–3 business days) is available for ₹199 regardless of order value.',
              },
              {
                icon: <MapPin size={22} />,
                title: 'Delivery Coverage',
                content: 'We deliver to all serviceable pin codes across India. For remote locations, delivery may take 2–3 additional business days. Please enter your pin code at checkout to confirm serviceability before placing your order.',
              },
              {
                icon: <Clock size={22} />,
                title: 'Bespoke & Custom Orders',
                content: 'Bespoke and customised shoes require 15–20 working days of crafting time before they are ready for dispatch. This timeline begins once all customisation details are confirmed. Complimentary shipping is included on all bespoke orders.',
              },
              {
                icon: <AlertCircle size={22} />,
                title: 'Order Tracking',
                content: 'Once your order is dispatched, you will receive an SMS and email with your tracking number and courier partner details. You can also track your order from the My Account section of our website at any time.',
              },
              {
                icon: <CheckCircle size={22} />,
                title: 'Further Assistance',
                content: 'If your order is delayed, damaged, or lost in transit, please contact us immediately. Our support team is available Monday–Saturday, 10 AM–6 PM IST at hello@cobblynshoes.com or +91 800 123 4567.',
              },
            ].map((section, i) => (
              <div key={i} className="shipping-policy-block">
                <div className="shipping-policy-block-header">
                  <div className="shipping-policy-block-icon">{section.icon}</div>
                  <h3 className="shipping-policy-block-title">{section.title}</h3>
                </div>
                <p className="shipping-policy-block-text">{section.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DELIVERY TIMELINE VISUAL */}
      <section className="shipping-timeline section">
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div className="section-label">HOW IT WORKS</div>
          <h2 className="section-title">Your Order Journey</h2>
        </div>
        <div className="shipping-journey">
          {[
            { step: '01', label: 'Order Placed', desc: 'You receive an instant confirmation email' },
            { step: '02', label: 'Processing', desc: 'Our team verifies and prepares your order' },
            { step: '03', label: 'Handcrafted', desc: 'For bespoke orders, artisans begin work' },
            { step: '04', label: 'Quality Check', desc: 'Every pair passes a rigorous inspection' },
            { step: '05', label: 'Dispatched', desc: 'Packed in our signature box and sent out' },
            { step: '06', label: 'Delivered', desc: 'At your door, ready to be unwrapped' },
          ].map((step, i) => (
            <div key={i} className="shipping-journey-step">
              <div className="shipping-journey-num">{step.step}</div>
              {i < 5 && <div className="shipping-journey-line" />}
              <div className="shipping-journey-label">{step.label}</div>
              <div className="shipping-journey-desc">{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="shipping-faq section" style={{ background: 'var(--off-white)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div className="section-label">FAQ</div>
            <h2 className="section-title">Shipping Questions</h2>
          </div>
          <div className="contact-faq-list">
            {shippingFaqs.map((faq, i) => (
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

      {/* CTA */}
      <section style={{ background: 'var(--black)', padding: '80px 72px', textAlign: 'center' }}>
        <div className="section-label">NEED HELP?</div>
        <h2 className="section-title" style={{ color: 'var(--white)', maxWidth: '500px', margin: '0 auto 24px' }}>
          Questions About Your Order?
        </h2>
        <p style={{ color: 'var(--mid-grey)', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto 36px' }}>
          Our support team is always happy to help. Reach out to us through any of our contact channels.
        </p>
        <a href="/contact" className="btn-hero-primary" style={{ textDecoration: 'none' }}>
          Contact Support
        </a>
      </section>
    </main>
  );
}
