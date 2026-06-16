"use client";
import React, { useState, useEffect } from 'react';
import { Heart, Star, X, Truck, Eye } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const SignatureStyles = () => {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [selectedColors, setSelectedColors] = useState({});
  const [activeQuickViewProduct, setActiveQuickViewProduct] = useState(null);
  const [modalSize, setModalSize] = useState('');
  const [modalColor, setModalColor] = useState(null);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await api.request('/banners?active_only=true&section=signature');
        const signatureBanners = data.items || [];
        if (signatureBanners.length > 0) {
          setProducts(signatureBanners.map((b, idx) => {
            const imgList = (b.image || '').split(',').filter(Boolean);
            const priceVal = b.price || 8500;
            const oldPriceVal = Math.round(priceVal * 1.35); // 35% higher for discount display
            const discountPct = "26% OFF";
            
            // Generate standard luxury swatches based on product id/index
            let colors = [
              { name: 'Tan Cognac', hex: '#A86A3E', image: imgList[0] || 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=900&q=85&fit=crop' },
              { name: 'Artisan Black', hex: '#1C1A17', image: imgList[1] || imgList[0] || 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=900&q=85&fit=crop' }
            ];
            
            if (idx % 2 === 1) {
              colors = [
                { name: 'Suede Charcoal', hex: '#3B3B3B', image: imgList[0] || 'https://images.unsplash.com/photo-1582897085656-c636d006a246?w=600&q=85&fit=crop&crop=center' },
                { name: 'Midnight Navy', hex: '#1C2E5A', image: imgList[1] || imgList[0] || 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=900&q=85&fit=crop' }
              ];
            }

            return {
              id: b.id,
              name: b.title,
              material: b.subtitle || 'Italian Calf Leather',
              price: `₹${priceVal.toLocaleString('en-IN')}`,
              priceRaw: priceVal,
              oldPrice: `₹${oldPriceVal.toLocaleString('en-IN')}`,
              discount: discountPct,
              tag: b.eyebrow || 'BESTSELLER',
              images: imgList.length > 0 ? imgList : [colors[0].image],
              colors: colors,
              sizes: ['6', '7', '8', '9', '10', '11', '12'],
              rating: 4.8,
              reviewsCount: 94 + (idx * 15),
              gender: b.primary_cta_link ? (b.primary_cta_link.includes('women') ? 'women' : 'men') : 'men',
              target_link: b.primary_cta_link || ''
            };
          }));
          return;
        }
      } catch (err) {
        console.error('Error fetching signature banners:', err);
      }
      
      // Fallback premium products
      const defaultProducts = [
        {
          id: 'sig-fallback-1',
          name: 'The Artisan Oxford',
          material: 'Italian Calf Leather',
          price: '₹8,500',
          priceRaw: 8500,
          oldPrice: '₹12,000',
          discount: '29% OFF',
          tag: 'BESTSELLER',
          rating: 4.8,
          reviewsCount: 124,
          images: [
            'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=900&q=85&fit=crop',
            'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=900&q=85&fit=crop'
          ],
          colors: [
            { name: 'Tan Cognac', hex: '#A86A3E', image: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=900&q=85&fit=crop' },
            { name: 'Artisan Black', hex: '#1C1A17', image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=900&q=85&fit=crop' }
          ],
          sizes: ['6', '7', '8', '9', '10', '11', '12'],
          gender: 'men'
        },
        {
          id: 'sig-fallback-2',
          name: 'The Suede Loafer',
          material: 'Premium Suede & Leather',
          price: '₹7,200',
          priceRaw: 7200,
          oldPrice: '₹9,900',
          discount: '27% OFF',
          tag: 'NEW',
          rating: 4.7,
          reviewsCount: 89,
          images: [
            'https://images.unsplash.com/photo-1582897085656-c636d006a246?w=600&q=85&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=900&q=85&fit=crop'
          ],
          colors: [
            { name: 'Suede Brown', hex: '#8C5228', image: 'https://images.unsplash.com/photo-1582897085656-c636d006a246?w=600&q=85&fit=crop&crop=center' },
            { name: 'Classic Navy', hex: '#1C2E5A', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=900&q=85&fit=crop' }
          ],
          sizes: ['6', '7', '8', '9', '10', '11', '12'],
          gender: 'men'
        },
        {
          id: 'sig-fallback-3',
          name: 'Heritage Jutis',
          material: 'Embroidered Silk',
          price: '₹6,500',
          priceRaw: 6500,
          oldPrice: '₹8,500',
          discount: '23% OFF',
          tag: 'TRENDING',
          rating: 4.9,
          reviewsCount: 212,
          images: [
            'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=900&q=85&fit=crop',
            'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=900&q=85&fit=crop'
          ],
          colors: [
            { name: 'Crimson Velvet', hex: '#9d2706', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=900&q=85&fit=crop' },
            { name: 'Tan Gold', hex: '#A86A3E', image: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=900&q=85&fit=crop' }
          ],
          sizes: ['6', '7', '8', '9', '10', '11', '12'],
          gender: 'women'
        },
        {
          id: 'sig-fallback-4',
          name: 'Double Monk',
          material: 'Italian Calf Leather',
          price: '₹9,200',
          priceRaw: 9200,
          oldPrice: '₹14,000',
          discount: '34% OFF',
          tag: 'PREMIUM',
          rating: 4.8,
          reviewsCount: 78,
          images: [
            'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=900&q=85&fit=crop',
            'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=900&q=85&fit=crop'
          ],
          colors: [
            { name: 'Dark Burgundy', hex: '#7A1E04', image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=900&q=85&fit=crop' },
            { name: 'Artisan Black', hex: '#1C1A17', image: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=900&q=85&fit=crop' }
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
    <section className="section" id="signature" data-testid="signature-styles">
      <div className="sig-header">
        <div>
          <div className="section-label">OUR COLLECTION</div>
          <h2 className="section-title">Signature Styles</h2>
        </div>
        <Link href="/collection" className="view-all">View All Collection →</Link>
      </div>

      <div className="sig-grid">
        {products.map((product) => {
          const selectedColor = selectedColors[product.id] || (product.colors && product.colors.length > 0 ? product.colors[0] : null);
          const activeImage = selectedColor ? selectedColor.image : product.images[0];
          
          return (
            <div 
              key={product.id} 
              className="sig-card"
              data-testid={`product-card-${product.id}`}
            >
              <div className="sig-card-tag">{product.tag}</div>
              
              <div className="sig-card-img">
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
                    <Star key={i} size={12} className="star" fill={i < 5 ? '#f5a623' : 'none'} strokeWidth={1.5} />
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
                  4.8 ({activeQuickViewProduct.reviewsCount} verified reviews)
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

export default SignatureStyles;