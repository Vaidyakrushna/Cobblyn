"use client";
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { ChevronRight, SlidersHorizontal, Heart, Grid3X3, X, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';

import Image from 'next/image';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

// Rotates through product images on hover (every 1s); shows first image at rest.
const RotatingProductImage = ({ images, alt, sizes, priority }) => {
  const [idx, setIdx] = useState(0);
  const intervalRef = useRef(null);

  const onEnter = () => {
    if (!images || images.length <= 1) return;
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      setIdx((prev) => (prev + 1) % images.length);
    }, 1000);
  };
  const onLeave = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIdx(0);
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const safeImages = (images && images.filter(Boolean).length) ? images.filter(Boolean) : ['/placeholder-shoe.svg'];
  const current = safeImages[idx] || safeImages[0];

  return (
    <div onMouseEnter={onEnter} onMouseLeave={onLeave}
      style={{ position: 'absolute', inset: 0 }}
      data-testid="rotating-product-image">
      {current ? (
        <Image src={current} alt={alt} fill priority={priority} sizes={sizes} style={{ objectFit: 'cover' }}
          onError={(e) => { e.target.style.display = 'none'; }} />
      ) : (
        <div style={{ width: '100%', height: '100%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 12 }}>No image</div>
      )}
      {safeImages.length > 1 && (
        <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
                      display: 'flex', gap: 4, padding: '4px 8px', borderRadius: 12,
                      background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', pointerEvents: 'none' }}>
          {safeImages.map((_, i) => (
            <span key={i} style={{ width: 5, height: 5, borderRadius: '50%',
                                   background: i === idx ? '#fff' : 'rgba(255,255,255,0.4)',
                                   transition: 'background 0.2s ease' }} />
          ))}
        </div>
      )}
    </div>
  );
};

const ProductListContent = ({ gender, title, subtitle, filterType: filterTypeProp, filterValue: filterValueProp }) => {
  const params = useParams() || {};
  const filterType = filterTypeProp || params.filterType || null;
  const filterValue = filterValueProp || params.slug || params.filterValue || null;
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search');
  const [filters, setFilters] = useState({ style: [], occasion: [], size: [], priceRange: 'all', color: [], gender: [] });
  const [sortBy, setSortBy] = useState('featured');
  const [filterOpen, setFilterOpen] = useState(true);
  const [wishlistedIds, setWishlistedIds] = useState([]);
  const [loginPanel, setLoginPanel] = useState(false);
  const [similarPanel, setSimilarPanel] = useState(null);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = {};
        if (gender) params.gender = gender;
        if (searchQuery) params.search = searchQuery;
        if (sortBy === 'price-low') params.sort = 'price-low';
        else if (sortBy === 'price-high') params.sort = 'price-high';
        const data = await api.getProducts(params);
        setProducts(data.products || []);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      }
      setLoading(false);
    };
    fetchProducts();
  }, [gender, sortBy, searchQuery]);

  // Fetch wishlist if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      api.getWishlist().then(data => {
        setWishlistedIds((data.items || []).map(i => i.product_id));
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  // Apply URL filters
  useEffect(() => {
    const newStyle = filterType === 'style' && filterValue ? [decodeURIComponent(filterValue).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())] : [];
    const newOccasion = filterType === 'occasion' && filterValue ? [decodeURIComponent(filterValue).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())] : [];
    setFilters(prev => ({ ...prev, style: newStyle, occasion: newOccasion }));
  }, [filterType, filterValue]);

  const basePath = gender === 'women' ? '/women' : gender === 'men' ? '/men' : gender === 'all' ? '/collection' : '/luxe-collection';

  const styleOptions = gender === 'women'
    ? ['Ballerina', 'Boots', 'Loafers', 'Jutis', 'Peep Toes']
    : ['Oxford', 'Loafer', 'Monk Strap', 'Desert Boot/Chukka Boots', 'Derby', 'Jutis', 'Mojaris', 'Boat'];
  const occasionOptions = ['Office', 'Casual', 'Daily Wear', 'Party', 'Wedding', 'Travel'];
  const sizeOptions = gender === 'women' ? ['3', '4', '5', '6', '7', '8'] : ['6', '7', '8', '9', '10', '11', '12'];
  const colorOptions = [...new Set(products.flatMap(p => (p.colors || []).map(c => c.name)))];

  const handleFilterChange = (category, value) => {
    setFilters(prev => {
      const cur = prev[category];
      return { ...prev, [category]: cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value] };
    });
  };

  const clearFilters = () => {
    setFilters({ style: [], occasion: [], size: [], priceRange: 'all', color: [], gender: [] });
  };

  const filteredProducts = (() => {
    let result = [...products];
    if (filters.style.length) {
      result = result.filter(p => {
        const pStyle = (p.style || '').toLowerCase();
        return filters.style.some(f => pStyle.includes(f.toLowerCase()) || f.toLowerCase().includes(pStyle));
      });
    }
    if (filters.occasion.length) {
      result = result.filter(p => {
        const pOcc = (p.occasion || '').toLowerCase();
        return filters.occasion.some(f => pOcc.includes(f.toLowerCase()) || f.toLowerCase().includes(pOcc));
      });
    }
    if (filters.color.length) result = result.filter(p => (p.colors || []).some(c => filters.color.includes(c.name)));
    if (gender === 'all' && filters.gender.length) {
      result = result.filter(p => filters.gender.includes(p.gender));
    }
    if (filters.priceRange !== 'all') {
      if (filters.priceRange === 'under-7000') result = result.filter(p => p.price < 7000);
      else if (filters.priceRange === '7000-9000') result = result.filter(p => p.price >= 7000 && p.price <= 9000);
      else if (filters.priceRange === 'above-9000') result = result.filter(p => p.price > 9000);
    }
    return result;
  })();

  const activeFilterCount = filters.style.length + filters.occasion.length + filters.size.length + filters.color.length + (filters.priceRange !== 'all' ? 1 : 0);

  const pageTitle = filterType === 'style' && filterValue
    ? `${decodeURIComponent(filterValue).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} â€” ${title}`
    : filterType === 'occasion' && filterValue
    ? `${decodeURIComponent(filterValue).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} â€” ${title}`
    : title;

  const handleWishlistClick = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      setLoginPanel(true);
      return;
    }
    try {
      if (wishlistedIds.includes(productId)) {
        await api.removeFromWishlist(productId);
        setWishlistedIds(prev => prev.filter(id => id !== productId));
      } else {
        await api.addToWishlist(productId);
        setWishlistedIds(prev => [...prev, productId]);
      }
      window.dispatchEvent(new Event('cobblyn-wishlist-update'));
    } catch (err) {
      console.error('Wishlist error:', err);
    }
  };

  const handleSimilarClick = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    const similar = products.filter(p => p.id !== product.id && (p.style === product.style || p.occasion === product.occasion)).slice(0, 6);
    setSimilarPanel({ product, similar: similar.length > 0 ? similar : products.filter(p => p.id !== product.id).slice(0, 6) });
  };

  const handleSimilarAddToCart = async (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { setLoginPanel(true); setSimilarPanel(null); return; }
    try {
      await api.addToCart({ product_id: item.id, size: (item.sizes || ['9'])[0], color: (item.colors || [{ name: 'Black' }])[0].name, quantity: 1 });
      window.dispatchEvent(new Event('cobblyn-cart-update'));
      alert(`${item.name} added to cart!`);
    } catch (err) { alert('Failed: ' + err.message); }
  };

  const handleSimilarWishlist = async (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { setLoginPanel(true); setSimilarPanel(null); return; }
    try {
      await api.addToWishlist(item.id);
      setWishlistedIds(prev => [...prev, item.id]);
      window.dispatchEvent(new Event('cobblyn-wishlist-update'));
    } catch (err) { console.error(err); }
  };

  const getProductLink = (product) => {
    if (gender === '') {
      return `/luxe-collection/product/${product.id}`;
    }
    const g = product.gender || gender;
    const gPath = g === 'women' ? '/women' : '/men';
    return `${gPath}/product/${product.id}`;
  };

  return (
    <div className="plp-container" data-testid={`${gender || 'all'}-plp`}>
      <div className="breadcrumbs">
        <Link href="/">Home</Link>
        <ChevronRight size={14} />
        <Link href={basePath}>{title}</Link>
        {filterType && filterValue && (
          <>
            <ChevronRight size={14} />
            <span>{decodeURIComponent(filterValue).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
          </>
        )}
      </div>

      <div className="plp-header">
        <div>
          <div className="section-label">{gender === 'women' ? 'FOR HER' : gender === 'men' ? 'FOR HIM' : 'CURATED'}</div>
          <h1 className="plp-title">{pageTitle}</h1>
          <p className="plp-subtitle">{subtitle}</p>
        </div>
        <div className="plp-controls">
          <button className="filter-toggle-btn" onClick={() => setFilterOpen(!filterOpen)} data-testid="filter-toggle-button">
            <SlidersHorizontal size={18} />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
          <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} data-testid="sort-select">
            <option value="featured">Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>

      <div className="plp-main">
        {filterOpen && (
          <aside className="plp-filters" data-testid="plp-filters">
            <div className="filter-header">
              <h3>Filters</h3>
              <button className="filter-clear" onClick={clearFilters}>Clear All</button>
            </div>
            {gender === 'all' && (
              <div className="filter-group">
                <h4 className="filter-title">Gender</h4>
                <div className="filter-options">
                  {['men', 'women'].map((g) => (
                    <label key={g} className="filter-checkbox">
                      <input type="checkbox" checked={filters.gender.includes(g)} onChange={() => handleFilterChange('gender', g)} />
                      <span>{g === 'men' ? 'Men' : 'Women'}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="filter-group">
              <h4 className="filter-title">Style</h4>
              <div className="filter-options">
                {styleOptions.map((s) => (
                  <label key={s} className="filter-checkbox">
                    <input type="checkbox" checked={filters.style.some(f => f.toLowerCase() === s.toLowerCase())} onChange={() => handleFilterChange('style', s)} />
                    <span>{s}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <h4 className="filter-title">Occasion</h4>
              <div className="filter-options">
                {occasionOptions.map((o) => (
                  <label key={o} className="filter-checkbox">
                    <input type="checkbox" checked={filters.occasion.some(f => f.toLowerCase() === o.toLowerCase())} onChange={() => handleFilterChange('occasion', o)} />
                    <span>{o}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <h4 className="filter-title">Size</h4>
              <div className="filter-size-grid">
                {sizeOptions.map((size) => (
                  <button key={size} className={`filter-size-btn ${filters.size.includes(size) ? 'active' : ''}`} onClick={() => handleFilterChange('size', size)}>
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <h4 className="filter-title">Price Range</h4>
              <div className="filter-options">
                {[{ val: 'all', label: 'All Prices' }, { val: 'under-7000', label: 'Under 7,000' }, { val: '7000-9000', label: '7,000 - 9,000' }, { val: 'above-9000', label: 'Above 9,000' }].map(({ val, label }) => (
                  <label key={val} className="filter-checkbox">
                    <input type="radio" name="price" value={val} checked={filters.priceRange === val} onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <h4 className="filter-title">Color</h4>
              <div className="filter-color-grid">
                {colorOptions.map((color) => (
                  <button key={color} className={`filter-color-btn ${filters.color.includes(color) ? 'active' : ''}`} onClick={() => handleFilterChange('color', color)} title={color}>
                    <span className={`color-swatch color-${color.toLowerCase()}`}></span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}
        <div className="plp-products">
          <div className="plp-results-count">
            {loading ? 'Loading...' : `Showing ${filteredProducts.length} products`}
          </div>
          <div className={`plp-grid ${!filterOpen ? 'plp-grid-full' : ''}`}>
            {filteredProducts.map((product, idx) => (
              <Link href={getProductLink(product)} key={product.id} className="plp-product-card" data-testid={`product-card-${product.id}`}>
                {product.tag && <div className="product-tag">{product.tag}</div>}
                <div className="product-image">
                  <RotatingProductImage
                    images={product.images}
                    alt={product.name}
                    priority={idx < 3}
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                  <div className="product-quick-view">Quick View</div>
                  <div className="plp-card-icons" data-testid={`plp-card-icons-${product.id}`}>
                    <button 
                      className={`plp-icon-btn ${wishlistedIds.includes(product.id) ? 'active' : ''}`}
                      onClick={(e) => handleWishlistClick(e, product.id)}
                      data-testid={`plp-wishlist-${product.id}`}
                      title="Add to Wishlist"
                    >
                      <Heart size={16} fill={wishlistedIds.includes(product.id) ? '#9d2706' : 'none'} />
                    </button>
                    <button 
                      className="plp-icon-btn"
                      onClick={(e) => handleSimilarAddToCart(e, product)}
                      data-testid={`plp-cart-${product.id}`}
                      title="Add to Cart"
                    >
                      <ShoppingCart size={16} />
                    </button>
                    <button 
                      className="plp-icon-btn"
                      onClick={(e) => handleSimilarClick(e, product)}
                      data-testid={`plp-similar-${product.id}`}
                      title="View Similar"
                    >
                      <Grid3X3 size={16} />
                    </button>
                  </div>
                </div>
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-material">{product.material}</p>
                  <div className="product-colors">
                    {(product.colors || []).map((color, idx) => (
                      <span key={idx} className="product-color-dot" style={{ backgroundColor: color.hex }} title={color.name}></span>
                    ))}
                  </div>
                  <div className="product-bottom">
                    <span className="product-price">{(product.price || 0).toLocaleString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {!loading && filteredProducts.length === 0 && (
            <div className="plp-empty">
              <p>No products match your filters.</p>
              <button className="filter-clear" onClick={clearFilters}>Clear Filters</button>
            </div>
          )}
        </div>
      </div>

      {/* Login Interstitial Panel */}
      {loginPanel && (
        <div className="interstitial-overlay" data-testid="login-interstitial" onClick={() => setLoginPanel(false)}>
          <div className="interstitial-panel" onClick={(e) => e.stopPropagation()}>
            <button className="interstitial-close" onClick={() => setLoginPanel(false)} data-testid="interstitial-close">
              <X size={20} />
            </button>
            <div className="interstitial-content">
              <Heart size={40} className="interstitial-icon" />
              <h3 className="interstitial-title">Save to Wishlist</h3>
              <p className="interstitial-desc">Please log in to save items to your wishlist and access them across devices.</p>
              <Link href="/login" className="interstitial-login-btn" data-testid="interstitial-login-btn">
                Log In / Sign Up
              </Link>
              <button className="interstitial-skip" onClick={() => setLoginPanel(false)}>Continue Browsing</button>
            </div>
          </div>
        </div>
      )}

      {/* Similar Products Interstitial Panel */}
      {similarPanel && (
        <div className="interstitial-overlay" data-testid="similar-interstitial" onClick={() => setSimilarPanel(null)}>
          <div className="interstitial-panel interstitial-panel-similar" onClick={(e) => e.stopPropagation()}>
            <button className="interstitial-close-top" onClick={() => setSimilarPanel(null)} data-testid="similar-close">
              <X size={22} />
            </button>
            <h3 className="interstitial-title" style={{ textAlign: 'left', padding: '0 0 16px 0', borderBottom: '1px solid var(--light-grey)' }}>Similar to {similarPanel.product.name}</h3>
            <div className="similar-panel-scroll">
              <div className="similar-panel-grid">
                {similarPanel.similar.map((item) => (
                  <div key={item.id} className="similar-panel-card" data-testid={`similar-panel-card-${item.id}`}>
                    <Link href={getProductLink(item)} onClick={() => setSimilarPanel(null)}>
                      <div className="similar-panel-img">
                        <Image src={(item.images || [])[0] || ''} alt={item.name} fill sizes="200px" style={{ objectFit: 'cover' }} />
                      </div>
                    </Link>
                    <div className="similar-panel-info">
                      <Link href={getProductLink(item)} onClick={() => setSimilarPanel(null)} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h4>{item.name}</h4>
                        <p className="similar-panel-material">{item.material}</p>
                      </Link>
                      <span className="similar-panel-price">{(item.price || 0).toLocaleString()}</span>
                      <div className="similar-panel-actions">
                        <button className="similar-action-btn" onClick={(e) => handleSimilarAddToCart(e, item)} data-testid={`similar-add-cart-${item.id}`}>
                          <ShoppingCart size={14} /> Add to Cart
                        </button>
                        <button className={`similar-wishlist-btn ${wishlistedIds.includes(item.id) ? 'active' : ''}`} onClick={(e) => handleSimilarWishlist(e, item)} data-testid={`similar-wishlist-${item.id}`}>
                          <Heart size={14} fill={wishlistedIds.includes(item.id) ? '#9d2706' : 'none'} color={wishlistedIds.includes(item.id) ? '#9d2706' : 'currentColor'} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProductListPage = (props) => {
  return (
    <Suspense fallback={<div style={{ padding: '100px', textAlign: 'center' }}>Loading products...</div>}>
      <ProductListContent {...props} />
    </Suspense>
  );
};

export default ProductListPage;

