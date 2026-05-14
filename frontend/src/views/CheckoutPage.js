"use client";
﻿import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

import { ChevronRight, ArrowRight, ArrowLeft, User, MapPin, CreditCard, Lock, CheckCircle2 } from 'lucide-react';

const CheckoutPage = () => {
  const location = usePathname();
  const navigate = useRouter();
  const { cartItems = [], subtotal = 15000, shipping = 0, total = 15000 } = location.state || {};

  const fallbackItems = cartItems.length ? cartItems : [
    { id: 1, name: 'Classic Oxford', material: 'Full-Grain Italian Leather', size: '9', color: 'Black', price: 8500, quantity: 1, image: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=300&q=80&fit=crop' },
    { id: 6, name: 'Heritage Jutis', material: 'Embroidered Silk & Leather', size: '8', color: 'Gold', price: 6500, quantity: 1, image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&q=80&fit=crop' },
  ];

  const computedSubtotal = fallbackItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const computedTotal = computedSubtotal + shipping;

  const [step, setStep] = useState(0);
  const [guestData, setGuestData] = useState({ email: '', isGuest: true });
  const [personal, setPersonal] = useState({ firstName: '', lastName: '', phone: '' });
  const [address, setAddress] = useState({ line1: '', line2: '', city: '', state: '', pincode: '', country: 'India' });
  const [payment, setPayment] = useState({ method: 'cod', cardNumber: '', cardName: '', expiry: '', cvv: '' });
  const [errors, setErrors] = useState({});
  const [coupon, setCoupon] = useState(null);

  const steps = [
    { label: 'Login', icon: <User size={18} /> },
    { label: 'Personal Details', icon: <User size={18} /> },
    { label: 'Address', icon: <MapPin size={18} /> },
    { label: 'Payment', icon: <CreditCard size={18} /> },
  ];

  const validateStep = () => {
    const errs = {};
    if (step === 0) {
      if (!guestData.email) errs.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(guestData.email)) errs.email = 'Enter a valid email';
    }
    if (step === 1) {
      if (!personal.firstName.trim()) errs.firstName = 'First name is required';
      if (!personal.lastName.trim()) errs.lastName = 'Last name is required';
      if (!personal.phone.trim()) errs.phone = 'Phone number is required';
      else if (!/^\d{10}$/.test(personal.phone.replace(/\s/g, ''))) errs.phone = 'Enter a valid 10-digit number';
    }
    if (step === 2) {
      if (!address.line1.trim()) errs.line1 = 'Address line 1 is required';
      if (!address.city.trim()) errs.city = 'City is required';
      if (!address.state.trim()) errs.state = 'State is required';
      if (!address.pincode.trim()) errs.pincode = 'Pincode is required';
      else if (!/^\d{6}$/.test(address.pincode)) errs.pincode = 'Enter a valid 6-digit pincode';
    }
    if (step === 3 && payment.method === 'card') {
      if (!payment.cardNumber.trim()) errs.cardNumber = 'Card number is required';
      if (!payment.cardName.trim()) errs.cardName = 'Name on card is required';
      if (!payment.expiry.trim()) errs.expiry = 'Expiry date is required';
      if (!payment.cvv.trim()) errs.cvv = 'CVV is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < 3) {
      setStep(step + 1);
      setErrors({});
    } else {
      const orderId = 'BYD-' + Date.now().toString(36).toUpperCase();
      router.push('/order-confirmation', {
        state: {
          orderId,
          items: fallbackItems,
          personal,
          address,
          payment: { method: payment.method },
          total: computedTotal,
          email: guestData.email,
        }
      });
    }
  };

  const handleBack = () => {
    if (step > 0) { setStep(step - 1); setErrors({}); }
  };

  const indianStates = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'];

  return (
    <div className="checkout-page" data-testid="checkout-page">
      <div className="breadcrumbs">
        <Link href="/">Home</Link>
        <ChevronRight size={14} />
        <Link href="/cart">Shopping Bag</Link>
        <ChevronRight size={14} />
        <span>Checkout</span>
      </div>

      <h1 className="checkout-heading">Checkout</h1>

      {/* Progress Steps */}
      <div className="checkout-steps" data-testid="checkout-steps">
        {steps.map((s, i) => (
          <div key={i} className={`ck-step ${i < step ? 'done' : ''} ${i === step ? 'active' : ''}`} data-testid={`checkout-step-${i}`}>
            <div className="ck-step-circle">
              {i < step ? <CheckCircle2 size={20} /> : s.icon}
            </div>
            <span className="ck-step-label">{s.label}</span>
          </div>
        ))}
        <div className="ck-step-line">
          <div className="ck-step-fill" style={{ width: `${(step / 3) * 100}%` }}></div>
        </div>
      </div>

      <div className="checkout-layout">
        {/* Left: Form Area */}
        <div className="checkout-form-area">
          {/* Step 0: Guest Login */}
          {step === 0 && (
            <div className="ck-form-card" data-testid="step-guest-login">
              <h2 className="ck-form-title">Continue as Guest</h2>
              <p className="ck-form-desc">Enter your email to receive order updates and tracking information.</p>

              <div className="ck-field">
                <label>Email Address *</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={guestData.email}
                  onChange={(e) => setGuestData({ ...guestData, email: e.target.value })}
                  className={errors.email ? 'has-error' : ''}
                  data-testid="guest-email"
                />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>

              <div className="ck-guest-divider"><span>Or</span></div>

              <Link href="/login" className="ck-login-link" data-testid="login-link">
                <User size={16} /> Log in to your BYOND account
              </Link>

              <div className="ck-secure-note">
                <Lock size={14} />
                <span>Your information is encrypted and secure</span>
              </div>
            </div>
          )}

          {/* Step 1: Personal Details */}
          {step === 1 && (
            <div className="ck-form-card" data-testid="step-personal-details">
              <h2 className="ck-form-title">Personal Details</h2>
              <p className="ck-form-desc">Tell us a bit about yourself for a personalized experience.</p>

              <div className="ck-form-row">
                <div className="ck-field">
                  <label>First Name *</label>
                  <input
                    type="text"
                    placeholder="Enter first name"
                    value={personal.firstName}
                    onChange={(e) => setPersonal({ ...personal, firstName: e.target.value })}
                    className={errors.firstName ? 'has-error' : ''}
                    data-testid="personal-first-name"
                  />
                  {errors.firstName && <span className="field-error">{errors.firstName}</span>}
                </div>
                <div className="ck-field">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    placeholder="Enter last name"
                    value={personal.lastName}
                    onChange={(e) => setPersonal({ ...personal, lastName: e.target.value })}
                    className={errors.lastName ? 'has-error' : ''}
                    data-testid="personal-last-name"
                  />
                  {errors.lastName && <span className="field-error">{errors.lastName}</span>}
                </div>
              </div>

              <div className="ck-field">
                <label>Phone Number *</label>
                <div className="phone-input-wrap">
                  <span className="phone-prefix">+91</span>
                  <input
                    type="tel"
                    placeholder="XXXXX XXXXX"
                    value={personal.phone}
                    onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
                    className={errors.phone ? 'has-error' : ''}
                    data-testid="personal-phone"
                  />
                </div>
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </div>

              <div className="ck-field">
                <label>Email</label>
                <input type="email" value={guestData.email} disabled className="disabled-input" />
              </div>
            </div>
          )}

          {/* Step 2: Communication Address */}
          {step === 2 && (
            <div className="ck-form-card" data-testid="step-address">
              <h2 className="ck-form-title">Communication Address</h2>
              <p className="ck-form-desc">Where should we deliver your bespoke footwear?</p>

              <div className="ck-field">
                <label>Address Line 1 *</label>
                <input
                  type="text"
                  placeholder="House/Flat No., Building, Street"
                  value={address.line1}
                  onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                  className={errors.line1 ? 'has-error' : ''}
                  data-testid="address-line1"
                />
                {errors.line1 && <span className="field-error">{errors.line1}</span>}
              </div>

              <div className="ck-field">
                <label>Address Line 2</label>
                <input
                  type="text"
                  placeholder="Area, Landmark (optional)"
                  value={address.line2}
                  onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                  data-testid="address-line2"
                />
              </div>

              <div className="ck-form-row">
                <div className="ck-field">
                  <label>City *</label>
                  <input
                    type="text"
                    placeholder="Enter city"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className={errors.city ? 'has-error' : ''}
                    data-testid="address-city"
                  />
                  {errors.city && <span className="field-error">{errors.city}</span>}
                </div>
                <div className="ck-field">
                  <label>State *</label>
                  <select
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className={errors.state ? 'has-error' : ''}
                    data-testid="address-state"
                  >
                    <option value="">Select state</option>
                    {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.state && <span className="field-error">{errors.state}</span>}
                </div>
              </div>

              <div className="ck-form-row">
                <div className="ck-field">
                  <label>Pincode *</label>
                  <input
                    type="text"
                    placeholder="6-digit pincode"
                    value={address.pincode}
                    onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                    maxLength={6}
                    className={errors.pincode ? 'has-error' : ''}
                    data-testid="address-pincode"
                  />
                  {errors.pincode && <span className="field-error">{errors.pincode}</span>}
                </div>
                <div className="ck-field">
                  <label>Country</label>
                  <input type="text" value="India" disabled className="disabled-input" />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div className="ck-form-card" data-testid="step-payment">
              <h2 className="ck-form-title">Payment</h2>
              <p className="ck-form-desc">Choose your preferred payment method.</p>

              <div className="payment-methods">
                <label className={`payment-option ${payment.method === 'cod' ? 'active' : ''}`} data-testid="payment-cod">
                  <input type="radio" name="paymentMethod" value="cod" checked={payment.method === 'cod'} onChange={(e) => setPayment({ ...payment, method: e.target.value })} />
                  <div className="payment-option-content">
                    <strong>Cash on Delivery</strong>
                    <p>Pay when your order arrives at your doorstep</p>
                  </div>
                </label>

                <label className={`payment-option ${payment.method === 'upi' ? 'active' : ''}`} data-testid="payment-upi">
                  <input type="radio" name="paymentMethod" value="upi" checked={payment.method === 'upi'} onChange={(e) => setPayment({ ...payment, method: e.target.value })} />
                  <div className="payment-option-content">
                    <strong>UPI Payment</strong>
                    <p>Pay via Google Pay, PhonePe, Paytm or any UPI app</p>
                  </div>
                </label>

                <label className={`payment-option ${payment.method === 'card' ? 'active' : ''}`} data-testid="payment-card">
                  <input type="radio" name="paymentMethod" value="card" checked={payment.method === 'card'} onChange={(e) => setPayment({ ...payment, method: e.target.value })} />
                  <div className="payment-option-content">
                    <strong>Credit / Debit Card</strong>
                    <p>Visa, Mastercard, RuPay accepted</p>
                  </div>
                </label>

                <label className={`payment-option ${payment.method === 'netbanking' ? 'active' : ''}`} data-testid="payment-netbanking">
                  <input type="radio" name="paymentMethod" value="netbanking" checked={payment.method === 'netbanking'} onChange={(e) => setPayment({ ...payment, method: e.target.value })} />
                  <div className="payment-option-content">
                    <strong>Net Banking</strong>
                    <p>All major Indian banks supported</p>
                  </div>
                </label>
              </div>

              {payment.method === 'card' && (
                <div className="card-form" data-testid="card-details-form">
                  <div className="ck-field">
                    <label>Card Number *</label>
                    <input type="text" placeholder="XXXX XXXX XXXX XXXX" value={payment.cardNumber} onChange={(e) => setPayment({ ...payment, cardNumber: e.target.value })} maxLength={19} className={errors.cardNumber ? 'has-error' : ''} data-testid="card-number" />
                    {errors.cardNumber && <span className="field-error">{errors.cardNumber}</span>}
                  </div>
                  <div className="ck-field">
                    <label>Name on Card *</label>
                    <input type="text" placeholder="As printed on card" value={payment.cardName} onChange={(e) => setPayment({ ...payment, cardName: e.target.value })} className={errors.cardName ? 'has-error' : ''} data-testid="card-name" />
                    {errors.cardName && <span className="field-error">{errors.cardName}</span>}
                  </div>
                  <div className="ck-form-row">
                    <div className="ck-field">
                      <label>Expiry *</label>
                      <input type="text" placeholder="MM/YY" value={payment.expiry} onChange={(e) => setPayment({ ...payment, expiry: e.target.value })} maxLength={5} className={errors.expiry ? 'has-error' : ''} data-testid="card-expiry" />
                      {errors.expiry && <span className="field-error">{errors.expiry}</span>}
                    </div>
                    <div className="ck-field">
                      <label>CVV *</label>
                      <input type="password" placeholder="***" value={payment.cvv} onChange={(e) => setPayment({ ...payment, cvv: e.target.value })} maxLength={4} className={errors.cvv ? 'has-error' : ''} data-testid="card-cvv" />
                      {errors.cvv && <span className="field-error">{errors.cvv}</span>}
                    </div>
                  </div>
                </div>
              )}

              <div className="ck-secure-note">
                <Lock size={14} />
                <span>All transactions are secure and encrypted</span>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="ck-nav-buttons">
            {step > 0 && (
              <button className="ck-btn-back" onClick={handleBack} data-testid="checkout-back">
                <ArrowLeft size={16} /> Back
              </button>
            )}
            <button className="ck-btn-next" onClick={handleNext} data-testid="checkout-next">
              {step === 3 ? 'Place Order' : 'Continue'} <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="checkout-summary" data-testid="checkout-summary">
          <h3 className="ck-summary-title">Order Summary</h3>

          <div className="ck-summary-items">
            {fallbackItems.map((item) => (
              <div key={item.id} className="ck-summary-item" data-testid={`ck-item-${item.id}`}>
                <div className="ck-summary-img">
                  <img src={item.image} alt={item.name} />
                  <span className="ck-summary-qty">{item.quantity}</span>
                </div>
                <div className="ck-summary-details">
                  <h4>{item.name}</h4>
                  <p>Size: {item.size} | {item.color}</p>
                </div>
                <span className="ck-summary-price">â‚¹{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="ck-coupon-block" data-testid="coupon-block" style={{ padding: '14px 18px', background: '#FAFAFA', marginBottom: 12 }}>
            <CouponInput subtotal={computedSubtotal} onApply={(c) => setCoupon(c)} applied={coupon} />
          </div>

          <div className="ck-summary-totals">
            <div className="ck-total-line"><span>Subtotal</span><span data-testid="ck-subtotal">{'\u20B9'}{computedSubtotal.toLocaleString()}</span></div>
            {coupon && (
              <div className="ck-total-line" style={{ color: '#10B981' }}>
                <span>Coupon ({coupon.code})</span>
                <span data-testid="ck-coupon-discount">- {'\u20B9'}{coupon.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="ck-total-line"><span>GST (estimated)</span><span data-testid="ck-tax">{'\u20B9'}{Math.round((computedSubtotal - (coupon?.discount || 0)) * (computedSubtotal > 1000 ? 0.18 : 0.05)).toLocaleString()}</span></div>
            <div className="ck-total-line"><span>Shipping</span><span className="text-accent">Free</span></div>
            <div className="ck-total-line ck-grand-total"><span>Total</span><span data-testid="ck-total">
              {'\u20B9'}{Math.round((computedSubtotal - (coupon?.discount || 0)) * (1 + (computedSubtotal > 1000 ? 0.18 : 0.05))).toLocaleString()}
            </span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Coupon input component
const CouponInput = ({ subtotal, onApply, applied }) => {
  const [code, setCode] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');

  const apply = async () => {
    setErr('');
    if (!code.trim()) return;
    setBusy(true);
    try {
      const data = await api.validateCoupon(code.trim().toUpperCase(), subtotal);
      onApply(data);
      setCode('');
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  if (applied) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} data-testid="coupon-applied">
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#10B981' }}>Coupon {applied.code} applied</div>
          {applied.description && <div style={{ fontSize: 11, color: '#6B7280' }}>{applied.description}</div>}
        </div>
        <button onClick={() => onApply(null)} data-testid="coupon-remove"
          style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 12 }}>Remove</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 8 }}>Have a coupon?</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="WELCOME10" data-testid="coupon-input"
          style={{ flex: 1, padding: '8px 10px', border: '1px solid #E5E7EB', borderRadius: 4, fontSize: 13 }} />
        <button onClick={apply} disabled={busy} data-testid="coupon-apply"
          style={{ padding: '8px 14px', background: '#1a1a1a', color: '#fff', border: 'none', cursor: busy ? 'wait' : 'pointer', fontSize: 12, fontWeight: 600 }}>
          {busy ? 'â€¦' : 'APPLY'}
        </button>
      </div>
      {err && <div style={{ color: '#EF4444', fontSize: 12, marginTop: 6 }} data-testid="coupon-error">{err}</div>}
    </div>
  );
};

export default CheckoutPage;

