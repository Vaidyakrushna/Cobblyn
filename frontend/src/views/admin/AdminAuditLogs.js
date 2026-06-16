"use client";
import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Shield, Search, Eye, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtering & Pagination
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Selected Log for details modal
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const skip = (page - 1) * limit;
      let params = `?limit=${limit}&skip=${skip}`;
      if (search) params += `&search=${encodeURIComponent(search)}`;
      if (actionFilter) params += `&action=${encodeURIComponent(actionFilter)}`;

      const data = await api.getAuditLogs(params);
      setLogs(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch security audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const getActionBadgeColor = (action) => {
    const maps = {
      override_customer_tier: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', label: 'Tier Override' },
      update_user_role: { bg: 'rgba(139, 92, 246, 0.1)', text: '#8b5cf6', label: 'Role Upgrade' },
      update_user_block_status: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', label: 'User Lockout' },
      update_raw_material: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', label: 'MRP Adjustment' },
      receive_raw_material_shipment: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', label: 'Material Intake' },
      log_vendor_payment: { bg: 'rgba(6, 182, 212, 0.1)', text: '#06b6d4', label: 'Vendor Payout' },
      update_order_operational: { bg: 'rgba(236, 72, 153, 0.1)', text: '#ec4899', label: 'Logistics Update' }
    };
    return maps[action] || { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280', label: action };
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    const date = new Date(isoStr);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  // Quick stats calculations
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="admin-page" data-testid="admin-audit-logs">
      {/* Page Header */}
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 600, color: 'var(--text-primary, #111827)' }}>Security Audit Trail</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary, #6B7280)', marginTop: 4 }}>
            Immutable administrative operation logs and compliance statement ledger events.
          </p>
        </div>
        <button 
          onClick={fetchLogs} 
          className="admin-btn btn-secondary" 
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="admin-stat-card" style={{ padding: 20, backgroundColor: '#ffffff', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E5E7EB' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Total Audit Entries</span>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 0 0', color: '#111827' }}>{total}</h3>
        </div>
        <div className="admin-stat-card" style={{ padding: 20, backgroundColor: '#ffffff', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E5E7EB' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Scope Status</span>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '12px 0 0 0', color: '#10B981', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shield size={18} />
            <span>Active & Guarded</span>
          </h3>
        </div>
        <div className="admin-stat-card" style={{ padding: 20, backgroundColor: '#ffffff', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E5E7EB' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Sanitization Engine</span>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '12px 0 0 0', color: '#3B82F6' }}>
            Stored XSS Filter
          </h3>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-filter-bar" style={{ backgroundColor: '#ffffff', padding: 16, borderRadius: 10, border: '1px solid #E5E7EB', marginBottom: 20 }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              type="text"
              placeholder="Search by Actor Email, Action, or Target..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: 6,
                border: '1px solid #D1D5DB',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={16} style={{ color: '#6B7280' }} />
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              style={{
                padding: '9px 12px',
                borderRadius: 6,
                border: '1px solid #D1D5DB',
                backgroundColor: '#ffffff',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            >
              <option value="">All Administrative Action Types</option>
              <option value="override_customer_tier">override_customer_tier (Tier Override)</option>
              <option value="update_user_role">update_user_role (Role Upgrade)</option>
              <option value="update_user_block_status">update_user_block_status (User Lockout)</option>
              <option value="receive_raw_material_shipment">receive_raw_material_shipment (Material Intake)</option>
              <option value="update_raw_material">update_raw_material (MRP Adjustment)</option>
              <option value="log_vendor_payment">log_vendor_payment (Vendor Payout)</option>
              <option value="update_order_operational">update_order_operational (Logistics Update)</option>
            </select>
          </div>

          <button type="submit" className="admin-btn btn-primary" style={{ padding: '9px 18px', fontSize: '0.875rem' }}>
            Apply Filter
          </button>
        </form>
      </div>

      {/* Main Table */}
      <div className="admin-table-container" style={{ backgroundColor: '#ffffff', borderRadius: 10, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#6B7280' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
            <span>Retrieving administrative records...</span>
          </div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#EF4444', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={32} />
            <span>{error}</span>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#6B7280' }}>
            <Shield size={32} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
            <p>No audit trail events matched your query.</p>
          </div>
        ) : (
          <>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#374151' }}>Timestamp</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#374151' }}>Action Type</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#374151' }}>Actor (Email)</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#374151' }}>Target ID</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#374151', textAlign: 'right' }}>Payload</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => {
                  const badge = getActionBadgeColor(log.action);
                  return (
                    <tr key={log.id || index} style={{ borderBottom: '1px solid #F3F4F6', transition: 'background 0.15s ease' }} className="hover-row">
                      <td style={{ padding: '14px 16px', color: '#4B5563', whiteSpace: 'nowrap' }}>
                        {formatDate(log.timestamp)}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: 9999,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: badge.bg,
                          color: badge.text
                        }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#111827', fontWeight: 500 }}>
                        {log.actor_email || 'System'}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#6B7280', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {log.target || 'N/A'}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="admin-btn btn-secondary"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 12px',
                            fontSize: '0.75rem',
                            borderRadius: 6
                          }}
                        >
                          <Eye size={12} />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderTop: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}>
              <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                Showing page {page} of {totalPages} ({total} entries total)
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="admin-btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 12px', fontSize: '0.75rem', opacity: page === 1 ? 0.5 : 1 }}
                >
                  <ChevronLeft size={14} />
                  <span>Prev</span>
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="admin-btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 12px', fontSize: '0.75rem', opacity: page === totalPages ? 0.5 : 1 }}
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Inspector Modal Overlay */}
      {selectedLog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 12,
            width: '100%',
            maxWidth: 620,
            maxHeight: '85vh',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #E5E7EB'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#F9FAFB'
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={18} style={{ color: '#3B82F6' }} />
                <span>Audit Log Inspector</span>
              </h3>
              <span style={{
                fontSize: '0.75rem',
                color: '#6B7280',
                fontFamily: 'monospace'
              }}>
                ID: {selectedLog.id}
              </span>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Event Summary Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.85rem' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase' }}>Timestamp</span>
                  <span style={{ color: '#111827', fontWeight: 500 }}>{formatDate(selectedLog.timestamp)}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase' }}>Action Category</span>
                  <span style={{ color: '#111827', fontWeight: 500, fontFamily: 'monospace' }}>{selectedLog.action}</span>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase' }}>Actor (Email)</span>
                  <span style={{ color: '#111827', fontWeight: 500 }}>{selectedLog.actor_email || 'System Operation'}</span>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase' }}>Target Entity ID</span>
                  <span style={{ color: '#111827', fontWeight: 500, fontFamily: 'monospace' }}>{selectedLog.target || 'N/A'}</span>
                </div>
              </div>

              {/* JSON Payload Explorer */}
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 6 }}>Payload Details</span>
                <pre style={{
                  backgroundColor: '#1E293B',
                  color: '#38BDF8',
                  padding: 16,
                  borderRadius: 8,
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                  overflowX: 'auto',
                  maxHeight: 280,
                  whiteSpace: 'pre-wrap',
                  margin: 0
                }}>
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#F9FAFB' }}>
              <button
                onClick={() => setSelectedLog(null)}
                className="admin-btn btn-primary"
                style={{ padding: '8px 24px', fontSize: '0.875rem' }}
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogs;
