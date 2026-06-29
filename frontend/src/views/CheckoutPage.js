"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, ArrowRight, ArrowLeft, User, MapPin, CreditCard, Lock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const CheckoutPage = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // Cart data fetched from API
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartLoading, setCartLoading] = useState(true);

  const [step, setStep] = useState(0);
  const [guestData, setGuestData] = useState({ email: '', isGuest: true });
  const [personal, setPersonal] = useState({ firstName: '', lastName: '', phone: '' });
  const [address, setAddress] = useState({ line1: '', line2: '', city: '', state: '', pincode: '', country: 'India' });
  const [payment, setPayment] = useState({ method: 'cod', cardNumber: '', cardName: '', expiry: '', cvv: '' });
  const [errors, setErrors] = useState({});
  const [coupon, setCoupon] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [useWallet, setUseWallet] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  const hasCustomizedItem = cartItems.some(item => item.customized || item.is_customized || item.product?.customized || item.category === 'bespoke' || item.name?.toLowerCase().includes('bespoke') || item.name?.toLowerCase().includes('custom'));

  useEffect(() => {
    if (hasCustomizedItem && payment.method === 'cod') {
      setPayment(p => ({ ...p, method: 'upi' }));
    }
  }, [hasCustomizedItem, payment.method]);

  // Fetch cart from API
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const data = await api.getCart();
        setCartItems(data.items || []);
        setCartTotal(data.total || 0);
      } catch (err) {
        console.error('Failed to fetch cart:', err);
      }
      setCartLoading(false);
    };
    fetchCart();
  }, []);

  // Pre-fill user data if logged in
  useEffect(() => {
    if (user) {
      setGuestData(prev => ({ ...prev, email: user.email || '' }));
      const nameParts = (user.name || '').split(' ');
      setPersonal(prev => ({
        ...prev,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
      }));
      // Skip guest step if logged in
      if (isAuthenticated) {
        setStep(1);
      }
    }
  }, [user, isAuthenticated]);

  // Fetch accurate wallet balance from API
  useEffect(() => {
    const fetchWallet = async () => {
      if (isAuthenticated) {
        try {
          const stats = await api.getReferralStats();
          setWalletBalance(stats.wallet_balance || 0);
        } catch (e) {
          console.error('Failed to fetch wallet balance:', e);
        }
      }
    };
    fetchWallet();
  }, [isAuthenticated]);

  const computedSubtotal = cartTotal;
  const vipMembership = user?.vip_membership;
  const vipDiscountPercent = (vipMembership?.is_active && new Date(vipMembership?.expires_at) > new Date()) ? parseFloat(vipMembership?.discount_percent || 0) : 0;
  const vipDiscountAmount = Math.round(computedSubtotal * (vipDiscountPercent / 100));

  const couponDiscount = coupon?.discount || 0;
  const subtotalAfterVip = computedSubtotal - vipDiscountAmount;
  const gstRate = subtotalAfterVip > 1000 ? 0.18 : 0.05;
  const totalBeforeWallet = Math.round((subtotalAfterVip - couponDiscount) * (1 + gstRate));
  
  const walletDeduction = useWallet ? Math.min(walletBalance, totalBeforeWallet) : 0;
  const grandTotal = Math.max(0, totalBeforeWallet - walletDeduction);

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
    if (step === 3 && payment.method === 'card' && grandTotal > 0) {
      if (!payment.cardNumber.trim()) errs.cardNumber = 'Card number is required';
      if (!payment.cardName.trim()) errs.cardName = 'Name on card is required';
      if (!payment.expiry.trim()) errs.expiry = 'Expiry date is required';
      if (!payment.cvv.trim()) errs.cvv = 'CVV is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePlaceOrder = async () => {
    setOrderError('');
    setPlacing(true);
    try {
      const orderData = {
        items: cartItems.map(item => ({
          product_id: item.product_id,
          name: item.name,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          price: item.price,
          material: item.material || '',
          is_customized: item.is_customized || false,
          custom_attributes: item.custom_attributes || null,
        })),
        shipping_address: {
          name: `${personal.firstName} ${personal.lastName}`.trim(),
          phone: personal.phone,
          address: [address.line1, address.line2].filter(Boolean).join(', '),
          city: address.city,
          state: address.state,
          pincode: address.pincode,
        },
        payment_method: grandTotal === 0 ? 'wallet' : payment.method,
        coupon_code: coupon?.code || null,
        use_wallet: useWallet,
      };

      const result = await api.createOrder(orderData);

      // Clear cart after successful order
      try { await api.clearCart(); } catch (e) {}
      window.dispatchEvent(new Event('cobblyn-cart-update'));

      router.push('/order-confirmation?order=' + encodeURIComponent(result.order_number || result.id || ''));
    } catch (err) {
      setOrderError(err.message || 'Failed to place order. Please try again.');
    }
    setPlacing(false);
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < 3) {
      setStep(step + 1);
      setErrors({});
    } else {
      handlePlaceOrder();
    }
  };

  const handleBack = () => {
    if (step > (isAuthenticated ? 1 : 0)) { setStep(step - 1); setErrors({}); }
  };

  const indianStates = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'];

  if (cartLoading) {
    return (
      <div className="checkout-page" data-testid="checkout-page">
        <div style={{ padding: '100px', textAlign: 'center' }}>Loading checkout...</div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="checkout-page" data-testid="checkout-page">
        <div className="breadcrumbs">
          <Link href="/">Home</Link>
          <ChevronRight size={14} />
          <span>Checkout</span>
        </div>
        <div style={{ padding: '80px 20px', textAlign: 'center' }}>
          <h2>Your bag is empty</h2>
          <p style={{ color: '#6B7280', marginTop: 8 }}>Add items to your bag before checking out.</p>
          <Link href="/" style={{ display: 'inline-block', marginTop: 24, padding: '12px 32px', background: '#1a1a1a', color: '#fff', textDecoration: 'none', borderRadius: 4 }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

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
                <User size={16} /> Log in to your Cobblyn account
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
                <input type="email" value={guestData.email || user?.email || ''} disabled className="disabled-input" />
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
              {grandTotal === 0 ? (
                <div style={{ padding: '24px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', color: '#047857', fontWeight: '600', textAlign: 'center', marginBottom: '20px' }}>
                  🎉 Your wallet balance covers the entire order amount of ₹{totalBeforeWallet.toLocaleString()}. No additional payment is required.
                </div>
              ) : (
                <>
                  <p className="ck-form-desc">Choose your preferred payment method.</p>

                  <div className="payment-methods">
                    {!hasCustomizedItem && (
                      <label className={`payment-option ${payment.method === 'cod' ? 'active' : ''}`} data-testid="payment-cod">
                        <input type="radio" name="paymentMethod" value="cod" checked={payment.method === 'cod'} onChange={(e) => setPayment({ ...payment, method: e.target.value })} />
                        <div className="payment-option-content">
                          <strong>Cash on Delivery</strong>
                          <p>Pay when your order arrives at your doorstep</p>
                        </div>
                      </label>
                    )}

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
                </>
              )}

              <div className="ck-secure-note">
                <Lock size={14} />
                <span>All transactions are secure and encrypted</span>
              </div>
            </div>
          )}

          {orderError && (
            <div style={{ color: '#EF4444', padding: '12px 16px', background: '#FEF2F2', borderRadius: 6, marginTop: 12, fontSize: 14 }} data-testid="order-error">
              {orderError}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="ck-nav-buttons">
            {step > (isAuthenticated ? 1 : 0) && (
              <button className="ck-btn-back" onClick={handleBack} data-testid="checkout-back">
                <ArrowLeft size={16} /> Back
              </button>
            )}
            <button className="ck-btn-next" onClick={handleNext} disabled={placing} data-testid="checkout-next">
              {placing ? 'Placing Order...' : step === 3 ? 'Place Order' : 'Continue'} {!placing && <ArrowRight size={16} />}
            </button>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="checkout-summary" data-testid="checkout-summary">
          <h3 className="ck-summary-title">Order Summary</h3>

          <div className="ck-summary-items">
            {cartItems.map((item, idx) => (
              <div key={`${item.product_id}-${item.size}-${idx}`} className="ck-summary-item" data-testid={`ck-item-${idx}`}>
                <div className="ck-summary-img">
                  <img src={item.image} alt={item.name} />
                  <span className="ck-summary-qty">{item.quantity}</span>
                </div>
                <div className="ck-summary-details">
                  <h4>{item.name}</h4>
                  <p>Size: {item.size} | {item.color}</p>
                  {item.is_customized && item.custom_attributes && (
                    <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '4px' }}>
                      <div style={{ color: '#C9A84C', fontWeight: 600 }}>✨ Bespoke</div>
                      {item.custom_attributes.material && <div>• {item.custom_attributes.material}</div>}
                      {item.custom_attributes.sole_type && <div>• {item.custom_attributes.sole_type}</div>}
                    </div>
                  )}
                </div>
                <span className="ck-summary-price">{'\u20B9'}{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>

          {isAuthenticated && walletBalance > 0 && (
            <div className="ck-wallet-block" style={{ padding: '16px 18px', background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: '4px', marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', color: '#111' }}>
                <input 
                  type="checkbox" 
                  checked={useWallet} 
                  onChange={(e) => setUseWallet(e.target.checked)} 
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <div>Use Wallet Balance</div>
                  <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 'normal', marginTop: '2px' }}>
                    Available: <strong style={{ color: '#111' }}>₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </div>
                </div>
              </label>
              {useWallet && walletDeduction > 0 && (
                <div style={{ fontSize: '11px', color: '#10B981', fontWeight: '600', marginTop: '6px', paddingLeft: '26px' }}>
                  ✓ ₹{walletDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2 })} will be deducted from your total.
                </div>
              )}
            </div>
          )}

          <div className="ck-coupon-block" data-testid="coupon-block" style={{ padding: '14px 18px', background: '#FAFAFA', marginBottom: 12 }}>
            <CouponInput subtotal={computedSubtotal} onApply={(c) => setCoupon(c)} applied={coupon} />
          </div>

          <div className="ck-summary-totals">
            <div className="ck-total-line"><span>Subtotal</span><span data-testid="ck-subtotal">{'\u20B9'}{computedSubtotal.toLocaleString()}</span></div>
            {vipDiscountAmount > 0 && (
              <div className="ck-total-line" style={{ color: '#D4AF37', fontWeight: 'bold' }}>
                <span>VIP Discount ({vipDiscountPercent}%)</span>
                <span data-testid="ck-vip-discount">- {'\u20B9'}{vipDiscountAmount.toLocaleString()}</span>
              </div>
            )}
            {coupon && (
              <div className="ck-total-line" style={{ color: '#10B981' }}>
                <span>Coupon ({coupon.code})</span>
                <span data-testid="ck-coupon-discount">- {'\u20B9'}{coupon.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="ck-total-line"><span>GST (estimated)</span><span data-testid="ck-tax">{'\u20B9'}{Math.round((subtotalAfterVip - (coupon?.discount || 0)) * gstRate).toLocaleString()}</span></div>
            <div className="ck-total-line"><span>Shipping</span><span className="text-accent">Free</span></div>
            {useWallet && walletDeduction > 0 && (
              <div className="ck-total-line" style={{ color: '#10B981', fontWeight: '600' }}>
                <span>Wallet Balance Applied</span>
                <span>- {'\u20B9'}{walletDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="ck-total-line ck-grand-total"><span>Total</span><span data-testid="ck-total">
              {'\u20B9'}{grandTotal.toLocaleString()}
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
          {busy ? '…' : 'APPLY'}
        </button>
      </div>
      {err && <div style={{ color: '#EF4444', fontSize: 12, marginTop: 6 }} data-testid="coupon-error">{err}</div>}
    </div>
  );
};

export default CheckoutPage;
