"use client";
import React, { useState, useEffect } from 'react';
import { Package, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { api } from '../../api';

const STATUS_COLORS = { pending: '#F59E0B', approved: '#2563EB', rejected: '#EF4444', completed: '#10B981' };

const AdminReturns = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetch = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const d = await api.listReturns(params);
      setItems(d.items || []);
    } catch (e) {}
    setLoading(false);
  };
  useEffect(() => { fetch(); }, [filter]);

  const updateStatus = async (id, status) => {
    let refund_amount = null;
    if (status === 'approved' || status === 'completed') {
      const v = window.prompt('Refund amount (₹)? (leave empty for none)', '0');
      if (v && !isNaN(parseFloat(v))) refund_amount = parseFloat(v);
    }
    const notes = window.prompt('Admin notes (optional)', '') || null;
    try {
      await api.updateReturnStatus(id, { status, refund_amount, admin_notes: notes });
      fetch();
    } catch (e) { alert(e.message); }
  };

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const safePage = page > totalPages ? totalPages : page;
  const paginatedItems = items.slice((safePage - 1) * limit, safePage * limit);

  if (loading) return <div className="admin-loading">Loading…</div>;
  return (
    <div className="admin-page" data-testid="admin-returns-page">
      <div className="admin-page-header">
        <div><h1>Returns & Exchanges</h1><p>Customer return / exchange requests</p></div>
        <button className="admin-btn-primary" onClick={fetch}><RefreshCw size={14} /> Refresh</button>
      </div>
      <div className="admin-filters" style={{ marginBottom: 16 }}>
        {['all', 'pending', 'approved', 'rejected', 'completed'].map(s => (
          <button key={s} onClick={() => { setFilter(s); setPage(1); }} className={`admin-filter-btn ${filter === s ? 'active' : ''}`} data-testid={`returns-filter-${s}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      {items.length === 0 ? <div className="admin-empty">No requests {filter !== 'all' ? 'in this status' : 'yet'}</div> : (
        <div className="admin-table-wrapper">
          <table className="admin-table" data-testid="admin-returns-table">
            <thead><tr><th>Customer</th><th>Type</th><th>Order/Product</th><th>Reason</th><th>Refund</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {paginatedItems.map(r => (
                <tr key={r.id} data-testid={`return-row-${r.id}`}>
                  <td><strong>{r.user_name}</strong><div style={{ fontSize: 11, color: '#6B7280' }}>{new Date(r.created_at).toLocaleDateString()}</div></td>
                  <td><span style={{ fontWeight: 500 }}>{r.type}</span>{r.type === 'exchange' && r.exchange_size && <div style={{ fontSize: 11, color: '#6B7280' }}>Exchange to size {r.exchange_size}</div>}</td>
                  <td style={{ fontSize: 12 }}><div>Order: <code>{r.order_id?.slice(-6)}</code></div><div>Product: <code>{r.product_id?.slice(-6)}</code></div>{r.size && <div>Size: {r.size}</div>}</td>
                  <td style={{ maxWidth: 280, fontSize: 13 }}>{r.reason}</td>
                  <td>{r.refund_amount ? `\u20B9${r.refund_amount}` : '-'}</td>
                  <td><span className="status-badge" style={{ backgroundColor: STATUS_COLORS[r.status] + '15', color: STATUS_COLORS[r.status] }}>{r.status}</span></td>
                  <td>
                    {r.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => updateStatus(r.id, 'approved')} title="Approve" data-testid={`approve-${r.id}`}><CheckCircle size={14} color="#10B981" /></button>
                        <button onClick={() => updateStatus(r.id, 'rejected')} title="Reject" data-testid={`reject-${r.id}`}><XCircle size={14} color="#EF4444" /></button>
                      </div>
                    )}
                    {r.status === 'approved' && (
                      <button onClick={() => updateStatus(r.id, 'completed')} title="Mark completed" data-testid={`complete-${r.id}`}><CheckCircle size={14} color="#10B981" /> Done</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: '1px solid #E5E7EB', fontSize: 13, color: '#4B5563' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label>Rows per page:</label>
              <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }} style={{ padding: '4px 8px', border: '1px solid #D1D5DB', borderRadius: 4, background: '#fff' }}>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div>
              Showing {(safePage - 1) * limit + 1} to {Math.min(safePage * limit, totalItems)} of {totalItems} items
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button disabled={safePage === 1} onClick={() => setPage(safePage - 1)} style={{ padding: '6px 12px', border: '1px solid #D1D5DB', background: '#fff', borderRadius: 4, cursor: safePage === 1 ? 'not-allowed' : 'pointer', opacity: safePage === 1 ? 0.5 : 1 }}>Previous</button>
              <button disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)} style={{ padding: '6px 12px', border: '1px solid #D1D5DB', background: '#fff', borderRadius: 4, cursor: safePage === totalPages ? 'not-allowed' : 'pointer', opacity: safePage === totalPages ? 0.5 : 1 }}>Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminReturns;
