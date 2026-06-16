"use client";
import React, { useState, useEffect } from 'react';
import { Heart, Star, X, Truck, Eye } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const LuxeCollection = () => {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [selectedColors, setSelectedColors] = useState({});
  const [activeQuickViewProduct, setActiveQuickViewProduct] = useState(null);
  const [modalSize, setModalSize] = useState('');
  const [modalColor, setModalColor] = useState(null);

  // Fetch Luxe products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await api.request('/banners?active_only=true&section=luxe');
        const luxeBanners = data.items || [];
        if (luxeBanners.length > 0) {
          setProducts(luxeBanners.map((b, idx) => {
            const imgList = (b.image || '').split(',').filter(Boolean);
            const priceVal = b.price || 9200;
            const oldPriceVal = Math.round(priceVal * 1.30); // 30% higher for discount
            const discountPct = "23% OFF";
            
            // Generate standard luxury swatches based on product index
            let colors = [
              { name: 'Dark Cognac', hex: '#2c1810', image: imgList[0] || 'https://images.unsplash.com/photo-1574634534894-89d7576c8259?w=900&q=85&fit=crop' },
              { name: 'Artisan Black', hex: '#1a1a1a', image: imgList[1] || imgList[0] || 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=900&q=85&fit=crop' }
            ];
            
            if (idx % 2 === 1) {
              colors = [
                { name: 'Crimson Wine', hex: '#6b3a2a', image: imgList[0] || 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=900&q=85&fit=crop' },
                { name: 'Heritage Gold', hex: '#d4a843', image: imgList[1] || imgList[0] || 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=900&q=85&fit=crop' }
              ];
            }

            return {
              id: b.id,
              name: b.title,
              material: b.subtitle || 'Premium Calf Leather',
              price: `₹${priceVal.toLocaleString('en-IN')}`,
              priceRaw: priceVal,
              oldPrice: `₹${oldPriceVal.toLocaleString('en-IN')}`,
              discount: discountPct,
              tag: b.eyebrow || 'LUXE',
              images: imgList.length > 0 ? imgList : [colors[0].image],
              colors: colors,
              sizes: ['6', '7', '8', '9', '10', '11', '12'],
              rating: 4.9,
              reviewsCount: 38 + (idx * 8),
              gender: b.primary_cta_link ? (b.primary_cta_link.includes('men') ? 'men' : 'women') : 'women',
              target_link: b.primary_cta_link || ''
            };
          }));
          return;
        }
      } catch (err) {
        console.error('Error fetching luxe banners:', err);
      }
      
      // Fallback premium Luxe products from the wireframe
      const defaultProducts = [
        {
          id: 'luxe-fallback-1',
          name: 'Shell Cordovan Derby',
          material: 'Shell Cordovan Leather',
          price: '₹22,000',
          priceRaw: 22000,
          oldPrice: '₹28,000',
          discount: '21% OFF',
          tag: 'LUXE',
          rating: 5.0,
          reviewsCount: 47,
          images: [
            'https://images.unsplash.com/photo-1574634534894-89d7576c8259?w=900&q=85&fit=crop',
            'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=900&q=85&fit=crop'
          ],
          colors: [
            { name: 'Dark Cognac', hex: '#2c1810', image: 'https://images.unsplash.com/photo-1574634534894-89d7576c8259?w=900&q=85&fit=crop' },
            { name: 'Artisan Black', hex: '#1a1a1a', image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=900&q=85&fit=crop' },
            { name: 'Heritage Gold', hex: '#8B6914', image: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=900&q=85&fit=crop' }
          ],
          sizes: ['6', '7', '8', '9', '10', '11', '12'],
          gender: 'men'
        },
        {
          id: 'luxe-fallback-2',
          name: 'Alligator Mule',
          material: 'Genuine Alligator',
          price: '₹45,000',
          priceRaw: 45000,
          oldPrice: '₹55,000',
          discount: '18% OFF',
          tag: 'LIMITED',
          rating: 5.0,
          reviewsCount: 18,
          images: [
            'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=900&q=85&fit=crop',
            'https://images.unsplash.com/photo-1582897085656-c636d006a246?w=600&q=85&fit=crop&crop=center'
          ],
          colors: [
            { name: 'Midnight Black', hex: '#1a1a1a', image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=900&q=85&fit=crop' },
            { name: 'Mahogany Brown', hex: '#3d2b1f', image: 'https://images.unsplash.com/photo-1582897085656-c636d006a246?w=600&q=85&fit=crop&crop=center' }
          ],
          sizes: ['6', '7', '8', '9', '10', '11', '12'],
          gender: 'women'
        },
        {
          id: 'luxe-fallback-3',
          name: 'Patent Evening Heel',
          material: 'Patent Leather',
          price: '₹18,500',
          priceRaw: 18500,
          oldPrice: '₹24,000',
          discount: '23% OFF',
          tag: 'LUXE',
          rating: 4.9,
          reviewsCount: 63,
          images: [
            'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=900&q=85&fit=crop',
            'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=900&q=85&fit=crop'
          ],
          colors: [
            { name: 'Classic Black', hex: '#1a1a1a', image: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=900&q=85&fit=crop' },
            { name: 'Crimson Wine', hex: '#6b3a2a', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=900&q=85&fit=crop' },
            { name: 'Heritage Gold', hex: '#d4a843', image: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=900&q=85&fit=crop' }
          ],
          sizes: ['6', '7', '8', '9', '10', '11', '12'],
          gender: 'women'
        },
        {
          id: 'luxe-fallback-4',
          name: 'Exotic Python Loafer',
          material: 'Python Skin',
          price: '₹38,000',
          priceRaw: 38000,
          oldPrice: '₹48,000',
          discount: '20% OFF',
          tag: 'LIMITED',
          rating: 5.0,
          reviewsCount: 9,
          images: [
            'https://images.unsplash.com/photo-1631163032988-d03da63c7a9c?w=900&q=85&fit=crop',
            'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=900&q=85&fit=crop'
          ],
          colors: [
            { name: 'Python Green', hex: '#2c4a2c', image: 'https://images.unsplash.com/photo-1631163032988-d03da63c7a9c?w=900&q=85&fit=crop' },
            { name: 'Midnight Black', hex: '#1a1a1a', image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=900&q=85&fit=crop' }
          ],
          sizes: ['6', '7', '8', '9', '10', '11', '12'],
          gender: 'men'
        }
      ];
      setProducts(defaultProducts);
    };
    fetchProducts();
  }, []);

  // Quick View triggering
  const openQuickView = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveQuickViewProduct(product);
    setModalSize('');
    setModalColor(product.colors && product.colors.length > 0 ? product.colors[0] : null);
  };

  const closeQuickView = () => {
    setActiveQuickViewProduct(null);
  };

  const handleModalAddToCart = async () => {
    if (!isAuthenticated) {
      alert('Please login to add to cart');
      return;
    }
    if (!modalSize) {
      alert('Please select your size (UK)');
      return;
    }
    try {
      const activeColorName = modalColor ? modalColor.name : 'Standard';
      await api.addToCart({
        product_id: activeQuickViewProduct.id,
        size: modalSize,
        color: activeColorName,
        quantity: 1
      });
      window.dispatchEvent(new Event('cobblyn-cart-update'));
      alert(`✨ Added ${activeQuickViewProduct.name} (UK ${modalSize}, ${activeColorName}) to cart!`);
      closeQuickView();
    } catch (err) {
      alert('Failed to add to cart: ' + err.message);
    }
  };

  const handleModalAddToWishlist = async () => {
    if (!isAuthenticated) {
      alert('Please login to manage wishlist');
      return;
    }
    try {
      await api.addToWishlist(activeQuickViewProduct.id);
      window.dispatchEvent(new Event('cobblyn-wishlist-update'));
      alert(`❤️ Added ${activeQuickViewProduct.name} to wishlist!`);
    } catch (err) {
      alert('Failed to add to wishlist: ' + err.message);
    }
  };

  return (
    <section className="section" id="luxe-collection" data-testid="luxe-collection">
      <div className="sig-header">
        <div>
          <div className="section-label">CURATED SELECTION</div>
          <h2 className="section-title">Luxe Collection</h2>
        </div>
        <Link href="/luxe-collection" className="view-all">View Full Collection →</Link>
      </div>

      <div className="sig-grid">
        {products.map((product) => {
          const selectedColor = selectedColors[product.id] || (product.colors && product.colors.length > 0 ? product.colors[0] : null);
          const activeImage = selectedColor ? selectedColor.image : product.images[0];
          
          return (
            <div 
              key={product.id} 
              className="sig-card"
              data-testid={`luxe-card-${product.id}`}
            >
              <div className="sig-card-tag">{product.tag}</div>
              
              <div className="prod-img-wrap">
                <Link href={product.target_link || `/${product.gender}/product/${product.id}`}>
                  <img 
                    src={activeImage} 
                    alt={product.name} 
                    style={{ cursor: 'pointer' }}
                  />
                </Link>
              </div>

              {/* Color swatches */}
              {product.colors && product.colors.length > 0 && (
                <div className="prod-swatches">
                  {product.colors.map((c, index) => (
                    <button 
                      key={index}
                      className={`prod-swatch ${selectedColor?.name === c.name ? 'active' : ''}`}
                      style={{ background: c.hex }}
                      onClick={() => setSelectedColors({ ...selectedColors, [product.id]: c })}
                      title={c.name}
                    />
                  ))}
                </div>
              )}

              <div className="sig-card-info" style={{ borderTop: 'none', paddingTop: '10px' }}>
                {/* Stars rating */}
                <div className="prod-rating">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className="star" fill={i < Math.floor(product.rating) ? '#f5a623' : 'none'} strokeWidth={1.5} />
                  ))}
                  <span>({product.reviewsCount})</span>
                </div>

                <h3 className="sig-card-name" style={{ marginTop: '8px' }}>{product.name}</h3>
                <p className="sig-card-material">{product.material}</p>
                
                <div className="prod-price-row">
                  <span className="sig-card-price" style={{ fontSize: '1rem' }}>{product.price}</span>
                  {product.oldPrice && (
                    <>
                      <span className="prod-old-price">{product.oldPrice}</span>
                      <span className="prod-discount">{product.discount}</span>
                    </>
                  )}
                </div>

                <button 
                  className="btn-quickview"
                  onClick={(e) => openQuickView(e, product)}
                  data-testid={`quickview-btn-${product.id}`}
                >
                  <Eye size={12} />
                  Quick View
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* QUICK VIEW MODAL OVERLAY */}
      {activeQuickViewProduct && (
        <div className="modal-overlay active" onClick={closeQuickView} data-testid="quickview-modal">
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeQuickView} aria-label="Close modal">
              <X size={20} />
            </button>
            
            <div className="modal-left">
              <img 
                src={modalColor ? modalColor.image : activeQuickViewProduct.images[0]} 
                alt={activeQuickViewProduct.name} 
              />
            </div>
            
            <div className="modal-right">
              <span className="modal-badge">{activeQuickViewProduct.tag}</span>
              <h3 className="modal-title">{activeQuickViewProduct.name}</h3>
              <p className="modal-material">{activeQuickViewProduct.material}</p>
              
              <div className="modal-rating">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} fill="#f5a623" color="#f5a623" />
                ))}
                <span style={{ fontSize: '12px', color: 'var(--mid-grey)', marginLeft: '6px', marginTop: '2px' }}>
                  {activeQuickViewProduct.rating} ({activeQuickViewProduct.reviewsCount} verified reviews)
                </span>
              </div>
              
              <div className="modal-price">
                {activeQuickViewProduct.price}
                {activeQuickViewProduct.oldPrice && (
                  <span>{activeQuickViewProduct.oldPrice}</span>
                )}
              </div>

              {/* Color Selector */}
              {activeQuickViewProduct.colors && activeQuickViewProduct.colors.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div className="modal-label">Select Color: <span style={{ textTransform: 'none', color: '#111' }}>{modalColor?.name}</span></div>
                  <div className="modal-colors">
                    {activeQuickViewProduct.colors.map((c, index) => (
                      <button 
                        key={index}
                        className={`modal-swatch ${modalColor?.name === c.name ? 'active' : ''}`}
                        style={{ background: c.hex }}
                        onClick={() => setModalColor(c)}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selector */}
              <div style={{ marginBottom: '24px' }}>
                <div className="modal-label">Select Size (UK): <span style={{ textTransform: 'none', color: '#111' }}>{modalSize ? `UK ${modalSize}` : 'None'}</span></div>
                <div className="modal-sizes">
                  {activeQuickViewProduct.sizes.map((sz) => (
                    <button
                      key={sz}
                      className={`size-btn ${modalSize === sz ? 'active' : ''}`}
                      onClick={() => setModalSize(sz)}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-btns">
                <button className="btn-atc" onClick={handleModalAddToCart} data-testid="modal-add-to-cart-btn">
                  Add to Bag
                </button>
                <button className="btn-wishlist" onClick={handleModalAddToWishlist}>
                  Add to Wishlist
                </button>
              </div>

              <div className="modal-delivery">
                <Truck size={16} />
                <span>Express Shipping: Dispatched within 24-48 hours. Free delivery & returns.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default LuxeCollection;
