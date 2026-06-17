"use client";
import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, Shield, Truck, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../api';

import { useAuth } from '../context/AuthContext';

const VipSubscription = () => {
  const { checkAuth } = useAuth();
  const [plans, setPlans] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState('');
  const [showCheckout, setShowCheckout] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Use api.request since getVipPlans is not explicitly defined
      const plansRes = await api.request('/vip/plans');
      setPlans(plansRes.plans || []);
      
      const statusRes = await api.request('/vip/status');
      setStatus(statusRes);
    } catch (err) {
      console.error('Failed to fetch VIP info', err);
    }
    setLoading(false);
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!showCheckout) return;
    setSubscribing(true);
    setError('');
    try {
      // Mock card checkout
      await api.request('/vip/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          plan_id: showCheckout,
          payment_method: paymentMethod === 'upi' ? 'upi' : 'mock_card'
        })
      });
      alert('Successfully subscribed to VIP!');
      setShowCheckout(null);
      await fetchData(); // Refresh status
      await checkAuth(); // Refresh global user context to update VIP badge
    } catch (err) {
      setError(err.message || 'Subscription failed');
    }
    setSubscribing(false);
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading VIP details...</div>;
  }

  const isActive = status?.is_active;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 10px 0', color: '#111' }}>
          <Star style={{ display: 'inline', color: '#D4AF37', marginRight: '10px' }} fill="#D4AF37" />
          Cobblyn VIP
        </h1>
        <p style={{ fontSize: '16px', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
          Experience the ultimate luxury. Get exclusive discounts, free shipping, and priority support.
        </p>
      </div>

      {isActive && (
        <div style={{
          background: 'linear-gradient(135deg, #111 0%, #222 100%)',
          color: '#D4AF37',
          padding: '24px',
          borderRadius: '16px',
          marginBottom: '40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
        }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>You are a VIP Member</h3>
            <p style={{ margin: 0, color: '#aaa', fontSize: '14px' }}>
              Your {status.plan_id} plan is active until {new Date(status.expires_at).toLocaleDateString()}.
            </p>
          </div>
          <Sparkles size={40} color="#D4AF37" />
        </div>
      )}

      {!isActive && (
        <>
          <div style={{ 
            background: '#FFFBEB', 
            border: '1px solid #FDE68A', 
            borderRadius: '12px', 
            padding: '16px', 
            marginBottom: '32px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start'
          }}>
            <AlertCircle color="#D97706" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ color: '#92400E', display: 'block', marginBottom: '4px' }}>Payment Notice</strong>
              <span style={{ color: '#B45309', fontSize: '14px' }}>
                Referral wallet rewards cannot be used to pay for VIP memberships. Subscriptions must be purchased using card checkout.
              </span>
            </div>
          </div>

          {error && (
            <div style={{ color: '#DC2626', background: '#FEE2E2', padding: '12px', borderRadius: '8px', marginBottom: '24px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
            {plans.map((plan) => (
              <div key={plan.plan_id} style={{
                border: '1px solid #eaeaea',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                background: '#fff',
                position: 'relative',
                boxShadow: plan.plan_id === 'annual' ? '0 12px 40px rgba(212, 175, 55, 0.15)' : 'none',
                borderColor: plan.plan_id === 'annual' ? '#D4AF37' : '#eaeaea'
              }}>
                {plan.plan_id === 'annual' && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#D4AF37', color: '#111', fontSize: '12px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '12px' }}>
                    BEST VALUE
                  </div>
                )}
                <h3 style={{ fontSize: '20px', margin: '0 0 8px 0', textTransform: 'capitalize' }}>{plan.name}</h3>
                <div style={{ fontSize: '32px', fontWeight: '800', margin: '16px 0', color: '#111' }}>
                  ₹{plan.price}
                </div>
                <div style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
                  for {plan.months} {plan.months === 1 ? 'month' : 'months'}
                </div>
                
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', textAlign: 'left', fontSize: '14px', color: '#444' }}>
                  {(plan.details || []).map((detail, idx) => (
                    <li key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <CheckCircle size={16} color="#10B981" style={{ flexShrink: 0 }} /> 
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={() => setShowCheckout(plan.plan_id)}
                  disabled={subscribing}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: plan.plan_id === 'annual' ? '#111' : '#f5f5f7',
                    color: plan.plan_id === 'annual' ? '#D4AF37' : '#111',
                    fontWeight: 'bold',
                    cursor: subscribing ? 'not-allowed' : 'pointer',
                    transition: 'opacity 0.2s'
                  }}
                >
                  {subscribing ? 'Processing...' : `Subscribe via Card`}
                </button>
              </div>
            ))}
          </div>
          
          {/* Mock Checkout Modal */}
          {showCheckout && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
              <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', width: '400px', maxWidth: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield color="#10B981" /> Secure Checkout
                  </h3>
                  <button onClick={() => setShowCheckout(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' }}>&times;</button>
                </div>
                
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
                  Please enter your payment details to start your {plans.find(p => p.plan_id === showCheckout)?.name}.
                </p>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="payment_method" 
                      value="card" 
                      checked={paymentMethod === 'card'} 
                      onChange={(e) => setPaymentMethod(e.target.value)} 
                    />
                    Card
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="payment_method" 
                      value="upi" 
                      checked={paymentMethod === 'upi'} 
                      onChange={(e) => setPaymentMethod(e.target.value)} 
                    />
                    UPI
                  </label>
                </div>
                
                <form onSubmit={handleSubscribe}>
                  {paymentMethod === 'card' ? (
                    <>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: 'bold' }}>Name on Card</label>
                        <input type="text" required placeholder="John Doe" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: 'bold' }}>Card Number</label>
                        <input type="text" required placeholder="0000 0000 0000 0000" maxLength="19" pattern="\d{4}\s?\d{4}\s?\d{4}\s?\d{4}" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: 'bold' }}>Expiry (MM/YY)</label>
                          <input type="text" required placeholder="MM/YY" pattern="\d\d/\d\d" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: 'bold' }}>CVV</label>
                          <input type="password" required placeholder="123" maxLength="4" pattern="\d{3,4}" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: 'bold' }}>UPI ID</label>
                      <input type="text" required placeholder="yourname@upi" pattern="^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
                    </div>
                  )}
                  
                  <div style={{ background: '#f5f5f7', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', color: '#111' }}>Total:</span>
                    <span style={{ fontSize: '20px', fontWeight: '800', color: '#D4AF37' }}>₹{plans.find(p => p.plan_id === showCheckout)?.price}</span>
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={subscribing}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#111',
                      color: '#D4AF37',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      cursor: subscribing ? 'not-allowed' : 'pointer',
                      transition: 'background 0.2s'
                    }}
                  >
                    {subscribing ? 'Processing Payment...' : 'Pay & Subscribe'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VipSubscription;
