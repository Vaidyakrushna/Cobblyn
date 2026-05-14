"use client";
﻿import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { User, MapPin, CreditCard, Lock, Package, FileText, ChevronRight, Plus, Trash2, Edit2, X, Check, Heart, CalendarCheck, Palette, ExternalLink, ShoppingBag, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'orders', label: 'My Orders', icon: Package },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
  { id: 'visits', label: 'Scheduled Visits', icon: CalendarCheck },
  { id: 'custom', label: 'Custom Orders', icon: Palette },
];

const MyAccountPage = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileSection, setProfileSection] = useState('info'); // info, addresses, payments, password

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) return <div className="account-loading">Loading...</div>;
  if (!isAuthenticated) return null;

  return (
    <div className="account-page" data-testid="my-account-page">
      <div className="account-container">
        <div className="account-sidebar">
          <div className="account-user-info">
            <div className="account-avatar">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
            <div className="account-user-name">{user?.name || 'User'}</div>
            <div className="account-user-email">{user?.email || ''}</div>
          </div>
          <nav className="account-nav">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`account-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => { setActiveTab(tab.id); setProfileSection('info'); }}
                data-testid={`account-tab-${tab.id}`}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
                <ChevronRight size={14} className="account-nav-arrow" />
              </button>
            ))}
          </nav>
        </div>
        <div className="account-content">
          {activeTab === 'profile' && <ProfileTab section={profileSection} setSection={setProfileSection} />}
          {activeTab === 'orders' && <OrdersTab />}
          {activeTab === 'wishlist' && <WishlistTab />}
          {activeTab === 'visits' && <VisitsTab />}
          {activeTab === 'custom' && <CustomOrdersTab />}
        </div>
      </div>
    </div>
  );
};

// ===== Profile Tab =====
const ProfileTab = ({ section, setSection }) => {
  return (
    <div className="account-panel" data-testid="profile-panel">
      <div className="profile-sub-nav">
        <button className={`psn-btn ${section === 'info' ? 'active' : ''}`} onClick={() => setSection('info')} data-testid="profile-info-tab">
          <User size={16} /> Personal Info
        </button>
        <button className={`psn-btn ${section === 'addresses' ? 'active' : ''}`} onClick={() => setSection('addresses')} data-testid="profile-addresses-tab">
          <MapPin size={16} /> Addresses
        </button>
        <button className={`psn-btn ${section === 'payments' ? 'active' : ''}`} onClick={() => setSection('payments')} data-testid="profile-payments-tab">
          <CreditCard size={16} /> Payment Methods
        </button>
        <button className={`psn-btn ${section === 'password' ? 'active' : ''}`} onClick={() => setSection('password')} data-testid="profile-password-tab">
          <Lock size={16} /> Change Password
        </button>
      </div>
      {section === 'info' && <PersonalInfoSection />}
      {section === 'addresses' && <AddressSection />}
      {section === 'payments' && <PaymentSection />}
      {section === 'password' && <PasswordSection />}
    </div>
  );
};

// ===== Personal Info =====
const PersonalInfoSection = () => {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.getProfile().then(data => {
      setProfile(data);
      setForm({ name: data.name || '', phone: data.phone || '' });
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    try {
      await api.updateProfile(form);
      setProfile({ ...profile, ...form });
      setEditing(false);
      setMsg('Profile updated successfully');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { setMsg(err.message); }
  };

  if (!profile) return <div className="account-loading">Loading profile...</div>;

  return (
    <div className="account-section" data-testid="personal-info-section">
      <div className="section-header">
        <h3>Personal Information</h3>
        {!editing && <button className="account-edit-btn" onClick={() => setEditing(true)} data-testid="edit-profile-btn"><Edit2 size={14} /> Edit</button>}
      </div>
      {msg && <div className="account-msg">{msg}</div>}
      {editing ? (
        <div className="account-form">
          <div className="af-field"><label>Full Name</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} data-testid="profile-name-input" /></div>
          <div className="af-field"><label>Phone</label><input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+91 98765 43210" data-testid="profile-phone-input" /></div>
          <div className="af-field"><label>Email</label><input type="email" value={profile.email} disabled className="disabled-input" /></div>
          <div className="account-form-actions">
            <button className="account-btn-primary" onClick={handleSave} data-testid="save-profile-btn">Save Changes</button>
            <button className="account-btn-secondary" onClick={() => { setEditing(false); setForm({ name: profile.name, phone: profile.phone || '' }); }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="account-info-grid">
          <div className="info-item"><span className="info-label">Name</span><span className="info-value">{profile.name}</span></div>
          <div className="info-item"><span className="info-label">Email</span><span className="info-value">{profile.email}</span></div>
          <div className="info-item"><span className="info-label">Phone</span><span className="info-value">{profile.phone || 'Not set'}</span></div>
          <div className="info-item"><span className="info-label">Member Since</span><span className="info-value">{profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) : '-'}</span></div>
          <div className="info-item"><span className="info-label">Total Orders</span><span className="info-value">{profile.order_count || 0}</span></div>
        </div>
      )}
    </div>
  );
};

// ===== Address Section =====
const AddressSection = () => {
  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ label: 'home', name: '', phone: '', address_line1: '', address_line2: '', city: '', state: '', pincode: '', is_default: false });
  const [msg, setMsg] = useState('');

  const fetchAddresses = () => {
    api.getAddresses().then(data => setAddresses(data.addresses || [])).catch(() => {});
  };
  useEffect(() => { fetchAddresses(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateAddress(editingId, form);
      } else {
        await api.addAddress(form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ label: 'home', name: '', phone: '', address_line1: '', address_line2: '', city: '', state: '', pincode: '', is_default: false });
      fetchAddresses();
      setMsg(editingId ? 'Address updated' : 'Address added');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { setMsg(err.message); }
  };

  const handleEdit = (addr) => {
    setForm({ label: addr.label, name: addr.name, phone: addr.phone, address_line1: addr.address_line1, address_line2: addr.address_line2 || '', city: addr.city, state: addr.state, pincode: addr.pincode, is_default: addr.is_default });
    setEditingId(addr.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try { await api.deleteAddress(id); fetchAddresses(); } catch (err) { setMsg(err.message); }
  };

  return (
    <div className="account-section" data-testid="address-section">
      <div className="section-header">
        <h3>Saved Addresses</h3>
        <button className="account-btn-primary" onClick={() => { setShowForm(true); setEditingId(null); setForm({ label: 'home', name: '', phone: '', address_line1: '', address_line2: '', city: '', state: '', pincode: '', is_default: false }); }} data-testid="add-address-btn">
          <Plus size={14} /> Add Address
        </button>
      </div>
      {msg && <div className="account-msg">{msg}</div>}

      {addresses.length === 0 && !showForm && <p className="account-empty">No addresses saved yet.</p>}

      <div className="address-cards">
        {addresses.map(addr => (
          <div key={addr.id} className={`address-card ${addr.is_default ? 'default' : ''}`} data-testid={`address-card-${addr.id}`}>
            <div className="address-card-header">
              <span className="address-label">{addr.label}</span>
              {addr.is_default && <span className="address-default-badge">Default</span>}
            </div>
            <div className="address-card-body">
              <p className="address-name">{addr.name}</p>
              <p>{addr.address_line1}</p>
              {addr.address_line2 && <p>{addr.address_line2}</p>}
              <p>{addr.city}, {addr.state} - {addr.pincode}</p>
              <p className="address-phone">{addr.phone}</p>
            </div>
            <div className="address-card-actions">
              <button onClick={() => handleEdit(addr)} data-testid={`edit-address-${addr.id}`}><Edit2 size={14} /> Edit</button>
              <button onClick={() => handleDelete(addr.id)} data-testid={`delete-address-${addr.id}`}><Trash2 size={14} /> Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="account-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="account-modal" onClick={e => e.stopPropagation()}>
            <button className="account-modal-close" onClick={() => setShowForm(false)}><X size={20} /></button>
            <h3>{editingId ? 'Edit Address' : 'Add New Address'}</h3>
            <form onSubmit={handleSubmit} className="account-form">
              <div className="af-row">
                <div className="af-field"><label>Label</label>
                  <select value={form.label} onChange={e => setForm({...form, label: e.target.value})}>
                    <option value="home">Home</option><option value="office">Office</option><option value="other">Other</option>
                  </select>
                </div>
                <div className="af-field"><label>Full Name *</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
              </div>
              <div className="af-field"><label>Phone *</label><input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required /></div>
              <div className="af-field"><label>Address Line 1 *</label><input type="text" value={form.address_line1} onChange={e => setForm({...form, address_line1: e.target.value})} required /></div>
              <div className="af-field"><label>Address Line 2</label><input type="text" value={form.address_line2} onChange={e => setForm({...form, address_line2: e.target.value})} /></div>
              <div className="af-row">
                <div className="af-field"><label>City *</label><input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} required /></div>
                <div className="af-field"><label>State *</label><input type="text" value={form.state} onChange={e => setForm({...form, state: e.target.value})} required /></div>
                <div className="af-field"><label>PIN Code *</label><input type="text" value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})} required /></div>
              </div>
              <div className="af-field af-checkbox">
                <label><input type="checkbox" checked={form.is_default} onChange={e => setForm({...form, is_default: e.target.checked})} /> Set as default address</label>
              </div>
              <button type="submit" className="account-btn-primary">{editingId ? 'Update' : 'Save'} Address</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== Payment Methods Section =====
const PaymentSection = () => {
  const [methods, setMethods] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'card', label: '', last4: '', card_brand: 'Visa', upi_id: '', is_default: false });
  const [msg, setMsg] = useState('');

  const fetchMethods = () => {
    api.getPaymentMethods().then(data => setMethods(data.payment_methods || [])).catch(() => {});
  };
  useEffect(() => { fetchMethods(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const label = form.type === 'card' ? `${form.card_brand} ending ${form.last4}` : `UPI: ${form.upi_id}`;
      await api.addPaymentMethod({ ...form, label });
      setShowForm(false);
      setForm({ type: 'card', label: '', last4: '', card_brand: 'Visa', upi_id: '', is_default: false });
      fetchMethods();
      setMsg('Payment method added');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { setMsg(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this payment method?')) return;
    try { await api.deletePaymentMethod(id); fetchMethods(); } catch (err) { setMsg(err.message); }
  };

  return (
    <div className="account-section" data-testid="payment-section">
      <div className="section-header">
        <h3>Saved Payment Methods</h3>
        <button className="account-btn-primary" onClick={() => setShowForm(true)} data-testid="add-payment-btn">
          <Plus size={14} /> Add Method
        </button>
      </div>
      {msg && <div className="account-msg">{msg}</div>}

      {methods.length === 0 && !showForm && <p className="account-empty">No payment methods saved yet.</p>}

      <div className="payment-cards">
        {methods.map(m => (
          <div key={m.id} className={`payment-card ${m.is_default ? 'default' : ''}`} data-testid={`payment-card-${m.id}`}>
            <div className="payment-card-icon">
              <CreditCard size={24} />
            </div>
            <div className="payment-card-info">
              <span className="payment-label">{m.label}</span>
              {m.is_default && <span className="payment-default-badge">Default</span>}
            </div>
            <button className="payment-delete-btn" onClick={() => handleDelete(m.id)} data-testid={`delete-payment-${m.id}`}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="account-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="account-modal" onClick={e => e.stopPropagation()}>
            <button className="account-modal-close" onClick={() => setShowForm(false)}><X size={20} /></button>
            <h3>Add Payment Method</h3>
            <form onSubmit={handleSubmit} className="account-form">
              <div className="af-field"><label>Type</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="card">Card</option><option value="upi">UPI</option>
                </select>
              </div>
              {form.type === 'card' ? (
                <>
                  <div className="af-row">
                    <div className="af-field"><label>Card Brand</label>
                      <select value={form.card_brand} onChange={e => setForm({...form, card_brand: e.target.value})}>
                        <option value="Visa">Visa</option><option value="Mastercard">Mastercard</option><option value="RuPay">RuPay</option><option value="Amex">Amex</option>
                      </select>
                    </div>
                    <div className="af-field"><label>Last 4 Digits *</label><input type="text" maxLength="4" value={form.last4} onChange={e => setForm({...form, last4: e.target.value.replace(/\D/g, '')})} required /></div>
                  </div>
                </>
              ) : (
                <div className="af-field"><label>UPI ID *</label><input type="text" value={form.upi_id} onChange={e => setForm({...form, upi_id: e.target.value})} placeholder="name@upi" required /></div>
              )}
              <div className="af-field af-checkbox">
                <label><input type="checkbox" checked={form.is_default} onChange={e => setForm({...form, is_default: e.target.checked})} /> Set as default</label>
              </div>
              <button type="submit" className="account-btn-primary">Save Payment Method</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== Password Section =====
const PasswordSection = () => {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm_password) {
      setMsg('New passwords do not match');
      setMsgType('error');
      return;
    }
    if (form.new_password.length < 6) {
      setMsg('New password must be at least 6 characters');
      setMsgType('error');
      return;
    }
    try {
      await api.changePassword({ current_password: form.current_password, new_password: form.new_password });
      setMsg('Password changed successfully');
      setMsgType('success');
      setForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setMsg(err.message);
      setMsgType('error');
    }
  };

  return (
    <div className="account-section" data-testid="password-section">
      <div className="section-header"><h3>Change Password</h3></div>
      {msg && <div className={`account-msg ${msgType}`}>{msg}</div>}
      <form onSubmit={handleSubmit} className="account-form password-form">
        <div className="af-field"><label>Current Password *</label><input type="password" value={form.current_password} onChange={e => setForm({...form, current_password: e.target.value})} required data-testid="current-password-input" /></div>
        <div className="af-field"><label>New Password *</label><input type="password" value={form.new_password} onChange={e => setForm({...form, new_password: e.target.value})} required data-testid="new-password-input" /></div>
        <div className="af-field"><label>Confirm New Password *</label><input type="password" value={form.confirm_password} onChange={e => setForm({...form, confirm_password: e.target.value})} required data-testid="confirm-password-input" /></div>
        <button type="submit" className="account-btn-primary" data-testid="change-password-btn">Update Password</button>
      </form>
    </div>
  );
};

// ===== Orders Tab =====
const OrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => {
    api.getMyOrders().then(data => { setOrders(data.orders || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const viewOrderDetail = async (orderId) => {
    try {
      const data = await api.getMyOrder(orderId);
      setSelectedOrder(data);
    } catch (err) { alert(err.message); }
  };

  const viewInvoice = async (orderId) => {
    try {
      const data = await api.getOrderInvoice(orderId);
      setInvoice(data);
      setShowInvoice(true);
    } catch (err) { alert(err.message); }
  };

  const getStatusColor = (status) => {
    const colors = { pending: '#f59e0b', confirmed: '#3b82f6', in_production: '#8b5cf6', quality_check: '#6366f1', shipped: '#06b6d4', delivered: '#10b981', cancelled: '#ef4444', returned: '#6b7280' };
    return colors[status] || '#6b7280';
  };

  if (loading) return <div className="account-loading">Loading orders...</div>;

  if (selectedOrder) {
    return (
      <div className="account-panel" data-testid="order-detail-panel">
        <button className="account-back-btn" onClick={() => setSelectedOrder(null)} data-testid="back-to-orders-btn">&larr; Back to Orders</button>
        <div className="order-detail">
          <div className="order-detail-header">
            <div>
              <h3>Order #{selectedOrder.order_number}</h3>
              <p className="order-date">{new Date(selectedOrder.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="order-detail-actions">
              <span className="order-status-badge" style={{ backgroundColor: getStatusColor(selectedOrder.status) }}>{selectedOrder.status?.replace(/_/g, ' ')}</span>
              <button className="account-btn-secondary" onClick={() => viewInvoice(selectedOrder.id)} data-testid="view-invoice-btn"><FileText size={14} /> Invoice</button>
            </div>
          </div>

          {/* Order Timeline */}
          {selectedOrder.status_history && selectedOrder.status_history.length > 0 && (
            <div className="order-timeline" data-testid="order-timeline">
              <h4>Order Tracking</h4>
              <div className="timeline-track">
                {selectedOrder.status_history.map((entry, idx) => (
                  <div key={idx} className={`timeline-entry ${idx === selectedOrder.status_history.length - 1 ? 'current' : ''}`}>
                    <div className="timeline-dot"><Check size={10} /></div>
                    <div className="timeline-info">
                      <span className="timeline-status">{entry.status?.replace(/_/g, ' ')}</span>
                      <span className="timeline-time">{new Date(entry.timestamp).toLocaleString('en-IN')}</span>
                      {entry.note && <span className="timeline-note">{entry.note}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="order-items-section">
            <h4>Items</h4>
            {selectedOrder.items?.map((item, idx) => (
              <div key={idx} className="order-item-row">
                <div className="order-item-info">
                  <span className="order-item-name">{item.name || 'Product'}</span>
                  <span className="order-item-meta">Size: {item.size} | Color: {item.color} | Qty: {item.quantity}</span>
                </div>
                <span className="order-item-price">{'\u20B9'}{(item.price * item.quantity).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>

          {/* Shipping */}
          {selectedOrder.shipping_address && (
            <div className="order-shipping-section">
              <h4>Shipping Address</h4>
              <p>{selectedOrder.shipping_address.name}</p>
              <p>{selectedOrder.shipping_address.address}</p>
              <p>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} - {selectedOrder.shipping_address.pincode}</p>
              <p>{selectedOrder.shipping_address.phone}</p>
            </div>
          )}

          <div className="order-total-section">
            <span>Total Amount</span>
            <span className="order-total-amount">{'\u20B9'}{selectedOrder.total_amount?.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="account-panel" data-testid="orders-panel">
      <div className="section-header"><h3>My Orders</h3></div>
      {orders.length === 0 ? (
        <div className="account-empty-orders">
          <Package size={48} strokeWidth={1} />
          <p>You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card" data-testid={`order-card-${order.id}`}>
              <div className="order-card-header">
                <span className="order-number">#{order.order_number}</span>
                <span className="order-status-badge" style={{ backgroundColor: getStatusColor(order.status) }}>{order.status?.replace(/_/g, ' ')}</span>
              </div>
              <div className="order-card-body">
                <div className="order-card-info">
                  <span className="order-card-date">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span className="order-card-items">{order.items?.length || 0} item(s)</span>
                </div>
                <span className="order-card-total">{'\u20B9'}{order.total_amount?.toLocaleString('en-IN')}</span>
              </div>
              <div className="order-card-actions">
                <button onClick={() => viewOrderDetail(order.id)} data-testid={`view-order-${order.id}`}>Track Order</button>
                <button onClick={() => viewInvoice(order.id)} data-testid={`invoice-order-${order.id}`}><FileText size={14} /> Invoice</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoice && invoice && (
        <div className="account-modal-overlay" onClick={() => setShowInvoice(false)}>
          <div className="account-modal invoice-modal" onClick={e => e.stopPropagation()}>
            <button className="account-modal-close" onClick={() => setShowInvoice(false)}><X size={20} /></button>
            <InvoiceView invoice={invoice} />
          </div>
        </div>
      )}
    </div>
  );
};

// ===== Invoice View =====
const InvoiceView = ({ invoice }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="invoice-container" data-testid="invoice-view">
      <div className="invoice-header">
        <div className="invoice-brand">
          <h2>BY<span style={{ color: '#C9A84C' }}>O</span>ND</h2>
          <p>{invoice.company?.name}</p>
          <p className="invoice-small">{invoice.company?.address}</p>
          <p className="invoice-small">GSTIN: {invoice.company?.gstin}</p>
        </div>
        <div className="invoice-meta">
          <h3>TAX INVOICE</h3>
          <p><strong>Invoice:</strong> {invoice.invoice_number}</p>
          <p><strong>Date:</strong> {new Date(invoice.order_date).toLocaleDateString('en-IN')}</p>
          <p><strong>Order:</strong> {invoice.order_number}</p>
        </div>
      </div>

      <div className="invoice-addresses">
        <div className="invoice-bill-to">
          <h4>Bill To:</h4>
          <p>{invoice.customer_name}</p>
          <p>{invoice.customer_email}</p>
          {invoice.shipping_address && (
            <>
              <p>{invoice.shipping_address.address}</p>
              <p>{invoice.shipping_address.city}, {invoice.shipping_address.state} - {invoice.shipping_address.pincode}</p>
            </>
          )}
        </div>
      </div>

      <table className="invoice-table">
        <thead>
          <tr><th>#</th><th>Item</th><th>Size</th><th>Color</th><th>Qty</th><th>Price</th><th>Amount</th></tr>
        </thead>
        <tbody>
          {invoice.items?.map((item, idx) => (
            <tr key={idx}>
              <td>{idx + 1}</td>
              <td>{item.name || 'Product'}</td>
              <td>{item.size}</td>
              <td>{item.color}</td>
              <td>{item.quantity}</td>
              <td>{'\u20B9'}{item.price?.toLocaleString('en-IN')}</td>
              <td>{'\u20B9'}{(item.price * item.quantity).toLocaleString('en-IN')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="invoice-totals">
        <div className="invoice-total-row"><span>Subtotal</span><span>{'\u20B9'}{invoice.subtotal?.toLocaleString('en-IN')}</span></div>
        <div className="invoice-total-row"><span>GST (18%)</span><span>{'\u20B9'}{invoice.gst?.toLocaleString('en-IN')}</span></div>
        <div className="invoice-total-row total"><span>Total</span><span>{'\u20B9'}{invoice.total?.toLocaleString('en-IN')}</span></div>
      </div>

      <div className="invoice-footer">
        <p>Payment Method: {invoice.payment_method?.toUpperCase()}</p>
        <p className="invoice-small">Thank you for shopping with BYOND. For queries, contact {invoice.company?.email}</p>
        <button className="account-btn-primary invoice-print-btn" onClick={handlePrint} data-testid="print-invoice-btn">Print Invoice</button>
      </div>
    </div>
  );
};

// ===== Wishlist Tab =====
const WishlistTab = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getWishlist()
      .then(data => setItems(data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (productId) => {
    try {
      await api.removeFromWishlist(productId);
      setItems(prev => prev.filter(i => i.product_id !== productId));
      window.dispatchEvent(new Event('byond-wishlist-update'));
    } catch {}
  };

  const moveToCart = async (item) => {
    try {
      const sizes = item.sizes || ['9'];
      const defaultSize = sizes[Math.floor(sizes.length / 2)] || '9';
      await api.wishlistMoveToCart(item.product_id, {
        size: defaultSize,
        color: (item.colors?.[0]?.name || 'Black'),
        quantity: 1,
      });
      setItems(prev => prev.filter(i => i.product_id !== item.product_id));
      window.dispatchEvent(new Event('byond-cart-update'));
      window.dispatchEvent(new Event('byond-wishlist-update'));
    } catch (err) {
      alert('Failed to move to cart: ' + err.message);
    }
  };

  if (loading) return <div className="account-loading">Loading wishlist...</div>;

  return (
    <div className="account-panel" data-testid="wishlist-panel">
      <div className="section-header">
        <h3>My Wishlist</h3>
        {items.length > 0 && <span style={{fontSize:'0.75rem',color:'var(--mid-grey)'}}>{items.length} item{items.length !== 1 ? 's' : ''} saved</span>}
      </div>
      {items.length === 0 ? (
        <div className="account-empty-orders">
          <Heart size={48} strokeWidth={1} />
          <p>Your wishlist is empty.</p>
          <a href="/" className="account-btn-primary" style={{textDecoration:'none',marginTop:12}}>Explore Collection</a>
        </div>
      ) : (
        <div className="wishlist-grid">
          {items.map(item => (
            <div key={item.product_id} className="wishlist-card" data-testid={`wishlist-item-${item.product_id}`}>
              <button className="wishlist-remove" onClick={() => handleRemove(item.product_id)} title="Remove from wishlist" data-testid={`wishlist-remove-${item.product_id}`}>
                <Trash2 size={16} />
              </button>
              <a href={`/${item.gender || 'men'}/product/${item.product_id}`} className="wishlist-img-link">
                {item.image
                  ? <img src={item.image} alt={item.name || 'Product'} />
                  : <div style={{width:'100%',height:'100%',background:'#f8f8f6',display:'flex',alignItems:'center',justifyContent:'center'}}><Heart size={32} style={{color:'var(--accent)'}}/></div>
                }
              </a>
              <div className="wishlist-card-info">
                <h3>{item.name || 'Product'}</h3>
                {item.material && <p className="wishlist-card-material">{item.material}</p>}
                {item.colors && item.colors.length > 0 && (
                  <div className="wishlist-card-colors">
                    {item.colors.map((c, i) => <span key={i} className="wishlist-color-dot" style={{ backgroundColor: c.hex }} title={c.name}></span>)}
                  </div>
                )}
                <div className="wishlist-card-bottom">
                  <span className="wishlist-price">{'\u20B9'}{(item.price || 0).toLocaleString('en-IN')}</span>
                  <button className="wishlist-add-cart" onClick={() => moveToCart(item)} data-testid={`wishlist-move-cart-${item.product_id}`}>
                    <ShoppingBag size={14} /> Move to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ===== Scheduled Visits Tab =====
const visitStyleOptions = ['Oxford', 'Loafer', 'Monk Strap', 'Derby', 'Wing Tip', 'Desert Boot', 'Jutis', 'Mojaris', 'Mule', 'Boat'];
const visitMaterialOptions = ['Full-Grain Leather', 'Suede', 'Nubuck', 'Patent Leather', 'Italian Calfskin', 'Shell Cordovan', 'Silk Brocade'];

const VisitsTab = () => {
  const { user } = useAuth();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [rescheduleVisit, setRescheduleVisit] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleNotes, setRescheduleNotes] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  const buildInitialForm = () => {
    const nameParts = (user?.name || '').split(' ');
    return {
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: user?.email || '',
      contactNumber: user?.phone || '',
      visitDate: '', style: '', material: '', materialType: '', visitFor: '', pinCode: '', notes: ''
    };
  };

  const [formData, setFormData] = useState(buildInitialForm);

  const fetchVisits = () => {
    api.myVisits()
      .then(data => setVisits(data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchVisits(); }, []);

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.scheduleVisit({
        first_name: formData.firstName, last_name: formData.lastName,
        email: formData.email, contact_number: formData.contactNumber,
        visit_date: formData.visitDate, style: formData.style,
        material: formData.material, material_type: formData.materialType,
        visit_for: formData.visitFor, pin_code: formData.pinCode, notes: formData.notes,
      });
      setSubmitted(true);
      setFormData(buildInitialForm());
      fetchVisits();
    } catch (err) {
      setFormError(err.message || 'Could not schedule visit.');
    }
    setSubmitting(false);
  };

  const openForm = () => { setFormData(buildInitialForm()); setSubmitted(false); setFormError(''); setShowForm(true); };

  const cancelVisit = async (visitId) => {
    if (!window.confirm('Are you sure you want to cancel this visit?')) return;
    try {
      await api.cancelMyVisit(visitId);
      setVisits(prev => prev.map(v => v.id === visitId ? { ...v, status: 'cancelled' } : v));
    } catch (err) {
      alert(err.message || 'Failed to cancel visit');
    }
  };

  const openReschedule = (visit) => {
    setRescheduleVisit(visit);
    setRescheduleDate('');
    setRescheduleNotes(visit.notes || '');
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleVisit) return;
    setRescheduling(true);
    try {
      await api.rescheduleMyVisit(rescheduleVisit.id, {
        new_visit_date: rescheduleDate,
        notes: rescheduleNotes || null,
      });
      setRescheduleVisit(null);
      fetchVisits();
    } catch (err) {
      alert(err.message || 'Failed to reschedule visit');
    }
    setRescheduling(false);
  };

  const getStatusStyle = (status) => {
    const map = {
      pending: { background: '#FEF3C7', color: '#92400E' },
      confirmed: { background: '#DBEAFE', color: '#1E40AF' },
      visited: { background: '#D1FAE5', color: '#065F46' },
      delivered: { background: '#ECFDF5', color: '#047857' },
      cancelled: { background: '#FEE2E2', color: '#991B1B' },
      rescheduled: { background: '#F3E8FF', color: '#7C3AED' },
    };
    return map[status] || { background: '#F3F4F6', color: '#6B7280' };
  };

  const minDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  if (loading) return <div className="account-loading">Loading visits...</div>;

  return (
    <div className="account-panel" data-testid="visits-panel">
      <div className="section-header">
        <h3>Scheduled Visits</h3>
        <button className="account-btn-primary" onClick={openForm}><Plus size={14} /> Schedule New</button>
      </div>

      {visits.length === 0 ? (
        <div className="account-empty-orders">
          <CalendarCheck size={48} strokeWidth={1} />
          <p>No visits scheduled yet.</p>
        </div>
      ) : (
        <div className="orders-list">
          {visits.map(visit => (
            <div key={visit.id} className="order-card" data-testid={`visit-card-${visit.id}`}>
              <div className="order-card-header">
                <span className="order-number">{visit.style} &#8212; {visit.material}</span>
                <span className="order-status-badge" style={getStatusStyle(visit.status)}>{visit.status}</span>
              </div>
              <div className="account-info-grid" style={{marginTop:12, marginBottom:8}}>
                <div className="info-item"><span className="info-label">Scheduled Date</span><span className="info-value">{visit.visit_date ? new Date(visit.visit_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '\u2014'}</span></div>
                <div className="info-item"><span className="info-label">Model Style</span><span className="info-value">{visit.style || '\u2014'}</span></div>
                <div className="info-item"><span className="info-label">Material</span><span className="info-value">{visit.material || '\u2014'}</span></div>
                <div className="info-item"><span className="info-label">Material Type</span><span className="info-value">{visit.material_type || '\u2014'}</span></div>
                <div className="info-item"><span className="info-label">For</span><span className="info-value">{visit.visit_for === 'men' ? 'Men' : visit.visit_for === 'women' ? 'Women' : (visit.visit_for || '\u2014')}</span></div>
                <div className="info-item"><span className="info-label">PIN Code</span><span className="info-value">{visit.pin_code || '\u2014'}</span></div>
              </div>
              {visit.notes && <div style={{fontSize:'0.72rem',color:'var(--mid-grey)',fontStyle:'italic',padding:'4px 0 0'}}>Note: {visit.notes}</div>}
              {visit.rescheduled_from && <div style={{fontSize:'0.62rem',color:'#7C3AED',marginTop:6}}>Rescheduled from {visit.original_visit_date || 'a previous visit'}</div>}
              {visit.rescheduled_to && <div style={{fontSize:'0.62rem',color:'#7C3AED',marginTop:6}}>Rescheduled to {visit.rescheduled_date || 'a new visit'}</div>}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:10,paddingTop:10,borderTop:'1px solid #f0f0f0'}}>
                <span style={{fontSize:'0.62rem',color:'var(--mid-grey)'}}>Booked on {visit.created_at ? new Date(visit.created_at).toLocaleDateString('en-IN') : '\u2014'}</span>
                {visit.status !== 'cancelled' && visit.status !== 'visited' && visit.status !== 'delivered' && visit.status !== 'rescheduled' && (
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={() => openReschedule(visit)} className="account-btn-secondary" style={{marginTop:0,fontSize:'0.62rem',padding:'6px 14px',color:'#7C3AED',borderColor:'#C4B5FD'}} data-testid={`reschedule-visit-${visit.id}`}>
                      <RefreshCw size={12} /> Reschedule
                    </button>
                    <button onClick={() => cancelVisit(visit.id)} className="account-btn-secondary" style={{marginTop:0,fontSize:'0.62rem',padding:'6px 14px',color:'#dc2626',borderColor:'#fca5a5'}} data-testid={`cancel-visit-${visit.id}`}>
                      <X size={12} /> Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="account-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="account-modal" onClick={e => e.stopPropagation()} style={{maxWidth:600}}>
            <button className="account-modal-close" onClick={() => setShowForm(false)}><X size={20} /></button>
            {submitted ? (
              <div style={{textAlign:'center', padding:'40px 0'}}>
                <div style={{fontSize:56, color:'#C9A84C', marginBottom:16}}>&#10003;</div>
                <h3 style={{fontFamily:"'Playfair Display', serif", fontSize:'1.3rem', marginBottom:8}}>Visit Scheduled!</h3>
                <p style={{fontSize:'0.82rem', color:'var(--mid-grey)', marginBottom:24}}>Our representative will call you within 24 hours to confirm the date, time, and your address.</p>
                <button className="account-btn-primary" onClick={() => setShowForm(false)}>Done</button>
              </div>
            ) : (
              <>
                <h3>Schedule Your Visit</h3>
                <form onSubmit={handleSubmit} className="account-form" data-testid="modal-visit-form">
                  <div className="af-row">
                    <div className="af-field"><label>First Name *</label><input type="text" value={formData.firstName} onChange={e => handleChange('firstName', e.target.value)} required placeholder="Arjun" /></div>
                    <div className="af-field"><label>Last Name *</label><input type="text" value={formData.lastName} onChange={e => handleChange('lastName', e.target.value)} required placeholder="Mehta" /></div>
                  </div>
                  <div className="af-row">
                    <div className="af-field"><label>Email *</label><input type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} required /></div>
                    <div className="af-field"><label>Contact Number *</label><input type="tel" value={formData.contactNumber} onChange={e => handleChange('contactNumber', e.target.value)} required placeholder="+91 98765 43210" /></div>
                  </div>
                  <div className="af-field"><label>Visit Date *</label><input type="date" value={formData.visitDate} min={minDate} onChange={e => handleChange('visitDate', e.target.value)} required /></div>
                  <div className="af-field">
                    <label>Choose Style *</label>
                    <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                      {visitStyleOptions.map(s => (
                        <button key={s} type="button" style={{padding:'6px 14px',fontSize:'0.68rem',fontWeight:500,letterSpacing:'0.05em',border:formData.style===s?'2px solid #C9A84C':'1px solid #ddd',background:formData.style===s?'rgba(201,168,76,0.08)':'#fff',color:formData.style===s?'#C9A84C':'#555',borderRadius:20,cursor:'pointer',fontFamily:"'Montserrat', sans-serif",transition:'all 0.2s'}} onClick={() => handleChange('style', s)}>{s}</button>
                      ))}
                    </div>
                  </div>
                  <div className="af-row">
                    <div className="af-field"><label>Material *</label><select value={formData.material} onChange={e => handleChange('material', e.target.value)} required><option value="">Select material</option>{visitMaterialOptions.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                    <div className="af-field"><label>Material Type *</label><select value={formData.materialType} onChange={e => handleChange('materialType', e.target.value)} required><option value="">Select type</option><option value="Premium">Premium</option><option value="Semi Premium">Semi Premium</option></select></div>
                  </div>
                  <div className="af-row">
                    <div className="af-field"><label>For *</label><select value={formData.visitFor} onChange={e => handleChange('visitFor', e.target.value)} required><option value="">Select</option><option value="men">Men</option><option value="women">Women</option></select></div>
                    <div className="af-field"><label>PIN Code *</label><input type="text" inputMode="numeric" pattern="[0-9]{4,10}" value={formData.pinCode} onChange={e => handleChange('pinCode', e.target.value)} required placeholder="400001" /></div>
                  </div>
                  <div className="af-field"><label>Notes (optional)</label><textarea rows="3" value={formData.notes} onChange={e => handleChange('notes', e.target.value)} placeholder="Preferred time, special requirements..." /></div>
                  {formError && <div className="account-msg error">{formError}</div>}
                  <button type="submit" className="account-btn-primary" disabled={submitting} style={{width:'100%',justifyContent:'center',padding:'14px',marginTop:8}}>{submitting ? 'Scheduling...' : 'Schedule My Visit'}</button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Reschedule Visit Modal ── */}
      {rescheduleVisit && (
        <div className="account-modal-overlay" onClick={() => setRescheduleVisit(null)}>
          <div className="account-modal" onClick={e => e.stopPropagation()} style={{maxWidth:440}}>
            <button className="account-modal-close" onClick={() => setRescheduleVisit(null)}><X size={20} /></button>
            <h3 style={{display:'flex',alignItems:'center',gap:8}}><RefreshCw size={18} color="#7C3AED" /> Reschedule Visit</h3>
            <div style={{background:'#F9FAFB',borderRadius:8,padding:16,margin:'16px 0',fontSize:'0.78rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                <span style={{color:'var(--mid-grey)'}}>Current Date</span>
                <strong>{rescheduleVisit.visit_date ? new Date(rescheduleVisit.visit_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '\u2014'}</strong>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                <span style={{color:'var(--mid-grey)'}}>Style</span>
                <strong>{rescheduleVisit.style}</strong>
              </div>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <span style={{color:'var(--mid-grey)'}}>Material</span>
                <strong>{rescheduleVisit.material} ({rescheduleVisit.material_type})</strong>
              </div>
            </div>
            <form onSubmit={handleReschedule} className="account-form">
              <div className="af-field">
                <label>New Visit Date *</label>
                <input type="date" value={rescheduleDate} min={minDate} onChange={e => setRescheduleDate(e.target.value)} required />
              </div>
              <div className="af-field">
                <label>Updated Notes (optional)</label>
                <textarea rows="2" value={rescheduleNotes} onChange={e => setRescheduleNotes(e.target.value)} placeholder="Any changes to your requirements..." />
              </div>
              <button type="submit" className="account-btn-primary" disabled={rescheduling} style={{width:'100%',justifyContent:'center',padding:'14px',marginTop:8,background:'#7C3AED'}}>
                {rescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== Custom Orders Tab =====
const CustomOrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Custom orders are regular orders that have customization data
    api.getMyOrders()
      .then(data => {
        const customOrders = (data.orders || []).filter(o =>
          o.items?.some(item => item.is_custom || item.customization)
        );
        setOrders(customOrders);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="account-loading">Loading custom orders…</div>;

  return (
    <div className="account-panel" data-testid="custom-orders-panel">
      <div className="section-header">
        <h3>Custom Orders</h3>
        <a href="/customize" className="account-btn-primary" style={{textDecoration:'none'}}>
          <Plus size={14} /> Create New
        </a>
      </div>
      {orders.length === 0 ? (
        <div className="account-empty-orders">
          <Palette size={48} strokeWidth={1} />
          <p>No customization orders yet.</p>
          <a href="/customize" className="account-btn-primary" style={{textDecoration:'none',marginTop:12}}>
            Start Customizing
          </a>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card" data-testid={`custom-order-${order.id}`}>
              <div className="order-card-header">
                <span className="order-number">#{order.order_number}</span>
                <span className="order-status-badge" style={{ backgroundColor: '#EDE9FE', color: '#5B21B6' }}>{order.status?.replace(/_/g, ' ')}</span>
              </div>
              <div className="order-card-body">
                <div className="order-card-info">
                  <span className="order-card-date">
                    {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="order-card-items">{order.items?.length || 0} custom item(s)</span>
                </div>
                <span className="order-card-total">{'\u20B9'}{order.total_amount?.toLocaleString('en-IN')}</span>
              </div>
              {order.items?.filter(i => i.is_custom || i.customization).map((item, idx) => (
                <div key={idx} style={{fontSize:'0.72rem',color:'var(--dark-grey)',padding:'6px 0',borderTop:'1px solid #f0f0f0',marginTop:6}}>
                  <strong>{item.name || 'Custom Shoe'}</strong>
                  {item.customization && (
                    <span style={{marginLeft:8,color:'var(--mid-grey)'}}>
                      {[item.customization.material, item.customization.color, item.customization.sole].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAccountPage;

