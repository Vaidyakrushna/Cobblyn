"use client";
﻿import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Heart, Share2, Truck, Shield, RotateCcw, Award, Star, X, Palette, ShoppingBag, CheckCircle, Ruler } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

import Image from 'next/image';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import ProductReviews from '../components/ProductReviews';
import SizeGuide from '../components/SizeGuide';

const mockReviews = [
  { id: 1, name: 'Rahul Sharma', rating: 5, date: '2 weeks ago', text: 'Exceptional quality and craftsmanship. The leather feels premium and the fit is perfect. Worth every rupee.' },
  { id: 2, name: 'Priya Mehta', rating: 5, date: '1 month ago', text: 'Ordered as a gift for my husband. He absolutely loves them. The packaging was beautiful too.' },
  { id: 3, name: 'Arun Kapoor', rating: 4, date: '1 month ago', text: 'Very comfortable right out of the box. The Goodyear welt construction gives great durability.' },
  { id: 4, name: 'Sneha Verma', rating: 5, date: '2 months ago', text: 'Best Indian brand for handcrafted shoes. The attention to detail is remarkable.' },
  { id: 5, name: 'Vikram Singh', rating: 4, date: '3 months ago', text: 'Good product. Delivery was on time and the shoe matched the pictures exactly.' },
];

const ProductPDP = ({ gender = 'men' }) => {
  const { id } = useParams();
  const navigate = useRouter();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState('');
  const [openSections, setOpenSections] = useState({ details: true, care: false, shipping: false });
  const [loginPanel, setLoginPanel] = useState(false);
  const [sharePopup, setSharePopup] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [cartInterstitial, setCartInterstitial] = useState(false);
  const [cartTotal, setCartTotal] = useState(0);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  // Feature B: Sizing Fit Profiler States
  const [showFitProfiler, setShowFitProfiler] = useState(false);
  const [fitBrand, setFitBrand] = useState('Nike');
  const [fitSize, setFitSize] = useState('9');
  const [fitWidth, setFitWidth] = useState('Standard');
  const [fitResult, setFitResult] = useState(null);

  const calculateRecommendedSize = () => {
    const numSize = Number(fitSize);
    let recommended = numSize;
    if (fitBrand === 'Nike' || fitBrand === 'Adidas') {
      recommended = numSize - 1;
    } else {
      recommended = numSize;
    }
    if (fitWidth === 'Wide') {
      recommended = Math.min(12, recommended + 0.5);
    } else if (fitWidth === 'Narrow') {
      recommended = Math.max(6, recommended - 0.5);
    }
    setFitResult(recommended);
  };

  // Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const data = await api.getProduct(id);
        setProduct(data);
        setSelectedColor((data.colors || [])[0]?.name || '');

        // Fetch related products
        const relData = await api.getProducts({ gender: data.gender || gender, limit: 5 });
        setRelatedProducts((relData.products || []).filter(p => p.id !== data.id).slice(0, 4));

        // Check wishlist
        if (isAuthenticated) {
          const wl = await api.checkWishlist(data.id);
          setIsWishlisted(wl.in_wishlist);
        }
      } catch (err) {
        console.error('Failed to fetch product:', err);
      }
      setLoading(false);
    };
    fetchProduct();
    setSelectedImage(0);
    setQuantity(1);
  }, [id, gender, isAuthenticated]);

  // Real-time variant stock polling (every 30 seconds)
  useEffect(() => {
    if (!id) return;
    const interval = setInterval(async () => {
      try {
        const data = await api.getProduct(id);
        if (data && data.size_stock) {
          setProduct(prev => {
            if (!prev) return data;
            return {
              ...prev,
              size_stock: data.size_stock
            };
          });
        }
      } catch (err) {
        console.error('Failed to poll variant stock:', err);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading || !product) {
    return <div className="pdp-container" style={{ padding: '80px 48px', textAlign: 'center' }}>Loading...</div>;
  }

  const avgRating = (mockReviews.reduce((sum, r) => sum + r.rating, 0) / mockReviews.length).toFixed(1);

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleAddToCart = async () => {
    if (!selectedSize) { alert('Please select a size'); return; }
    
    // Check dynamic variant stock limits
    const sizeStock = product.size_stock || {};
    const stockCount = sizeStock[String(selectedSize)] !== undefined ? Number(sizeStock[String(selectedSize)]) : 10;
    if (stockCount === 0) {
      alert(`Size UK ${selectedSize} is currently out of stock. Please select another size or contact support.`);
      return;
    }

    if (!isAuthenticated) { setLoginPanel(true); return; }
    try {
      await api.addToCart({ product_id: product.id, size: selectedSize, color: selectedColor, quantity });
      window.dispatchEvent(new Event('cobblyn-cart-update'));
      // Open interstitial showing the just-added item with checkout option
      try {
        const cart = await api.getCart();
        const subtotal = (cart?.items || []).reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 1), 0);
        setCartTotal(subtotal);
      } catch (_) { /* non-fatal */ }
      setCartInterstitial(true);
    } catch (err) {
      alert('Failed to add to cart: ' + err.message);
    }
  };

  const handleWishlistClick = async () => {
    if (!isAuthenticated) { setLoginPanel(true); return; }
    try {
      if (isWishlisted) {
        await api.removeFromWishlist(product.id);
        setIsWishlisted(false);
      } else {
        await api.addToWishlist(product.id);
        setIsWishlisted(true);
      }
      window.dispatchEvent(new Event('cobblyn-wishlist-update'));
    } catch (err) {
      console.error('Wishlist error:', err);
    }
  };

  const handleShareClick = () => {
    setSharePopup(!sharePopup);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied!');
    setSharePopup(false);
  };

  const basePath = gender === 'women' ? '/women' : gender === 'luxe-collection' ? '/luxe-collection' : '/men';

  const getCustomizeUrl = () => {
    const model = product.model || product.category || (product.specifications && (product.specifications['Category'] || product.specifications['Style'])) || '';
    const submodel = product.name || '';
    const leather = product.leather || (product.specifications && (product.specifications['Material'] || product.specifications['Leather Type'] || product.specifications['Leather'])) || '';
    const color = selectedColor || '';
    const sole = product.sole || (product.specifications && (product.specifications['Sole'] || product.specifications['Sole Type'])) || '';
    
    const qs = new URLSearchParams({
      gender: gender === 'luxe-collection' ? (product.gender || 'men') : gender,
      model: model,
      submodel: submodel,
      leather: leather,
      color: color,
      sole: sole
    }).toString();
    return `/customize/${gender === 'luxe-collection' ? (product.gender || 'men') : gender}?${qs}`;
  };

  return (
    <div className="pdp-container" data-testid="product-pdp">
      <div className="breadcrumbs">
        <Link href="/">Home</Link>
        <ChevronRight size={14} />
        <Link href={basePath}>{gender === 'women' ? "Women's" : gender === 'luxe-collection' ? "Luxe" : "Men's"} Collection</Link>
        <ChevronRight size={14} />
        <span>{product.name}</span>
      </div>

      <div className="pdp-main-woodland">
        <div className="pdp-gallery-woodland">
          <div className="gallery-thumbs-col">
            {(product.images || []).map((img, idx) => (
              <button
                key={idx}
                className={`gallery-thumb-woodland ${selectedImage === idx ? 'active' : ''}`}
                onClick={() => setSelectedImage(idx)}
                data-testid={`gallery-thumb-${idx}`}
              >
                <img src={img} alt={`${product.name} view ${idx + 1}`} />
              </button>
            ))}
          </div>
          <div className="gallery-main-woodland">
            <Image src={(product.images || [])[selectedImage] || ''} alt={product.name} fill priority sizes="(max-width: 768px) 100vw, 50vw" style={{ objectFit: 'cover' }} data-testid="main-product-image" />
            {product.tag && <div className="pdp-tag">{product.tag}</div>}
          </div>
        </div>

        <div className="pdp-info-woodland">
          <div className="pdp-top-actions">
            <button className="pdp-action-btn" onClick={handleWishlistClick} data-testid="pdp-wishlist-button" title="Add to Wishlist">
              <Heart size={16} fill={isWishlisted ? '#9d2706' : 'none'} color={isWishlisted ? '#9d2706' : 'currentColor'} />
              <span>{isWishlisted ? 'Wishlisted' : 'Wishlist'}</span>
            </button>
            <div className="pdp-share-wrapper">
              <button className="pdp-action-btn" onClick={handleShareClick} data-testid="share-button" title="Share">
                <Share2 size={16} />
                <span>Share</span>
              </button>
              {sharePopup && (
                <div className="share-popup" data-testid="share-popup">
                  <button onClick={() => { window.open(`https://wa.me/?text=${encodeURIComponent(product.name + ' - ' + window.location.href)}`, '_blank'); setSharePopup(false); }} data-testid="share-whatsapp">WhatsApp</button>
                  <button onClick={() => { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank'); setSharePopup(false); }} data-testid="share-facebook">Facebook</button>
                  <button onClick={handleCopyLink} data-testid="share-copy">Copy Link</button>
                </div>
              )}
            </div>
          </div>

          <h1 className="pdp-product-name" data-testid="product-name">{product.name}</h1>
          <div className="pdp-rating-row" data-testid="product-rating">
            <div className="pdp-stars">
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={14} fill={i <= Math.round(avgRating) ? '#9d2706' : 'none'} color="#9d2706" />
              ))}
            </div>
            <span className="pdp-rating-text">{avgRating} | {mockReviews.length} Ratings</span>
            <span className="pdp-sku">SKU: {product.articleCode}</span>
          </div>

          <div className="pdp-price-woodland" data-testid="product-price">
            {(product.price || 0).toLocaleString()}.00
            <span className="pdp-price-note">(Inclusive of all taxes)</span>
          </div>

          <div className="pdp-section-block">
            <label className="pdp-block-label">Available Colors</label>
            <div className="pdp-color-swatches">
              {(product.colors || []).map((color) => (
                <button
                  key={color.name}
                  className={`pdp-swatch ${selectedColor === color.name ? 'active' : ''}`}
                  onClick={() => setSelectedColor(color.name)}
                  data-testid={`color-${color.name.toLowerCase()}`}
                  title={color.name}
                >
                  <span className="swatch-inner" style={{ backgroundColor: color.hex }}></span>
                </button>
              ))}
              <span className="pdp-color-name">{selectedColor}</span>
            </div>
          </div>

          <div className="pdp-section-block">
            <div className="pdp-block-header">
              <label className="pdp-block-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Select Size (UK)</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button type="button" onClick={() => setShowFitProfiler(true)} data-testid="open-fit-profiler"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, color: '#9d2706', fontSize: 12, textDecoration: 'underline', textTransform: 'none', letterSpacing: 0, fontWeight: '600' }}>
                    <Star size={12} fill="#9d2706" /> Find My Fit
                  </button>
                  <button type="button" onClick={() => setSizeGuideOpen(true)} data-testid="open-size-guide"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, color: '#6B7280', fontSize: 12, textDecoration: 'underline', textTransform: 'none', letterSpacing: 0 }}>
                    <Ruler size={12} /> Size Guide
                  </button>
                </div>
              </label>
              <button className="find-size-link" data-testid="find-size-link">Size Chart</button>
            </div>
            <div className="pdp-size-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {(product.sizes || []).map((size) => {
                const sizeStock = product.size_stock || {};
                const stockCount = sizeStock[String(size)] !== undefined ? Number(sizeStock[String(size)]) : 10;
                const isOutOfStock = stockCount === 0;
                const isLowStock = !isOutOfStock && stockCount <= 3;
                
                return (
                  <button
                    key={size}
                    className={`pdp-size-box ${selectedSize === size ? 'active' : ''} ${isOutOfStock ? 'out-of-stock' : ''}`}
                    onClick={() => isOutOfStock ? null : setSelectedSize(size)}
                    data-testid={`size-${size}`}
                    style={{
                      width: '48px',
                      height: '48px',
                      opacity: isOutOfStock ? 0.4 : 1,
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                      border: selectedSize === size 
                        ? '2px solid #9d2706' 
                        : isLowStock 
                          ? '1.5px solid rgba(157, 39, 6, 0.6)' 
                          : '1px solid #E5E7EB',
                      borderStyle: isOutOfStock ? 'dashed' : 'solid',
                      backgroundColor: isOutOfStock 
                        ? '#F3F4F6' 
                        : selectedSize === size 
                          ? '#FAF9F6' 
                          : isLowStock 
                            ? 'rgba(157, 39, 6, 0.03)' 
                            : 'inherit',
                      textDecoration: isOutOfStock ? 'line-through' : 'none',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: selectedSize === size ? '700' : '500',
                      color: isOutOfStock ? '#9CA3AF' : '#1F2937',
                      transition: 'all 0.2s ease',
                    }}
                    title={isOutOfStock ? `UK ${size} - Out of Stock` : `UK ${size} - In Stock`}
                  >
                    {size}
                    
                    {/* Subtle low stock warning dot indicator (no exact numbers shown) */}
                    {isLowStock && (
                      <span style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: '#9d2706',
                        boxShadow: '0 0 4px rgba(157,39,6,0.8)'
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Real-Time Variant Stock Alerts Banner */}
            {selectedSize && (() => {
              const sizeStock = product.size_stock || {};
              const stockCount = sizeStock[String(selectedSize)] !== undefined ? Number(sizeStock[String(selectedSize)]) : 10;
              
              if (stockCount === 0) {
                return (
                  <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', fontSize: '0.75rem', color: 'rgb(220, 38, 38)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ❌ Size UK {selectedSize} is currently out of stock. Contact our concierge to request a custom restock.
                  </div>
                );
              }
              if (stockCount <= 3) {
                return (
                  <div 
                    style={{ 
                      marginTop: '12px', 
                      padding: '12px 14px', 
                      background: 'rgba(157, 39, 6, 0.07)', 
                      border: '1px solid rgba(157, 39, 6, 0.4)', 
                      borderRadius: '6px', 
                      fontSize: '0.75rem', 
                      color: '#9A7D32', 
                      fontWeight: 700, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      boxShadow: '0 0 10px rgba(157, 39, 6, 0.15)',
                      animation: 'pdpGlow 2s infinite ease-in-out'
                    }}
                  >
                    <span style={{ fontSize: '14px' }}>⚠️</span>
                    <span>Only a few pairs left in size UK {selectedSize}! Order soon to secure your fit.</span>
                    <style>{`
                      @keyframes pdpGlow {
                        0% { box-shadow: 0 0 6px rgba(157, 39, 6, 0.1); }
                        50% { box-shadow: 0 0 14px rgba(157, 39, 6, 0.3); border-color: rgba(157, 39, 6, 0.6); }
                        100% { box-shadow: 0 0 6px rgba(157, 39, 6, 0.1); }
                      }
                    `}</style>
                  </div>
                );
              }
              return (
                <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '6px', fontSize: '0.75rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  ✓ Size UK {selectedSize} is in stock and ready for immediate dispatch.
                </div>
              );
            })()}
          </div>

          <div className="pdp-delivery-block">
            <div className="pdp-delivery-header">
              <Truck size={18} />
              <span className="delivery-title">Check Delivery Date</span>
            </div>
            <div className="pdp-pincode-row">
              <input type="text" placeholder="Enter pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} className="pincode-input" data-testid="pincode-input" />
              <button className="pincode-check-btn" data-testid="pincode-check-btn">Check</button>
            </div>
            <div className="pdp-delivery-badges">
              {(!product.customized && product.category !== 'bespoke') && <span>COD available</span>}
              <span>100% Originals</span>
              <span>Free Shipping</span>
              <span>Easy 15 days returns</span>
            </div>
          </div>

          <div className="pdp-cart-section">
            <div className="pdp-qty-woodland">
              <button className="qty-btn-w" onClick={() => setQuantity(Math.max(1, quantity - 1))} data-testid="decrease-quantity">-</button>
              <span className="qty-val-w" data-testid="quantity-value">{quantity}</span>
              <button className="qty-btn-w" onClick={() => setQuantity(quantity + 1)} data-testid="increase-quantity">+</button>
            </div>
            <button className="pdp-add-cart-btn" onClick={handleAddToCart} data-testid="add-to-cart-button">
              Add to Cart
            </button>
          </div>

          {product.customized && (
            <Link href={getCustomizeUrl()} className="pdp-customize-btn" data-testid="customize-button">
              <Palette size={18} />
              Customize This Style
            </Link>
          )}

          <div className="pdp-accordions">
            <div className="pdp-accordion-item">
              <button className="pdp-accordion-header" onClick={() => toggleSection('details')} data-testid="accordion-details">
                <span>Product Details</span>
                <ChevronDown size={18} className={openSections.details ? 'rotate-180' : ''} />
              </button>
              {openSections.details && (
                <div className="pdp-accordion-body">
                  <div className="pdp-specs-table">
                    {Object.entries(product.specifications || {}).map(([key, value]) => (
                      <div key={key} className="pdp-spec-row">
                        <span className="spec-key">{key}</span>
                        <span className="spec-val">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pdp-features-list">
                    <h4>Key Features</h4>
                    <ul>{(product.features || []).map((f, i) => <li key={i}>{f}</li>)}</ul>
                  </div>
                </div>
              )}
            </div>

            <div className="pdp-accordion-item">
              <button className="pdp-accordion-header" onClick={() => toggleSection('care')} data-testid="accordion-care">
                <span>Care Instructions</span>
                <ChevronDown size={18} className={openSections.care ? 'rotate-180' : ''} />
              </button>
              {openSections.care && (
                <div className="pdp-accordion-body">
                  <ul className="pdp-policy-list">
                    <li>Keep your product dry, avoid getting it wet or damp</li>
                    <li>To clean, simply wipe with a dry cloth</li>
                    <li>Use shoe trees to maintain shape when not in use</li>
                    <li>Apply leather conditioner every 2-3 months</li>
                    <li>Store in the provided dust bag away from direct sunlight</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="pdp-accordion-item">
              <button className="pdp-accordion-header" onClick={() => toggleSection('shipping')} data-testid="accordion-shipping">
                <span>Shipping & Return Policy</span>
                <ChevronDown size={18} className={openSections.shipping ? 'rotate-180' : ''} />
              </button>
              {openSections.shipping && (
                <div className="pdp-accordion-body">
                  <ul className="pdp-policy-list">
                    <li>Free shipping across India on all orders</li>
                    <li>Standard delivery within 3-5 business days</li>
                    <li>Bespoke orders delivered in 15-20 business days</li>
                    <li>15-day hassle-free return and exchange policy</li>
                    <li>Full refund on unused products returned in original packaging</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="pdp-trust-badges">
            <div className="trust-badge"><Shield size={20} /><span>Authentic Quality</span></div>
            <div className="trust-badge"><RotateCcw size={20} /><span>Easy Returns</span></div>
            <div className="trust-badge"><Award size={20} /><span>Handcrafted</span></div>
            <div className="trust-badge"><Truck size={20} /><span>Free Shipping</span></div>
          </div>
        </div>
      </div>

      <div className="pdp-similar-section">
        <h2 className="similar-heading">Similar Products</h2>
        <div className="similar-grid">
          {relatedProducts.map((item) => (
            <Link href={`${basePath}/product/${item.id}`} key={item.id} className="similar-card" data-testid={`similar-product-${item.id}`}>
              {item.tag && <div className="similar-tag">{item.tag}</div>}
              <div className="similar-img"><img src={(item.images || [])[0]} alt={item.name} /></div>
              <div className="similar-info">
                <div className="similar-colors">
                  {(item.colors || []).map((c, i) => <span key={i} className="similar-color-dot" style={{ backgroundColor: c.hex }}></span>)}
                </div>
                <h3 className="similar-name">{item.name}</h3>
                <p className="similar-price">{(item.price || 0).toLocaleString()}.00</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="pdp-reviews-section" data-testid="customer-reviews">
        <ProductReviews productId={product?.id} />
      </div>

      <SizeGuide open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} gender={gender} />

      {/* Sizing Fit Profiler Modal */}
      {showFitProfiler && (
        <div className="interstitial-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="interstitial-panel glass-gilded" style={{ maxWidth: 440, width: '100%', border: '1px solid rgba(157, 39, 6, 0.3)', borderRadius: '16px', padding: '24px 32px', position: 'relative' }}>
            <button className="interstitial-close" onClick={() => { setShowFitProfiler(false); setFitResult(null); }} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: '#6B7280' }}>
              <X size={20} />
            </button>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <Ruler size={32} color="#9d2706" style={{ margin: '0 auto 8px' }} />
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', color: '#1a1a1a', margin: 0, fontStyle: 'italic' }}>Bespoke Sizing Concierge</h3>
              <p style={{ fontSize: '11px', color: '#6B7280', margin: '4px 0 0 0' }}>Map your current footwear sizes to our handcrafted Italian lasts.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#4B5563', textTransform: 'uppercase', marginBottom: 6 }}>Reference Brand You Wear</label>
                <select value={fitBrand} onChange={(e) => { setFitBrand(e.target.value); setFitResult(null); }} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '13px', background: '#fff' }}>
                  <option value="Nike">Nike (Running)</option>
                  <option value="Adidas">Adidas (Athletic)</option>
                  <option value="Clarks">Clarks (Heritage Dress)</option>
                  <option value="Allen Edmonds">Allen Edmonds (Premium Dress)</option>
                  <option value="Birkenstock">Birkenstock (Sandals)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#4B5563', textTransform: 'uppercase', marginBottom: 6 }}>Reference Size (UK/US)</label>
                  <select value={fitSize} onChange={(e) => { setFitSize(e.target.value); setFitResult(null); }} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '13px', background: '#fff' }}>
                    {['6', '7', '8', '9', '10', '11', '12'].map(s => (
                      <option key={s} value={s}>UK {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#4B5563', textTransform: 'uppercase', marginBottom: 6 }}>Foot Width Profile</label>
                  <select value={fitWidth} onChange={(e) => { setFitWidth(e.target.value); setFitResult(null); }} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '13px', background: '#fff' }}>
                    <option value="Narrow">Narrow Width</option>
                    <option value="Standard">Standard (Medium)</option>
                    <option value="Wide">Wide Width</option>
                  </select>
                </div>
              </div>

              {!fitResult ? (
                <button onClick={calculateRecommendedSize} style={{ width: '100%', padding: '12px', background: '#111', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: 8 }}>
                  Calculate Recommended Fit
                </button>
              ) : (
                <div style={{ marginTop: 10, padding: '14px', background: 'rgba(157, 39, 6, 0.08)', border: '1px solid rgba(157, 39, 6, 0.3)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#9A7D32', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Our Recommendation</div>
                  <div style={{ fontSize: '15px', color: '#1a1a1a', fontWeight: '800' }}>
                    UK {Math.floor(fitResult)} <span style={{ fontWeight: '400', fontSize: '13px', color: '#4B5563' }}>({fitWidth === 'Wide' ? 'Wide last adjustment' : fitWidth === 'Narrow' ? 'Narrow last adjustment' : 'Standard Fit'})</span>
                  </div>
                  <p style={{ fontSize: '10px', color: '#6B7280', margin: '6px 0 12px 0', lineHeight: 1.4 }}>
                    {fitBrand === 'Nike' || fitBrand === 'Adidas' 
                      ? 'Athletic running shoes run tighter. Handcrafted leather dress shoes map 1 size down for standard last molds.' 
                      : 'Perfect 1:1 match. Handcrafted to original heritage sizing profiles.'}
                  </p>
                  <button 
                    onClick={() => {
                      setSelectedSize(Math.floor(fitResult));
                      setShowFitProfiler(false);
                      setFitResult(null);
                    }}
                    style={{ width: '100%', padding: '10px', background: '#9d2706', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}
                  >
                    Apply Recommended Size UK {Math.floor(fitResult)}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {loginPanel && (
        <div className="interstitial-overlay" data-testid="pdp-login-interstitial" onClick={() => setLoginPanel(false)} style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
          <div className="interstitial-panel glass-gilded" onClick={(e) => e.stopPropagation()} style={{ border: '1px solid rgba(157, 39, 6, 0.3)' }}>
            <button className="interstitial-close" onClick={() => setLoginPanel(false)} data-testid="pdp-interstitial-close">
              <X size={20} />
            </button>
            <div className="interstitial-content">
              <Heart size={40} className="interstitial-icon" />
              <h3 className="interstitial-title">Login Required</h3>
              <p className="interstitial-desc">Please log in to add items to your wishlist or cart.</p>
              <Link href="/login" className="interstitial-login-btn" data-testid="pdp-interstitial-login-btn">
                Log In / Sign Up
              </Link>
              <button className="interstitial-skip" onClick={() => setLoginPanel(false)}>Continue Browsing</button>
            </div>
          </div>
        </div>
      )}

      {cartInterstitial && (
        <div className="interstitial-overlay" data-testid="add-to-cart-interstitial" onClick={() => setCartInterstitial(false)} style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
          <div className="interstitial-panel glass-gilded" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540, border: '1px solid rgba(157, 39, 6, 0.3)' }}>
            <button className="interstitial-close" onClick={() => setCartInterstitial(false)} data-testid="cart-interstitial-close">
              <X size={20} />
            </button>
            <div className="interstitial-content" style={{ alignItems: 'stretch', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 20, color: '#10B981' }}>
                <CheckCircle size={28} />
                <h3 className="interstitial-title" style={{ margin: 0, color: '#1a1a1a' }}>Added to Cart</h3>
              </div>

              <div style={{ display: 'flex', gap: 16, padding: 16, background: '#FAFAFA', borderRadius: 8, marginBottom: 20 }}>
                <div style={{ width: 96, height: 96, flexShrink: 0, borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
                  <img src={(product.images || [])[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, fontSize: 14 }}>
                  <div style={{ fontWeight: 600, color: '#1a1a1a', marginBottom: 6 }} data-testid="cart-interstitial-product-name">{product.name}</div>
                  <div style={{ color: '#6B7280', fontSize: 13, marginBottom: 4 }}>Size: <strong>UK {selectedSize}</strong> Â· Color: <strong>{selectedColor}</strong></div>
                  <div style={{ color: '#6B7280', fontSize: 13, marginBottom: 8 }}>Qty: <strong>{quantity}</strong></div>
                  <div style={{ color: '#1a1a1a', fontWeight: 600 }}>{'\u20B9'}{((product.price || 0) * quantity).toLocaleString()}</div>
                </div>
              </div>

              {cartTotal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB', marginBottom: 20, fontSize: 14 }}>
                  <span style={{ color: '#6B7280' }}>Cart subtotal</span>
                  <strong style={{ color: '#1a1a1a' }} data-testid="cart-interstitial-subtotal">{'\u20B9'}{cartTotal.toLocaleString()}</strong>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setCartInterstitial(false)}
                  className="interstitial-skip"
                  data-testid="cart-interstitial-continue"
                  style={{ flex: 1, padding: '12px 16px', border: '1px solid #1a1a1a', background: '#fff', color: '#1a1a1a', cursor: 'pointer', fontWeight: 500, fontSize: 13, letterSpacing: '0.04em' }}>
                  CONTINUE SHOPPING
                </button>
                <button onClick={() => { setCartInterstitial(false); router.push('/checkout'); }}
                  data-testid="cart-interstitial-checkout"
                  style={{ flex: 1, padding: '12px 16px', border: 'none', background: '#1a1a1a', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <ShoppingBag size={16} /> CHECKOUT
                </button>
              </div>

              <button onClick={() => { setCartInterstitial(false); router.push('/cart'); }}
                data-testid="cart-interstitial-view-cart"
                style={{ marginTop: 12, width: '100%', padding: '8px', background: 'transparent', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>
                View Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPDP;

