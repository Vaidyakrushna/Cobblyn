"use client";
import React, { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const LuxeCollection = () => {
  const { isAuthenticated } = useAuth();
  
  const handleInstantAddToCart = async (e, item, sz) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { alert('Please login to add to cart'); return; }
    try {
      const activeColor = item.colors && item.colors.length > 0 ? item.colors[0].name : 'Black';
      await api.addToCart({ product_id: item.id, size: String(sz), color: activeColor, quantity: 1 });
      window.dispatchEvent(new Event('cobblyn-cart-update'));
      alert(`✨ Added ${item.name} (UK ${sz}) to cart!`);
    } catch (err) { 
      alert('Failed to add to cart: ' + err.message); 
    }
  };

  const [products, setProducts] = useState([]);

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await api.request('/banners?active_only=true&section=luxe');
        const luxeBanners = data.items || [];
        if (luxeBanners.length > 0) {
          setProducts(luxeBanners.map(b => {
            const imgList = (b.image || '').split(',').filter(Boolean);
            return {
              id: b.id,
              name: b.title,
              material: b.subtitle,
              price: b.price || '₹9,200',
              tag: b.eyebrow || 'LUXE',
              image: imgList[0] || '',
              images: imgList,
              gender: b.primary_cta_link ? (b.primary_cta_link.includes('men') ? 'men' : 'women') : 'women',
              target_link: b.primary_cta_link || ''
            };
          }));
          return;
        }
      } catch (err) {
        console.error('Error fetching luxe banners:', err);
      }
      
      // Fallback
      setProducts([
        {
          id: 3,
          name: 'Double Monk Strap',
          material: 'Italian Leather',
          price: '₹9,200',
          tag: 'PREMIUM',
          gender: 'men',
          image: 'https://images.unsplash.com/photo-1770198408387-7f45e5d6c056?w=900&q=85&fit=crop'
        },
        {
          id: 102,
          name: 'Ankle Boots',
          material: 'Full-Grain Leather',
          price: '₹8,900',
          tag: 'NEW',
          gender: 'women',
          image: 'https://images.unsplash.com/photo-1720603989488-1f3d16b7be9d?w=900&q=85&fit=crop'
        },
        {
          id: 4,
          name: 'Derby Elegance',
          material: 'Premium Calfskin',
          price: '₹7,800',
          tag: 'LUXE',
          gender: 'men',
          image: 'https://images.unsplash.com/photo-1616696038562-574c18066055?w=900&q=85&fit=crop'
        },
        {
          id: 105,
          name: 'Peep Toe Heels',
          material: 'Patent Leather',
          price: '₹7,500',
          tag: 'EXCLUSIVE',
          gender: 'women',
          image: 'https://images.unsplash.com/photo-1720603989488-1f3d16b7be9d?w=900&q=85&fit=crop'
        }
      ]);
    };
    fetchProducts();
  }, []);

  const sizes = ['6', '7', '8', '9', '10', '11', '12'];

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
        {products.map((product) => (
          <div 
            key={product.id} 
            className="sig-card"
            data-testid={`luxe-card-${product.id}`}
            style={{ position: 'relative', overflow: 'hidden' }}
          >
            <div className="sig-card-tag">{product.tag}</div>
            
            <div className="sig-card-img" style={{ position: 'relative' }}>
              <Link href={product.target_link || `/${product.gender || 'women'}/product/${product.id}`}>
                <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }} className="sig-image-container">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="sig-image-primary"
                    style={{ cursor: 'pointer', width: '100%', height: '100%', objectFit: 'cover', transition: 'all 0.5s ease' }} 
                  />
                  {product.images && product.images.length > 1 && (
                    <img 
                      src={product.images[1]} 
                      alt={product.name} 
                      className="sig-image-secondary"
                      style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover', 
                        opacity: 0, 
                        transition: 'opacity 0.4s ease-in-out', 
                        cursor: 'pointer' 
                      }} 
                    />
                  )}
                </div>
              </Link>
              
              {/* Pierre Cardin Sizing Quick Add Hover Overlay */}
              <div className="sig-hover-overlay">
                <span className="size-label">QUICK ADD SIZE (UK)</span>
                <div className="size-options" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {sizes.map((sz) => (
                    <button
                      key={sz}
                      onClick={(e) => handleInstantAddToCart(e, product, sz)}
                      className="size-opt"
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(255, 255, 255, 0.4)',
                        background: 'transparent',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(el) => {
                        el.target.style.borderColor = '#9d2706';
                        el.target.style.color = '#9d2706';
                      }}
                      onMouseLeave={(el) => {
                        el.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                        el.target.style.color = '#fff';
                      }}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="sig-card-info">
              <h3 className="sig-card-name">{product.name}</h3>
              <p className="sig-card-material">{product.material}</p>
              <div className="sig-card-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="sig-card-price">{product.price}</span>
                <Link href={product.target_link || `/${product.gender || 'women'}/product/${product.id}`} className="sig-btn-cart" style={{ background: 'var(--black)', color: 'white', border: 'none', padding: '6px', borderRadius: '50%', cursor: 'pointer', display: 'flex' }} title="View Product Details">
                  <ShoppingCart size={14} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default LuxeCollection;
