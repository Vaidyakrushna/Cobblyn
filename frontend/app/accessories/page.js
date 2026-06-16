"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Shield, Award, Truck, RotateCcw } from 'lucide-react';
import { accessoriesCategories, getFeaturedAccessories } from '../../src/data/accessoriesData';

const featured = getFeaturedAccessories();

export default function AccessoriesPage() {
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <main className="acc-landing" data-testid="accessories-landing">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="acc-hero">
        <div className="acc-hero-bg">
          <img
            src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1600&q=85&fit=crop"
            alt="Cobblyn Accessories"
          />
          <div className="acc-hero-overlay" />
        </div>
        <div className="acc-hero-content">
          <div className="section-label" style={{ color: 'var(--accent)' }}>THE FINISHING TOUCH</div>
          <h1 className="acc-hero-title">
            Complete<br />
            <em>the Look</em>
          </h1>
          <p className="acc-hero-sub">
            Every detail matters. From hand-stitched belts to aromatic cedar shoe trees —
            our accessories are crafted with the same precision as our footwear.
          </p>
          <div className="acc-hero-ctas">
            <Link href="#categories" className="btn-hero-primary" style={{ textDecoration: 'none' }}>
              Shop All Categories
            </Link>
            <Link href="/accessories/shoe-care" className="btn-hero-ghost" style={{ textDecoration: 'none' }}>
              Shoe Care Essentials
            </Link>
          </div>
        </div>
      </section>

      {/* ── CATEGORY TILES ───────────────────────────────────── */}
      <section className="acc-categories-section section" id="categories">
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div className="section-label">BROWSE BY CATEGORY</div>
          <h2 className="section-title">Everything You Need</h2>
          <p style={{ maxWidth: '520px', margin: '0 auto', color: 'var(--mid-grey)', fontSize: '0.88rem', lineHeight: '1.85' }}>
            Handpicked accessories that complement every pair in our collection — made with the same obsessive attention to detail.
          </p>
        </div>

        <div className="acc-categories-grid">
          {accessoriesCategories.map((cat, i) => (
            <Link
              key={cat.slug}
              href={`/accessories/${cat.slug}`}
              className="acc-category-card"
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
              data-testid={`category-card-${cat.slug}`}
            >
              <div className="acc-category-img">
                <img src={cat.img} alt={cat.label} />
                <div className={`acc-category-overlay ${hoveredCard === i ? 'acc-overlay-visible' : ''}`} />
              </div>
              <div className="acc-category-info">
                <h3 className="acc-category-name">{cat.label}</h3>
                <span className="acc-category-count">{cat.count} styles</span>
                <span className="acc-category-arrow">
                  <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ────────────────────────────────── */}
      <section className="acc-featured-section" style={{ background: 'var(--off-white)' }}>
        <div className="section">
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div className="section-label">HAND-PICKED FOR YOU</div>
            <h2 className="section-title">Bestselling Accessories</h2>
          </div>
          <div className="acc-featured-grid">
            {featured.map((product) => (
              <Link
                key={product.id}
                href={`/accessories/product/${product.id}`}
                className="acc-product-card"
                data-testid={`featured-${product.id}`}
              >
                {product.tag && <div className="acc-product-tag">{product.tag}</div>}
                <div className="acc-product-img">
                  <img src={product.images[0]} alt={product.name} />
                  <div className="acc-product-img-hover">
                    {product.images[1] && <img src={product.images[1]} alt={product.name} />}
                  </div>
                </div>
                <div className="acc-product-info">
                  <p className="acc-product-material">{product.material}</p>
                  <h3 className="acc-product-name">{product.name}</h3>
                  <div className="acc-product-colors">
                    {(product.colors || []).slice(0, 4).map((c, i) => (
                      <span key={i} className="acc-color-dot" style={{ backgroundColor: c.hex }} title={c.name} />
                    ))}
                  </div>
                  <div className="acc-product-bottom">
                    <span className="acc-product-price">₹{(product.price || 0).toLocaleString()}</span>
                    <span className="acc-product-cta">View Details →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <Link href="/accessories/belts" className="view-all" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              View All Accessories <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── BRAND PROMISE BAND ───────────────────────────────── */}
      <section className="acc-promise-band">
        <div className="acc-promise-inner">
          {[
            { icon: <Award size={24} />, title: 'Handcrafted', desc: 'Made with the same precision as our footwear' },
            { icon: <Shield size={24} />, title: 'Premium Materials', desc: 'Full-grain leather, natural waxes, solid brass' },
            { icon: <Truck size={24} />, title: 'Free Shipping', desc: 'Complimentary delivery on all orders over ₹999' },
            { icon: <RotateCcw size={24} />, title: 'Easy Returns', desc: '7-day hassle-free returns on all accessories' },
          ].map((item, i) => (
            <div key={i} className="acc-promise-item">
              <div className="acc-promise-icon">{item.icon}</div>
              <div>
                <div className="acc-promise-title">{item.title}</div>
                <div className="acc-promise-desc">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SHOE CARE EDITORIAL STRIP ────────────────────────── */}
      <section className="acc-editorial section">
        <div className="acc-editorial-inner">
          <div className="acc-editorial-img">
            <img
              src="https://images.unsplash.com/photo-1542621334-a254cf47733d?w=800&q=85&fit=crop"
              alt="Shoe care ritual"
            />
            <div className="acc-editorial-badge">
              <Award size={18} fill="currentColor" />
              <span>Since 2018</span>
            </div>
          </div>
          <div className="acc-editorial-content">
            <div className="section-label">CARE IS CRAFT</div>
            <h2 className="section-title">Your Shoes Deserve the Best Care</h2>
            <p style={{ color: 'var(--dark-grey)', fontSize: '0.9rem', lineHeight: '1.85', marginBottom: '16px' }}>
              A pair of Cobblyn shoes is a lifelong investment. Our care products — formulated specifically
              for full-grain and exotic leathers — extend the life and deepen the beauty of your footwear.
            </p>
            <p style={{ color: 'var(--dark-grey)', fontSize: '0.9rem', lineHeight: '1.85', marginBottom: '32px' }}>
              From aromatic cedar shoe trees to natural carnauba wax polishes, every product in our
              Shoe Care range is curated and tested by our master craftsmen in Jaipur.
            </p>
            <Link href="/accessories/shoe-care" className="btn-hero-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              Shop Shoe Care <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}