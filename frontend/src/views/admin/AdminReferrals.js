"use client";
import React, { useState, useEffect } from 'react';
import { Settings, ShieldAlert, CheckCircle, Trash2, Coins, Search, FileText, X, AlertTriangle } from 'lucide-react';
import { api } from '../../api';

const AdminReferrals = () => {
  const [activeTab, setActiveTab] = useState('ledger');
  const [ledger, setLedger] = useState([]);
  const [config, setConfig] = useState({
    welcome_credit: 250,
    referral_reward: 500,
    min_purchase_amount: 0,
    hold_days: 0,
    max_wallet_shoes_amount: 500,
    max_wallet_accessories_amount: 100
  });
  const [auditLogs, setAuditLogs] = useState([]);
  
  // State for Ledger Table
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [flagFilter, setFlagFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  // Modal State for Wallet Adjustment
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // { id, name, email }
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  // Fetch functions
  const fetchLedger = async () => {
    try {
      setLoading(true);
      let params = `?limit=${limit}&skip=${(page - 1) * limit}`;
      if (search) params += `&search=${encodeURIComponent(search)}`;
      if (statusFilter) params += `&status=${statusFilter}`;
      if (flagFilter === 'flagged') params += `&is_flagged=true`;
      if (flagFilter === 'clean') params += `&is_flagged=false`;
      
      const res = await api.request(`/referrals/admin/ledger${params}`);
      setLedger(res.items || []);
      setTotalItems(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const data = await api.request('/referrals/admin/config');
      if (data) {
        setConfig({
          welcome_credit: data.welcome_credit ?? 250,
          referral_reward: data.referral_reward ?? 500,
          min_purchase_amount: data.min_purchase_amount ?? 0,
          hold_days: data.hold_days ?? 0,
          max_wallet_shoes_amount: data.max_wallet_shoes_amount ?? 500,
          max_wallet_accessories_amount: data.max_wallet_accessories_amount ?? 100
        });
      }
    } catch (err) {
      console.error("Error fetching config:", err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await api.request('/referrals/admin/audit-logs?limit=50');
      setAuditLogs(res.items || []);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    }
  };

  useEffect(() => {
    if (activeTab === 'ledger') {
      fetchLedger();
    } else if (activeTab === 'config') {
      fetchConfig();
    } else if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab, page, limit, statusFilter, flagFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLedger();
  };

  // Actions
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      await api.request('/referrals/admin/config', {
        method: 'PUT',
        body: JSON.stringify(config)
      });
      alert('Referral Campaign configurations updated successfully!');
      fetchConfig();
    } catch (err) {
      alert(`Error updating configuration: ${err.message}`);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this referral and release the reward cash?')) return;
    try {
      const res = await api.request(`/referrals/admin/ledger/${id}/approve`, { method: 'POST' });
      alert(res.message);
      fetchLedger();
    } catch (err) {
      alert(`Approval failed: ${err.message}`);
    }
  };

  const handleVoid = async (id) => {
    if (!window.confirm('Are you sure you want to void this referral? If the reward was already released, this will debit the amount from the referrer\'s wallet.')) return;
    try {
      const res = await api.request(`/referrals/admin/ledger/${id}/void`, { method: 'POST' });
      alert(res.message);
      fetchLedger();
    } catch (err) {
      alert(`Void failed: ${err.message}`);
    }
  };

  const openAdjustWalletModal = (userId, userName, userEmail) => {
    setSelectedUser({ id: userId, name: userName, email: userEmail });
    setAdjustAmount('');
    setAdjustReason('');
    setShowAdjustModal(true);
  };

  const handleWalletAdjustment = async (e) => {
    e.preventDefault();
    if (!adjustAmount || isNaN(adjustAmount)) {
      alert('Please enter a valid numeric amount.');
      return;
    }
    try {
      const res = await api.request(`/referrals/admin/customers/${selectedUser.id}/adjust-wallet`, {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(adjustAmount),
          reason: adjustReason
        })
      });
      alert(res.message);
      setShowAdjustModal(false);
      if (activeTab === 'ledger') fetchLedger();
    } catch (err) {
      alert(`Adjustment failed: ${err.message}`);
    }
  };

  const totalPages = Math.ceil(totalItems / limit) || 1;

  return (
    <div className="admin-page" data-testid="admin-referrals">
      <div className="admin-page-header">
        <div>
          <h1>Refer & Earn Management</h1>
          <p>Configure signup rewards, monitor fraud detection alerts, and manage wallets ledger.</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="tabs-nav" style={{ display: 'flex', gap: 16, marginBottom: 24, borderBottom: '1px solid #E5E7EB', paddingBottom: 8 }}>
        <button 
          onClick={() => setActiveTab('ledger')} 
          className={`tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
          style={{
            padding: '8px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'ledger' ? '3px solid #9d2706' : '3px solid transparent',
            color: activeTab === 'ledger' ? '#9d2706' : '#6B7280',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          Referrals Ledger
        </button>
        <button 
          onClick={() => setActiveTab('config')} 
          className={`tab-btn ${activeTab === 'config' ? 'active' : ''}`}
          style={{
            padding: '8px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'config' ? '3px solid #9d2706' : '3px solid transparent',
            color: activeTab === 'config' ? '#9d2706' : '#6B7280',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          Campaign Configuration
        </button>
        <button 
          onClick={() => setActiveTab('audit')} 
          className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          style={{
            padding: '8px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'audit' ? '3px solid #9d2706' : '3px solid transparent',
            color: activeTab === 'audit' ? '#9d2706' : '#6B7280',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          Fraud & Security Logs
        </button>
      </div>

      {/* TAB 1: LEDGER */}
      {activeTab === 'ledger' && (
        <div>
          {/* Filtering controls */}
          <form className="admin-search-bar" onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input 
                type="text" 
                placeholder="Search referee email, name, or order number..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                style={{ paddingLeft: 38, width: '100%', height: '40px', border: '1px solid #D1D5DB', borderRadius: 4 }}
              />
            </div>
            
            <select 
              value={statusFilter} 
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }} 
              style={{ height: '40px', padding: '0 12px', border: '1px solid #D1D5DB', borderRadius: 4, background: '#fff' }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending Purchase</option>
              <option value="held">Held (Flagged/Cool-off)</option>
              <option value="completed">Completed (Credited)</option>
              <option value="voided">Voided</option>
            </select>

            <select 
              value={flagFilter} 
              onChange={e => { setFlagFilter(e.target.value); setPage(1); }} 
              style={{ height: '40px', padding: '0 12px', border: '1px solid #D1D5DB', borderRadius: 4, background: '#fff' }}
            >
              <option value="">All Referrals</option>
              <option value="flagged">Flagged Alert</option>
              <option value="clean">Clean</option>
            </select>

            <button type="submit" className="admin-btn-primary" style={{ height: '40px', padding: '0 20px' }}>Filter</button>
          </form>

          {loading ? <div className="admin-loading" style={{ padding: 40, textAlign: 'center' }}>Loading ledger data...</div> : (
            <div className="admin-table-wrapper" style={{ overflowX: 'auto', background: '#fff', borderRadius: 6, border: '1px solid #E5E7EB' }}>
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    <th style={{ padding: 14 }}>Referee (Invited)</th>
                    <th style={{ padding: 14 }}>Referrer (Inviter)</th>
                    <th style={{ padding: 14 }}>Purchase / Order</th>
                    <th style={{ padding: 14 }}>Reward Value</th>
                    <th style={{ padding: 14 }}>Status</th>
                    <th style={{ padding: 14 }}>Fraud Flags</th>
                    <th style={{ padding: 14 }}>Date Created</th>
                    <th style={{ padding: 14 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#6B7280' }}>
                        No referral records found matching filter constraints.
                      </td>
                    </tr>
                  ) : ledger.map(r => (
                    <tr 
                      key={r.id} 
                      style={{ 
                        borderBottom: '1px solid #F3F4F6',
                        background: r.is_flagged ? '#FEF2F2' : 'inherit'
                      }}
                    >
                      <td style={{ padding: 14 }}>
                        <div style={{ fontWeight: 600 }}>{r.referee_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{r.referee_email}</div>
                        <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>IP: {r.referee_ip || '-'}</div>
                      </td>
                      <td style={{ padding: 14 }}>
                        <div style={{ fontWeight: 600 }}>{r.referrer_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{r.referrer_email}</div>
                        <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>IP: {r.referrer_ip || '-'}</div>
                      </td>
                      <td style={{ padding: 14 }}>
                        {r.order_number ? (
                          <div>
                            <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{r.order_number}</span>
                          </div>
                        ) : (
                          <span style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>No Purchase Yet</span>
                        )}
                        {r.eligible_at && r.status === 'held' && (
                          <div style={{ fontSize: '0.7rem', color: '#B45309', marginTop: 4 }}>
                            Releases: {new Date(r.eligible_at).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: 14 }}>
                        <strong>₹{(r.reward_amount || 500).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                      </td>
                      <td style={{ padding: 14 }}>
                        <span className={`badge-${r.status}`} style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          background: r.status === 'completed' ? '#D1FAE5' : r.status === 'held' ? '#FEF3C7' : r.status === 'voided' ? '#F3F4F6' : '#DBEAFE',
                          color: r.status === 'completed' ? '#065F46' : r.status === 'held' ? '#92400E' : r.status === 'voided' ? '#374151' : '#1E40AF'
                        }}>
                          {r.status === 'completed' ? 'Completed' : r.status === 'held' ? 'Held' : r.status === 'voided' ? 'Voided' : 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: 14, maxWidth: 220 }}>
                        {r.is_flagged ? (
                          <div style={{ color: '#DC2626', display: 'flex', gap: 4, alignItems: 'flex-start', fontSize: '0.72rem' }}>
                            <ShieldAlert size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                            <div>{r.flag_reasons?.join(', ')}</div>
                          </div>
                        ) : (
                          <span style={{ color: '#10B981', fontSize: '0.75rem' }}>Passed</span>
                        )}
                      </td>
                      <td style={{ padding: 14, fontSize: '0.8rem', color: '#4B5563' }}>
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td style={{ padding: 14 }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {(r.status === 'pending' || r.status === 'held') && (
                            <button 
                              onClick={() => handleApprove(r.id)} 
                              title="Approve & Credit Reward"
                              style={{ padding: '6px', border: '1px solid #10B981', color: '#10B981', background: '#F0FDF4', borderRadius: 4, cursor: 'pointer' }}
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                          {r.status !== 'voided' && (
                            <button 
                              onClick={() => handleVoid(r.id)} 
                              title="Void Reward"
                              style={{ padding: '6px', border: '1px solid #EF4444', color: '#EF4444', background: '#FEF2F2', borderRadius: 4, cursor: 'pointer' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                          
                          <button 
                            onClick={() => openAdjustWalletModal(r.referrer_id, r.referrer_name || 'Referrer', r.referrer_email)}
                            title="Adjust Referrer Wallet"
                            style={{ padding: '6px', border: '1px solid #9d2706', color: '#9d2706', background: '#FFFDF5', borderRadius: 4, cursor: 'pointer' }}
                          >
                            <Coins size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Pagination Bar */}
              <div className="pagination-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: '1px solid #E5E7EB', fontSize: 13, color: '#4B5563' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <label>Rows per page:</label>
                  <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }} style={{ padding: '4px 8px', border: '1px solid #D1D5DB', borderRadius: 4 }}>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <div>
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalItems)} of {totalItems} items
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button disabled={page === 1} onClick={() => setPage(page - 1)} style={{ padding: '6px 12px', border: '1px solid #D1D5DB', background: '#fff', borderRadius: 4, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>Previous</button>
                  <button disabled={page === totalPages} onClick={() => setPage(page + 1)} style={{ padding: '6px 12px', border: '1px solid #D1D5DB', background: '#fff', borderRadius: 4, cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}>Next</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CAMPAIGN CONFIGURATION */}
      {activeTab === 'config' && (
        <div className="admin-card" style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 28, maxWidth: 640 }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={20} style={{ color: '#9d2706' }} />
            Rules & Campaigns Settings
          </h3>
          
          <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Referee Welcome Credit (₹)
                </label>
                <input 
                  type="number" 
                  value={config.welcome_credit} 
                  onChange={e => setConfig({ ...config, welcome_credit: parseFloat(e.target.value) })}
                  required 
                  style={{ width: '100%', height: '40px', border: '1px solid #D1D5DB', borderRadius: 4, padding: '0 12px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Referrer Reward Credit (₹)
                </label>
                <input 
                  type="number" 
                  value={config.referral_reward} 
                  onChange={e => setConfig({ ...config, referral_reward: parseFloat(e.target.value) })}
                  required 
                  style={{ width: '100%', height: '40px', border: '1px solid #D1D5DB', borderRadius: 4, padding: '0 12px' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Referee Minimum Purchase (₹)
                </label>
                <input 
                  type="number" 
                  value={config.min_purchase_amount} 
                  onChange={e => setConfig({ ...config, min_purchase_amount: parseFloat(e.target.value) })}
                  required 
                  style={{ width: '100%', height: '40px', border: '1px solid #D1D5DB', borderRadius: 4, padding: '0 12px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Hold Period / Cool-off (Days)
                </label>
                <input 
                  type="number" 
                  value={config.hold_days} 
                  onChange={e => setConfig({ ...config, hold_days: parseInt(e.target.value) })}
                  required 
                  style={{ width: '100%', height: '40px', border: '1px solid #D1D5DB', borderRadius: 4, padding: '0 12px' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Max Wallet Discount on Shoes (₹)
                </label>
                <input 
                  type="number" 
                  value={config.max_wallet_shoes_amount} 
                  onChange={e => setConfig({ ...config, max_wallet_shoes_amount: parseFloat(e.target.value) })}
                  required 
                  style={{ width: '100%', height: '40px', border: '1px solid #D1D5DB', borderRadius: 4, padding: '0 12px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Max Wallet Discount on Accessories (₹)
                </label>
                <input 
                  type="number" 
                  value={config.max_wallet_accessories_amount} 
                  onChange={e => setConfig({ ...config, max_wallet_accessories_amount: parseFloat(e.target.value) })}
                  required 
                  style={{ width: '100%', height: '40px', border: '1px solid #D1D5DB', borderRadius: 4, padding: '0 12px' }}
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="admin-btn-primary" style={{ padding: '10px 24px' }}>
                Save Configurations
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: FRAUD & SECURITY LOGS */}
      {activeTab === 'audit' && (
        <div className="admin-card" style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 28 }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={20} style={{ color: '#9d2706' }} />
            Referrals Audit Trail & Security Logs
          </h3>

          <div className="timeline" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {auditLogs.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#6B7280' }}>
                No audit log entries available yet.
              </div>
            ) : auditLogs.map(log => (
              <div 
                key={log.id} 
                style={{ 
                  display: 'flex', 
                  gap: 16, 
                  padding: '16px 20px', 
                  borderRadius: 4,
                  borderLeft: log.action === 'flagged_fraud' ? '4px solid #DC2626' : '4px solid #9d2706',
                  background: log.action === 'flagged_fraud' ? '#FEF2F2' : '#F9FAFB'
                }}
              >
                {log.action === 'flagged_fraud' ? (
                  <AlertTriangle size={24} style={{ color: '#DC2626', flexShrink: 0 }} />
                ) : (
                  <FileText size={24} style={{ color: '#9d2706', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <strong style={{ fontSize: '0.9rem', color: '#111827' }}>
                      {log.action.replace('_', ' ').toUpperCase()}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#4B5563', margin: 0 }}>
                    {log.details}
                  </p>
                  <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: '0.72rem', color: '#9CA3AF' }}>
                    <span>Actor: <strong>{log.actor}</strong></span>
                    {log.referrer_email && <span>Referrer: {log.referrer_email}</span>}
                    {log.referee_email && <span>Referee: {log.referee_email}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QUICK WALLET ADJUSTMENT MODAL */}
      {showAdjustModal && selectedUser && (
        <div className="admin-modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => setShowAdjustModal(false)}>
          <div className="admin-modal" style={{
            background: '#fff', borderRadius: 6, width: '480px', padding: 28, position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            <button 
              className="admin-modal-close" 
              onClick={() => setShowAdjustModal(false)}
              style={{ position: 'absolute', right: 16, top: 16, border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.4rem' }}
            >
              <X size={20} />
            </button>
            
            <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: '1.2rem' }}>Adjust Wallet Balance</h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#6B7280' }}>
              Adjusting wallet for: <strong>{selectedUser.name}</strong> ({selectedUser.email})
            </p>

            <form onSubmit={handleWalletAdjustment} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Adjustment Amount (₹)
                </label>
                <input 
                  type="number" 
                  placeholder="e.g. 500 for credit, -500 for debit"
                  value={adjustAmount} 
                  onChange={e => setAdjustAmount(e.target.value)}
                  required 
                  style={{ width: '100%', height: '40px', border: '1px solid #D1D5DB', borderRadius: 4, padding: '0 12px' }}
                />
                <span style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: 4, display: 'block' }}>
                  Use positive numbers to add money, negative numbers to subtract money.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Reason for Adjustment
                </label>
                <textarea 
                  placeholder="Reason (required for audit logs)..."
                  value={adjustReason} 
                  onChange={e => setAdjustReason(e.target.value)}
                  required 
                  rows={3}
                  style={{ width: '100%', border: '1px solid #D1D5DB', borderRadius: 4, padding: '10px 12px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifySelf: 'flex-end', gap: 12, marginTop: 12 }}>
                <button 
                  type="button" 
                  onClick={() => setShowAdjustModal(false)}
                  style={{ padding: '10px 20px', border: '1px solid #D1D5DB', background: '#fff', borderRadius: 4, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="admin-btn-primary"
                  style={{ padding: '10px 20px' }}
                >
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReferrals;
