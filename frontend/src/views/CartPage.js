"use client";
﻿import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ChevronRight, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const CartPage = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try {
      const data = await api.getCart();
      setCartItems(data.items || []);
      setCartTotal(data.total || 0);
    } catch (err) {
      console.error('Cart fetch error:', err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCart(); }, [isAuthenticated]);

  const updateQuantity = async (item, delta) => {
    const newQty = Math.max(1, item.quantity + delta);
    try {
      await api.updateCart({ product_id: item.product_id, size: item.size, color: item.color, quantity: newQty });
      fetchCart();
      window.dispatchEvent(new Event('cobblyn-cart-update'));
    } catch (err) { console.error(err); }
  };

  const removeItem = async (item) => {
    try {
      await api.removeFromCart(item.product_id, item.size, item.color);
      fetchCart();
      window.dispatchEvent(new Event('cobblyn-cart-update'));
    } catch (err) { console.error(err); }
  };

  const subtotal = cartTotal;
  const shipping = 0;
  const total = subtotal + shipping;

  const handleCheckout = () => {
    router.push('/checkout');
  };

  if (!isAuthenticated) {
    return (
      <div className="cart-page" data-testid="cart-page">
        <div className="breadcrumbs">
          <Link href="/">Home</Link><ChevronRight size={14} /><span>Shopping Bag</span>
        </div>
        <div className="cart-empty" data-testid="cart-empty">
          <ShoppingBag size={64} className="cart-empty-icon" />
          <h2>Please log in to view your bag</h2>
          <p>Log in to add items and manage your shopping bag.</p>
          <Link href="/login" className="btn-continue-shopping" data-testid="login-link">Log In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page" data-testid="cart-page">
      <div className="breadcrumbs">
        <Link href="/">Home</Link><ChevronRight size={14} /><span>Shopping Bag</span>
      </div>

      <h1 className="cart-heading">Shopping Bag</h1>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center' }}>Loading...</div>
      ) : cartItems.length === 0 ? (
        <div className="cart-empty" data-testid="cart-empty">
          <ShoppingBag size={64} className="cart-empty-icon" />
          <h2>Your bag is empty</h2>
          <p>Looks like you haven't added anything to your bag yet.</p>
          <Link href="/" className="btn-continue-shopping" data-testid="continue-shopping" onClick={() => window.scrollTo(0, 0)}>Continue Shopping</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cartItems.map((item, idx) => (
              <div key={`${item.product_id}-${item.size}-${item.color}`} className="cart-card" data-testid={`cart-item-${idx}`}>
                <button className="cart-card-remove" onClick={() => removeItem(item)} data-testid={`remove-item-${idx}`}>
                  Remove
                </button>
                <div className="cart-card-body">
                  <div className="cart-card-img">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <div className="cart-card-details">
                    <h3 className="cart-card-name">{item.name}</h3>
                    <p className="cart-card-material">{item.material}</p>
                    <div className="cart-card-meta">
                      <span>Size: <strong>{item.size}</strong></span>
                      <span className="meta-divider">|</span>
                      <span>Color: <strong>{item.color}</strong></span>
                    </div>
                  </div>
                  <div className="cart-card-actions">
                    <div className="cart-qty-control">
                      <button onClick={() => updateQuantity(item, -1)} data-testid={`qty-minus-${idx}`}><Minus size={14} /></button>
                      <span data-testid={`qty-value-${idx}`}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item, 1)} data-testid={`qty-plus-${idx}`}><Plus size={14} /></button>
                    </div>
                  </div>
                  <div className="cart-card-price">
                    <span className="cart-card-unit">{item.price?.toLocaleString()} each</span>
                    <span className="cart-card-total">{item.item_total?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary" data-testid="order-summary">
            <h3 className="summary-title">Order Summary</h3>
            <div className="summary-line">
              <span>Subtotal ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
              <span>{subtotal.toLocaleString()}</span>
            </div>
            <div className="summary-line">
              <span>Shipping</span>
              <span className="text-accent">{shipping === 0 ? 'Free' : shipping}</span>
            </div>
            <div className="summary-line total-line">
              <span>Total</span>
              <span>{total.toLocaleString()}</span>
            </div>
            <button className="btn-checkout" onClick={handleCheckout} data-testid="checkout-button">
              Proceed to Checkout <ArrowRight size={18} />
            </button>
            <Link href="/" className="link-continue" onClick={() => window.scrollTo(0, 0)}>Continue Shopping</Link>
            <div className="cart-guarantees">
              <div className="guarantee-item"><span className="guarantee-icon">&#10003;</span><span>Free shipping across India</span></div>
              <div className="guarantee-item"><span className="guarantee-icon">&#10003;</span><span>30-day hassle-free returns</span></div>
              <div className="guarantee-item"><span className="guarantee-icon">&#10003;</span><span>100% genuine materials</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;

