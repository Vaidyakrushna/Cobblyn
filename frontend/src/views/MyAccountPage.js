"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, MapPin, CreditCard, Lock, Package, FileText, ChevronRight, Plus, Trash2, Edit2, X, Check, Heart, CalendarCheck, Palette, ExternalLink, ShoppingBag, RefreshCw, Activity, Sparkles, Layers, MessageSquare, HelpCircle, Send, Star, Gift, Copy, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import VipSubscription from './VipSubscription';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'orders', label: 'My Orders', icon: Package },
  { id: 'visits', label: 'Scheduled Visits', icon: CalendarCheck },
  { id: 'custom', label: 'Customization', icon: Palette },
  { id: 'fit_vault', label: 'Fit Vault', icon: Layers },
  { id: 'referrals', label: 'Refer & Earn', icon: Gift },
  { id: 'vip', label: 'VIP Membership', icon: Star },
  { id: 'support', label: 'Support & Help', icon: MessageSquare },
];

const MyAccountPage = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileSection, setProfileSection] = useState('info'); // info, addresses, payments, password
  const [supportOrderContext, setSupportOrderContext] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const active = localStorage.getItem('cobblyn_active_tab');
      if (active) {
        setActiveTab(active);
        localStorage.removeItem('cobblyn_active_tab');
      }
    }
  }, []);

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
            {user?.vip_membership?.is_active && (
              <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)', color: '#111', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                <Star size={12} fill="#111" /> VIP Member
              </div>
            )}
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
          {activeTab === 'fit_vault' && <FitVaultTab setActiveTab={setActiveTab} />}
          {activeTab === 'orders' && <OrdersTab setActiveTab={setActiveTab} setSupportOrderContext={setSupportOrderContext} />}
          {activeTab === 'visits' && <VisitsTab />}
          {activeTab === 'custom' && <CustomOrdersTab />}
          {activeTab === 'referrals' && <ReferralsTab />}
          {activeTab === 'vip' && <VipSubscription />}
          {activeTab === 'support' && <SupportTab supportOrderContext={supportOrderContext} setSupportOrderContext={setSupportOrderContext} />}
        </div>
      </div>
    </div>
  );
};

// ===== Referrals Tab =====
const ReferralsTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await api.getReferralStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch referral stats", err);
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (!stats?.referral_code) return;
    navigator.clipboard.writeText(stats.referral_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: '#666' }}>
        <RefreshCw style={{ animation: 'spin 1s linear infinite', marginBottom: '16px' }} size={32} className="animate-spin" />
        <span style={{ fontSize: '15px', fontWeight: '500' }}>Loading referral dashboard...</span>
      </div>
    );
  }

  const referralCode = stats?.referral_code || '';
  const walletBalance = stats?.wallet_balance || 0;
  const referralList = stats?.referrals || [];
  const transactionsList = stats?.transactions || [];
  const totalEarned = stats?.stats?.total_earned || 0;
  const pendingCount = stats?.stats?.pending_referrals || 0;
  const completedCount = stats?.stats?.successful_referrals || 0;

  const shareText = `Get ₹250 welcome credit on Cobblyn Shoes by signing up with my referral code: ${referralCode}! Register here: ${typeof window !== 'undefined' ? window.location.origin : ''}/login`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  const emailUrl = `mailto:?subject=Get ₹250 off on Cobblyn Shoes!&body=${encodeURIComponent(shareText)}`;

  return (
    <div className="referrals-tab-container" style={{ padding: '8px', color: '#111' }}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1.5s linear infinite;
        }
        .share-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
      `}</style>
      
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.02em', color: '#111' }}>Refer & Earn</h2>
        <p style={{ color: '#666', fontSize: '15px', lineHeight: '1.5' }}>Share the Cobblyn experience. Invite your friends: they get ₹250 welcome credit instantly, and you get ₹500 credited to your wallet once they make their first purchase.</p>
      </div>

      {/* Grid of stats and wallet */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* Wallet balance */}
        <div style={{ 
          background: 'linear-gradient(135deg, #161616 0%, #2a2a2a 100%)', 
          color: '#fff', 
          borderRadius: '16px', 
          padding: '28px', 
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '180px',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c5a880', fontWeight: '700', marginBottom: '10px' }}>Virtual Wallet Balance</div>
            <div style={{ fontSize: '38px', fontWeight: '800', fontFamily: 'Outfit, Inter, sans-serif' }}>₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
          <div style={{ fontSize: '14px', color: '#aaa', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px', marginTop: '12px' }}>
            Lifetime Referral Earnings: <span style={{ color: '#fff', fontWeight: '700' }}>₹{totalEarned.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Share Code */}
        <div style={{ 
          background: '#ffffff', 
          border: '1px solid #eaeaea', 
          borderRadius: '16px', 
          padding: '28px', 
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '180px'
        }}>
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666', fontWeight: '700', marginBottom: '10px' }}>Your Referral Code</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '0.05em', background: '#f5f5f7', padding: '8px 16px', borderRadius: '10px', fontFamily: 'monospace', border: '1px solid #e5e5ea', color: '#111' }}>{referralCode}</span>
              <button 
                onClick={handleCopy}
                className="share-btn"
                style={{ 
                  padding: '10px 18px', 
                  backgroundColor: copied ? '#10b981' : '#111', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '10px', 
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="share-btn" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#25D366', color: '#fff', padding: '10px', borderRadius: '10px', textDecoration: 'none', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' }}>
              WhatsApp
            </a>
            <a href={emailUrl} className="share-btn" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#f2f2f7', color: '#111', padding: '10px', borderRadius: '10px', textDecoration: 'none', fontSize: '13px', fontWeight: '600', border: '1px solid #e5e5ea', transition: 'all 0.2s' }}>
              Email Friend
            </a>
          </div>
        </div>
      </div>

      {/* Referral Stats Counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '40px', background: '#f5f5f7', padding: '20px', borderRadius: '16px', border: '1px solid #e5e5ea' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#111' }}>{referralList.length}</div>
          <div style={{ fontSize: '12px', color: '#666', fontWeight: '500', marginTop: '4px' }}>Friends Invited</div>
        </div>
        <div style={{ textAlign: 'center', borderLeft: '1px solid #e5e5ea', borderRight: '1px solid #e5e5ea' }}>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#10b981' }}>{completedCount}</div>
          <div style={{ fontSize: '12px', color: '#666', fontWeight: '500', marginTop: '4px' }}>Successful Referrals</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#f59e0b' }}>{pendingCount}</div>
          <div style={{ fontSize: '12px', color: '#666', fontWeight: '500', marginTop: '4px' }}>Pending Purchases</div>
        </div>
      </div>

      {/* Ledger details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '32px' }}>
        {/* Referral Ledger */}
        <div style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: '#111', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Gift size={20} style={{ color: '#c5a880' }} /> Invite Status
          </h3>
          {referralList.length === 0 ? (
            <div style={{ color: '#888', padding: '40px 20px', borderRadius: '12px', textAlign: 'center', border: '1px dashed #ddd', background: '#fafafa' }}>
              No friends referred yet. Share your unique code to start earning!
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f2f2f7', color: '#666', fontWeight: '600' }}>
                    <th style={{ padding: '12px 8px' }}>Invited Friend</th>
                    <th style={{ padding: '12px 8px' }}>Status</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Cashback</th>
                  </tr>
                </thead>
                <tbody>
                  {referralList.map((ref) => (
                    <tr key={ref.id} style={{ borderBottom: '1px solid #f2f2f7' }}>
                      <td style={{ padding: '14px 8px' }}>
                        <div style={{ fontWeight: '600', color: '#111' }}>{ref.referee_name}</div>
                        <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{ref.referee_email}</div>
                      </td>
                      <td style={{ padding: '14px 8px' }}>
                        <span style={{ 
                          padding: '4px 10px', 
                          borderRadius: '100px', 
                          fontSize: '11px', 
                          fontWeight: '700', 
                          background: ref.status === 'completed' ? '#ecfdf5' : '#fffbeb',
                          color: ref.status === 'completed' ? '#047857' : '#b45309',
                          border: ref.status === 'completed' ? '1px solid #a7f3d0' : '1px solid #fde68a'
                        }}>
                          {ref.status === 'completed' ? 'Completed' : 'Pending Order'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 8px', textAlign: 'right', fontWeight: '700', color: ref.status === 'completed' ? '#111' : '#888' }}>
                        +₹{ref.reward_amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Transaction History */}
        <div style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: '#111', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={20} style={{ color: '#c5a880' }} /> Wallet History
          </h3>
          {transactionsList.length === 0 ? (
            <div style={{ color: '#888', padding: '40px 20px', borderRadius: '12px', textAlign: 'center', border: '1px dashed #ddd', background: '#fafafa' }}>
              No transactions recorded in your wallet yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
              {transactionsList.map((tx) => (
                <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '12px' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '13.5px', color: '#212529' }}>{tx.description}</div>
                    <div style={{ fontSize: '11.5px', color: '#868e96', marginTop: '4px' }}>
                      {new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ 
                    fontWeight: '800', 
                    fontSize: '15px', 
                    color: tx.type === 'credit' ? '#10b981' : '#ef4444' 
                  }}>
                    {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount}
                  </div>
                </div>
              ))}
            </div>
          )}
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
const OrdersTab = ({ setActiveTab, setSupportOrderContext }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);

  // Feedback State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackOrderId, setFeedbackOrderId] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

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

  const openFeedbackModal = (order) => {
    setFeedbackOrderId(order.id);
    setFeedbackRating(order.customer_feedback?.rating || 5);
    setFeedbackComment(order.customer_feedback?.comment || '');
    setShowFeedbackModal(true);
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackOrderId) return;
    setSubmittingFeedback(true);
    try {
      await api.submitOrderFeedback(feedbackOrderId, { rating: feedbackRating, comment: feedbackComment });
      setOrders(prev => prev.map(o => o.id === feedbackOrderId ? { ...o, customer_feedback: { rating: feedbackRating, comment: feedbackComment } } : o));
      if (selectedOrder && selectedOrder.id === feedbackOrderId) {
        setSelectedOrder(prev => ({ ...prev, customer_feedback: { rating: feedbackRating, comment: feedbackComment } }));
      }
      setShowFeedbackModal(false);
      alert("✨ Thank you for rating your Cobblyn order!");
    } catch (err) {
      alert(err.message || "Failed to submit feedback");
    } finally {
      setSubmittingFeedback(false);
    }
  };


  const getStatusColor = (status) => {
    const colors = { pending: '#f59e0b', confirmed: '#3b82f6', in_production: '#8b5cf6', quality_check: '#6366f1', shipped: '#06b6d4', delivered: '#10b981', cancelled: '#ef4444', returned: '#6b7280', waiting_for_payment: '#d97706' };
    return colors[status] || '#6b7280';
  };

  if (loading) return <div className="account-loading">Loading orders...</div>;

  if (selectedOrder) {
    const isCustomBespoke = selectedOrder.production_type === 'crafted' || 
                            selectedOrder.is_custom === true || 
                            selectedOrder.items?.some(item => item.is_custom || item.custom_design_id || item.material || item.sole);

    return (
      <div className="account-panel" data-testid="order-detail-panel">
        <button className="account-back-btn" onClick={() => setSelectedOrder(null)} data-testid="back-to-orders-btn">&larr; Back to Orders</button>
        <div className="order-detail">
          <div className="order-detail-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ margin: 0 }}>Order #{selectedOrder.order_number}</h3>
                <span className="order-type-badge" style={{
                  fontSize: '0.62rem',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background: isCustomBespoke ? 'rgba(157, 39, 6, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                  border: isCustomBespoke ? '1px solid rgba(157, 39, 6, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                  color: isCustomBespoke ? '#9d2706' : '#10B981',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}>
                  {isCustomBespoke ? '✨ Custom Bespoke' : '📦 Ready-to-Ship'}
                </span>
              </div>
              <p className="order-date" style={{ margin: '4px 0 0 0' }}>{new Date(selectedOrder.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="order-detail-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className="order-status-badge" style={{ backgroundColor: getStatusColor(selectedOrder.status), margin: 0 }}>{selectedOrder.status?.replace(/_/g, ' ')}</span>
              <button className="account-btn-secondary" onClick={() => { setSupportOrderContext(selectedOrder); setActiveTab('support'); }} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}><MessageSquare size={14} /> Support</button>

              
              {/* Star Rating & Feedback section next to support button (right end) */}
              {selectedOrder.customer_feedback ? (
                <div style={{
                  fontSize: '0.72rem',
                  color: '#9d2706',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  border: '1px solid rgba(157, 39, 6, 0.25)',
                  padding: '7px 12px',
                  borderRadius: '6px',
                  background: 'rgba(157, 39, 6, 0.05)',
                  height: '34px',
                  boxSizing: 'border-box'
                }}>
                  <Star size={13} fill="#9d2706" color="#9d2706" /> {selectedOrder.customer_feedback.rating} / 5
                </div>
              ) : (
                <button className="account-btn-secondary" onClick={() => openFeedbackModal(selectedOrder)} style={{
                  margin: 0,
                  borderColor: '#9d2706',
                  color: '#9d2706',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 600,
                  background: 'rgba(157, 39, 6, 0.03)'
                }}>
                  <Star size={14} /> Rate Order
                </button>
              )}
            </div>
          </div>

          {/* Horizontal Stepper and Map Integration */}
          {(() => {
            const orderStages = [
              { name: 'pending', label: 'Placed' },
              { name: 'confirmed', label: 'Confirmed' },
              { name: 'in_production', label: 'In Production' },
              { name: 'shipped', label: 'Dispatched' },
              { name: 'delivered', label: 'Delivered' }
            ];

            const getActiveStageIndex = (status) => {
              const mapping = {
                'pending': 0,
                'confirmed': 1,
                'in_production': 2,
                'quality_check': 2,
                'shipped': 3,
                'ready_to_ship': 3,
                'delivered': 4
              };
              return mapping[status] ?? 0;
            };

            const activeIndex = getActiveStageIndex(selectedOrder.status);
            
            // Factory Coordinate Resolver
            const factoryCity = selectedOrder.order_number % 2 === 0 ? 'Mumbai Atelier' : 'Jaipur Atelier';
            const factoryCoords = selectedOrder.order_number % 2 === 0 ? [19.0760, 72.8777] : [26.9124, 75.7873];
            
            // Customer Coordinate Resolver
            const customerCity = selectedOrder.shipping_address?.city || 'Mumbai';
            const cityCoords = {
              mumbai: [19.0760, 72.8777],
              delhi: [28.6139, 77.2090],
              'new delhi': [28.6139, 77.2090],
              bangalore: [12.9716, 77.5946],
              bengluru: [12.9716, 77.5946],
              jaipur: [26.9124, 75.7873],
              kolkata: [22.5726, 88.3639],
              chennai: [13.0827, 80.2707],
              hyderabad: [17.3850, 78.4867],
              pune: [18.5204, 73.8567],
              ahmedabad: [23.0225, 72.5714],
              indore: [22.7196, 75.8577],
              noida: [28.5355, 77.3910],
              gurgaon: [28.4595, 77.0266],
              gurugram: [28.4595, 77.0266],
              chandigarh: [30.7333, 76.7794],
              lucknow: [26.8467, 80.9462],
              coimbatore: [11.0168, 76.9558],
              kochi: [9.9312, 76.2673]
            };

            const getCustomerCoords = (cityName) => {
              const clean = cityName.trim().toLowerCase();
              if (cityCoords[clean]) return cityCoords[clean];
              for (const k in cityCoords) {
                if (clean.includes(k) || k.includes(clean)) return cityCoords[k];
              }
              // Fallback based on name hash
              let hash = 0;
              for (let i = 0; i < clean.length; i++) hash += clean.charCodeAt(i);
              const lat = 15.0 + (hash % 12);
              const lng = 73.0 + (hash % 12);
              return [lat, lng];
            };

            const customerCoords = getCustomerCoords(customerCity);

            // Compute a logistics transit sorting hub checkpoint if status is shipped or delivered
            const transitCheckpoints = [];
            if (activeIndex >= 3) {
              const midLat = (factoryCoords[0] + customerCoords[0]) / 2 + 0.6;
              const midLng = (factoryCoords[1] + customerCoords[1]) / 2 - 0.4;
              transitCheckpoints.push({
                name: 'Indore Central Logistics Sorting Hub',
                lat: midLat,
                lng: midLng
              });
            }

            const isDelivered = selectedOrder.status === 'delivered';

            return (
              <div className="order-timeline-expanded" data-testid="order-timeline-expanded" style={{ marginTop: 24 }}>
                <style>{`
                  .stepper-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin: 20px 0 24px 0;
                    position: relative;
                  }
                  .stepper-step {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    flex: 1;
                    position: relative;
                  }
                  .stepper-circle {
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    background: #f4f4f5;
                    border: 2px solid #e4e4e7;
                    color: #71717a;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.75rem;
                    font-weight: 600;
                    transition: all 0.4s ease;
                    z-index: 2;
                  }
                  .stepper-step.completed .stepper-circle {
                    background: #9d2706;
                    border-color: #9d2706;
                    color: #fff;
                  }
                  .stepper-step.active .stepper-circle {
                    background: #111;
                    border-color: #9d2706;
                    color: #9d2706;
                    box-shadow: 0 0 12px rgba(157,39,6,0.4);
                  }
                  .stepper-label {
                    font-size: 0.68rem;
                    font-weight: 600;
                    color: #a1a1aa;
                    margin-top: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                  }
                  .stepper-step.active .stepper-label {
                    color: #9d2706;
                  }
                  .stepper-step.completed .stepper-label {
                    color: #1c1917;
                  }
                  .stepper-bar-wrapper {
                    position: absolute;
                    top: 15px;
                    left: calc(50% + 15px);
                    width: calc(100% - 30px);
                    height: 2px;
                    background: #e4e4e7;
                    z-index: 1;
                  }
                  .stepper-bar-progress {
                    width: 0%;
                    height: 100%;
                    background: #9d2706;
                    transition: width 0.6s ease;
                  }
                  .stepper-bar-progress.completed {
                    width: 100%;
                  }
                `}</style>

                {/* Feature A: Atelier Craftsman Production Timeline */}
                {(() => {
                  const isCustomBespoke = selectedOrder.production_type === 'crafted' || 
                                          selectedOrder.is_custom === true || 
                                          selectedOrder.items?.some(item => item.is_custom || item.custom_design_id || item.material || item.sole);

                  if (!isCustomBespoke) return null;

                  // Fallback or custom stages resolver
                  const currentProdStage = selectedOrder.current_production_stage || (
                    selectedOrder.status === 'delivered' ? 'ready_to_ship' : (
                      selectedOrder.status === 'shipped' ? 'ready_to_ship' : (
                        selectedOrder.status === 'ready_to_ship' ? 'ready_to_ship' : (
                          selectedOrder.status === 'quality_check' ? 'quality_check' : (
                            selectedOrder.status === 'in_production' ? 'upper_assembly' : 'order_received'
                          )
                        )
                      )
                    )
                  );

                  const allStages = [
                    { name: 'order_received', label: 'Order Received' },
                    { name: 'pattern_cutting', label: 'Pattern Cutting' },
                    { name: 'upper_assembly', label: 'Upper Assembly' },
                    { name: 'sole_attachment', label: 'Sole Attachment' },
                    { name: 'finishing', label: 'Finishing & Polishing' },
                    { name: 'quality_check', label: 'Quality Check' },
                    { name: 'ready_to_ship', label: 'Ready to Ship' }
                  ];

                  const getStageStatus = (stageName) => {
                    if (selectedOrder.production_stages && selectedOrder.production_stages.length > 0) {
                      const matched = selectedOrder.production_stages.find(s => s.name === stageName);
                      return matched ? matched.status : 'pending';
                    }
                    // Simulate based on currentProdStage
                    const indexMap = {
                      'order_received': 0,
                      'pattern_cutting': 1,
                      'upper_assembly': 2,
                      'sole_attachment': 3,
                      'finishing': 4,
                      'quality_check': 5,
                      'ready_to_ship': 6
                    };
                    const currentIndex = indexMap[currentProdStage] ?? 0;
                    const stageIndex = indexMap[stageName];
                    if (stageIndex < currentIndex || selectedOrder.status === 'delivered' || selectedOrder.status === 'shipped') return 'completed';
                    if (stageIndex === currentIndex) return 'active';
                    return 'pending';
                  };

                  return (
                    <div className="atelier-tracker-card glass-gilded" style={{ 
                      padding: '24px 20px', 
                      borderRadius: '12px', 
                      border: '1px solid rgba(157, 39, 6, 0.3)', 
                      background: 'rgba(255, 255, 255, 0.85)', 
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      margin: '24px 0', 
                      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.04)' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <Sparkles size={16} color="#9d2706" />
                        <h4 style={{ margin: 0, fontFamily: 'Montserrat, sans-serif', fontSize: '0.85rem', color: '#1c1917', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700 }}>
                          Atelier Progress Tracker
                        </h4>
                      </div>
                      <p style={{ margin: '0 0 20px 0', fontSize: '0.72rem', color: '#78716c', lineHeight: 1.4 }}>
                        Your footwear is individually bench-made inside our workshops. Track the meticulous journey of your pair:
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px', position: 'relative' }}>
                        {allStages.map((stage, idx) => {
                          const status = getStageStatus(stage.name);
                          const isCompleted = status === 'completed';
                          const isActive = status === 'active';
                          
                          return (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
                              <div style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                background: isCompleted ? '#9d2706' : (isActive ? '#111' : '#f4f4f5'),
                                border: isActive ? '2px solid #9d2706' : '2px solid #e4e4e7',
                                color: isCompleted ? '#fff' : (isActive ? '#9d2706' : '#a1a1aa'),
                                display: 'flex',
                                alignItems: 'center',
                                justifyItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                boxShadow: isActive ? '0 0 10px rgba(157, 39, 6, 0.4)' : 'none',
                                transition: 'all 0.3s ease',
                                zIndex: 2
                              }}>
                                {isCompleted ? <Check size={12} strokeWidth={3} /> : (idx + 1)}
                              </div>
                              <div style={{ 
                                fontSize: '0.62rem', 
                                fontWeight: (isActive || isCompleted) ? 700 : 500, 
                                color: isActive ? '#9d2706' : (isCompleted ? '#1c1917' : '#78716c'), 
                                marginTop: '8px', 
                                textTransform: 'uppercase', 
                                letterSpacing: '0.02em', 
                                lineHeight: '1.2' 
                              }}>
                                {stage.label}
                              </div>
                              <div style={{ fontSize: '0.58rem', color: '#a1a1aa', marginTop: '2px' }}>
                                {isCompleted ? 'Done' : (isActive ? 'Atelier Work' : 'Queued')}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                <h4>Order Transit Status</h4>
                
                {/* Horizontal progress stepper */}
                <div className="stepper-container">
                  {orderStages.map((stage, idx) => {
                    const isCompleted = idx < activeIndex;
                    const isActive = idx === activeIndex;
                    return (
                      <div key={idx} className={`stepper-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                        <div className="stepper-circle">
                          {isCompleted ? <Check size={14} /> : <span>{idx + 1}</span>}
                        </div>
                        <div className="stepper-label">{stage.label}</div>
                        {idx < orderStages.length - 1 && (
                          <div className="stepper-bar-wrapper">
                            <div className={`stepper-bar-progress ${idx < activeIndex ? 'completed' : ''}`}></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Check-in records tracking checkpoint details */}
                <h4 style={{ marginTop: 24, marginBottom: 12 }}>Check-in Records</h4>
                <div className="timeline-track" style={{ background: '#fafaf9', padding: '16px', borderRadius: '8px', border: '1px solid #e7e5e4' }}>
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
            );
          })()}

          {/* Order Items */}
          <div className="order-items-section">
            <h4>Items</h4>
            {selectedOrder.items?.map((item, idx) => (
              <div key={idx} className="order-item-row">
                <div className="order-item-info">
                  <span className="order-item-name">{item.name || 'Product'}</span>
                  <span className="order-item-meta">Size: {item.size} | Color: {item.color}{item.material ? ` | Leather: ${item.material}` : ''}{item.sole ? ` | Sole: ${item.sole}` : ''} | Qty: {item.quantity}</span>
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

        {/* Invoice Modal */}
        {showInvoice && invoice && (
          <div className="account-modal-overlay" onClick={() => setShowInvoice(false)}>
            <div className="account-modal invoice-modal" onClick={e => e.stopPropagation()}>
              <button className="account-modal-close" onClick={() => setShowInvoice(false)}><X size={20} /></button>
              <InvoiceView invoice={invoice} />
            </div>
          </div>
        )}

        {/* Feedback & Star Rating Modal */}
        {showFeedbackModal && (
          <div className="account-modal-overlay" onClick={() => setShowFeedbackModal(false)}>
            <div className="account-modal glass-gilded" onClick={e => e.stopPropagation()} style={{
              maxWidth: '450px',
              padding: '30px',
              borderRadius: '16px',
              border: '1px solid rgba(157, 39, 6, 0.4)',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.18)'
            }}>
              <button className="account-modal-close" onClick={() => setShowFeedbackModal(false)} style={{ color: '#78716c' }}><X size={20} /></button>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'inline-flex', padding: '10px', borderRadius: '50%', background: 'rgba(157, 39, 6, 0.1)', marginBottom: '12px' }}>
                  <Star size={32} fill="#9d2706" color="#9d2706" />
                </div>
                <h3 style={{ margin: 0, fontFamily: 'Montserrat, sans-serif', fontSize: '1.25rem', color: '#1c1917', fontWeight: 700 }}>Rate Your Cobblyn Shoes</h3>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: '#78716c', lineHeight: 1.4 }}>
                  Your feedback helps our master craftsmen continuously refine their bespoke art.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '24px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setFeedbackRating(star)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      transition: 'transform 0.2s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <Star
                      size={36}
                      fill={star <= feedbackRating ? "#9d2706" : "transparent"}
                      color={star <= feedbackRating ? "#9d2706" : "#d6d3d1"}
                      strokeWidth={2}
                    />
                  </button>
                ))}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#78716c', marginBottom: '8px', letterSpacing: '0.05em' }}>
                  Share Your Experience
                </label>
                <textarea
                  value={feedbackComment}
                  onChange={e => setFeedbackComment(e.target.value)}
                  placeholder="How does the leather feel? How is the fit? Share your thoughts..."
                  style={{
                    width: '100%',
                    height: '100px',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #d6d3d1',
                    fontSize: '0.85rem',
                    lineHeight: '1.4',
                    resize: 'none',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    fontFamily: 'inherit'
                  }}
                  onFocus={e => e.target.style.borderColor = '#9d2706'}
                  onBlur={e => e.target.style.borderColor = '#d6d3d1'}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  className="account-btn-secondary"
                  onClick={() => setShowFeedbackModal(false)}
                  style={{ flex: 1, margin: 0 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleFeedbackSubmit}
                  disabled={submittingFeedback}
                  style={{
                    flex: 1,
                    background: '#111',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: submittingFeedback ? 'not-allowed' : 'pointer',
                    opacity: submittingFeedback ? 0.7 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {submittingFeedback ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </div>
          </div>
        )}
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
          {orders.map(order => {
            const isOrderCustom = order.production_type === 'crafted' || 
                                  order.is_custom === true || 
                                  order.items?.some(item => item.is_custom || item.custom_design_id || item.material || item.sole);

            return (
              <div key={order.id} className="order-card" data-testid={`order-card-${order.id}`}>
                <div className="order-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="order-number">#{order.order_number}</span>
                    <span className="order-type-badge" style={{
                      fontSize: '0.58rem',
                      padding: '2px 6px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.02em',
                      background: isOrderCustom ? 'rgba(157, 39, 6, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                      border: isOrderCustom ? '1px solid rgba(157, 39, 6, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                      color: isOrderCustom ? '#9d2706' : '#10B981',
                      display: 'inline-flex',
                      alignItems: 'center'
                    }}>
                      {isOrderCustom ? '✨ Custom' : '📦 Standard'}
                    </span>
                  </div>
                  <span className="order-status-badge" style={{ backgroundColor: getStatusColor(order.status), margin: 0 }}>{order.status?.replace(/_/g, ' ')}</span>
                </div>
                <div className="order-card-body">
                  <div className="order-card-info">
                    <span className="order-card-date">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span className="order-card-items">{order.items?.length || 0} item(s)</span>
                  </div>
                  <span className="order-card-total">{'\u20B9'}{order.total_amount?.toLocaleString('en-IN')}</span>
                </div>
                <div className="order-card-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button onClick={() => viewOrderDetail(order.id)} data-testid={`view-order-${order.id}`}>Track Order</button>
                  <button onClick={() => viewInvoice(order.id)} data-testid={`invoice-order-${order.id}`}><FileText size={14} /> Invoice</button>
                  <button onClick={() => { setSupportOrderContext(order); setActiveTab('support'); }} data-testid={`support-order-${order.id}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MessageSquare size={14} /> Support</button>
                  
                  {/* Star Rating & Feedback section next to support button (right end) */}
                  {order.customer_feedback ? (
                    <span style={{
                      fontSize: '0.68rem',
                      color: '#9d2706',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      border: '1px solid rgba(157, 39, 6, 0.2)',
                      padding: '5px 10px',
                      borderRadius: '4px',
                      background: 'rgba(157, 39, 6, 0.04)',
                      marginLeft: 'auto'
                    }}>
                      <Star size={12} fill="#9d2706" color="#9d2706" /> {order.customer_feedback.rating} / 5
                    </span>
                  ) : (
                    <button onClick={() => openFeedbackModal(order)} style={{
                      marginLeft: 'auto',
                      background: 'transparent',
                      border: '1px solid #9d2706',
                      color: '#9d2706',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}>
                      <Star size={13} /> Rate Order
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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

      {/* Feedback & Star Rating Modal */}
      {showFeedbackModal && (
        <div className="account-modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="account-modal glass-gilded" onClick={e => e.stopPropagation()} style={{
            maxWidth: '450px',
            padding: '30px',
            borderRadius: '16px',
            border: '1px solid rgba(157, 39, 6, 0.4)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.18)'
          }}>
            <button className="account-modal-close" onClick={() => setShowFeedbackModal(false)} style={{ color: '#78716c' }}><X size={20} /></button>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'inline-flex', padding: '10px', borderRadius: '50%', background: 'rgba(157, 39, 6, 0.1)', marginBottom: '12px' }}>
                <Star size={32} fill="#9d2706" color="#9d2706" />
              </div>
              <h3 style={{ margin: 0, fontFamily: 'Montserrat, sans-serif', fontSize: '1.25rem', color: '#1c1917', fontWeight: 700 }}>Rate Your Cobblyn Shoes</h3>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: '#78716c', lineHeight: 1.4 }}>
                Your feedback helps our master craftsmen continuously refine their bespoke art.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '24px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setFeedbackRating(star)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <Star
                    size={36}
                    fill={star <= feedbackRating ? "#9d2706" : "transparent"}
                    color={star <= feedbackRating ? "#9d2706" : "#d6d3d1"}
                    strokeWidth={2}
                  />
                </button>
              ))}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#78716c', marginBottom: '8px', letterSpacing: '0.05em' }}>
                Share Your Experience
              </label>
              <textarea
                value={feedbackComment}
                onChange={e => setFeedbackComment(e.target.value)}
                placeholder="How does the leather feel? How is the fit? Share your thoughts..."
                style={{
                  width: '100%',
                  height: '100px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #d6d3d1',
                  fontSize: '0.85rem',
                  lineHeight: '1.4',
                  resize: 'none',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  fontFamily: 'inherit'
                }}
                onFocus={e => e.target.style.borderColor = '#9d2706'}
                onBlur={e => e.target.style.borderColor = '#d6d3d1'}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="account-btn-secondary"
                onClick={() => setShowFeedbackModal(false)}
                style={{ flex: 1, margin: 0 }}
              >
                Cancel
              </button>
              <button
                onClick={handleFeedbackSubmit}
                disabled={submittingFeedback}
                style={{
                  flex: 1,
                  background: '#111',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: submittingFeedback ? 'not-allowed' : 'pointer',
                  opacity: submittingFeedback ? 0.7 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                {submittingFeedback ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
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
          <h2>BY<span style={{ color: '#9d2706' }}>O</span>ND</h2>
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
        <p className="invoice-small">Thank you for shopping with Cobblyn. For queries, contact {invoice.company?.email}</p>
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
      window.dispatchEvent(new Event('cobblyn-wishlist-update'));
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
      window.dispatchEvent(new Event('cobblyn-cart-update'));
      window.dispatchEvent(new Event('cobblyn-wishlist-update'));
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

  // Sub-tab view and dynamic validation state
  const [tabMode, setTabMode] = useState('list'); // 'list' | 'book'
  const [serviceablePincodes, setServiceablePincodes] = useState([]);

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

  useEffect(() => { 
    fetchVisits(); 
    api.getPincodesSettings()
      .then(data => setServiceablePincodes(data.pincodes || []))
      .catch(() => {});
  }, []);

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

  // Pincode validation helper
  const getPincodeStatus = () => {
    const pin = (formData.pinCode || '').trim();
    if (!pin || pin.length < 4) return null;
    const found = serviceablePincodes.find(p => p.pin_code === pin);
    if (!found) {
      return { status: 'unserviceable', message: '✖ We do not serve this pin code yet. We are expanding rapidly!' };
    }
    if (!found.active) {
      return { status: 'paused', message: `⚠ Atelier services in ${found.city} are temporarily paused due to capacity constraints.` };
    }
    return { status: 'active', message: `✓ We serve your region in ${found.city}! Daily slots capacity: ${found.capacity} bookings.` };
  };
  const pinStatus = getPincodeStatus();

  return (
    <div className="account-panel" data-testid="visits-panel">
      <div className="section-header" style={{ marginBottom: '16px' }}>
        <h3>Scheduled Visits</h3>
      </div>

      {/* Sub-navigation tabs within Scheduled Visits */}
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', marginBottom: '20px' }}>
        <button 
          onClick={() => { setTabMode('list'); setSubmitted(false); }}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: tabMode === 'list' ? '#9d2706' : '#6b7280',
            borderBottom: tabMode === 'list' ? '2px solid #9d2706' : 'none',
            paddingBottom: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <CalendarCheck size={14} /> My Scheduled Visits ({visits.length})
        </button>
        <button 
          onClick={() => { setTabMode('book'); setSubmitted(false); }}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: tabMode === 'book' ? '#9d2706' : '#6b7280',
            borderBottom: tabMode === 'book' ? '2px solid #9d2706' : 'none',
            paddingBottom: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Plus size={14} /> Schedule a New Visit
        </button>
      </div>

      {tabMode === 'list' && visits.length === 0 && (
        <div className="account-empty-orders">
          <CalendarCheck size={48} strokeWidth={1} />
          <p style={{ color: '#6b7280' }}>No visits scheduled yet.</p>
          <button className="account-btn-primary" onClick={() => setTabMode('book')} style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={14} /> Schedule a New Visit
          </button>
        </div>
      )}

      {tabMode === 'list' && visits.length > 0 && (
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

      {tabMode === 'book' && (
        <div style={{ background: '#FAF9F6', border: '1px solid #9d2706', borderRadius: '12px', padding: '24px', maxWidth: '640px', margin: '0 auto' }}>
          {submitted ? (
            <div style={{textAlign:'center', padding:'40px 0'}}>
              <div style={{fontSize:56, color:'#9d2706', marginBottom:16}}>&#10003;</div>
              <h3 style={{fontFamily:"'Playfair Display', serif", fontSize:'1.3rem', marginBottom:8}}>Visit Scheduled!</h3>
              <p style={{fontSize:'0.82rem', color:'var(--mid-grey)', marginBottom:24}}>Our representative will call you within 24 hours to confirm the date, time, and your address.</p>
              <button className="account-btn-primary" onClick={() => { setTabMode('list'); setSubmitted(false); }} style={{ margin: '0 auto' }}>View My Visits</button>
            </div>
          ) : (
            <>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', marginBottom: '16px', color: '#111' }}>Schedule Your Atelier Visit</h3>
              <form onSubmit={handleSubmit} className="account-form" data-testid="modal-visit-form" style={{ marginTop: 0 }}>
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
                      <button key={s} type="button" style={{padding:'6px 14px',fontSize:'0.68rem',fontWeight:500,letterSpacing:'0.05em',border:formData.style===s?'2px solid #9d2706':'1px solid #ddd',background:formData.style===s?'rgba(157,39,6,0.08)':'#fff',color:formData.style===s?'#9d2706':'#555',borderRadius:20,cursor:'pointer',fontFamily:"'Montserrat', sans-serif",transition:'all 0.2s'}} onClick={() => handleChange('style', s)}>{s}</button>
                    ))}
                  </div>
                </div>
                <div className="af-row">
                  <div className="af-field"><label>Material *</label><select value={formData.material} onChange={e => handleChange('material', e.target.value)} required><option value="">Select material</option>{visitMaterialOptions.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                  <div className="af-field"><label>Material Type *</label><select value={formData.materialType} onChange={e => handleChange('materialType', e.target.value)} required><option value="">Select type</option><option value="Premium">Premium</option><option value="Semi Premium">Semi Premium</option></select></div>
                </div>
                <div className="af-row">
                  <div className="af-field"><label>For *</label><select value={formData.visitFor} onChange={e => handleChange('visitFor', e.target.value)} required><option value="">Select</option><option value="men">Men</option><option value="women">Women</option></select></div>
                  <div className="af-field">
                    <label>PIN Code *</label>
                    <input type="text" inputMode="numeric" pattern="[0-9]{4,10}" value={formData.pinCode} onChange={e => handleChange('pinCode', e.target.value)} required placeholder="400001" />
                    {pinStatus && (
                      <div style={{
                        fontSize: '0.68rem',
                        marginTop: '6px',
                        fontWeight: 600,
                        color: pinStatus.status === 'active' ? '#059669' : pinStatus.status === 'paused' ? '#d97706' : '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {pinStatus.message}
                      </div>
                    )}
                  </div>
                </div>
                <div className="af-field"><label>Notes (optional)</label><textarea rows="3" value={formData.notes} onChange={e => handleChange('notes', e.target.value)} placeholder="Preferred time, special requirements..." /></div>
                {formError && <div className="account-msg error">{formError}</div>}
                <button type="submit" className="account-btn-primary" disabled={submitting} style={{width:'100%',justifyContent:'center',padding:'14px',marginTop:8}}>{submitting ? 'Scheduling...' : 'Schedule My Visit'}</button>
              </form>
            </>
          )}
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
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [savedDesigns, setSavedDesigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch custom orders from API
    api.getMyOrders()
      .then(data => {
        const customOrders = (data.orders || []).filter(o =>
          o.items?.some(item => item.is_custom || item.customization)
        );
        setOrders(customOrders);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // 2. Fetch saved designs from localStorage
    if (typeof window !== 'undefined' && user) {
      const key = `cobblyn_saved_designs_${user.email || 'global'}`;
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      setSavedDesigns(saved);
    }
  }, [user]);

  if (loading) return <div className="account-loading">Loading custom orders…</div>;

  return (
    <div className="account-panel" data-testid="custom-orders-panel">
      <div className="section-header">
        <h3>Customization</h3>
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

      {/* Saved Bespoke Designs Section */}
      <div style={{ marginTop: '30px', borderTop: '1px solid #e7e5e4', paddingTop: '24px' }}>
        <h4 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.85rem', color: '#1c1917', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Palette size={16} color="#9d2706" /> My Saved Bespoke Designs
        </h4>
        
        {savedDesigns.length === 0 ? (
          <p style={{ fontSize: '0.78rem', color: '#78716c', fontStyle: 'italic' }}>No saved bespoke designs in your journal yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {savedDesigns.map(design => (
              <div key={design.id} className="order-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9d2706', letterSpacing: '0.05em' }}>{design.id}</span>
                    <span style={{ fontSize: '0.62rem', color: '#78716c' }}>{design.date}</span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e7e5e4' }}>
                      <img src={design.image} alt={design.submodel} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <h5 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#1c1917' }}>{design.submodel}</h5>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.68rem', color: '#78716c', lineHeight: 1.3 }}>
                        {design.leather} · {design.color} · {design.sole}
                        {design.monogram && ` · Monogram: [${design.monogram}]`}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed #e7e5e4' }}>
                  <a 
                    href={`/customize?gender=${design.gender}&model=${design.model}&submodel=${design.submodel}&leather=${design.leather}&color=${design.color}&sole=${design.sole}&monogram=${design.monogram}`}
                    className="account-btn-primary" 
                    style={{ textDecoration: 'none', margin: 0, padding: '6px 12px', fontSize: '0.68rem', flex: 1, textAlign: 'center' }}
                  >
                    Configure
                  </a>
                  <button 
                    onClick={() => {
                      const key = `cobblyn_saved_designs_${user.email || 'global'}`;
                      const filtered = savedDesigns.filter(d => d.id !== design.id);
                      localStorage.setItem(key, JSON.stringify(filtered));
                      setSavedDesigns(filtered);
                    }}
                    className="account-btn-secondary" 
                    style={{ margin: 0, padding: '6px 12px', fontSize: '0.68rem', color: '#dc2626', borderColor: '#fca5a5' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ===== Fit Vault Tab (Bespoke Sizing Visualizer) =====
const FitVaultTab = ({ setActiveTab }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  
  // Custom preference forms
  const [fitPref, setFitPref] = useState('regular');
  const [lastPref, setLastPref] = useState('rounded');
  const [podiatryNotes, setPodiatryNotes] = useState('');

  // Default / Demo Profile if none exists
  const demoProfile = {
    foot_length_left: 274,
    foot_length_right: 273,
    foot_width_left: 98,
    foot_width_right: 97,
    foot_girth_left: 245,
    foot_girth_right: 244,
    arch_type: 'medium',
    scan_date: new Date().toISOString(),
    scan_source: 'Demo Atelier Scan',
    uk_size: '9',
    fit_preference: 'regular',
    last_preference: 'rounded',
    podiatry_notes: 'arch support'
  };

  useEffect(() => {
    if (user?.id) {
      api.getFitProfile(user.id)
        .then(data => {
          if (data && data.fit_profile) {
            setProfile(data.fit_profile);
            setFitPref(data.fit_profile.fit_preference || 'regular');
            setLastPref(data.fit_profile.last_preference || 'rounded');
            setPodiatryNotes(data.fit_profile.podiatry_notes || '');
          }
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateFitProfile(user.id || '', {
        fit_preference: fitPref,
        last_preference: lastPref,
        podiatry_notes: podiatryNotes
      });
      setMsg('Bespoke fit preferences updated successfully.');
      setTimeout(() => setMsg(''), 3000);
      // Reload profile
      const data = await api.getFitProfile(user.id || '');
      if (data && data.fit_profile) {
        setProfile(data.fit_profile);
      }
    } catch (err) {
      setMsg('Error saving preferences: ' + err.message);
    }
    setSaving(false);
  };

  if (loading) return <div className="account-loading">Loading Fit Vault...</div>;

  const isDemo = !profile;
  const activeProfile = profile || demoProfile;
  const archType = activeProfile.arch_type || 'medium';
  const lastTypeLabel = activeProfile.last_preference 
    ? activeProfile.last_preference.charAt(0).toUpperCase() + activeProfile.last_preference.slice(1)
    : 'Chiseled Last #12';

  return (
    <div className="account-panel fit-vault-panel" data-testid="fit-vault-panel">
      {/* Luxury styles inside the component */}
      <style>{`
        .fit-vault-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          border-bottom: 1px solid #eaeaea;
          padding-bottom: 16px;
        }
        .fit-vault-header h3 {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          color: #1a1a1a;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .fit-vault-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }
        @media(max-width: 768px) {
          .fit-vault-grid {
            grid-template-columns: 1fr;
          }
        }
        .visualizer-card {
          background: #fafaf9;
          border: 1px solid #e7e5e4;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }
        .visualizer-card h4 {
          align-self: flex-start;
          margin: 0 0 16px 0;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: #78716c;
          text-transform: uppercase;
        }
        .foot-path {
          transform-origin: center;
          transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .foot-path.snug {
          transform: scale(0.93) translate(0, 0);
          stroke: #9d2706;
          fill: rgba(157, 39, 6, 0.08);
        }
        .foot-path.relaxed {
          transform: scale(1.06) translate(0, 0);
          stroke: #854d0e;
          fill: rgba(133, 77, 14, 0.08);
        }
        .foot-path.regular {
          stroke: #9d2706;
          fill: rgba(157, 39, 6, 0.04);
        }
        .visualizer-svg {
          background: #111110;
          border-radius: 8px;
          border: 1px solid #292524;
          box-shadow: inset 0 0 20px rgba(0,0,0,0.8);
        }
        .arch-path {
          transition: all 0.6s ease;
        }
        .glowing-vertex {
          animation: pulse-gold 2s infinite ease-in-out;
          fill: #f59e0b;
        }
        @keyframes pulse-gold {
          0% { r: 3px; opacity: 0.6; }
          50% { r: 5.5px; opacity: 1; fill: #9d2706; }
          100% { r: 3px; opacity: 0.6; }
        }
        .atelier-banner {
          background: rgba(157, 39, 6, 0.08);
          border: 1px solid rgba(157, 39, 6, 0.3);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .atelier-banner-content {
          flex: 1;
        }
        .atelier-banner h5 {
          margin: 0 0 4px 0;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #854d0e;
          text-transform: uppercase;
        }
        .atelier-banner p {
          margin: 0;
          font-size: 0.78rem;
          color: #78716c;
          line-height: 1.4;
        }
        .fit-metric-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .metric-mini-card {
          background: #fff;
          border: 1px solid #e7e5e4;
          border-radius: 8px;
          padding: 14px;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .metric-mini-card span {
          display: block;
          font-size: 0.68rem;
          color: #78716c;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }
        .metric-mini-card strong {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.1rem;
          color: #1c1917;
        }
        .fit-form-card {
          background: #fff;
          border: 1px solid #e7e5e4;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        }
        .fit-form-card h4 {
          font-family: 'Playfair Display', serif;
          font-size: 1.15rem;
          color: #1c1917;
          margin: 0 0 16px 0;
        }
        @keyframes scannerSweep {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>

      <div className="fit-vault-header">
        <h3><Sparkles size={20} color="#9d2706" /> Bespoke Fit Vault</h3>
        <span style={{ fontSize: '0.75rem', color: '#78716c', background: '#f4f4f5', padding: '4px 10px', borderRadius: 20, fontWeight: 500 }}>
          Client Tier: {profile ? 'Elite Sizing' : 'Default Parameters'}
        </span>
      </div>

      {isDemo && (
        <div className="atelier-banner">
          <Activity size={24} color="#9d2706" style={{ flexShrink: 0 }} />
          <div className="atelier-banner-content">
            <h5>Demo Preview Mode</h5>
            <p>You do not have a 3D LiDAR Podiatric scan on file. Displaying standard craft metrics. Book an atelier artisan session to lock in your custom footbed contour.</p>
          </div>
          <button className="account-btn-primary" onClick={() => setActiveTab('visits')} style={{ fontSize: '0.7rem', padding: '8px 14px', marginTop: 0 }}>
            Book Sizing Visit
          </button>
        </div>
      )}

      {/* Sizing Visualization Panel */}
      <div className="fit-vault-grid">
        {/* Footprint SVG */}
        <div className="visualizer-card">
          <h4>Atelier Footprint Scan (UK Size {activeProfile.uk_size || '9'})</h4>
          <svg className="visualizer-svg" width="100%" height="280" viewBox="0 0 360 300">
            {/* Grid background */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Tech pack measurements text overlays */}
            <text x="20" y="30" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="monospace">SCAN: {activeProfile.scan_source || 'ATELIER 3D'}</text>
            <text x="20" y="45" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="monospace">ACCURACY: ±0.2mm</text>
            
            {/* Left Foot */}
            <g>
              <path 
                d="M 110,250 C 75,230 70,160 76,120 C 80,80 94,60 106,55 C 112,52 120,55 124,65 C 130,85 128,125 132,165 C 136,205 130,235 110,250 Z"
                className={`foot-path ${fitPref}`}
                strokeWidth="1.5"
              />
              <ellipse cx="104" cy="35" rx="8" ry="10" fill="rgba(157, 39, 6, 0.4)" />
              <ellipse cx="118" cy="38" rx="5.5" ry="7" fill="rgba(157, 39, 6, 0.3)" />
              <ellipse cx="128" cy="45" rx="4.5" ry="6" fill="rgba(157, 39, 6, 0.25)" />
              <ellipse cx="137" cy="54" rx="3.5" ry="5" fill="rgba(157, 39, 6, 0.2)" />
              <ellipse cx="144" cy="65" rx="2.5" ry="4" fill="rgba(157, 39, 6, 0.15)" />
              
              {/* Width dimension line */}
              <line x1="74" y1="120" x2="130" y2="120" stroke="rgba(255,255,255,0.25)" strokeDasharray="3,3" />
              <text x="102" y="115" fill="#9d2706" fontSize="8" textAnchor="middle" fontFamily="monospace">{activeProfile.foot_width_left || '98'}mm</text>
              
              {/* Length dimension line */}
              <line x1="110" y1="250" x2="110" y2="35" stroke="rgba(255,255,255,0.25)" strokeDasharray="3,3" />
              <text x="95" y="150" fill="#9d2706" fontSize="8" textAnchor="end" fontFamily="monospace" transform="rotate(-90 95 150)">{activeProfile.foot_length_left || '274'}mm</text>
              
              {/* Glowing checkpoints */}
              <circle cx="110" cy="250" r="3.5" className="glowing-vertex" />
              <circle cx="104" cy="35" r="3.5" className="glowing-vertex" />
            </g>

            {/* Right Foot */}
            <g>
              <path 
                d="M 250,250 C 285,230 290,160 284,120 C 280,80 266,60 254,55 C 248,52 240,55 236,65 C 230,85 232,125 228,165 C 224,205 230,235 250,250 Z"
                className={`foot-path ${fitPref}`}
                strokeWidth="1.5"
              />
              <ellipse cx="256" cy="35" rx="8" ry="10" fill="rgba(157, 39, 6, 0.4)" />
              <ellipse cx="242" cy="38" rx="5.5" ry="7" fill="rgba(157, 39, 6, 0.3)" />
              <ellipse cx="232" cy="45" rx="4.5" ry="6" fill="rgba(157, 39, 6, 0.25)" />
              <ellipse cx="223" cy="54" rx="3.5" ry="5" fill="rgba(157, 39, 6, 0.2)" />
              <ellipse cx="216" cy="65" rx="2.5" ry="4" fill="rgba(157, 39, 6, 0.15)" />
              
              {/* Width dimension line */}
              <line x1="228" y1="120" x2="284" y2="120" stroke="rgba(255,255,255,0.25)" strokeDasharray="3,3" />
              <text x="256" y="115" fill="#9d2706" fontSize="8" textAnchor="middle" fontFamily="monospace">{activeProfile.foot_width_right || '97'}mm</text>
              
              {/* Length dimension line */}
              <line x1="250" y1="250" x2="250" y2="35" stroke="rgba(255,255,255,0.25)" strokeDasharray="3,3" />
              <text x="268" y="150" fill="#9d2706" fontSize="8" textAnchor="start" fontFamily="monospace" transform="rotate(90 268 150)">{activeProfile.foot_length_right || '273'}mm</text>

              <circle cx="250" cy="250" r="3.5" className="glowing-vertex" />
              <circle cx="256" cy="35" r="3.5" className="glowing-vertex" />
            </g>
          </svg>
        </div>

        {/* Instep Elevation Curve */}
        <div className="visualizer-card">
          <h4>Instep & Arch Contour Profile</h4>
          <svg className="visualizer-svg" width="100%" height="280" viewBox="0 0 320 200">
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Draw side-profile foot */}
            <path 
              d="M 30,160 C 50,160 55,145 60,110 C 65,70 85,45 110,45 C 130,45 155,75 185,115 C 215,140 255,145 285,160 Z" 
              fill="rgba(255,255,255,0.02)" 
              stroke="rgba(255,255,255,0.15)" 
              strokeWidth="1.5" 
            />
            
            {/* Draw active arch shape based on arch type */}
            {archType === 'high' && (
              <path 
                d="M 60,160 C 95,110 185,110 220,160" 
                fill="none" 
                stroke="#9d2706" 
                strokeWidth="4" 
                className="arch-path"
                style={{ filter: 'drop-shadow(0 0 5px rgba(157,39,6,0.6))' }}
              />
            )}
            {archType === 'medium' && (
              <path 
                d="M 60,160 C 95,135 185,135 220,160" 
                fill="none" 
                stroke="#D4A574" 
                strokeWidth="3.5" 
                className="arch-path" 
              />
            )}
            {archType === 'low' && (
              <path 
                d="M 60,160 C 95,152 185,152 220,160" 
                fill="none" 
                stroke="#78716c" 
                strokeWidth="3" 
                className="arch-path" 
              />
            )}
            
            <line x1="30" y1="160" x2="285" y2="160" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
            
            <text x="140" y="180" fill="#9d2706" fontSize="10" fontWeight="500" letterSpacing="0.05em" textAnchor="middle" fontFamily="sans-serif">
              {archType.toUpperCase()} ARCH DETECTED
            </text>

            {/* Custom shoe inserts advisory */}
            {activeProfile.podiatry_notes?.includes('arch support') && (
              <g transform="translate(15, 15)">
                <rect width="290" height="22" rx="4" fill="rgba(239, 68, 68, 0.08)" stroke="rgba(239, 68, 68, 0.2)" strokeWidth="1" />
                <text x="145" y="14" fill="#ef4444" fontSize="8.5" textAnchor="middle" fontWeight="bold">
                  ⚠️ ADVISORY: Custom orthotic arch inserts active for this last shape.
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="fit-metric-cards">
        <div className="metric-mini-card">
          <span>Assigned Last</span>
          <strong>{lastTypeLabel}</strong>
        </div>
        <div className="metric-mini-card">
          <span>Arch Parameter</span>
          <strong>{archType.toUpperCase()}</strong>
        </div>
        <div className="metric-mini-card">
          <span>Fit Profile Accuracy</span>
          <strong>LiDAR ±0.2mm</strong>
        </div>
        <div className="metric-mini-card">
          <span>Scan Date</span>
          <strong>{new Date(activeProfile.scan_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
        </div>
      </div>

      {/* Physical Imprints Scans Row */}
      {(activeProfile.heatmap_image || activeProfile.arch_imprint_image) && (
        <div className="fit-form-card" style={{ marginBottom: 24 }}>
          <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', color: '#1c1917', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={18} color="#9d2706" /> Atelier Podiatric Physical Imprints
          </h4>
          <p style={{ fontSize: '0.78rem', color: '#78716c', margin: '0 0 20px 0', lineHeight: 1.5 }}>
            Physical foot scans captured during your in-store or custom offline sizing visit. These high-resolution anatomical mappings calibrate our bespoke welting blocks.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {activeProfile.heatmap_image && (
              <div style={{ background: '#fafaf9', border: '1px solid #e7e5e4', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                  Aramed Footbed Pressure Heatmap
                </span>
                <div style={{ width: '100%', height: 200, background: '#111', borderRadius: 8, overflow: 'hidden', border: '1.5px solid #9d2706', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <img src={activeProfile.heatmap_image} alt="Bespoke Heatmap Scan" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 2, background: 'rgba(157, 39, 6, 0.85)', boxShadow: '0 0 8px #9d2706', animation: 'scannerSweep 4s infinite linear' }}></div>
                </div>
              </div>
            )}
            {activeProfile.arch_imprint_image && (
              <div style={{ background: '#fafaf9', border: '1px solid #e7e5e4', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                  Foam Box Arch Profile Contour
                </span>
                <div style={{ width: '100%', height: 200, background: '#111', borderRadius: 8, overflow: 'hidden', border: '1.5px solid #9d2706', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <img src={activeProfile.arch_imprint_image} alt="Foam Box Arch Imprint" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 2, background: 'rgba(157, 39, 6, 0.85)', boxShadow: '0 0 8px #9d2706', animation: 'scannerSweep 4s infinite linear' }}></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Sizing Preferences Form */}
      <div className="fit-form-card">
        <h4>Bespoke Fitting Specifications</h4>
        {msg && <div className="account-msg success" style={{ marginBottom: 16 }}>{msg}</div>}
        
        <form onSubmit={handleSave} className="account-form">
          <div className="af-row">
            <div className="af-field">
              <label>Fit Volume Preference</label>
              <select value={fitPref} onChange={e => setFitPref(e.target.value)}>
                <option value="snug">Snug Fit (Contoured Contained Silhouette)</option>
                <option value="regular">Regular Fit (Standard Atelier Profile)</option>
                <option value="relaxed">Relaxed Roomy Fit (Spacious Wider Toe Box)</option>
              </select>
            </div>
            
            <div className="af-field">
              <label>Shoe Last Preference</label>
              <select value={lastPref} onChange={e => setLastPref(e.target.value)}>
                <option value="pointed">Pointed Last (Sleek Chiselled Oxford Silhouette)</option>
                <option value="rounded">Rounded Last (Soft Timeless Classic Profile)</option>
                <option value="chiseled">Chiseled Last (Bold Italian Atelier Sculpt)</option>
              </select>
            </div>
          </div>

          <div className="af-field">
            <label>Podiatry Notes & Fit Alerts (e.g. orthotics, inserts, bunion relief)</label>
            <textarea 
              rows="3" 
              value={podiatryNotes} 
              onChange={e => setPodiatryNotes(e.target.value)}
              placeholder="E.g., high instep support required, orthotic shoe insert support required, extra wide ball padding..."
            />
          </div>

          <button type="submit" className="account-btn-primary" disabled={saving} style={{ padding: '12px 24px', letterSpacing: '0.05em', fontWeight: 600 }}>
            {saving ? 'Updating Specifications...' : 'Update Sizing Specifications'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ===== Support & Help Tab =====
const SupportTab = ({ supportOrderContext, setSupportOrderContext }) => {
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);

  // New ticket form states
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [updateOrderRequest, setUpdateOrderRequest] = useState(false);
  const [linkedOrderId, setLinkedOrderId] = useState('');

  // Loaders & Interactive states
  const [loading, setLoading] = useState(true);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [faqOpen, setFaqOpen] = useState({});
  const [errorMsg, setErrorMsg] = useState('');

  const PREDEFINED_QUESTIONS = [
    {
      title: "🚚 Order Shipment Status",
      desc: "Track active order shipment progress and location updates.",
      subject: "Order Tracking Status",
      message: "Hello, I would like to track my active order shipment status. Please share the tracking ID and carrier updates.",
      category: "order_issue",
      update_order: false
    },
    {
      title: "✏️ Request Size/Leather Change",
      desc: "Change size, leather type, or sole before production begins.",
      subject: "Order Modification Request",
      message: "Hello, I would like to request a change to the size, leather/material, or sole on my order. Please let me know what custom adjustments are possible.",
      category: "order_issue",
      update_order: true
    },
    {
      title: "📏 Book 3D Fit Scan",
      desc: "Schedule or reschedule a podiatric scan in the atelier.",
      subject: "3D Fit Vault Scan Booking",
      message: "Hello, I would like to book or update my 3D Fit Vault podiatric scan appointment. Please share the available slots.",
      category: "fit_issue",
      update_order: false
    },
    {
      title: "🎨 Custom Material Option",
      desc: "Inquire about premium cordovan or custom patinas.",
      subject: "Custom Leather / Design Request",
      message: "Hello, I would like to request a custom leather/material design option that is not listed. Please let me know what bespoke combinations are available.",
      category: "design_query",
      update_order: false
    },
    {
      title: "🔄 Size Exchange / Return",
      desc: "Initiate an exchange or return for a delivered order.",
      subject: "Return or Exchange Request",
      message: "Hello, I would like to initiate a return or a size exchange request for my delivered order.",
      category: "return",
      update_order: false
    },
    {
      title: "❓ Fit & Style Consultation",
      desc: "Get styling or fitting recommendations from an artisan.",
      subject: "Sizing and Style Recommendation",
      message: "Hello, I have a general sizing or style recommendation inquiry. I would like some advice on selecting the perfect fit.",
      category: "general",
      update_order: false
    },
    {
      title: "💬 Other Queries",
      desc: "Raise a ticket for any other general support or custom query.",
      subject: "Other Custom Query",
      message: "Hello, I have an inquiry regarding custom orders or support. Please assist me with my query.",
      category: "general",
      update_order: false
    }
  ];

  const FAQS = [
    {
      q: "When can I request changes to my bespoke order?",
      a: "Changes to size, leather selection, or sole configuration can be made freely as long as your order status is 'Placed' (Pending) or 'Confirmed'. Once the order moves into 'In Production', the anatomical leather shapes are already cut, and changes are no longer possible."
    },
    {
      q: "How does the price adjustment work for custom upgrades?",
      a: "Some premium leathers (e.g. Shell Cordovan) or sole selections (e.g. Dainite Rubber) have additional material costs. When our support staff proposes a modification draft, you will see a detailed comparison of prices. If you accept and the price increases, your order will transition to 'Waiting for Payment' until the balance is settled."
    },
    {
      q: "What is the 3D Fit Vault scan appointment?",
      a: "We capture a complete sub-millimeter anatomical scan of your feet at our physical ateliers to create individual wooden shoe lasts. You can book an appointment through the scheduled visits tab or directly ask our support team to register a priority slot."
    },
    {
      q: "How long does shipping take after dispatch?",
      a: "Since all shoes are individually hand-welted, production takes between 3 to 6 weeks. Once complete and verified by Quality Control, transit takes 2-4 business days across India with real-time GPS tracking enabled in your orders tab."
    }
  ];

  const fetchTicketsAndOrders = async () => {
    try {
      const ticketRes = await api.getMyTickets();
      setTickets(ticketRes.tickets || []);
      
      const orderRes = await api.getMyOrders();
      setOrders(orderRes.orders || []);
    } catch (err) {
      console.error("Failed to load support page data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketsAndOrders();
  }, []);

  // Sync contextual order from My Orders navigation click
  useEffect(() => {
    if (supportOrderContext) {
      const orderId = supportOrderContext.id || supportOrderContext._id;
      setLinkedOrderId(orderId);
      setSubject(`Help with Order #${supportOrderContext.order_number}`);
      setMessage(`Hello, I need assistance with my order #${supportOrderContext.order_number}.`);
      setCategory('order_issue');
      setActiveTicket(null);
      setShowNewForm(true);

      // Auto scroll to form
      setTimeout(() => {
        const el = document.getElementById('support-inquiry-form');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [supportOrderContext]);

  const selectPredefined = (question) => {
    setSubject(question.subject);
    setMessage(question.message);
    setCategory(question.category);
    setUpdateOrderRequest(question.update_order);
    setErrorMsg('');
    setActiveTicket(null);
    setShowNewForm(true);
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setErrorMsg("Subject and message are required.");
      return;
    }
    setSubmittingTicket(true);
    try {
      const selectedOrder = orders.find(o => (o.id || o._id) === linkedOrderId);
      const res = await api.createTicket({
        subject,
        message,
        category,
        update_order_request: updateOrderRequest,
        order_id: linkedOrderId || null,
        order_number: selectedOrder ? selectedOrder.order_number : null
      });
      
      setSubject('');
      setMessage('');
      setCategory('general');
      setUpdateOrderRequest(false);
      setLinkedOrderId('');
      setSupportOrderContext(null);
      setShowNewForm(false);

      // Refresh tickets list and set the newly created ticket as active
      const ticketRes = await api.getMyTickets();
      const updatedTickets = ticketRes.tickets || [];
      setTickets(updatedTickets);

      const newTicket = updatedTickets.find(t => t.id === res.id);
      if (newTicket) setActiveTicket(newTicket);

    } catch (err) {
      setErrorMsg(err.message || "Failed to create support ticket.");
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await api.customerReplyTicket(activeTicket.id, { message: replyText });
      
      // Reload tickets and update active ticket
      const ticketRes = await api.getMyTickets();
      const updatedTickets = ticketRes.tickets || [];
      setTickets(updatedTickets);
      
      const updatedActive = updatedTickets.find(t => t.id === activeTicket.id);
      if (updatedActive) setActiveTicket(updatedActive);
      setReplyText('');
    } catch (err) {
      alert(err.message || "Failed to send message.");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleConfirmDraft = async (ticketId) => {
    if (!confirm("Are you sure you want to accept these proposed modifications and estimated price changes? This action will update your order specifications.")) return;
    try {
      await api.confirmDraftModification(ticketId);
      alert("Modifications accepted successfully! Our administrators will now process and apply these changes to production.");
      
      // Reload tickets
      const ticketRes = await api.getMyTickets();
      const updatedTickets = ticketRes.tickets || [];
      setTickets(updatedTickets);
      
      const updatedActive = updatedTickets.find(t => t.id === activeTicket.id);
      if (updatedActive) setActiveTicket(updatedActive);
    } catch (err) {
      alert(err.message || "Failed to confirm modifications.");
    }
  };

  const handleRejectDraft = async (ticketId) => {
    if (!confirm("Are you sure you want to decline these proposed modifications? The current specifications of your order will remain active.")) return;
    try {
      await api.rejectDraftModification(ticketId);
      alert("Proposed changes have been declined.");
      
      // Reload tickets
      const ticketRes = await api.getMyTickets();
      const updatedTickets = ticketRes.tickets || [];
      setTickets(updatedTickets);
      
      const updatedActive = updatedTickets.find(t => t.id === activeTicket.id);
      if (updatedActive) setActiveTicket(updatedActive);
    } catch (err) {
      alert(err.message || "Failed to decline modifications.");
    }
  };

  const toggleFaq = (index) => {
    setFaqOpen(prev => ({ ...prev, [index]: !prev[index] }));
  };

  if (loading) return <div className="account-loading">Loading Support Atelier...</div>;

  return (
    <div className="account-panel support-panel" data-testid="support-panel" style={{ position: 'relative' }}>
      <style>{`
        .support-layout {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 24px;
          margin-top: 16px;
          min-height: 580px;
        }
        @media (max-width: 900px) {
          .support-layout {
            grid-template-columns: 1fr;
          }
        }
        .support-left-pane {
          border-right: 1px solid #e7e5e4;
          padding-right: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        @media (max-width: 900px) {
          .support-left-pane {
            border-right: none;
            padding-right: 0;
            border-bottom: 1px solid #e7e5e4;
            padding-bottom: 20px;
          }
        }
        .ticket-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 480px;
          overflow-y: auto;
        }
        .ticket-item-btn {
          width: 100%;
          text-align: left;
          background: #fafaf9;
          border: 1px solid #e7e5e4;
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-family: inherit;
        }
        .ticket-item-btn:hover {
          border-color: #9d2706;
          background: #fdfcfa;
        }
        .ticket-item-btn.active {
          background: #faf6eb;
          border-color: #9d2706;
          box-shadow: 0 0 10px rgba(157,39,6,0.1);
        }
        .ticket-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8rem;
          font-weight: 700;
          color: #1c1917;
        }
        .ticket-item-subject {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 0.76rem;
          color: #44403c;
          font-weight: 500;
        }
        .ticket-item-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.65rem;
          color: #78716c;
          margin-top: 4px;
        }
        .status-badge-mini {
          font-size: 0.58rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 2px 6px;
          border-radius: 4px;
          color: #fff;
        }
        .status-open { background: #3b82f6; }
        .status-pending_modification { background: #d97706; }
        .status-resolved { background: #10b981; }
        .status-closed { background: #6b7280; }
        
        .chat-pane {
          background: #fafaf9;
          border: 1px solid #e7e5e4;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          height: 520px;
          position: relative;
        }
        .chat-header {
          padding-bottom: 12px;
          border-bottom: 1px solid #e7e5e4;
          margin-bottom: 14px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .chat-header h4 {
          margin: 0;
          font-family: 'Playfair Display', serif;
          font-size: 1.1rem;
          color: #1c1917;
        }
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-right: 8px;
          margin-bottom: 14px;
        }
        .msg-bubble {
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 0.78rem;
          line-height: 1.4;
          position: relative;
          display: flex;
          flex-direction: column;
        }
        .msg-bubble.customer {
          align-self: flex-end;
          background: #111;
          color: #fff;
          border-bottom-right-radius: 2px;
        }
        .msg-bubble.admin {
          align-self: flex-start;
          background: #f5f5f4;
          color: #1c1917;
          border: 1px solid #e7e5e4;
          border-bottom-left-radius: 2px;
        }
        .msg-bubble.system {
          align-self: center;
          background: #faf6eb;
          color: #854d0e;
          border: 1px solid #fef3c7;
          text-align: center;
          max-width: 90%;
          font-weight: 500;
        }
        .msg-time-label {
          font-size: 0.58rem;
          color: rgba(255,255,255,0.6);
          margin-top: 6px;
          text-align: right;
        }
        .msg-bubble.admin .msg-time-label {
          color: #a1a1aa;
        }
        .msg-bubble.system .msg-time-label {
          color: #b45309;
        }
        .chat-input-row {
          display: flex;
          gap: 8px;
          border-top: 1px solid #e7e5e4;
          padding-top: 12px;
        }
        .chat-input {
          flex: 1;
          background: #fff;
          border: 1px solid #d1d5db;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 0.78rem;
          outline: none;
          resize: none;
          height: 36px;
        }
        .chat-input:focus {
          border-color: #9d2706;
        }
        .predefined-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }
        @media (max-width: 640px) {
          .predefined-grid {
            grid-template-columns: 1fr;
          }
        }
        .predefined-card {
          background: #fff;
          border: 1.5px dashed #e7e5e4;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
          text-align: left;
          font-family: inherit;
          width: 100%;
          box-sizing: border-box;
          min-height: 64px;
        }
        .predefined-card:hover {
          border-color: #9d2706;
          background: #fdfcfa;
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.02);
        }
        .predefined-card h5 {
          margin: 0 0 3px 0;
          font-size: 0.74rem;
          font-weight: 700;
          color: #1c1917;
          line-height: 1.2;
        }
        .predefined-card p {
          margin: 0;
          font-size: 0.62rem;
          color: #78716c;
          line-height: 1.35;
        }
        
        /* Interactive Proposal Draft Card */
        .proposal-draft-card {
          background: #fffbeb;
          border: 1.5px solid #9d2706;
          border-radius: 10px;
          padding: 14px;
          margin-bottom: 12px;
          box-shadow: 0 4px 12px rgba(157,39,6,0.12);
        }
        .proposal-draft-title {
          font-family: 'Playfair Display', serif;
          font-size: 0.95rem;
          color: #854d0e;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
        }
        .proposal-comparison-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          font-size: 0.72rem;
          background: #fff;
          padding: 10px;
          border-radius: 6px;
          border: 1px solid #fde68a;
          margin-bottom: 12px;
        }
        .comparison-col {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .comparison-col.original {
          border-right: 1px solid #f5f5f4;
          padding-right: 10px;
        }
        .comparison-col.proposed {
          padding-left: 4px;
        }
        
        /* FAQ styling */
        .faq-section {
          margin-top: 36px;
          border-top: 1px solid #e7e5e4;
          padding-top: 24px;
        }
        .faq-item {
          border: 1px solid #e7e5e4;
          border-radius: 8px;
          margin-bottom: 8px;
          overflow: hidden;
          background: #fafaf9;
        }
        .faq-q-btn {
          width: 100%;
          background: none;
          border: none;
          padding: 14px 16px;
          text-align: left;
          font-weight: 600;
          font-size: 0.8rem;
          color: #1c1917;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: inherit;
        }
        .faq-q-btn:hover {
          background: #faf6eb;
        }
        .faq-answer {
          padding: 12px 16px;
          background: #fff;
          border-top: 1px solid #e7e5e4;
          font-size: 0.75rem;
          color: #57534e;
          line-height: 1.45;
        }
      `}</style>

      <div className="section-header">
        <h3>Support & Help Desk</h3>
        <p className="table-sub">Submit custom inquiries, track shipments, or verify audited price modification drafts with our support artisans.</p>
      </div>

      <div className="support-layout">
        
        {/* LEFT COLUMN: Active Ticket Selection */}
        <div className="support-left-pane">
          <button
            type="button"
            onClick={() => {
              setActiveTicket(null);
              setSupportOrderContext(null);
              setSubject('');
              setMessage('');
              setCategory('general');
              setUpdateOrderRequest(false);
              setLinkedOrderId('');
              setErrorMsg('');
              setShowNewForm(true);
            }}
            data-testid="raise-new-inquiry-btn"
            style={{
              width: '100%',
              marginTop: 0,
              padding: '11px 14px',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
              background: showNewForm && !activeTicket ? '#9d2706' : '#1a1a1a',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontFamily: 'Montserrat, sans-serif',
              transition: 'background 0.2s',
              letterSpacing: '0.02em',
            }}
          >
            <Plus size={15} /> Raise New Enquiry
          </button>
          
          <div className="ticket-list">
            <h4 style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#78716c', letterSpacing: '0.05em', margin: '4px 0' }}>Your Active Inquiries</h4>
            {tickets.length === 0 ? (
              <div style={{ padding: '24px 10px', textAlign: 'center', fontSize: '0.72rem', color: '#a8a29e', fontStyle: 'italic' }}>
                No enquiries filed yet.
              </div>
            ) : (
              tickets.map(t => (
                <button
                  key={t.id}
                  className={`ticket-item-btn ${activeTicket?.id === t.id ? 'active' : ''}`}
                  onClick={() => { setActiveTicket(t); setShowNewForm(false); }}
                  data-testid={`customer-ticket-${t.id}`}
                >
                  <div className="ticket-item-header">
                    <span>Enquiry #{t.id.slice(-6).toUpperCase()}</span>
                    <span className={`status-badge-mini status-${t.status}`}>{t.status?.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="ticket-item-subject">{t.subject}</div>
                  <div className="ticket-item-footer">
                    <span>{t.category?.toUpperCase() || 'GENERAL'}</span>
                    <span>{new Date(t.updated_at).toLocaleDateString('en-IN')}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Welcome Starters | New Form | Chat Pane */}
        <div className="support-right-pane">
          {!activeTicket && !showNewForm ? (

            // ── DEFAULT: Chat-starter welcome screen ──
            <div style={{
              background: '#fafaf9',
              border: '1px solid #e7e5e4',
              borderRadius: '14px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '520px',
            }}>
              {/* Chat header */}
              <div style={{
                background: '#1a1a1a',
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}>
                <div style={{
                  width: 40, height: 40,
                  borderRadius: '50%',
                  background: 'rgba(157,39,6,0.15)',
                  border: '2px solid #9d2706',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem',
                }}>🎨</div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', fontFamily: 'Montserrat, sans-serif' }}>Atelier Support Desk</div>
                  <div style={{ color: '#9d2706', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                    Artisans online · usually replies within a few hours
                  </div>
                </div>
              </div>

              {/* Messages area */}
              <div style={{ flex: 1, padding: '24px 20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Bot welcome bubble */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f5f5f4', border: '1px solid #e7e5e4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>🎨</div>
                  <div>
                    <div style={{ fontSize: '0.63rem', color: '#a8a29e', marginBottom: 4, fontWeight: 600 }}>Atelier Support</div>
                    <div style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: '12px', borderBottomLeftRadius: 2, padding: '12px 16px', fontSize: '0.8rem', color: '#1c1917', lineHeight: 1.55, maxWidth: 380 }}>
                      👋 Welcome to the <strong>Cobblyn Atelier Desk</strong>. How can our artisans assist you today?
                      <br /><br />
                      Select a topic below to get started, or raise a custom enquiry using the button on the left.
                    </div>
                  </div>
                </div>

                {/* Suggestion chips label */}
                <div style={{ fontSize: '0.65rem', color: '#a8a29e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 8, paddingLeft: 42 }}>
                  Quick Topics
                </div>

                {/* Suggestion chips */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 42 }}>
                  {PREDEFINED_QUESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectPredefined(q)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        background: '#fff',
                        border: '1.5px solid #e7e5e4',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'inherit',
                        transition: 'all 0.18s',
                        width: '100%',
                        maxWidth: 420,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#9d2706'; e.currentTarget.style.background = '#fffbeb'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e7e5e4'; e.currentTarget.style.background = '#fff'; }}
                    >
                      <span style={{ fontSize: '1rem', lineHeight: 1 }}>{q.title.split(' ')[0]}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1c1917' }}>{q.title.split(' ').slice(1).join(' ')}</div>
                        <div style={{ fontSize: '0.65rem', color: '#78716c', marginTop: 1 }}>{q.desc}</div>
                      </div>
                      <span style={{ color: '#9d2706', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>→</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Disabled reply bar hint */}
              <div style={{
                borderTop: '1px solid #e7e5e4',
                padding: '12px 20px',
                display: 'flex',
                gap: 8,
                alignItems: 'center',
              }}>
                <div style={{
                  flex: 1,
                  background: '#f5f5f4',
                  border: '1px solid #e7e5e4',
                  borderRadius: '8px',
                  padding: '9px 14px',
                  fontSize: '0.75rem',
                  color: '#a8a29e',
                  cursor: 'default',
                  userSelect: 'none',
                }}>Select a topic above or raise a new enquiry…</div>
                <button
                  type="button"
                  onClick={() => { setShowNewForm(true); }}
                  style={{
                    background: '#9d2706', color: '#fff', border: 'none',
                    borderRadius: '8px', padding: '9px 16px',
                    fontSize: '0.75rem', fontWeight: 700,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    fontFamily: 'Montserrat, sans-serif',
                  }}
                >+ New Enquiry</button>
              </div>
            </div>

          ) : !activeTicket && showNewForm ? (

            // ── NEW ENQUIRY FORM ──
            <div id="support-inquiry-form" className="fit-form-card" style={{ marginTop: 0, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid #e7e5e4', paddingBottom: 10 }}>
                <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.15rem', color: '#1c1917', margin: 0 }}>
                  Raise a New Enquiry
                </h4>
                <button
                  type="button"
                  onClick={() => { setShowNewForm(false); setErrorMsg(''); }}
                  style={{ background: 'none', border: 'none', fontSize: '0.72rem', color: '#78716c', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  ← Back
                </button>
              </div>

              {/* Quick topic chips at top of form too */}
              <div style={{ marginBottom: 18 }}>
                <span style={{ fontSize: '0.67rem', fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
                  💡 Quick-fill from a topic
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {PREDEFINED_QUESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => { setSubject(q.subject); setMessage(q.message); setCategory(q.category); setUpdateOrderRequest(q.update_order); setErrorMsg(''); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '5px 10px',
                        background: subject === q.subject ? '#fffbeb' : '#f5f5f4',
                        border: subject === q.subject ? '1.5px solid #9d2706' : '1.5px solid #e7e5e4',
                        borderRadius: '20px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: subject === q.subject ? '#92400e' : '#44403c',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.15s',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span>{q.title.split(' ')[0]}</span>
                      <span>{q.title.split(' ').slice(1).join(' ')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {errorMsg && <div className="account-msg" style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', padding: '8px 12px', borderRadius: '6px', fontSize: '0.72rem', marginBottom: 14 }}>{errorMsg}</div>}

              <form onSubmit={handleCreateTicket} className="account-form" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                  <div className="af-field">
                    <label>Enquiry Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value)}>
                      <option value="general">General Sizing & Atelier Advice</option>
                      <option value="fit_issue">Podiatric / 3D Fit Vault Issue</option>
                      <option value="design_query">Custom Patina & Leather Inquiry</option>
                      <option value="order_issue">Bespoke Order Customization & Modification</option>
                      <option value="return">Exchange & Return Filing</option>
                    </select>
                  </div>

                  <div className="af-field">
                    <label>Link to a Specific Order <span style={{ color: '#a8a29e', fontWeight: 400 }}>(optional)</span></label>
                    <select value={linkedOrderId} onChange={e => {
                      setLinkedOrderId(e.target.value);
                      if (e.target.value) {
                        const o = orders.find(ord => (ord.id || ord._id) === e.target.value);
                        if (o) setSubject(`Order Modification/Help: #${o.order_number}`);
                      }
                    }}>
                      <option value="">-- No Order Association --</option>
                      {orders.map(o => (
                        <option key={o.id || o._id} value={o.id || o._id}>
                          Order #{o.order_number} ({new Date(o.created_at).toLocaleDateString()} · ₹{o.total_amount?.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#fafaf9', padding: '10px', borderRadius: '6px', border: '1px solid #e7e5e4' }}>
                  <input
                    type="checkbox"
                    id="update-order-checkbox"
                    checked={updateOrderRequest}
                    onChange={e => setUpdateOrderRequest(e.target.checked)}
                    style={{ width: 14, height: 14, accentColor: '#9d2706', cursor: 'pointer', marginTop: '4px' }}
                  />
                  <label htmlFor="update-order-checkbox" style={{ fontSize: '0.72rem', fontWeight: 600, color: '#44403c', margin: 0, cursor: 'pointer' }}>
                    🚨 This is an order modification request (size, material, or sole change).
                  </label>
                </div>

                <div className="af-field">
                  <label>Subject / Brief Summary</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="E.g., Requesting Dainite sole upgrade on my oxfords"
                    style={{ fontSize: '0.78rem' }}
                    data-testid="ticket-subject-input"
                  />
                </div>

                <div className="af-field">
                  <label>Detailed Description</label>
                  <textarea
                    rows="4"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Detail your request here. Our artisans will read this and formulate your bespoke proposal."
                    style={{ fontSize: '0.78rem' }}
                    data-testid="ticket-message-input"
                  />
                </div>

                <button
                  type="submit"
                  className="account-btn-primary"
                  disabled={submittingTicket}
                  style={{ width: 'fit-content', padding: '10px 24px', letterSpacing: '0.05em', fontWeight: 600, marginTop: 4 }}
                  data-testid="submit-ticket-btn"
                >
                  {submittingTicket ? 'Initiating Request…' : 'Submit Enquiry'}
                </button>
              </form>
            </div>

          ) : (
            
            // conversational pane for active ticket
            <div className="chat-pane" data-testid="chat-pane">
              
              <div className="chat-header">
                <div>
                  <h4>{activeTicket.subject}</h4>
                  <p className="table-sub" style={{ margin: '2px 0 0 0', fontSize: '0.68rem' }}>
                    Category: <strong>{activeTicket.category?.toUpperCase()}</strong> 
                    {activeTicket.order_number && (
                      <> | Linked Order: <strong>#{activeTicket.order_number}</strong></>
                    )}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span className={`status-badge-mini status-${activeTicket.status}`}>{activeTicket.status?.replace(/_/g, ' ')}</span>
                  <button
                    type="button"
                    onClick={() => { setActiveTicket(null); setSupportOrderContext(null); setShowNewForm(false); }}
                    style={{ background: 'none', border: 'none', color: '#9d2706', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    ← Back to Enquiries
                  </button>
                </div>
              </div>

              {/* Chat timeline messages list */}
              <div className="chat-messages">
                
                {/* Active Proposed Modification Draft comparative card */}
                {activeTicket.proposed_modification_draft && (
                  <div className="proposal-draft-card" data-testid="proposal-draft-card">
                    <div className="proposal-draft-title">
                      <Sparkles size={16} color="#9d2706" />
                      <span>Proposed Bespoke Details Upgrade</span>
                    </div>
                    
                    <p style={{ fontSize: '0.68rem', color: '#78350f', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                      Our atelier artisans have prepared a custom draft modification proposal for your order <strong>#{activeTicket.proposed_modification_draft.order_number}</strong>. Please review the detailed changes below.
                    </p>

                    <div className="proposal-comparison-grid">
                      {/* Original specifications */}
                      <div className="comparison-col original">
                        <span style={{ fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', fontSize: '0.58rem', letterSpacing: '0.05em', marginBottom: 4 }}>Original Spec</span>
                        {(() => {
                          const linked = orders.find(o => (o.id || o._id) === activeTicket.order_id);
                          const item = linked?.items?.[0];
                          if (item) {
                            return (
                              <>
                                <div><strong>Item:</strong> {item.name}</div>
                                <div><strong>Size:</strong> UK {item.size}</div>
                                <div><strong>Color:</strong> {item.color}</div>
                                <div><strong>Leather:</strong> {item.material || 'Full-Grain'}</div>
                                <div><strong>Sole:</strong> {item.sole || 'Leather'}</div>
                              </>
                            );
                          }
                          return <div style={{ fontStyle: 'italic', color: '#888' }}>Previous order specs</div>;
                        })()}
                      </div>

                      {/* Proposed specifications */}
                      <div className="comparison-col proposed">
                        <span style={{ fontWeight: 700, color: '#166534', textTransform: 'uppercase', fontSize: '0.58rem', letterSpacing: '0.05em', marginBottom: 4 }}>Proposed Upgrade</span>
                        {(() => {
                          const item = activeTicket.proposed_modification_draft.items?.[0];
                          if (item) {
                            return (
                              <>
                                <div style={{ color: '#14532d', fontWeight: 600 }}><strong>Item:</strong> {item.name}</div>
                                <div style={{ color: '#14532d', fontWeight: 600 }}><strong>Size:</strong> UK {item.size}</div>
                                <div style={{ color: '#14532d', fontWeight: 600 }}><strong>Color:</strong> {item.color}</div>
                                <div style={{ color: '#14532d', fontWeight: 600 }}><strong>Leather:</strong> {item.material || 'Full-Grain'}</div>
                                <div style={{ color: '#14532d', fontWeight: 600 }}><strong>Sole:</strong> {item.sole || 'Leather'}</div>
                              </>
                            );
                          }
                          return <div style={{ fontStyle: 'italic', color: '#888' }}>No draft details</div>;
                        })()}
                      </div>
                    </div>

                    {activeTicket.proposed_modification_draft.notes && (
                      <div style={{ background: '#fafaf9', border: '1px solid #fde68a', borderRadius: '6px', padding: '8px', fontSize: '0.66rem', color: '#78716c', fontStyle: 'italic', marginBottom: 12 }}>
                        Artisan Notes: "{activeTicket.proposed_modification_draft.notes}"
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="status-badge-mini" style={{
                        backgroundColor: activeTicket.proposed_modification_draft.status === 'confirmed' ? '#10b981' : '#d97706',
                        fontSize: '0.55rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '4px'
                      }}>
                        {activeTicket.proposed_modification_draft.status === 'confirmed' ? '✅ accepted' : '⏳ review required'}
                      </span>

                      {activeTicket.proposed_modification_draft.status !== 'confirmed' ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button 
                            onClick={() => handleConfirmDraft(activeTicket.id)}
                            style={{ padding: '6px 12px', background: '#9d2706', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.66rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 6px rgba(157,39,6,0.3)', marginTop: 0 }}
                            data-testid="accept-draft-btn"
                          >
                            Accept Modifications
                          </button>
                          <button 
                            onClick={() => handleRejectDraft(activeTicket.id)}
                            style={{ padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.66rem', fontWeight: 700, cursor: 'pointer', marginTop: 0 }}
                            data-testid="decline-draft-btn"
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.66rem', color: '#166534', fontWeight: 600, fontStyle: 'italic' }}>
                          Draft approved! Awaiting supervisor review.
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Regular messages */}
                {(activeTicket.messages || []).map((msg, idx) => {
                  let bubbleClass = 'admin';
                  if (msg.sender === 'customer') bubbleClass = 'customer';
                  else if (msg.sender === 'system' || msg.admin_name === 'System / CRM') bubbleClass = 'system';
                  
                  return (
                    <div key={idx} className={`msg-bubble ${bubbleClass}`} data-testid={`chat-msg-${idx}`}>
                      <div style={{ fontWeight: 700, fontSize: '0.64rem', marginBottom: 2 }}>
                        {msg.sender === 'customer' ? 'You' : (msg.admin_name || 'Atelier Support')}
                      </div>
                      <div>{msg.message}</div>
                      <div className="msg-time-label">
                        {new Date(msg.timestamp).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input for replying */}
              {activeTicket.status !== 'closed' && activeTicket.status !== 'resolved' ? (
                <form onSubmit={handleSendReply} className="chat-input-row">
                  <input 
                    type="text" 
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Type your reply here..."
                    className="chat-input"
                    disabled={submittingReply}
                    data-testid="chat-reply-input"
                  />
                  <button 
                    type="submit" 
                    className="account-btn-primary" 
                    disabled={submittingReply || !replyText.trim()}
                    style={{ margin: 0, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '36px' }}
                    data-testid="send-reply-btn"
                  >
                    <Send size={14} />
                  </button>
                </form>
              ) : (
                <div style={{ padding: '10px 0', borderTop: '1px solid #e7e5e4', fontSize: '0.72rem', color: '#78716c', fontStyle: 'italic', textAlign: 'center' }}>
                  This support thread has been resolved/closed.
                </div>
              )}

            </div>
          )}
        </div>

      </div>

      {/* Luxury Accordion FAQs Section at the bottom */}
      <div className="faq-section">
        <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', color: '#1c1917', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
          <HelpCircle size={18} color="#9d2706" /> Frequently Answered Inquiries
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FAQS.map((faq, idx) => (
            <div key={idx} className="faq-item">
              <button className="faq-q-btn" onClick={() => toggleFaq(idx)}>
                <span>{faq.q}</span>
                <ChevronRight size={14} style={{ transform: faqOpen[idx] ? 'rotate(90deg)' : 'rotate(0)', transition: 'all 0.2s' }} />
              </button>
              {faqOpen[idx] && (
                <div className="faq-answer">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

const SavedDesignsTab = () => {
  const { user } = useAuth();
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const key = `cobblyn_saved_designs_${user.email || 'global'}`;
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      setDesigns(saved);
    }
    setLoading(false);
  }, [user]);

  const handleDelete = (id) => {
    if (typeof window !== 'undefined' && user) {
      const key = `cobblyn_saved_designs_${user.email || 'global'}`;
      const filtered = designs.filter(d => d.id !== id);
      localStorage.setItem(key, JSON.stringify(filtered));
      setDesigns(filtered);
    }
  };

  const getConfigureLink = (d) => {
    const qs = new URLSearchParams({
      gender: d.gender || 'men',
      model: d.model || '',
      submodel: d.submodel || '',
      leather: d.leather || '',
      color: d.color || '',
      sole: d.sole || '',
      monogram: d.monogram || ''
    }).toString();
    return `/customize/${d.gender || 'men'}?${qs}`;
  };

  if (loading) return <div className="account-loading">Loading Saved Designs...</div>;

  return (
    <div className="account-panel" data-testid="saved-designs-panel">
      <div className="section-header">
        <h3>My Saved Designs</h3>
        {designs.length > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--mid-grey)' }}>{designs.length} Saved Design{designs.length !== 1 ? 's' : ''}</span>}
      </div>
      
      {designs.length === 0 ? (
        <div className="account-empty-orders" style={{ textAlign: 'center', padding: '48px 0' }}>
          <Palette size={48} strokeWidth={1} style={{ color: '#9d2706', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '0.95rem', color: '#1c1917', fontWeight: 600 }}>Your Atelier Journal is empty.</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--mid-grey)', marginTop: '4px', maxWidth: '320px', marginLeft: 'auto', marginRight: 'auto' }}>Create your bespoke masterpiece using our Customizer to save it here!</p>
          <Link href="/customize/men" className="account-btn-primary" style={{ textDecoration: 'none', marginTop: '16px', display: 'inline-block' }}>Design Your Shoe</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {designs.map((d) => (
            <div key={d.id} style={{ border: '1px solid #e7e5e4', borderRadius: '12px', background: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
              
              {/* Trash button */}
              <button 
                onClick={() => handleDelete(d.id)}
                style={{ position: 'absolute', top: '12px', right: '12px', background: '#111', border: '1px solid #333', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa', cursor: 'pointer', zIndex: 5, transition: 'all 0.2s' }}
                title="Remove saved design"
              >
                <Trash2 size={12} />
              </button>

              {/* Shoe Image */}
              <div style={{ width: '100%', height: '180px', background: '#fcfcfc', borderBottom: '1px solid #e7e5e4', overflow: 'hidden' }}>
                <img src={d.image} alt={d.submodel} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              {/* Shoe Specs Details */}
              <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.62rem', color: '#9d2706', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d.date}</span>
                    {d.monogram && <span style={{ fontSize: '0.65rem', background: 'rgba(157,39,6,0.1)', color: '#9d2706', border: '1px solid rgba(157,39,6,0.2)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, letterSpacing: '0.05em' }}>[{d.monogram}]</span>}
                  </div>
                  
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 700, color: '#1c1917' }}>{d.submodel}</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.72rem', color: '#78716c' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Leather:</span><strong style={{ color: '#1c1917' }}>{d.leather}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Color:</span><strong style={{ color: '#1c1917' }}>{d.color}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Sole:</span><strong style={{ color: '#1c1917' }}>{d.sole}</strong></div>
                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                  <Link 
                    href={getConfigureLink(d)} 
                    style={{ flex: 1, textDecoration: 'none', padding: '10px 12px', background: '#111', color: '#9d2706', border: '1px solid #9d2706', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer' }}
                  >
                    <Sparkles size={12} /> Customize
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAccountPage;

