"use client";
import React, { useState, useEffect } from 'react';
import { Settings, Users, Star, Edit, Trash2, Shield, AlertCircle, ShieldAlert, Plus } from 'lucide-react';
import { api } from '../../api';

const AdminVip = () => {
  const [config, setConfig] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [activeTab, setActiveTab] = useState('plans');

  // Grant Modal
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantUserEmail, setGrantUserEmail] = useState('');
  const [grantUserId, setGrantUserId] = useState('');
  const [grantPlanId, setGrantPlanId] = useState('monthly');
  const [grantMonths, setGrantMonths] = useState(1);
  const [grantDiscount, setGrantDiscount] = useState(10);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const confRes = await api.request('/vip/admin/config');
      setConfig(confRes);
      
      const memRes = await api.request('/vip/admin/members');
      setMembers(memRes);
    } catch (err) {
      console.error('Error fetching VIP admin data:', err);
      showMessage('Failed to load data', 'error');
    }
    setLoading(false);
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleConfigChange = (planIndex, field, value) => {
    const newConfig = { ...config };
    if (field === 'price' || field === 'discount_percent') {
      newConfig.plans[planIndex][field] = parseFloat(value) || 0;
    } else if (field === 'months') {
      newConfig.plans[planIndex][field] = parseInt(value, 10) || 1;
    } else if (field === 'is_active') {
      newConfig.plans[planIndex][field] = value;
    } else if (field === 'details') {
      newConfig.plans[planIndex][field] = value.split('\n').filter(s => s.trim() !== '');
    } else {
      newConfig.plans[planIndex][field] = value;
    }
    setConfig(newConfig);
  };

  const handleAddPlan = () => {
    const newConfig = { ...config };
    newConfig.plans.push({
      plan_id: `tier_${Date.now()}`,
      name: "New VIP Tier",
      price: 999.0,
      months: 1,
      discount_percent: 5.0,
      is_active: false,
      details: ["Exclusive benefit"]
    });
    setConfig(newConfig);
  };

  const handleRemovePlan = (planIndex) => {
    if (!window.confirm('Remove this tier?')) return;
    const newConfig = { ...config };
    newConfig.plans.splice(planIndex, 1);
    setConfig(newConfig);
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      await api.request('/vip/admin/config', {
        method: 'PUT',
        body: JSON.stringify(config)
      });
      showMessage('VIP Configurations saved successfully');
    } catch (err) {
      showMessage(err.message || 'Failed to save configs', 'error');
    }
    setSaving(false);
  };

  const handleCancelVip = async (userId) => {
    if (!window.confirm("Are you sure you want to revoke this user's VIP membership?")) return;
    try {
      await api.request(`/vip/admin/members/${userId}/cancel`, { method: 'POST' });
      showMessage('VIP Membership cancelled');
      fetchData();
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const openGrantModal = (user) => {
    setGrantUserId(user ? user.id : '');
    setGrantUserEmail(user ? user.email : '');
    setShowGrantModal(true);
  };

  const handleGrantVip = async (e) => {
    e.preventDefault();
    if (!grantUserId) {
      showMessage('Please provide a valid user ID', 'error');
      return;
    }
    try {
      await api.request(`/vip/admin/members/${grantUserId}/grant`, {
        method: 'POST',
        body: JSON.stringify({
          plan_id: grantPlanId,
          months: grantMonths,
          discount_percent: grantDiscount
        })
      });
      showMessage('VIP Membership manually granted');
      setShowGrantModal(false);
      fetchData();
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  if (loading) return <div style={{ padding: '40px' }}>Loading VIP settings...</div>;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px' }}>
      {message.text && (
        <div style={{ 
          position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
          padding: '12px 24px', borderRadius: '8px', color: '#fff', 
          backgroundColor: message.type === 'error' ? '#ef4444' : '#10b981',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontWeight: 'bold'
        }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Star color="#D4AF37" fill="#D4AF37" /> VIP Subscriptions Management
        </h1>
      </div>

      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('plans')}
          style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'plans' ? '2px solid #D4AF37' : '2px solid transparent', fontWeight: activeTab === 'plans' ? 'bold' : 'normal', color: activeTab === 'plans' ? '#111' : '#6b7280', cursor: 'pointer' }}
        >
          Subscription Plans
        </button>
        <button 
          onClick={() => setActiveTab('members')}
          style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'members' ? '2px solid #D4AF37' : '2px solid transparent', fontWeight: activeTab === 'members' ? 'bold' : 'normal', color: activeTab === 'members' ? '#111' : '#6b7280', cursor: 'pointer' }}
        >
          Active Members
        </button>
      </div>

      {activeTab === 'plans' && (
        <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={20} /> Subscription Tier Configuration
            </h2>
            <button 
              onClick={handleAddPlan} 
              style={{ padding: '8px 16px', background: '#f3f4f6', color: '#111', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={16} /> Add New Tier
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
            {config && config.plans.map((plan, idx) => (
              <div key={plan.plan_id} style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input 
                    type="text" 
                    value={plan.name}
                    onChange={(e) => handleConfigChange(idx, 'name', e.target.value)}
                    style={{ fontSize: '16px', fontWeight: 'bold', padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={plan.is_active !== false} 
                      onChange={(e) => handleConfigChange(idx, 'is_active', e.target.checked)} 
                    /> Active
                  </label>
                </div>
                <button onClick={() => handleRemovePlan(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                  <Trash2 size={16} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Price (₹)</label>
                  <input 
                    type="number" 
                    value={plan.price} 
                    onChange={(e) => handleConfigChange(idx, 'price', e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Duration (Months)</label>
                  <input 
                    type="number" 
                    value={plan.months} 
                    onChange={(e) => handleConfigChange(idx, 'months', e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Discount Percent (%)</label>
                  <input 
                    type="number" 
                    value={plan.discount_percent} 
                    onChange={(e) => handleConfigChange(idx, 'discount_percent', e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Benefits (One per line)</label>
                <textarea 
                  value={(plan.details || []).join('\n')}
                  onChange={(e) => handleConfigChange(idx, 'details', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', minHeight: '80px', fontFamily: 'inherit' }}
                />
              </div>
            </div>
            ))}
          </div>

          <button 
            onClick={saveConfig} 
            disabled={saving}
            style={{ width: '100%', padding: '12px', background: '#111', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
          >
            {saving ? 'Saving...' : 'Save Configurations'}
          </button>
        </div>
      )}

      {activeTab === 'members' && (
        <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} /> Active VIP Members ({members.length})
            </h2>
            <button 
              onClick={() => openGrantModal(null)}
              style={{ padding: '6px 12px', background: '#D4AF37', color: '#111', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
            >
              Manual Grant
            </button>
          </div>

          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {members.length === 0 ? (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px 0' }}>No active VIP members found.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f3f4f6', textAlign: 'left', color: '#6b7280' }}>
                    <th style={{ padding: '12px 8px' }}>User</th>
                    <th style={{ padding: '12px 8px' }}>Plan</th>
                    <th style={{ padding: '12px 8px' }}>Discount</th>
                    <th style={{ padding: '12px 8px' }}>Expires</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(member => (
                    <tr key={member.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ fontWeight: '500' }}>{member.name || 'Unknown'}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{member.email}</div>
                      </td>
                      <td style={{ padding: '12px 8px', textTransform: 'capitalize' }}>
                        {member.vip_membership?.plan_id || 'Unknown'}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ background: '#ecfdf5', color: '#047857', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' }}>
                          {member.vip_membership?.discount_percent || 0}%
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        {member.vip_membership?.expires_at ? new Date(member.vip_membership.expires_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <button 
                          onClick={() => handleCancelVip(member.id)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                          title="Revoke VIP Access"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Manual Grant Modal */}
      {showGrantModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert color="#D4AF37" /> Manual VIP Grant
            </h3>
            <form onSubmit={handleGrantVip}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>User ID</label>
                <input 
                  type="text" 
                  value={grantUserId} 
                  onChange={(e) => setGrantUserId(e.target.value)}
                  placeholder="64a1b2..."
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Plan Tier</label>
                <select 
                  value={grantPlanId}
                  onChange={(e) => setGrantPlanId(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Duration (Months)</label>
                  <input 
                    type="number" 
                    value={grantMonths} 
                    onChange={(e) => setGrantMonths(e.target.value)}
                    min="1"
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Discount (%)</label>
                  <input 
                    type="number" 
                    value={grantDiscount} 
                    onChange={(e) => setGrantDiscount(e.target.value)}
                    min="0"
                    max="100"
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" style={{ flex: 1, padding: '10px', background: '#D4AF37', color: '#111', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Grant VIP
                </button>
                <button type="button" onClick={() => setShowGrantModal(false)} style={{ flex: 1, padding: '10px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVip;
