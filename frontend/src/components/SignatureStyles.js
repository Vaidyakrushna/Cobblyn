"use client";
import React, { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const SignatureStyles = () => {
  const { isAuthenticated } = useAuth();
  
  const handleAddToCart = async (e, item) => {
    e.preventDefault();
    if (!isAuthenticated) { alert('Please login to add to cart'); return; }
    try {
      await api.addToCart({ product_id: item.id, size: '9', color: 'Black', quantity: 1 });
      window.dispatchEvent(new Event('byond-cart-update'));
      alert(`${item.name} added to cart!`);
    } catch (err) { alert('Failed: ' + err.message); }
  };

  const [products, setProducts] = useState([]);
  
  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await api.getProducts({ limit: 4 });
        if (data.products && data.products.length >= 4) {
          setProducts(data.products.slice(0, 4).map(p => ({
            ...p,
            id: p._id || p.id,
            image: p.images && p.images.length > 0 ? p.images[0] : p.image
          })));
          return;
        }
      } catch (err) {}
      
      // Fallback
      setProducts([
        {
          id: 1,
          name: 'Classic Oxford',
          material: 'Full-Grain Leather',
          price: '₹8,500',
          tag: 'BESTSELLER',
          image: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=900&q=85&fit=crop'
        },
        {
          id: 2,
          name: 'Penny Loafer',
          material: 'Suede & Leather',
          price: '₹7,200',
          tag: 'NEW',
          image: 'https://images.unsplash.com/photo-1582897085656-c636d006a246?w=600&q=85&fit=crop&crop=center'
        },
        {
          id: 3,
          name: 'Heritage Jutis',
          material: 'Embroidered Silk',
          price: '₹6,500',
          tag: 'TRENDING',
          image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=900&q=85&fit=crop'
        },
        {
          id: 4,
          name: 'Double Monk',
          material: 'Italian Leather',
          price: '₹9,200',
          tag: 'PREMIUM',
          image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=900&q=85&fit=crop'
        }
      ]);
    };
    fetchProducts();
  }, []);

  const sizes = ['6', '7', '8', '9', '10', '11', '12'];
  const [selectedSizes, setSelectedSizes] = useState({});

  const handleSizeSelect = (productId, size) => {
    setSelectedSizes(prev => ({
      ...prev,
      [productId]: prev[productId] === size ? null : size
    }));
  };


  return (
    <section className="section" id="signature" data-testid="signature-styles">
      <div className="sig-header">
        <div>
          <div className="section-label">OUR COLLECTION</div>
          <h2 className="section-title">Signature Styles</h2>
        </div>
        <a href="/collection" className="view-all">View All Collection →</a>
      </div>

      <div className="sig-grid">
        {products.map((product) => (
          <div 
            key={product.id} 
            className="sig-card"
            data-testid={`product-card-${product.id}`}
          >
            <div className="sig-card-tag">{product.tag}</div>
            <div className="sig-card-img">
              <Link href={`/${product.gender || 'men'}/product/${product.id}`}>
                <img src={product.image} alt={product.name} style={{ cursor: 'pointer' }} />
              </Link>
            </div>
            <div className="sig-card-info">
              <h3 className="sig-card-name">{product.name}</h3>
              <p className="sig-card-material">{product.material}</p>
              <div className="sig-card-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="sig-card-price">{product.price}</span>
                <button className="sig-btn-cart" onClick={(e) => handleAddToCart(e, product)} style={{ background: 'var(--black)', color: 'white', border: 'none', padding: '6px', borderRadius: '50%', cursor: 'pointer', display: 'flex' }} title="Add to Cart">
                  <ShoppingCart size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SignatureStyles;