"use client";
import React, { useState, useEffect } from 'react';
import { Calendar, Phone, Mail, MapPin, Trash2, RefreshCw, CheckCircle, Clock, X, UserCheck } from 'lucide-react';
import { api } from '../../api';

const STATUSES = [
  { v: 'all', l: 'All', color: '#6B7280' },
  { v: 'pending', l: 'Pending', color: '#F59E0B' },
  { v: 'confirmed', l: 'Confirmed', color: '#2563EB' },
  { v: 'visited', l: 'Visited', color: '#10B981' },
  { v: 'rescheduled', l: 'Rescheduled', color: '#7C3AED' },
  { v: 'cancelled', l: 'Cancelled', color: '#EF4444' },
];

const StatusBadge = ({ status }) => {
  const cfg = STATUSES.find(s => s.v === status) || STATUSES[1];
  const Icon = status === 'visited' ? CheckCircle : status === 'cancelled' ? X : status === 'confirmed' ? UserCheck : status === 'rescheduled' ? RefreshCw : Clock;
  return (
    <span className="status-badge" style={{ backgroundColor: cfg.color + '15', color: cfg.color, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <Icon size={12} /> {cfg.l}
    </span>
  );
};

const AdminVisits = () => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const data = await api.listVisits(params);
      setVisits(data.items || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchVisits(); }, [statusFilter]);

  const handleStatusChange = async (visit, newStatus) => {
    setUpdatingId(visit.id);
    try {
      await api.updateVisitStatus(visit.id, newStatus);
      fetchVisits();
    } catch (err) { alert('Update failed: ' + err.message); }
    setUpdatingId(null);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.deleteVisit(deleteConfirm.id);
      setDeleteConfirm(null);
      fetchVisits();
    } catch (err) { alert('Delete failed: ' + err.message); }
  };

  const counts = STATUSES.reduce((acc, s) => {
    acc[s.v] = s.v === 'all' ? visits.length : visits.filter(v => v.status === s.v).length;
    return acc;
  }, {});

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const totalItems = visits.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const safePage = page > totalPages ? totalPages : page;
  const paginatedVisits = visits.slice((safePage - 1) * limit, safePage * limit);

  return (
    <div className="admin-page" data-testid="admin-visits-page">
      <div className="admin-page-header">
        <div><h1>Schedule-a-Visit Leads</h1><p>Customer requests for in-person visits</p></div>
        <button className="admin-btn-primary" onClick={fetchVisits} data-testid="refresh-visits-btn">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="inv-controls">
        <div className="admin-filters">
          {STATUSES.map(s => (
            <button key={s.v}
              className={`admin-filter-btn ${statusFilter === s.v ? 'active' : ''}`}
              onClick={() => { setStatusFilter(s.v); setPage(1); }}
              data-testid={`visits-filter-${s.v}`}>
              {s.l} {statusFilter === 'all' && counts[s.v] > 0 ? `(${counts[s.v]})` : ''}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="admin-loading">Loading visits...</div> :
        visits.length === 0 ? <div className="admin-empty">No visit requests {statusFilter !== 'all' ? `with status "${statusFilter}"` : 'yet'}</div> : (
          <div className="admin-table-wrapper">
            <table className="admin-table" data-testid="admin-visits-table">
              <thead>
                <tr>
                  <th>Customer</th><th>Contact</th><th>Visit Date</th>
                  <th>Style / Material</th><th>For</th><th>PIN</th>
                  <th>Status</th><th>Reschedule</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedVisits.map(v => (
                  <tr key={v.id} data-testid={`visit-row-${v.id}`}>
                    <td>
                      <strong>{v.first_name} {v.last_name}</strong>
                      <div style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }}>
                        {new Date(v.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                        <Phone size={11} color="#6B7280" /> {v.contact_number}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Mail size={11} color="#6B7280" /> <a href={`mailto:${v.email}`} style={{ color: '#2563EB' }}>{v.email}</a>
                      </div>
                    </td>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} color="#6B7280" /><strong>{v.visit_date}</strong></div></td>
                    <td>
                      <div><strong>{v.style}</strong></div>
                      <div style={{ color: '#6B7280', fontSize: 12 }}>{v.material} · {v.material_type}</div>
                    </td>
                    <td className="inv-gender">{v.visit_for}</td>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} color="#6B7280" />{v.pin_code}</div></td>
                    <td><StatusBadge status={v.status} /></td>
                    <td style={{ fontSize: 11, color: '#6B7280' }}>
                      {v.rescheduled_from && <div>From: {v.original_visit_date}</div>}
                      {v.rescheduled_to && <div>New: {v.rescheduled_date}</div>}
                      {!v.rescheduled_from && !v.rescheduled_to && <span>—</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <select value={v.status}
                          onChange={(e) => handleStatusChange(v, e.target.value)}
                          disabled={updatingId === v.id}
                          data-testid={`visit-status-select-${v.id}`}
                          style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 4 }}>
                          {STATUSES.filter(s => s.v !== 'all').map(s => (
                            <option key={s.v} value={s.v}>{s.l}</option>
                          ))}
                        </select>
                        <button onClick={() => setDeleteConfirm(v)} title="Delete" data-testid={`visit-delete-${v.id}`}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                          <Trash2 size={14} color="#EF4444" />
                        </button>
                      </div>
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

      {deleteConfirm && (
        <div className="admin-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <button className="admin-modal-close" onClick={() => setDeleteConfirm(null)}><X size={18} /></button>
            <h3>Delete Visit Request?</h3>
            <p style={{ marginTop: 8, marginBottom: 24 }}>
              Are you sure you want to delete the visit request from <strong>{deleteConfirm.first_name} {deleteConfirm.last_name}</strong>?
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setDeleteConfirm(null)} className="admin-btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleDelete} className="admin-btn-primary" data-testid="confirm-delete-visit"
                style={{ flex: 1, background: '#EF4444' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVisits;
