"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronRight, Heart, ShoppingCart, SlidersHorizontal, X } from 'lucide-react';
import { getByCategory, getCategoryMeta, accessoriesCategories } from '../../../src/data/accessoriesData';
import { useAuth } from '../../../src/context/AuthContext';

const categoryLabels = {
  belts:        'Belts',
  socks:        'Socks',
  wallets:      'Wallets & Card Holders',
  lace:         'Lace',
  'key-rings':  'Key Rings',
  'travel-kit': 'Travel Kit',
  'shoe-care':  'Shoe Care',
};

const priceRanges = [
  { val: 'all',        label: 'All Prices' },
  { val: 'under-999',  label: 'Under ₹999' },
  { val: '999-2999',   label: '₹999 – ₹2,999' },
  { val: 'above-2999', label: 'Above ₹2,999' },
];

export default function AccessoryCategoryPage() {
  const { category } = useParams();
  const { isAuthenticated } = useAuth();
  const products = getByCategory(category);
  const meta = getCategoryMeta(category);
  const label = categoryLabels[category] || 'Accessories';

  const [priceFilter, setPriceFilter]   = useState('all');
  const [colorFilter, setColorFilter]   = useState([]);
  const [sortBy, setSortBy]             = useState('featured');
  const [filterOpen, setFilterOpen]     = useState(true);
  const [wishlist, setWishlist]         = useState([]);
  const [loginPanel, setLoginPanel]     = useState(false);
  const [addedToCart, setAddedToCart]   = useState(null);

  // All unique colors in this category
  const allColors = [...new Map(
    products.flatMap(p => p.colors || []).map(c => [c.name, c])
  ).values()];

  // Filter + sort
  const filtered = (() => {
    let r = [...products];
    if (priceFilter === 'under-999')  r = r.filter(p => p.price < 999);
    if (priceFilter === '999-2999')   r = r.filter(p => p.price >= 999 && p.price <= 2999);
    if (priceFilter === 'above-2999') r = r.filter(p => p.price > 2999);
    if (colorFilter.length) r = r.filter(p => (p.colors || []).some(c => colorFilter.includes(c.name)));
    if (sortBy === 'price-low')  r.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') r.sort((a, b) => b.price - a.price);
    return r;
  })();

  const toggleWishlist = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { setLoginPanel(true); return; }
    setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleQuickCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { setLoginPanel(true); return; }
    setAddedToCart(product.id);
    setTimeout(() => setAddedToCart(null), 2000);
  };

  const clearFilters = () => { setPriceFilter('all'); setColorFilter([]); };
  const activeCount = (priceFilter !== 'all' ? 1 : 0) + colorFilter.length;

  return (
    <div className="acc-plp-container" data-testid={`acc-plp-${category}`}>

      {/* Breadcrumb */}
      <div className="breadcrumbs">
        <Link href="/">Home</Link>
        <ChevronRight size={14} />
        <Link href="/accessories">Accessories</Link>
        <ChevronRight size={14} />
        <span>{label}</span>
      </div>

      {/* Category Header */}
      <div className="acc-plp-header">
        <div>
          <div className="section-label">ACCESSORIES</div>
          <h1 className="plp-title">{label}</h1>
          <p className="plp-subtitle">
            {meta?.count || products.length} handcrafted styles — made to complete your look.
          </p>
        </div>
        <div className="plp-controls">
          <button className="filter-toggle-btn" onClick={() => setFilterOpen(!filterOpen)}>
            <SlidersHorizontal size={18} />
            Filters {activeCount > 0 && `(${activeCount})`}
          </button>
          <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="featured">Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Category sub-nav pills */}
      <div className="acc-plp-subnav">
        <Link href="/accessories" className="acc-subnav-pill">View All</Link>
        {accessoriesCategories.map(cat => (
          <Link
            key={cat.slug}
            href={`/accessories/${cat.slug}`}
            className={`acc-subnav-pill ${cat.slug === category ? 'acc-subnav-active' : ''}`}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      <div className="plp-main">
        {/* Filter sidebar */}
        {filterOpen && (
          <aside className="plp-filters">
            <div className="filter-header">
              <h3>Filters</h3>
              <button className="filter-clear" onClick={clearFilters}>Clear All</button>
            </div>

            <div className="filter-group">
              <h4 className="filter-title">Price Range</h4>
              <div className="filter-options">
                {priceRanges.map(({ val, label: lbl }) => (
                  <label key={val} className="filter-checkbox">
                    <input
                      type="radio"
                      name="acc-price"
                      checked={priceFilter === val}
                      onChange={() => setPriceFilter(val)}
                    />
                    <span>{lbl}</span>
                  </label>
                ))}
              </div>
            </div>

            {allColors.length > 0 && (
              <div className="filter-group">
                <h4 className="filter-title">Colour</h4>
                <div className="filter-color-grid">
                  {allColors.map(color => (
                    <button
                      key={color.name}
                      className={`filter-color-btn ${colorFilter.includes(color.name) ? 'active' : ''}`}
                      onClick={() => setColorFilter(prev =>
                        prev.includes(color.name) ? prev.filter(c => c !== color.name) : [...prev, color.name]
                      )}
                      title={color.name}
                    >
                      <span className="color-swatch" style={{ backgroundColor: color.hex }} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}

        {/* Product grid */}
        <div className="plp-products">
          <div className="plp-results-count">Showing {filtered.length} products</div>
          <div className={`acc-plp-grid ${!filterOpen ? 'acc-plp-grid-full' : ''}`}>
            {filtered.map(product => (
              <Link
                key={product.id}
                href={`/accessories/product/${product.id}`}
                className="acc-plp-card"
                data-testid={`acc-card-${product.id}`}
              >
                {product.tag && <div className="product-tag">{product.tag}</div>}
                <div className="acc-plp-card-img">
                  <img src={product.images[0]} alt={product.name} />
                  {product.images[1] && (
                    <img src={product.images[1]} alt={product.name} className="acc-plp-card-img-hover" />
                  )}
                  <div className="plp-card-icons">
                    <button
                      className={`plp-icon-btn ${wishlist.includes(product.id) ? 'active' : ''}`}
                      onClick={e => toggleWishlist(e, product.id)}
                      title="Wishlist"
                    >
                      <Heart size={16} fill={wishlist.includes(product.id) ? '#9d2706' : 'none'} />
                    </button>
                    <button
                      className={`plp-icon-btn ${addedToCart === product.id ? 'active' : ''}`}
                      onClick={e => handleQuickCart(e, product)}
                      title="Quick Add"
                    >
                      <ShoppingCart size={16} />
                    </button>
                  </div>
                  {addedToCart === product.id && (
                    <div className="acc-added-toast">✓ Added</div>
                  )}
                </div>
                <div className="product-info">
                  <p className="product-material">{product.material}</p>
                  <h3 className="product-name">{product.name}</h3>
                  <div className="product-colors">
                    {(product.colors || []).slice(0, 4).map((c, i) => (
                      <span key={i} className="product-color-dot" style={{ backgroundColor: c.hex }} title={c.name} />
                    ))}
                  </div>
                  <div className="product-bottom">
                    <span className="product-price">₹{(product.price || 0).toLocaleString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="plp-empty">
              <p>No products match your filters.</p>
              <button className="filter-clear" onClick={clearFilters}>Clear Filters</button>
            </div>
          )}
        </div>
      </div>

      {/* Login interstitial */}
      {loginPanel && (
        <div className="interstitial-overlay" onClick={() => setLoginPanel(false)}>
          <div className="interstitial-panel" onClick={e => e.stopPropagation()}>
            <button className="interstitial-close" onClick={() => setLoginPanel(false)}>
              <X size={20} />
            </button>
            <div className="interstitial-content">
              <Heart size={40} className="interstitial-icon" />
              <h3 className="interstitial-title">Login Required</h3>
              <p className="interstitial-desc">Please log in to save items or add to cart.</p>
              <Link href="/login" className="interstitial-login-btn">Log In / Sign Up</Link>
              <button className="interstitial-skip" onClick={() => setLoginPanel(false)}>Continue Browsing</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
