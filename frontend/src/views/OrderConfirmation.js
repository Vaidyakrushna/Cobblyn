"use client";
﻿import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { CheckCircle2, Package, Truck, MapPin, Mail, Phone } from 'lucide-react';

const OrderConfirmation = () => {
  const location = usePathname();
  const { orderId = 'BYD-DEMO123', items = [], personal = {}, address = {}, payment = {}, total = 15000, email = '' } = location.state || {};

  const fallbackItems = items.length ? items : [
    { id: 1, name: 'Classic Oxford', size: '9', color: 'Black', price: 8500, quantity: 1, image: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=300&q=80&fit=crop' },
  ];

  const paymentLabel = {
    cod: 'Cash on Delivery',
    upi: 'UPI Payment',
    card: 'Credit / Debit Card',
    netbanking: 'Net Banking',
  };

  return (
    <div className="order-page" data-testid="order-confirmation-page">
      {/* Success Banner */}
      <div className="order-success-banner">
        <CheckCircle2 size={56} />
        <h1 className="order-success-title">Order Placed Successfully</h1>
        <p className="order-success-sub">Thank you for shopping with Cobblyn. Your order has been confirmed.</p>
        <div className="order-id-badge" data-testid="order-id">Order ID: <strong>{orderId}</strong></div>
      </div>

      <div className="order-content">
        {/* Order Timeline */}
        <div className="order-timeline" data-testid="order-timeline">
          <div className="timeline-step done">
            <div className="timeline-dot"><CheckCircle2 size={18} /></div>
            <div className="timeline-info">
              <strong>Order Confirmed</strong>
              <p>Your order has been placed</p>
            </div>
          </div>
          <div className="timeline-connector"></div>
          <div className="timeline-step">
            <div className="timeline-dot"><Package size={18} /></div>
            <div className="timeline-info">
              <strong>Crafting</strong>
              <p>Your shoes are being handcrafted</p>
            </div>
          </div>
          <div className="timeline-connector"></div>
          <div className="timeline-step">
            <div className="timeline-dot"><Truck size={18} /></div>
            <div className="timeline-info">
              <strong>Shipping</strong>
              <p>On its way to you</p>
            </div>
          </div>
          <div className="timeline-connector"></div>
          <div className="timeline-step">
            <div className="timeline-dot"><MapPin size={18} /></div>
            <div className="timeline-info">
              <strong>Delivered</strong>
              <p>Estimated 15-20 business days</p>
            </div>
          </div>
        </div>

        <div className="order-details-grid">
          {/* Order Items */}
          <div className="order-items-card" data-testid="order-items">
            <h3>Order Items</h3>
            {fallbackItems.map((item) => (
              <div key={item.id} className="order-item-row">
                <img src={item.image} alt={item.name} className="order-item-thumb" />
                <div className="order-item-info">
                  <h4>{item.name}</h4>
                  <p>Size: {item.size} | Color: {item.color} | Qty: {item.quantity}</p>
                </div>
                <span className="order-item-price">â‚¹{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div className="order-total-row">
              <span>Total</span>
              <span className="order-grand-total">â‚¹{total.toLocaleString()}</span>
            </div>
          </div>

          {/* Delivery & Payment Info */}
          <div className="order-info-cards">
            <div className="order-info-card" data-testid="delivery-info">
              <h3>Delivery Address</h3>
              {personal.firstName ? (
                <>
                  <p className="info-name">{personal.firstName} {personal.lastName}</p>
                  <p>{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>
                  <p>{address.city}, {address.state} â€” {address.pincode}</p>
                  <p>{address.country || 'India'}</p>
                  <div className="info-contact">
                    <span><Phone size={14} /> +91 {personal.phone}</span>
                    <span><Mail size={14} /> {email}</span>
                  </div>
                </>
              ) : (
                <p className="info-placeholder">No address provided</p>
              )}
            </div>

            <div className="order-info-card" data-testid="payment-info">
              <h3>Payment Method</h3>
              <p className="info-payment-method">{paymentLabel[payment.method] || 'Cash on Delivery'}</p>
              <p className="info-payment-status">Status: <span className="text-accent">Pending</span></p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="order-actions">
          <Link href="/" className="order-btn-primary" data-testid="continue-shopping-btn">
            Continue Shopping
          </Link>
          <button className="order-btn-secondary" onClick={() => window.print()} data-testid="print-order-btn">
            Print Order Details
          </button>
        </div>

        {/* Help Note */}
        <div className="order-help-note">
          <p>Need help? Contact us at <a href="mailto:care@cobblyn.in">care@cobblyn.in</a> or call <a href="tel:+911234567890">+91 1234 567 890</a></p>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;

