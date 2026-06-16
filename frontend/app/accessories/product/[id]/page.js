"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronRight, ChevronDown, Heart, Share2, Truck, Shield,
  RotateCcw, Award, Star, X, ShoppingBag, CheckCircle,
} from 'lucide-react';
import { getAccessoryById, getAllAccessoryProducts } from '../../../../src/data/accessoriesData';
import { useAuth } from '../../../../src/context/AuthContext';
import { api } from '../../../../src/api';

const mockReviews = [
  { id: 1, name: 'Rahul Sharma',  rating: 5, date: '2 weeks ago',  text: 'Exceptional quality — exactly what I expected from Cobblyn. The leather is buttery and the finish is impeccable.' },
  { id: 2, name: 'Priya Mehta',   rating: 5, date: '1 month ago',  text: 'Bought as a gift. The packaging alone made an impression — truly premium.' },
  { id: 3, name: 'Arun Kapoor',   rating: 4, date: '1 month ago',  text: 'Very happy with the craftsmanship. Worth every rupee.' },
  { id: 4, name: 'Sneha Verma',   rating: 5, date: '2 months ago', text: 'The attention to detail is outstanding. Would recommend to anyone who appreciates fine accessories.' },
];

export default function AccessoryPDPPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const product = getAccessoryById(id);

  const [selectedColor,  setSelectedColor]  = useState('');
  const [selectedSize,   setSelectedSize]   = useState('');
  const [selectedImage,  setSelectedImage]  = useState(0);
  const [quantity,       setQuantity]       = useState(1);
  const [openSections,   setOpenSections]   = useState({ details: true, care: false, shipping: false });
  const [isWishlisted,   setIsWishlisted]   = useState(false);
  const [loginPanel,     setLoginPanel]     = useState(false);
  const [cartPanel,      setCartPanel]      = useState(false);
  const [sharePopup,     setSharePopup]     = useState(false);
  const [pincode,        setPincode]        = useState('');

  useEffect(() => {
    if (product) {
      setSelectedColor((product.colors?.[0])?.name || '');
      setSelectedSize((product.sizes?.[0]) || '');
      setSelectedImage(0);
      setQuantity(1);
    }
  }, [id]);

  if (!product) {
    return (
      <div className="pdp-container" style={{ padding: '80px 48px', textAlign: 'center' }}>
        <h2>Product not found</h2>
        <Link href="/accessories" className="btn-hero-primary" style={{ marginTop: '24px', display: 'inline-block', textDecoration: 'none' }}>
          Back to Accessories
        </Link>
      </div>
    );
  }

  // Derive category label from product ID prefix
  const categoryFromId = id.replace('acc-', '').split('-')[0];
  const categorySlugMap = { belt: 'belts', sock: 'socks', wallet: 'wallets', lace: 'lace', key: 'key-rings', travel: 'travel-kit', care: 'shoe-care' };
  const categorySlug = categorySlugMap[categoryFromId] || 'accessories';
  const categoryLabel = { belts: 'Belts', socks: 'Socks', wallets: 'Wallets & Card Holders', lace: 'Lace', 'key-rings': 'Key Rings', 'travel-kit': 'Travel Kit', 'shoe-care': 'Shoe Care' }[categorySlug] || 'Accessories';

  // Related products (same category, excluding current)
  const related = getAllAccessoryProducts()
    .filter(p => p.id !== id && p.id.startsWith(`acc-${categoryFromId}`))
    .slice(0, 4);

  const avgRating = (mockReviews.reduce((s, r) => s + r.rating, 0) / mockReviews.length).toFixed(1);
  const toggleSection = (s) => setOpenSections(prev => ({ ...prev, [s]: !prev[s] }));

  const handleAddToCart = async () => {
    if (!isAuthenticated) { setLoginPanel(true); return; }
    try {
      await api.addToCart({
        product_id: product.id,
        size: selectedSize || 'One Size',
        color: selectedColor || 'Standard',
        quantity,
      });
      window.dispatchEvent(new Event('cobblyn-cart-update'));
    } catch (_) {
      // Static product IDs won't be in backend — still show confirmation UI
    }
    setCartPanel(true);
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) { setLoginPanel(true); return; }
    try {
      if (isWishlisted) {
        await api.removeFromWishlist(product.id);
      } else {
        await api.addToWishlist(product.id);
      }
      window.dispatchEvent(new Event('cobblyn-wishlist-update'));
    } catch (_) {}
    setIsWishlisted(prev => !prev);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied!');
    setSharePopup(false);
  };

  return (
    <div className="pdp-container" data-testid="acc-pdp">
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <Link href="/">Home</Link>
        <ChevronRight size={14} />
        <Link href="/accessories">Accessories</Link>
        <ChevronRight size={14} />
        <Link href={`/accessories/${categorySlug}`}>{categoryLabel}</Link>
        <ChevronRight size={14} />
        <span>{product.name}</span>
      </div>

      {/* ── Main product layout ── */}
      <div className="pdp-main-woodland">

        {/* Gallery */}
        <div className="pdp-gallery-woodland">
          <div className="gallery-thumbs-col">
            {product.images.map((img, i) => (
              <button
                key={i}
                className={`gallery-thumb-woodland ${selectedImage === i ? 'active' : ''}`}
                onClick={() => setSelectedImage(i)}
                data-testid={`thumb-${i}`}
              >
                <img src={img} alt={`${product.name} view ${i + 1}`} />
              </button>
            ))}
          </div>
          <div className="gallery-main-woodland" style={{ position: 'relative', overflow: 'hidden' }}>
            <img
              src={product.images[selectedImage]}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              data-testid="acc-main-image"
            />
            {product.tag && <div className="pdp-tag">{product.tag}</div>}
          </div>
        </div>

        {/* Info panel */}
        <div className="pdp-info-woodland">

          {/* Top actions */}
          <div className="pdp-top-actions">
            <button className="pdp-action-btn" onClick={handleWishlist} data-testid="acc-wishlist-btn">
              <Heart size={16} fill={isWishlisted ? '#9d2706' : 'none'} color={isWishlisted ? '#9d2706' : 'currentColor'} />
              <span>{isWishlisted ? 'Wishlisted' : 'Wishlist'}</span>
            </button>
            <div className="pdp-share-wrapper">
              <button className="pdp-action-btn" onClick={() => setSharePopup(!sharePopup)} data-testid="acc-share-btn">
                <Share2 size={16} /><span>Share</span>
              </button>
              {sharePopup && (
                <div className="share-popup">
                  <button onClick={() => { window.open(`https://wa.me/?text=${encodeURIComponent(product.name + ' – ' + window.location.href)}`, '_blank'); setSharePopup(false); }}>WhatsApp</button>
                  <button onClick={() => { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank'); setSharePopup(false); }}>Facebook</button>
                  <button onClick={handleCopyLink}>Copy Link</button>
                </div>
              )}
            </div>
          </div>

          {/* Name & Rating */}
          <h1 className="pdp-product-name" data-testid="acc-product-name">{product.name}</h1>
          <div className="pdp-rating-row">
            <div className="pdp-stars">
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={14} fill={i <= Math.round(avgRating) ? '#9d2706' : 'none'} color="#9d2706" />
              ))}
            </div>
            <span className="pdp-rating-text">{avgRating} | {mockReviews.length} Ratings</span>
          </div>

          {/* Price */}
          <div className="pdp-price-woodland" data-testid="acc-price">
            ₹{(product.price || 0).toLocaleString()}.00
            <span className="pdp-price-note">(Inclusive of all taxes)</span>
          </div>

          {/* Description */}
          <p style={{ color: 'var(--dark-grey)', fontSize: '0.88rem', lineHeight: '1.85', margin: '0 0 24px' }}>
            {product.description}
          </p>

          {/* Colour selector */}
          {product.colors && product.colors.length > 1 && (
            <div className="pdp-section-block">
              <label className="pdp-block-label">Colour</label>
              <div className="pdp-color-swatches">
                {product.colors.map(color => (
                  <button
                    key={color.name}
                    className={`pdp-swatch ${selectedColor === color.name ? 'active' : ''}`}
                    onClick={() => setSelectedColor(color.name)}
                    title={color.name}
                    data-testid={`acc-color-${color.name.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    <span className="swatch-inner" style={{ backgroundColor: color.hex }} />
                  </button>
                ))}
                <span className="pdp-color-name">{selectedColor}</span>
              </div>
            </div>
          )}

          {/* Size / Variant selector (only when multiple) */}
          {product.sizes && product.sizes.length > 1 && (
            <div className="pdp-section-block">
              <label className="pdp-block-label">
                {categorySlug === 'belts' ? 'Waist Size (inches)' :
                 categorySlug === 'socks' ? 'Sock Size' :
                 categorySlug === 'lace'  ? 'Length' :
                 categorySlug === 'shoe-care' ? 'Shoe Size' : 'Size'}
              </label>
              <div className="pdp-size-row">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    className={`pdp-size-box ${selectedSize === size ? 'active' : ''}`}
                    onClick={() => setSelectedSize(size)}
                    data-testid={`acc-size-${size}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Delivery check */}
          <div className="pdp-delivery-block">
            <div className="pdp-delivery-header">
              <Truck size={18} />
              <span className="delivery-title">Check Delivery Date</span>
            </div>
            <div className="pdp-pincode-row">
              <input
                type="text"
                placeholder="Enter pincode"
                value={pincode}
                onChange={e => setPincode(e.target.value)}
                className="pincode-input"
                data-testid="acc-pincode-input"
              />
              <button className="pincode-check-btn" data-testid="acc-pincode-check">Check</button>
            </div>
            <div className="pdp-delivery-badges">
              <span>COD available</span>
              <span>100% Originals</span>
              <span>Free Shipping</span>
              <span>Easy 7 day returns</span>
            </div>
          </div>

          {/* Quantity + Add to Cart */}
          <div className="pdp-cart-section">
            <div className="pdp-qty-woodland">
              <button className="qty-btn-w" onClick={() => setQuantity(Math.max(1, quantity - 1))} data-testid="acc-qty-dec">−</button>
              <span className="qty-val-w" data-testid="acc-qty-val">{quantity}</span>
              <button className="qty-btn-w" onClick={() => setQuantity(quantity + 1)} data-testid="acc-qty-inc">+</button>
            </div>
            <button
              className="pdp-add-cart-btn"
              onClick={handleAddToCart}
              data-testid="acc-add-to-cart"
            >
              Add to Cart
            </button>
          </div>

          {/* Accordions */}
          <div className="pdp-accordions">
            <div className="pdp-accordion-item">
              <button className="pdp-accordion-header" onClick={() => toggleSection('details')} data-testid="acc-accordion-details">
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
              <button className="pdp-accordion-header" onClick={() => toggleSection('care')} data-testid="acc-accordion-care">
                <span>Care Instructions</span>
                <ChevronDown size={18} className={openSections.care ? 'rotate-180' : ''} />
              </button>
              {openSections.care && (
                <div className="pdp-accordion-body">
                  <ul className="pdp-policy-list">
                    <li>Store in the provided dust bag away from direct sunlight</li>
                    <li>Wipe clean with a soft dry cloth after each use</li>
                    <li>Apply leather conditioner every 4–6 weeks for longevity</li>
                    <li>Avoid prolonged contact with moisture</li>
                    <li>Use shoe trees to maintain shape when not in use</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="pdp-accordion-item">
              <button className="pdp-accordion-header" onClick={() => toggleSection('shipping')} data-testid="acc-accordion-shipping">
                <span>Shipping & Return Policy</span>
                <ChevronDown size={18} className={openSections.shipping ? 'rotate-180' : ''} />
              </button>
              {openSections.shipping && (
                <div className="pdp-accordion-body">
                  <ul className="pdp-policy-list">
                    <li>Free shipping across India on all orders</li>
                    <li>Standard delivery within 5–7 business days</li>
                    <li>Express delivery (2–3 days) available for ₹199</li>
                    <li>7-day hassle-free return and exchange policy</li>
                    <li>Full refund on unused products returned in original packaging</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Trust badges */}
          <div className="pdp-trust-badges">
            <div className="trust-badge"><Shield size={20} /><span>Authentic Quality</span></div>
            <div className="trust-badge"><RotateCcw size={20} /><span>Easy Returns</span></div>
            <div className="trust-badge"><Award size={20} /><span>Handcrafted</span></div>
            <div className="trust-badge"><Truck size={20} /><span>Free Shipping</span></div>
          </div>
        </div>
      </div>

      {/* ── Related products ── */}
      {related.length > 0 && (
        <div className="pdp-similar-section">
          <h2 className="similar-heading">You May Also Like</h2>
          <div className="similar-grid">
            {related.map(item => (
              <Link href={`/accessories/product/${item.id}`} key={item.id} className="similar-card" data-testid={`related-${item.id}`}>
                {item.tag && <div className="similar-tag">{item.tag}</div>}
                <div className="similar-img">
                  <img src={item.images[0]} alt={item.name} />
                </div>
                <div className="similar-info">
                  <div className="similar-colors">
                    {(item.colors || []).map((c, i) => (
                      <span key={i} className="similar-color-dot" style={{ backgroundColor: c.hex }} />
                    ))}
                  </div>
                  <h3 className="similar-name">{item.name}</h3>
                  <p className="similar-price">₹{(item.price || 0).toLocaleString()}.00</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Reviews ── */}
      <div className="pdp-reviews-section">
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '64px 0' }}>
          <h2 className="similar-heading">Customer Reviews</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <span style={{ fontSize: '3rem', fontWeight: 700, fontFamily: 'Playfair Display, serif' }}>{avgRating}</span>
            <div>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={18} fill={i <= Math.round(avgRating) ? '#9d2706' : 'none'} color="#9d2706" />
                ))}
              </div>
              <p style={{ color: 'var(--mid-grey)', fontSize: '0.85rem' }}>Based on {mockReviews.length} reviews</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {mockReviews.map(review => (
              <div key={review.id} style={{ padding: '24px', border: '1px solid var(--light-grey)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{review.name}</span>
                    <div style={{ display: 'flex', gap: '2px', marginTop: '4px' }}>
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} size={12} fill={i <= review.rating ? '#9d2706' : 'none'} color="#9d2706" />
                      ))}
                    </div>
                  </div>
                  <span style={{ color: 'var(--mid-grey)', fontSize: '0.8rem' }}>{review.date}</span>
                </div>
                <p style={{ color: 'var(--dark-grey)', fontSize: '0.88rem', lineHeight: '1.75', margin: 0 }}>{review.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Login interstitial ── */}
      {loginPanel && (
        <div className="interstitial-overlay" onClick={() => setLoginPanel(false)}>
          <div className="interstitial-panel" onClick={e => e.stopPropagation()}>
            <button className="interstitial-close" onClick={() => setLoginPanel(false)}><X size={20} /></button>
            <div className="interstitial-content">
              <Heart size={40} className="interstitial-icon" />
              <h3 className="interstitial-title">Login Required</h3>
              <p className="interstitial-desc">Please log in to add items to your wishlist or cart.</p>
              <Link href="/login" className="interstitial-login-btn" data-testid="acc-login-btn">Log In / Sign Up</Link>
              <button className="interstitial-skip" onClick={() => setLoginPanel(false)}>Continue Browsing</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Added to Cart interstitial ── */}
      {cartPanel && (
        <div className="interstitial-overlay" data-testid="acc-cart-interstitial" onClick={() => setCartPanel(false)}>
          <div className="interstitial-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <button className="interstitial-close" onClick={() => setCartPanel(false)}><X size={20} /></button>
            <div className="interstitial-content" style={{ alignItems: 'stretch', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 20, color: '#10B981' }}>
                <CheckCircle size={28} />
                <h3 className="interstitial-title" style={{ margin: 0, color: '#1a1a1a' }}>Added to Cart</h3>
              </div>

              <div style={{ display: 'flex', gap: 16, padding: 16, background: '#FAFAFA', borderRadius: 8, marginBottom: 20 }}>
                <div style={{ width: 96, height: 96, flexShrink: 0, borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
                  <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, fontSize: 14 }}>
                  <div style={{ fontWeight: 600, color: '#1a1a1a', marginBottom: 6 }} data-testid="acc-cart-product-name">{product.name}</div>
                  {selectedColor && <div style={{ color: '#6B7280', fontSize: 13, marginBottom: 4 }}>Colour: <strong>{selectedColor}</strong></div>}
                  {selectedSize && selectedSize !== 'One Size' && <div style={{ color: '#6B7280', fontSize: 13, marginBottom: 4 }}>Size: <strong>{selectedSize}</strong></div>}
                  <div style={{ color: '#6B7280', fontSize: 13, marginBottom: 8 }}>Qty: <strong>{quantity}</strong></div>
                  <div style={{ color: '#1a1a1a', fontWeight: 600 }}>₹{((product.price || 0) * quantity).toLocaleString()}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setCartPanel(false)}
                  style={{ flex: 1, padding: '12px 16px', border: '1px solid #1a1a1a', background: '#fff', color: '#1a1a1a', cursor: 'pointer', fontWeight: 500, fontSize: 13, letterSpacing: '0.04em' }}
                  data-testid="acc-continue-shopping"
                >
                  CONTINUE SHOPPING
                </button>
                <button
                  onClick={() => { setCartPanel(false); router.push('/checkout'); }}
                  style={{ flex: 1, padding: '12px 16px', border: 'none', background: '#1a1a1a', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  data-testid="acc-checkout-btn"
                >
                  <ShoppingBag size={16} /> CHECKOUT
                </button>
              </div>
              <button
                onClick={() => { setCartPanel(false); router.push('/cart'); }}
                style={{ marginTop: 12, width: '100%', padding: '8px', background: 'transparent', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}
                data-testid="acc-view-cart"
              >
                View Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
