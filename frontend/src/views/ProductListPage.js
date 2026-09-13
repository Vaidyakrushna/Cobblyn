"use client";
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { 
  ChevronRight, 
  SlidersHorizontal, 
  Heart, 
  Grid3X3, 
  LayoutGrid, 
  X, 
  ShoppingCart, 
  Sparkles, 
  Check, 
  Eye, 
  ArrowRight, 
  ShieldCheck, 
  Award, 
  ChevronDown, 
  RotateCcw 
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

// Helper to clean database artifact titles like "The Sovereign Wholecut Oxford : Black"
const cleanProductName = (raw) => {
  if (!raw) return { title: '', colorSuffix: '' };
  let title = raw;
  let colorSuffix = '';

  if (title.includes(' : ')) {
    const parts = title.split(' : ');
    title = parts[0].trim();
    colorSuffix = parts[1].trim();
  } else if (title.includes(':')) {
    const parts = title.split(':');
    title = parts[0].trim();
    colorSuffix = parts[1].trim();
  } else if (/\((.*?)\)/.test(title)) {
    const match = title.match(/\((.*?)\)/);
    if (match) {
      colorSuffix = match[1].trim();
      title = title.replace(/\(.*?\)/, '').trim();
    }
  }

  // Capitalize colors nicely (e.g. "BLUE" -> "Blue")
  if (colorSuffix) {
    colorSuffix = colorSuffix
      .split(/[\s,]+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(', ');
  }

  return { title, colorSuffix };
};

// Formats Indian Rupees
const formatPrice = (p) => {
  if (!p && p !== 0) return '';
  return `₹${Number(p).toLocaleString('en-IN')}`;
};

// Luxury Product Image with smooth hover secondary angle
const LuxuryProductImage = ({ images, alt, priority }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const safeImages = (images && images.filter(Boolean).length) 
    ? images.filter(Boolean) 
    : ['/placeholder-shoe.svg'];

  return (
    <div 
      className="plp-img-wrapper"
      onMouseEnter={() => {
        if (safeImages.length > 1) setActiveIdx(1);
      }}
      onMouseLeave={() => setActiveIdx(0)}
    >
      <Image 
        src={safeImages[activeIdx] || safeImages[0]} 
        alt={alt} 
        fill 
        priority={priority}
        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        className="plp-card-img"
        onError={(e) => { e.target.style.display = 'none'; }} 
      />
      {safeImages.length > 1 && (
        <div className="plp-img-pips">
          {safeImages.slice(0, 4).map((_, i) => (
            <span 
              key={i} 
              className={`plp-img-pip ${i === activeIdx ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveIdx(i);
              }}
            />
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

  // Filter & Layout States
  const [filters, setFilters] = useState({ 
    style: [], 
    occasion: [], 
    material: [], 
    size: [], 
    priceRange: 'all', 
    color: [], 
    gender: [] 
  });
  const [sortBy, setSortBy] = useState('featured');
  const [filterOpen, setFilterOpen] = useState(true);
  const [gridColumns, setGridColumns] = useState(4); // 3 (Editorial) or 4 (Catalog)
  const [wishlistedIds, setWishlistedIds] = useState([]);
  const [loginPanel, setLoginPanel] = useState(false);
  const [similarPanel, setSimilarPanel] = useState(null);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [quickViewSize, setQuickViewSize] = useState('9');
  const [toastMessage, setToastMessage] = useState('');
  const [addingSizeMap, setAddingSizeMap] = useState({});

  // Accordion open/collapse states
  const [openSections, setOpenSections] = useState({
    style: true,
    material: true,
    price: true,
    size: true,
    color: true,
    occasion: false,
  });

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = {};
        if (gender && gender !== 'all') params.gender = gender;
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

  // Fetch wishlist
  useEffect(() => {
    if (isAuthenticated) {
      api.getWishlist().then(data => {
        setWishlistedIds((data.items || []).map(i => i.product_id));
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  // Apply URL filters
  useEffect(() => {
    const newStyle = filterType === 'style' && filterValue 
      ? [decodeURIComponent(filterValue).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())] 
      : [];
    const newOccasion = filterType === 'occasion' && filterValue 
      ? [decodeURIComponent(filterValue).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())] 
      : [];
    setFilters(prev => ({ ...prev, style: newStyle, occasion: newOccasion }));
  }, [filterType, filterValue]);

  const basePath = gender === 'women' ? '/collections/women' : gender === 'men' ? '/collections/men' : '/collections/all';

  const styleOptions = gender === 'women'
    ? ['Ballerina', 'Boots', 'Loafers', 'Jutis', 'Peep Toes']
    : ['Oxford', 'Loafer', 'Monk Strap', 'Derby', 'Boots', 'Ethnic', 'Boat'];
  
  const materialOptions = [
    'Full-Grain Leather', 
    'Suede', 
    'Italian Leather', 
    'Premium Calfskin', 
    'Polished Leather', 
    'Smooth Leather', 
    'Silk & Leather', 
    'Nubuck Leather'
  ];

  const occasionOptions = ['Office', 'Casual', 'Daily Wear', 'Party', 'Wedding', 'Travel'];
  const sizeOptions = gender === 'women' ? ['3', '4', '5', '6', '7', '8'] : ['6', '7', '8', '9', '10', '11', '12'];
  const colorOptions = [...new Set(products.flatMap(p => (p.colors || []).map(c => c.name)))];

  const handleFilterChange = (category, value) => {
    setFilters(prev => {
      const cur = prev[category] || [];
      return { 
        ...prev, 
        [category]: cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value] 
      };
    });
  };

  const clearFilters = () => {
    setFilters({ style: [], occasion: [], material: [], size: [], priceRange: 'all', color: [], gender: [] });
  };

  const removeSingleFilter = (cat, val) => {
    if (cat === 'priceRange') {
      setFilters(prev => ({ ...prev, priceRange: 'all' }));
    } else {
      setFilters(prev => ({ ...prev, [cat]: prev[cat].filter(v => v !== val) }));
    }
  };

  // Filter calculation
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
    if (filters.material.length) {
      result = result.filter(p => {
        const pMat = (p.material || '').toLowerCase();
        return filters.material.some(f => pMat.includes(f.toLowerCase()) || f.toLowerCase().includes(pMat));
      });
    }
    if (filters.size.length) {
      result = result.filter(p => {
        const pSizes = (p.sizes || []).map(String);
        return filters.size.some(s => pSizes.includes(String(s)));
      });
    }
    if (filters.color.length) {
      result = result.filter(p => (p.colors || []).some(c => filters.color.includes(c.name)));
    }
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

  const activeFilterCount = 
    filters.style.length + 
    filters.occasion.length + 
    filters.material.length + 
    filters.size.length + 
    filters.color.length + 
    (filters.priceRange !== 'all' ? 1 : 0);

  const pageTitle = filterType === 'style' && filterValue
    ? `${decodeURIComponent(filterValue).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} — ${title}`
    : filterType === 'occasion' && filterValue
    ? `${decodeURIComponent(filterValue).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} — ${title}`
    : title;

  // Wishlist handler
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

  // Quick Add Size directly to Cart
  const handleQuickAddSize = async (e, product, size) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      setLoginPanel(true);
      return;
    }
    const key = `${product.id}-${size}`;
    setAddingSizeMap(prev => ({ ...prev, [key]: true }));
    try {
      const colorName = (product.colors && product.colors[0]?.name) || 'Black';
      await api.addToCart({
        product_id: product.id,
        size: String(size),
        color: colorName,
        quantity: 1
      });
      window.dispatchEvent(new Event('cobblyn-cart-update'));
      const { title } = cleanProductName(product.name);
      setToastMessage(`Added ${title} (UK ${size}) to your bag`);
      setTimeout(() => setToastMessage(''), 3500);
    } catch (err) {
      alert('Could not add to bag: ' + err.message);
    } finally {
      setAddingSizeMap(prev => ({ ...prev, [key]: false }));
    }
  };

  // Open Quick View Modal
  const handleOpenQuickView = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewProduct(product);
    setQuickViewSize(product.sizes?.[0] || '9');
  };

  // Add from Quick View Modal
  const handleQuickViewAddToCart = async () => {
    if (!quickViewProduct) return;
    if (!isAuthenticated) {
      setLoginPanel(true);
      return;
    }
    try {
      const colorName = (quickViewProduct.colors && quickViewProduct.colors[0]?.name) || 'Black';
      await api.addToCart({
        product_id: quickViewProduct.id,
        size: String(quickViewSize),
        color: colorName,
        quantity: 1
      });
      window.dispatchEvent(new Event('cobblyn-cart-update'));
      const { title } = cleanProductName(quickViewProduct.name);
      setToastMessage(`Added ${title} (UK ${quickViewSize}) to your bag`);
      setQuickViewProduct(null);
      setTimeout(() => setToastMessage(''), 3500);
    } catch (err) {
      alert('Could not add to bag: ' + err.message);
    }
  };

  const renderHeroHeading = () => {
    if (pageTitle.includes(' — ')) {
      const parts = pageTitle.split(' — ');
      return (
        <>
          {parts[0]}
          <br />
          <em>{parts[1]}</em>
        </>
      );
    }
    const words = pageTitle.trim().split(/\s+/);
    if (words.length > 1) {
      const first = words.slice(0, -1).join(' ');
      const last = words[words.length - 1];
      return (
        <>
          {first}
          <br />
          <em>{last}</em>
        </>
      );
    }
    return pageTitle;
  };

  const getProductLink = (product) => {
    const id = product.numericId || product.id;
    return `/products/${id}`;
  };

  return (
    <div className="plp-lux-wrapper" data-testid={`${gender || 'all'}-plp`}>
      {/* Editorial Heritage Hero Banner */}
      <section className="plp-hero-luxury">
        <div className="plp-hero-container">
          <div className="plp-hero-breadcrumbs">
            <Link href="/">Home</Link>
            <ChevronRight size={12} className="crumb-sep" />
            <Link href={basePath}>Collections</Link>
            <ChevronRight size={12} className="crumb-sep" />
            <span className="crumb-active">{gender === 'women' ? "Women's" : "Men's Footwear"}</span>
          </div>

          <div className="plp-hero-body">
            <div className="plp-hero-atelier-tag">
              COBCULT ATELIER · HAND-LASTED BENCHWORK
            </div>
            <h1 className="plp-hero-heading">{renderHeroHeading()}</h1>
            <p className="plp-hero-subtext">
              {subtitle || "Artisanal bench-crafted footwear, shaped from full-grain European calfskin and finished with hand-burnished patina."}
            </p>

            {/* Heritage Craftsmanship Pillars */}
            <div className="plp-pillars-row">
              <div className="plp-pillar-item">
                <ShieldCheck size={14} className="pillar-icon" />
                <span>Goodyear Welt &amp; Blake Stitched</span>
              </div>
              <span className="pillar-dot">•</span>
              <div className="plp-pillar-item">
                <Award size={14} className="pillar-icon" />
                <span>Full-Grain European Leathers</span>
              </div>
              <span className="pillar-dot">•</span>
              <div className="plp-pillar-item">
                <Sparkles size={14} className="pillar-icon" />
                <span>Hand-Burnished Artisanal Patina</span>
              </div>
            </div>

            {/* Quick Silhouette Navigator */}
            <div className="plp-silhouette-bar">
              <button
                className={`silhouette-pill ${filters.style.length === 0 ? 'active' : ''}`}
                onClick={() => setFilters(prev => ({ ...prev, style: [] }))}
              >
                All Silhouettes
              </button>
              {styleOptions.map((style) => {
                const isSelected = filters.style.some(s => s.toLowerCase() === style.toLowerCase());
                return (
                  <button
                    key={style}
                    className={`silhouette-pill ${isSelected ? 'active' : ''}`}
                    onClick={() => handleFilterChange('style', style)}
                  >
                    {style}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Control & Filter Sticky Toolbar */}
      <div className="plp-toolbar-wrap">
        <div className="plp-toolbar">
          <div className="plp-toolbar-left">
            <button 
              className={`plp-filter-btn ${filterOpen ? 'is-active' : ''}`} 
              onClick={() => setFilterOpen(!filterOpen)} 
              data-testid="filter-toggle-button"
            >
              <SlidersHorizontal size={15} />
              <span>{filterOpen ? 'Hide Filters' : 'Show Filters'}</span>
              {activeFilterCount > 0 && <span className="filter-count-badge">{activeFilterCount}</span>}
            </button>

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="plp-active-chips">
                {filters.style.map(s => (
                  <span key={s} className="filter-chip" onClick={() => removeSingleFilter('style', s)}>
                    {s} <X size={12} />
                  </span>
                ))}
                {filters.material.map(m => (
                  <span key={m} className="filter-chip" onClick={() => removeSingleFilter('material', m)}>
                    {m} <X size={12} />
                  </span>
                ))}
                {filters.size.map(sz => (
                  <span key={sz} className="filter-chip" onClick={() => removeSingleFilter('size', sz)}>
                    UK {sz} <X size={12} />
                  </span>
                ))}
                {filters.color.map(c => (
                  <span key={c} className="filter-chip" onClick={() => removeSingleFilter('color', c)}>
                    {c} <X size={12} />
                  </span>
                ))}
                {filters.priceRange !== 'all' && (
                  <span className="filter-chip" onClick={() => removeSingleFilter('priceRange', '')}>
                    {filters.priceRange.replace('-', ' ')} <X size={12} />
                  </span>
                )}
                <button className="chips-clear-all" onClick={clearFilters}>
                  <RotateCcw size={11} /> Reset
                </button>
              </div>
            )}
          </div>

          <div className="plp-toolbar-right">
            <span className="plp-item-counter">
              {loading ? 'Curating catalog...' : `${filteredProducts.length} Artisanal Silhouettes`}
            </span>

            {/* Grid Switcher: 3 (Editorial) vs 4 (Catalog) */}
            <div className="plp-grid-toggle">
              <button 
                className={`grid-view-btn ${gridColumns === 3 ? 'active' : ''}`}
                onClick={() => setGridColumns(3)}
                title="Editorial 3-Column View"
              >
                <Grid3X3 size={16} />
              </button>
              <button 
                className={`grid-view-btn ${gridColumns === 4 ? 'active' : ''}`}
                onClick={() => setGridColumns(4)}
                title="Catalog 4-Column View"
              >
                <LayoutGrid size={16} />
              </button>
            </div>

            {/* Luxury Sort Select */}
            <div className="plp-sort-wrapper">
              <select 
                className="plp-luxury-sort" 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)} 
                data-testid="sort-select"
              >
                <option value="featured">Curated &amp; Recommended</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest Bench Creations</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout: Filters Sidebar + Products Grid */}
      <div className={`plp-layout-main ${!filterOpen ? 'filters-collapsed' : ''}`}>
        {/* Accordion Filter Sidebar */}
        {filterOpen && (
          <aside className="plp-sidebar-lux" data-testid="plp-filters">
            <div className="sidebar-head">
              <h3>Refine Catalog</h3>
              {activeFilterCount > 0 && (
                <button className="sidebar-clear-btn" onClick={clearFilters}>Clear All</button>
              )}
            </div>

            {/* Style Accordion */}
            <div className="lux-accordion">
              <button className="lux-accordion-btn" onClick={() => toggleSection('style')}>
                <span>Silhouette Style</span>
                <ChevronDown size={15} className={`acc-chevron ${openSections.style ? 'rotate' : ''}`} />
              </button>
              {openSections.style && (
                <div className="lux-accordion-content">
                  {styleOptions.map((s) => {
                    const checked = filters.style.some(f => f.toLowerCase() === s.toLowerCase());
                    const count = products.filter(p => (p.style || '').toLowerCase().includes(s.toLowerCase())).length;
                    return (
                      <label key={s} className="lux-checkbox-row">
                        <input 
                          type="checkbox" 
                          checked={checked} 
                          onChange={() => handleFilterChange('style', s)} 
                        />
                        <span className="lux-custom-box">
                          {checked && <Check size={11} strokeWidth={3} />}
                        </span>
                        <span className="lux-label-text">{s}</span>
                        {count > 0 && <span className="lux-count-pill">{count}</span>}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Material Accordion */}
            <div className="lux-accordion">
              <button className="lux-accordion-btn" onClick={() => toggleSection('material')}>
                <span>Leather &amp; Material</span>
                <ChevronDown size={15} className={`acc-chevron ${openSections.material ? 'rotate' : ''}`} />
              </button>
              {openSections.material && (
                <div className="lux-accordion-content">
                  {materialOptions.map((m) => {
                    const checked = filters.material.some(f => f.toLowerCase() === m.toLowerCase());
                    const count = products.filter(p => (p.material || '').toLowerCase().includes(m.toLowerCase())).length;
                    if (count === 0 && !checked) return null;
                    return (
                      <label key={m} className="lux-checkbox-row">
                        <input 
                          type="checkbox" 
                          checked={checked} 
                          onChange={() => handleFilterChange('material', m)} 
                        />
                        <span className="lux-custom-box">
                          {checked && <Check size={11} strokeWidth={3} />}
                        </span>
                        <span className="lux-label-text">{m}</span>
                        {count > 0 && <span className="lux-count-pill">{count}</span>}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Size Accordion */}
            <div className="lux-accordion">
              <button className="lux-accordion-btn" onClick={() => toggleSection('size')}>
                <span>Shoe Size (UK)</span>
                <ChevronDown size={15} className={`acc-chevron ${openSections.size ? 'rotate' : ''}`} />
              </button>
              {openSections.size && (
                <div className="lux-accordion-content">
                  <div className="lux-size-grid">
                    {sizeOptions.map((sz) => {
                      const isActive = filters.size.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          className={`lux-size-btn ${isActive ? 'is-active' : ''}`}
                          onClick={() => handleFilterChange('size', sz)}
                        >
                          UK {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Price Range Accordion */}
            <div className="lux-accordion">
              <button className="lux-accordion-btn" onClick={() => toggleSection('price')}>
                <span>Price Bracket</span>
                <ChevronDown size={15} className={`acc-chevron ${openSections.price ? 'rotate' : ''}`} />
              </button>
              {openSections.price && (
                <div className="lux-accordion-content">
                  {[
                    { val: 'all', label: 'All Silhouettes' },
                    { val: 'under-7000', label: 'Under ₹7,000' },
                    { val: '7000-9000', label: '₹7,000 – ₹9,000' },
                    { val: 'above-9000', label: 'Above ₹9,000 (Bespoke Grade)' }
                  ].map(({ val, label }) => {
                    const checked = filters.priceRange === val;
                    return (
                      <label key={val} className="lux-checkbox-row">
                        <input 
                          type="radio" 
                          name="priceBracket"
                          value={val}
                          checked={checked} 
                          onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))} 
                        />
                        <span className={`lux-radio-dot ${checked ? 'is-active' : ''}`} />
                        <span className="lux-label-text">{label}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Color Accordion */}
            <div className="lux-accordion">
              <button className="lux-accordion-btn" onClick={() => toggleSection('color')}>
                <span>Leather Shade</span>
                <ChevronDown size={15} className={`acc-chevron ${openSections.color ? 'rotate' : ''}`} />
              </button>
              {openSections.color && (
                <div className="lux-accordion-content">
                  <div className="lux-swatches-grid">
                    {colorOptions.map((cName) => {
                      const isActive = filters.color.includes(cName);
                      const sampleColor = products.flatMap(p => p.colors || []).find(c => c.name === cName);
                      const hex = sampleColor?.hex || '#1a1a1a';
                      return (
                        <button
                          key={cName}
                          type="button"
                          className={`lux-swatch-btn ${isActive ? 'is-active' : ''}`}
                          onClick={() => handleFilterChange('color', cName)}
                          title={cName}
                        >
                          <span className="swatch-circle" style={{ backgroundColor: hex }} />
                          <span className="swatch-name">{cName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Occasion Accordion */}
            <div className="lux-accordion">
              <button className="lux-accordion-btn" onClick={() => toggleSection('occasion')}>
                <span>Occasion &amp; Setting</span>
                <ChevronDown size={15} className={`acc-chevron ${openSections.occasion ? 'rotate' : ''}`} />
              </button>
              {openSections.occasion && (
                <div className="lux-accordion-content">
                  {occasionOptions.map((occ) => {
                    const checked = filters.occasion.some(f => f.toLowerCase() === occ.toLowerCase());
                    return (
                      <label key={occ} className="lux-checkbox-row">
                        <input 
                          type="checkbox" 
                          checked={checked} 
                          onChange={() => handleFilterChange('occasion', occ)} 
                        />
                        <span className="lux-custom-box">
                          {checked && <Check size={11} strokeWidth={3} />}
                        </span>
                        <span className="lux-label-text">{occ}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Product Grid Area */}
        <div className="plp-grid-container">
          {loading ? (
            <div className="plp-loading-state">
              <div className="plp-spinner" />
              <p>Curating handcrafted collection...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="plp-empty-state">
              <Sparkles size={32} className="empty-icon" />
              <h3>No Silhouettes Match Your Selection</h3>
              <p>Refine your filters or clear them to view the complete benchmade range.</p>
              <button className="plp-reset-btn" onClick={clearFilters}>Reset Filters</button>
            </div>
          ) : (
            <div className={`plp-luxury-grid cols-${gridColumns}`}>
              {filteredProducts.map((product, idx) => {
                const { title: cleanTitle, colorSuffix } = cleanProductName(product.name);
                const isWishlisted = wishlistedIds.includes(product.id);
                const originalPrice = product.specifications?.MRP 
                  ? parseInt(product.specifications.MRP.replace(/[^0-9]/g, ''), 10)
                  : Math.round((product.price * 1.15) / 100) * 100;
                const discountPct = originalPrice > product.price 
                  ? Math.round(((originalPrice - product.price) / originalPrice) * 100) 
                  : 0;

                // Subtle micro badge label
                const badgeLabel = product.tag === 'NEW' 
                  ? '✦ NEW CREATION'
                  : product.tag === 'BESTSELLER' 
                  ? '✦ BESTSELLER'
                  : product.tag === 'POPULAR'
                  ? '✦ PATINA FINISH'
                  : product.tag === 'BESPOKE'
                  ? '✦ BENCHMADE'
                  : product.specifications?.Construction
                  ? `✦ ${product.specifications.Construction.toUpperCase()}`
                  : null;

                const cardElements = [];

                // Insert In-Grid Bespoke Editorial Card at index 4
                if (idx === 4) {
                  cardElements.push(
                    <div className="plp-bespoke-tile" key="in-grid-bespoke">
                      <div className="bespoke-tile-inner">
                        <div className="bespoke-crest">COBCULT ATELIER</div>
                        <h3 className="bespoke-heading">Bespoke &amp; Made-To-Measure</h3>
                        <p className="bespoke-desc">
                          Cannot find your exact width, leather grade, or custom patina? Commission a 1-of-1 pair hand-lasted to your anatomical measurements.
                        </p>
                        <div className="bespoke-specs">
                          <span>✦ Custom Last Carving</span>
                          <span>✦ Goodyear Welted</span>
                          <span>✦ Italian Full-Grain Leathers</span>
                        </div>
                        <Link href="/customize" className="bespoke-cta-button">
                          Open 3D Customizer <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  );
                }

                // Main Product Card
                cardElements.push(
                  <div 
                    key={product.id} 
                    className="plp-card-lux"
                    data-testid={`product-card-${product.id}`}
                  >
                    {/* Image Area with Quick Actions */}
                    <div className="plp-card-media">
                      <Link href={getProductLink(product)} className="plp-media-link">
                        <LuxuryProductImage 
                          images={product.images} 
                          alt={cleanTitle}
                          priority={idx < 4}
                        />
                      </Link>

                      {/* Micro Badge */}
                      {badgeLabel && (
                        <div className="plp-card-badge">
                          <span>{badgeLabel}</span>
                        </div>
                      )}

                      {/* Card Action Icons (Wishlist + Quick View) */}
                      <div className="plp-card-actions">
                        <button 
                          type="button"
                          className={`plp-action-circle ${isWishlisted ? 'is-active' : ''}`}
                          onClick={(e) => handleWishlistClick(e, product.id)}
                          data-testid={`plp-wishlist-${product.id}`}
                          title="Save to Wishlist"
                        >
                          <Heart 
                            size={16} 
                            fill={isWishlisted ? '#9d2706' : 'none'} 
                            color={isWishlisted ? '#9d2706' : 'currentColor'} 
                          />
                        </button>
                        <button 
                          type="button"
                          className="plp-action-circle"
                          onClick={(e) => handleOpenQuickView(e, product)}
                          title="Quick View Details"
                        >
                          <Eye size={16} />
                        </button>
                      </div>

                      {/* Slide-Up Quick Size Selector */}
                      <div className="plp-quick-sizes-bar">
                        <div className="quick-sizes-title">QUICK ADD SIZE:</div>
                        <div className="quick-sizes-row">
                          {(product.sizes && product.sizes.length ? product.sizes : ['6', '7', '8', '9', '10', '11']).map((sz) => {
                            const isAdding = addingSizeMap[`${product.id}-${sz}`];
                            return (
                              <button
                                key={sz}
                                type="button"
                                disabled={isAdding}
                                className={`quick-size-pill ${isAdding ? 'is-adding' : ''}`}
                                onClick={(e) => handleQuickAddSize(e, product, sz)}
                                title={`Add size UK ${sz} to Bag`}
                              >
                                {isAdding ? '...' : sz}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Product Details Area */}
                    <div className="plp-card-details">
                      <Link href={getProductLink(product)} className="plp-details-link">
                        <h2 className="plp-card-title">{cleanTitle}</h2>
                        <div className="plp-card-leather">
                          {product.material || 'Full-Grain Leather'}
                          {colorSuffix ? ` · ${colorSuffix}` : ''}
                        </div>
                      </Link>

                      {/* Color Swatch Dots */}
                      <div className="plp-card-swatches">
                        {(product.colors && product.colors.length > 0 ? product.colors : [{ name: 'Black', hex: '#1a1a1a' }]).map((c, i) => (
                          <span 
                            key={i} 
                            className="card-swatch-dot" 
                            style={{ backgroundColor: c.hex }} 
                            title={c.name} 
                          />
                        ))}
                      </div>

                      {/* Luxury Price Row */}
                      <div className="plp-card-price-row">
                        <span className="price-current">{formatPrice(product.price)}</span>
                        {originalPrice > product.price && (
                          <>
                            <span className="price-original">{formatPrice(originalPrice)}</span>
                            {discountPct > 0 && (
                              <span className="price-discount-tag">-{discountPct}%</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );

                return cardElements;
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="plp-floating-toast">
          <div className="toast-inner">
            <Check size={16} className="toast-check" />
            <span>{toastMessage}</span>
            <Link href="/cart" className="toast-cart-btn">View Bag</Link>
          </div>
        </div>
      )}

      {/* Quick View Modal */}
      {quickViewProduct && (
        <div className="interstitial-overlay" onClick={() => setQuickViewProduct(null)}>
          <div className="quickview-modal-panel" onClick={(e) => e.stopPropagation()}>
            <button className="quickview-close-btn" onClick={() => setQuickViewProduct(null)}>
              <X size={20} />
            </button>
            <div className="quickview-grid">
              <div className="quickview-gallery">
                <div className="quickview-main-img">
                  <Image
                    src={(quickViewProduct.images && quickViewProduct.images[0]) || '/placeholder-shoe.svg'}
                    alt={quickViewProduct.name}
                    fill
                    sizes="400px"
                    style={{ objectFit: 'contain', padding: '24px' }}
                  />
                </div>
              </div>

              <div className="quickview-info">
                <div className="qv-atelier-tag">HAND-LASTED ATELIER</div>
                <h3 className="qv-title">{cleanProductName(quickViewProduct.name).title}</h3>
                <div className="qv-leather">{quickViewProduct.material || 'Full-Grain Leather'}</div>

                <div className="qv-price-row">
                  <span className="qv-price">{formatPrice(quickViewProduct.price)}</span>
                  {quickViewProduct.price && (
                    <span className="qv-tax-note">Inclusive of all taxes &amp; bespoke delivery</span>
                  )}
                </div>

                <p className="qv-desc">
                  {quickViewProduct.description || "Handcrafted through over 200 individual operations. Featuring reinforced welt construction, anatomical memory-foam footbed, and water-repellent patina treatment."}
                </p>

                {/* Size Selector */}
                <div className="qv-sizes-section">
                  <div className="qv-sizes-header">
                    <span>SELECT SIZE (UK)</span>
                    <Link href="/size-guide" className="qv-guide-link">Size Guide</Link>
                  </div>
                  <div className="qv-sizes-grid">
                    {(quickViewProduct.sizes || ['6', '7', '8', '9', '10', '11']).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        className={`qv-size-btn ${quickViewSize === sz ? 'is-active' : ''}`}
                        onClick={() => setQuickViewSize(sz)}
                      >
                        UK {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="qv-actions">
                  <button 
                    className="qv-add-cart-btn" 
                    onClick={handleQuickViewAddToCart}
                  >
                    <ShoppingCart size={16} /> Add to Bag · UK {quickViewSize}
                  </button>
                  <Link 
                    href={getProductLink(quickViewProduct)} 
                    className="qv-view-pdp-link"
                    onClick={() => setQuickViewProduct(null)}
                  >
                    View Complete Details &amp; Specifications →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
};

const ProductListPage = (props) => {
  return (
    <Suspense fallback={<div style={{ padding: '120px 24px', textAlign: 'center', fontFamily: 'Montserrat, sans-serif' }}>Curating handcrafted footwear catalog...</div>}>
      <ProductListContent {...props} />
    </Suspense>
  );
};

export default ProductListPage;
