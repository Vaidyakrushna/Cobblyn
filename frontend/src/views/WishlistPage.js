"use client";
﻿import React, { useState, useEffect } from 'react';
import Link from 'next/link';

import { ChevronRight, Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const WishlistPage = () => {
  const { isAuthenticated } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try {
      const data = await api.getWishlist();
      setWishlistItems(data.items || []);
    } catch (err) {
      console.error('Wishlist fetch error:', err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchWishlist(); }, [isAuthenticated]);

  const removeItem = async (productId) => {
    try {
      await api.removeFromWishlist(productId);
      setWishlistItems(prev => prev.filter(item => item.product_id !== productId));
      window.dispatchEvent(new Event('cobblyn-wishlist-update'));
    } catch (err) { console.error(err); }
  };

  const addToCart = async (item) => {
    try {
      const sizes = item.sizes || ['9'];
      const defaultSize = sizes[Math.floor(sizes.length / 2)] || '9';
      await api.wishlistMoveToCart(item.product_id, {
        size: defaultSize,
        color: (item.colors?.[0]?.name || 'Black'),
        quantity: 1,
      });
      setWishlistItems(prev => prev.filter(i => i.product_id !== item.product_id));
      window.dispatchEvent(new Event('cobblyn-cart-update'));
      window.dispatchEvent(new Event('cobblyn-wishlist-update'));
    } catch (err) {
      alert('Failed to move to cart: ' + err.message);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="wishlist-page" data-testid="wishlist-page">
        <div className="breadcrumbs">
          <Link href="/">Home</Link><ChevronRight size={14} /><span>Wishlist</span>
        </div>
        <div className="wishlist-empty" data-testid="wishlist-empty">
          <Heart size={64} className="wishlist-empty-icon" />
          <h2>Please log in to view your wishlist</h2>
          <p>Log in to save and manage your favourite items.</p>
          <Link href="/login" className="btn-continue-shopping" data-testid="login-link">Log In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page" data-testid="wishlist-page">
      <div className="breadcrumbs">
        <Link href="/">Home</Link><ChevronRight size={14} /><span>Wishlist</span>
      </div>

      <h1 className="wishlist-heading">My Wishlist</h1>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center' }}>Loading...</div>
      ) : wishlistItems.length === 0 ? (
        <div className="wishlist-empty" data-testid="wishlist-empty">
          <Heart size={64} className="wishlist-empty-icon" />
          <h2>Your wishlist is empty</h2>
          <p>Save your favourite items to revisit them later.</p>
          <Link href="/" className="btn-continue-shopping" data-testid="continue-shopping" onClick={() => window.scrollTo(0, 0)}>Explore Collection</Link>
        </div>
      ) : (
        <>
          <p className="wishlist-count">{wishlistItems.length} items saved</p>
          <div className="wishlist-grid">
            {wishlistItems.map((item) => (
              <div key={item.product_id} className="wishlist-card" data-testid={`wishlist-item-${item.product_id}`}>
                <button className="wishlist-remove" onClick={() => removeItem(item.product_id)} data-testid={`wishlist-remove-${item.product_id}`}>
                  <Trash2 size={16} />
                </button>
                <Link href={`/${item.gender || 'men'}/product/${item.product_id}`} className="wishlist-img-link">
                  <img src={item.image} alt={item.name} />
                </Link>
                <div className="wishlist-card-info">
                  <h3>{item.name}</h3>
                  <p className="wishlist-card-material">{item.material}</p>
                  <div className="wishlist-card-colors">
                    {(item.colors || []).map((c, i) => <span key={i} className="wishlist-color-dot" style={{ backgroundColor: c.hex }} title={c.name}></span>)}
                  </div>
                  <div className="wishlist-card-bottom">
                    <span className="wishlist-price">{(item.price || 0).toLocaleString()}</span>
                    <button className="wishlist-add-cart" onClick={() => addToCart(item)} data-testid={`wishlist-add-cart-${item.product_id}`}>
                      <ShoppingCart size={16} /> Move to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default WishlistPage;

