"use client";
import React, { useState, useEffect } from 'react';
import { 
  Calendar, Phone, Mail, MapPin, Trash2, RefreshCw, 
  CheckCircle, Clock, X, UserCheck, Plus, Minus, 
  Settings, Globe, Map, AlertCircle, Sparkles, LayoutDashboard
} from 'lucide-react';
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
  // Navigation Tabs State
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'pincodes'

  // Visits State
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // Pincodes State
  const [pincodes, setPincodes] = useState([]);
  const [pincodesLoading, setPincodesLoading] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newCapacity, setNewCapacity] = useState(3);
  const [pincodeError, setPincodeError] = useState('');
  const [deletePinConfirm, setDeletePinConfirm] = useState(null);
  const [pincodeActionLoading, setPincodeActionLoading] = useState(false);

  // Fetch Visits
  const fetchVisits = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const data = await api.listVisits(params);
      setVisits(data.items || []);
    } catch (err) { 
      console.error(err); 
    } finally {
      setLoading(false);
    }
  };

  // Fetch Pincodes settings
  const fetchPincodes = async () => {
    setPincodesLoading(true);
    try {
      const data = await api.getPincodesSettings();
      setPincodes(data.pincodes || []);
    } catch (err) {
      console.error('Failed to load serviceable pincodes:', err);
    } finally {
      setPincodesLoading(false);
    }
  };

  useEffect(() => { 
    if (activeTab === 'requests') {
      fetchVisits(); 
    } else {
      fetchPincodes();
    }
  }, [statusFilter, activeTab]);

  const handleStatusChange = async (visit, newStatus) => {
    setUpdatingId(visit.id);
    try {
      await api.updateVisitStatus(visit.id, newStatus);
      fetchVisits();
    } catch (err) { 
      alert('Update failed: ' + err.message); 
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.deleteVisit(deleteConfirm.id);
      setDeleteConfirm(null);
      fetchVisits();
    } catch (err) { 
      alert('Delete failed: ' + err.message); 
    }
  };

  // Dynamic capacity steppers adjustment
  const handleCapacityStep = async (pin, currentCap, step) => {
    const nextCap = currentCap + step;
    if (nextCap < 1 || nextCap > 50) return;
    
    // Optimistic local state update
    setPincodes(prev => prev.map(p => p.pin_code === pin ? { ...p, capacity: nextCap } : p));
    
    try {
      await api.updatePincodeSettings(pin, { capacity: nextCap });
    } catch (err) {
      console.error('Capacity update failed:', err);
      // Revert on error
      fetchPincodes();
    }
  };

  // Toggle active service zone status
  const handleToggleActive = async (pin, currentActive) => {
    const nextActive = !currentActive;
    
    // Optimistic local state update
    setPincodes(prev => prev.map(p => p.pin_code === pin ? { ...p, active: nextActive } : p));
    
    try {
      await api.updatePincodeSettings(pin, { active: nextActive });
    } catch (err) {
      console.error('Status update failed:', err);
      // Revert on error
      fetchPincodes();
    }
  };

  // Add a new Pincode Service Zone
  const handleAddPincode = async (e) => {
    e.preventDefault();
    setPincodeError('');
    const cleanPin = newPin.trim();
    const cleanCity = newCity.trim();

    if (!cleanPin || cleanPin.length < 4) {
      setPincodeError('Please enter a valid pin code.');
      return;
    }
    if (!cleanCity) {
      setPincodeError('Please enter a city or region name.');
      return;
    }

    setPincodeActionLoading(true);
    try {
      await api.addPincodeSettings({
        pin_code: cleanPin,
        city: cleanCity,
        capacity: newCapacity
      });
      setNewPin('');
      setNewCity('');
      setNewCapacity(3);
      fetchPincodes();
    } catch (err) {
      setPincodeError(err.message || 'Failed to register pin code.');
    } finally {
      setPincodeActionLoading(false);
    }
  };

  // Delete Pincode Service Zone
  const handleDeletePincode = async () => {
    if (!deletePinConfirm) return;
    setPincodeActionLoading(true);
    try {
      await api.deletePincodeSettings(deletePinConfirm.pin_code);
      setDeletePinConfirm(null);
      fetchPincodes();
    } catch (err) {
      alert('Failed to remove pin code: ' + err.message);
    } finally {
      setPincodeActionLoading(false);
    }
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

  // Statistics calculation for Pincodes Hub
  const activeZonesCount = pincodes.filter(p => p.active).length;
  const totalFulfillmentCapacity = pincodes.filter(p => p.active).reduce((sum, p) => sum + p.capacity, 0);
  const uniqueCitiesCount = new Set(pincodes.map(p => p.city.split('(')[0].trim())).size;

  return (
    <div className="admin-page" data-testid="admin-visits-page" style={{ padding: '24px 32px' }}>

      {/* ── Page Title ── */}
      <div className="admin-page-header" style={{ marginBottom: '0' }}>
        <div>
          <span style={{ fontSize: '0.62rem', color: '#9d2706', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>ATELIER SERVICE PLANNER</span>
          <h1 style={{ margin: '4px 0 0 0', fontFamily: 'Montserrat, sans-serif', fontSize: '1.6rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={26} color="#9d2706" /> Schedule-a-Visit Hub
          </h1>
        </div>
      </div>

      {/* ── Sub-Tab Navigation Strip ── */}
      <div style={{
        display: 'flex',
        gap: '0',
        borderBottom: '2px solid #e7e5e4',
        marginTop: '20px',
        marginBottom: '24px',
      }}>
        {[
          { key: 'requests',  icon: <LayoutDashboard size={14} />, label: 'Lead Requests' },
          { key: 'pincodes',  icon: <Globe size={14} />,           label: 'Service Zones' },
          { key: 'capacity',  icon: <Settings size={14} />,        label: 'Daily Capacity' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            data-testid={`visits-tab-${tab.key}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '10px 20px',
              fontSize: '0.78rem',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #9d2706' : '2px solid transparent',
              marginBottom: '-2px',
              color: activeTab === tab.key ? '#9d2706' : '#6B7280',
              cursor: 'pointer',
              transition: 'color 0.18s',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>


      {activeTab === 'requests' && (
        <>
          {/* ── Controls Row ── */}
          <div className="inv-controls" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div className="admin-filters" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {STATUSES.map(s => (
                <button key={s.v}
                  className={`admin-filter-btn ${statusFilter === s.v ? 'active' : ''}`}
                  onClick={() => { setStatusFilter(s.v); setPage(1); }}
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.73rem',
                    borderRadius: '9999px',
                    border: `1px solid ${statusFilter === s.v ? '#111' : '#e5e7eb'}`,
                    background: statusFilter === s.v ? '#111' : '#fff',
                    color: statusFilter === s.v ? '#fff' : '#4b5563',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.18s',
                    whiteSpace: 'nowrap',
                  }}
                  data-testid={`visits-filter-${s.v}`}>
                  {s.l}{counts[s.v] > 0 ? ` (${counts[s.v]})` : ''}
                </button>
              ))}
            </div>
            <button
              onClick={fetchVisits}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '8px 18px',
                fontSize: '0.78rem',
                fontWeight: 600,
                background: '#111',
                color: '#fff',
                border: 'none',
                borderRadius: '7px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh Leads
            </button>
          </div>

          {/* ── Visits Table ── */}
          {loading ? (
            <div className="admin-loading" style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
              Loading visits…
            </div>
          ) : visits.length === 0 ? (
            <div className="admin-empty" style={{
              padding: '48px', textAlign: 'center',
              color: '#9ca3af', fontSize: '0.85rem',
              border: '1px dashed #d1d5db', borderRadius: '10px',
            }}>
              No visit requests{statusFilter !== 'all' ? ` with status "${statusFilter}"` : ' yet'}.
            </div>
          ) : (
            <div style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              overflow: 'hidden',
            }}>
              {/* Scrollable table container */}
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <table
                  className="admin-table"
                  data-testid="admin-visits-table"
                  style={{
                    width: '100%',
                    minWidth: '960px',
                    borderCollapse: 'collapse',
                    fontSize: '0.8rem',
                    textAlign: 'left',
                  }}
                >
                  <thead>
                    <tr style={{
                      background: '#FAF9F6',
                      borderBottom: '1px solid #e5e7eb',
                    }}>
                      {[
                        { label: 'Customer',           w: '160px' },
                        { label: 'Contact Details',    w: '190px' },
                        { label: 'Visit Date',         w: '120px' },
                        { label: 'Style / Material',   w: '160px' },
                        { label: 'Gender',             w: '80px'  },
                        { label: 'PIN Code',           w: '90px'  },
                        { label: 'Status',             w: '110px' },
                        { label: 'Reschedule',         w: '130px' },
                        { label: 'Actions',            w: '180px', align: 'right' },
                      ].map(col => (
                        <th
                          key={col.label}
                          style={{
                            padding: '12px 14px',
                            fontSize: '0.63rem',
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: '#6B7280',
                            whiteSpace: 'nowrap',
                            minWidth: col.w,
                            textAlign: col.align || 'left',
                          }}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedVisits.map((v, idx) => (
                      <tr
                        key={v.id}
                        data-testid={`visit-row-${v.id}`}
                        style={{
                          borderBottom: '1px solid #f3f4f6',
                          background: idx % 2 === 0 ? '#fff' : '#FAFAF9',
                        }}
                      >
                        {/* Customer */}
                        <td style={{ padding: '13px 14px', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.82rem' }}>{v.first_name} {v.last_name}</div>
                          <div style={{ color: '#9CA3AF', fontSize: '0.68rem', marginTop: 2 }}>Logged: {new Date(v.created_at).toLocaleDateString()}</div>
                        </td>
                        {/* Contact */}
                        <td style={{ padding: '13px 14px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4, fontSize: '0.78rem', color: '#374151' }}>
                            <Phone size={11} color="#9CA3AF" /> {v.contact_number}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem' }}>
                            <Mail size={11} color="#9CA3AF" />
                            <a href={`mailto:${v.email}`} style={{ color: '#2563EB', textDecoration: 'none', fontSize: '0.75rem' }}>{v.email}</a>
                          </div>
                        </td>
                        {/* Visit Date */}
                        <td style={{ padding: '13px 14px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Calendar size={12} color="#9CA3AF" />
                            <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{v.visit_date}</span>
                          </div>
                        </td>
                        {/* Style / Material */}
                        <td style={{ padding: '13px 14px', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#111827' }}>{v.style}</div>
                          <div style={{ color: '#9CA3AF', fontSize: '0.7rem', marginTop: 2 }}>{v.material}{v.material_type ? ` · ${v.material_type}` : ''}</div>
                        </td>
                        {/* Gender */}
                        <td style={{ padding: '13px 14px', verticalAlign: 'middle', textTransform: 'capitalize', fontSize: '0.8rem' }}>{v.visit_for}</td>
                        {/* PIN */}
                        <td style={{ padding: '13px 14px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
                            <MapPin size={11} color="#9CA3AF" />{v.pin_code}
                          </div>
                        </td>
                        {/* Status */}
                        <td style={{ padding: '13px 14px', verticalAlign: 'middle' }}>
                          <StatusBadge status={v.status} />
                        </td>
                        {/* Reschedule */}
                        <td style={{ padding: '13px 14px', verticalAlign: 'middle', fontSize: '0.72rem', color: '#6B7280' }}>
                          {v.rescheduled_from && <div><span style={{ color: '#9CA3AF' }}>From:</span> {v.original_visit_date}</div>}
                          {v.rescheduled_to   && <div><span style={{ color: '#9CA3AF' }}>New:</span>  {v.rescheduled_date}</div>}
                          {!v.rescheduled_from && !v.rescheduled_to && <span style={{ color: '#D1D5DB' }}>—</span>}
                        </td>
                        {/* Actions */}
                        <td style={{ padding: '13px 14px', verticalAlign: 'middle', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <select
                              value={v.status}
                              onChange={(e) => handleStatusChange(v, e.target.value)}
                              disabled={updatingId === v.id}
                              data-testid={`visit-status-select-${v.id}`}
                              style={{
                                padding: '6px 10px',
                                fontSize: '0.73rem',
                                fontWeight: 500,
                                border: '1px solid #E5E7EB',
                                borderRadius: '6px',
                                background: '#FAFAFA',
                                color: '#374151',
                                cursor: 'pointer',
                                height: '32px',
                              }}
                            >
                              {STATUSES.filter(s => s.v !== 'all').map(s => (
                                <option key={s.v} value={s.v}>{s.l}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => setDeleteConfirm(v)}
                              title="Delete visit"
                              data-testid={`visit-delete-${v.id}`}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: '32px', height: '32px',
                                background: '#FFF5F5',
                                border: '1px solid #FECACA',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                flexShrink: 0,
                              }}
                            >
                              <Trash2 size={13} color="#EF4444" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 18px',
                borderTop: '1px solid #F3F4F6',
                fontSize: '0.78rem',
                color: '#6B7280',
                flexWrap: 'wrap',
                gap: '10px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span>Rows per page:</span>
                  <select
                    value={limit}
                    onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
                    style={{ padding: '4px 8px', border: '1px solid #E5E7EB', borderRadius: '5px', background: '#fff', fontSize: '0.78rem' }}
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <span>Showing {(safePage - 1) * limit + 1}–{Math.min(safePage * limit, totalItems)} of {totalItems}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    disabled={safePage === 1}
                    onClick={() => setPage(safePage - 1)}
                    style={{
                      padding: '6px 14px', border: '1px solid #E5E7EB', background: '#fff',
                      borderRadius: '6px', fontSize: '0.78rem', fontWeight: 500,
                      cursor: safePage === 1 ? 'not-allowed' : 'pointer',
                      opacity: safePage === 1 ? 0.45 : 1,
                    }}
                  >← Prev</button>
                  <button
                    disabled={safePage === totalPages}
                    onClick={() => setPage(safePage + 1)}
                    style={{
                      padding: '6px 14px', border: '1px solid #E5E7EB', background: '#fff',
                      borderRadius: '6px', fontSize: '0.78rem', fontWeight: 500,
                      cursor: safePage === totalPages ? 'not-allowed' : 'pointer',
                      opacity: safePage === totalPages ? 0.45 : 1,
                    }}
                  >Next →</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'pincodes' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
          {/* Left Grid: Serviced Pincodes */}
          <div>
            {/* Visual Analytics / Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#FAF9F6', border: '1px solid #e7e5e4', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(157, 39, 6, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Globe size={18} color="#9d2706" />
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Active Zones</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#111827', fontFamily: 'Montserrat, sans-serif' }}>{activeZonesCount} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#6b7280' }}>/ {pincodes.length} regions</span></div>
                </div>
              </div>

              <div style={{ background: '#FAF9F6', border: '1px solid #e7e5e4', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(157, 39, 6, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Map size={18} color="#9d2706" />
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Coverage Cities</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#111827', fontFamily: 'Montserrat, sans-serif' }}>{uniqueCitiesCount} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#6b7280' }}>metro hubs</span></div>
                </div>
              </div>
            </div>

            {/* Pincodes Registry Grid */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAF9F6' }}>
                <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#9d2706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🌐 Service Zones Registry</h3>
                <button 
                  onClick={fetchPincodes}
                  disabled={pincodesLoading}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#4b5563', fontWeight: 600 }}
                >
                  <RefreshCw size={12} className={pincodesLoading ? 'animate-spin' : ''} /> Reload
                </button>
              </div>

              {pincodesLoading && pincodes.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading serviceable regions...</div>
              ) : pincodes.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>No serviceable pin codes registered in database. Use the right form to register one.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: '#FAF9F6', borderBottom: '1px solid #e5e7eb', color: '#4b5563', fontWeight: 600 }}>
                      <th style={{ padding: '14px 16px' }}>PIN Code</th>
                      <th style={{ padding: '14px 16px' }}>Region / City</th>
                      <th style={{ padding: '14px 16px' }}>Service Coverage</th>
                      <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pincodes.map(p => (
                      <tr key={p.pin_code} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.2s' }}>
                        <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>
                          {p.pin_code}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                          {p.city}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <button
                            onClick={() => handleToggleActive(p.pin_code, p.active)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '9999px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: 'none',
                              transition: 'all 0.2s',
                              backgroundColor: p.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                              color: p.active ? '#059669' : '#d97706',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.active ? '#10B981' : '#F59E0B', display: 'inline-block', boxShadow: p.active ? '0 0 8px #10B981' : 'none' }} />
                            {p.active ? 'Active (Live)' : 'Paused (Locked)'}
                          </button>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <button
                            onClick={() => setDeletePinConfirm(p)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                            title="Delete Pincode"
                          >
                            <Trash2 size={14} color="#EF4444" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right Panel: Add New Region Registration Form */}
          <div style={{ background: '#FAF9F6', border: '1px solid #9d2706', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '0.8rem', fontWeight: 700, color: '#9d2706', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> Add Service Zone
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.68rem', color: '#6b7280', lineHeight: 1.4 }}>
              Register new postal coverage areas to unlock atelier bookings and set custom operational limits.
            </p>

            <form onSubmit={handleAddPincode} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#4b5563', marginBottom: '4px' }}>
                  Pin Code *
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. 400001"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  maxLength={10}
                  required
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem', color: '#1f2937', background: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#4b5563', marginBottom: '4px' }}>
                  City / Area *
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Mumbai (South)"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem', color: '#1f2937', background: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#4b5563', marginBottom: '4px' }}>
                  Default Capacity (visits/day) *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="number" 
                    min={1}
                    max={50}
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(Math.max(1, parseInt(e.target.value) || 3))}
                    required
                    style={{ width: '80px', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem', color: '#1f2937', background: '#fff', textAlign: 'center' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>Recommended: 3</span>
                </div>
              </div>

              {pincodeError && (
                <div style={{ color: '#EF4444', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {pincodeError}
                </div>
              )}

              <button 
                type="submit"
                disabled={pincodeActionLoading}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: '#111',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '6px',
                  transition: 'background 0.2s'
                }}
              >
                <Sparkles size={12} color="#9d2706" /> {pincodeActionLoading ? 'Registering...' : 'Register Service Zone'}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'capacity' && (
        <div>
          {/* Visual Analytics / Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: '#FAF9F6', border: '1px solid #e7e5e4', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(157, 39, 6, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Globe size={18} color="#9d2706" />
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Active Zones</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#111827', fontFamily: 'Montserrat, sans-serif' }}>{activeZonesCount} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#6b7280' }}>/ {pincodes.length} regions</span></div>
              </div>
            </div>

            <div style={{ background: '#FAF9F6', border: '1px solid #e7e5e4', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={18} color="#10B981" />
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Fulfillment Capacity</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#111827', fontFamily: 'Montserrat, sans-serif' }}>{totalFulfillmentCapacity} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#6b7280' }}>visits/day</span></div>
              </div>
            </div>
          </div>

          {/* Daily Slot Booking Capacity Adjuster */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAF9F6' }}>
              <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#9d2706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>⚡ Dynamic Capacity Steppers</h3>
              <button 
                onClick={fetchPincodes}
                disabled={pincodesLoading}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#4b5563', fontWeight: 600 }}
              >
                <RefreshCw size={12} className={pincodesLoading ? 'animate-spin' : ''} /> Reload
              </button>
            </div>

            {pincodesLoading && pincodes.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading serviceable regions...</div>
            ) : pincodes.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>No serviceable pin codes registered in database. Please register one first.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#FAF9F6', borderBottom: '1px solid #e5e7eb', color: '#4b5563', fontWeight: 600 }}>
                    <th style={{ padding: '14px 16px' }}>PIN Code</th>
                    <th style={{ padding: '14px 16px' }}>Region / City</th>
                    <th style={{ padding: '14px 16px' }}>Status</th>
                    <th style={{ padding: '14px 16px', width: '280px' }}>Daily Slot Booking Capacity</th>
                  </tr>
                </thead>
                <tbody>
                  {pincodes.map(p => (
                    <tr key={p.pin_code} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.2s' }}>
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>
                        {p.pin_code}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                        {p.city}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          backgroundColor: p.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: p.active ? '#059669' : '#d97706',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.active ? '#10B981' : '#F59E0B', display: 'inline-block' }} />
                          {p.active ? 'Active' : 'Paused'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <button
                            disabled={p.capacity <= 1}
                            onClick={() => handleCapacityStep(p.pin_code, p.capacity, -1)}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              border: '1px solid #d1d5db',
                              background: '#fff',
                              color: '#374151',
                              cursor: p.capacity <= 1 ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: p.capacity <= 1 ? 0.4 : 1,
                              transition: 'all 0.2s'
                            }}
                          >
                            <Minus size={12} />
                          </button>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827', minWidth: '85px', textAlign: 'center' }}>
                            {p.capacity} visits/day
                          </span>
                          <button
                            disabled={p.capacity >= 50}
                            onClick={() => handleCapacityStep(p.pin_code, p.capacity, 1)}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              border: '1px solid #9d2706',
                              background: 'rgba(157, 39, 6, 0.02)',
                              color: '#9d2706',
                              cursor: p.capacity >= 50 ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Visits deletion modal overlay */}
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

      {/* Pincode deletion modal overlay */}
      {deletePinConfirm && (
        <div className="admin-modal-overlay" onClick={() => setDeletePinConfirm(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: 420, width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', position: 'relative' }}>
            <button style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setDeletePinConfirm(null)}><X size={18} /></button>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', color: '#111827', fontWeight: 600 }}>Remove Service Zone?</h3>
            <p style={{ marginTop: 8, marginBottom: 24, fontSize: '0.8rem', color: '#4b5563', lineHeight: 1.5 }}>
              Are you sure you want to remove PIN Code <strong>{deletePinConfirm.pin_code} ({deletePinConfirm.city})</strong> from the active service registry?
              Storefront customers will no longer be able to book concierge visits in this region.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setDeletePinConfirm(null)} className="admin-btn-secondary" style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', cursor: 'pointer', background: '#fff', fontSize: '0.78rem', fontWeight: 600 }}>Cancel</button>
              <button onClick={handleDeletePincode} className="admin-btn-primary" disabled={pincodeActionLoading}
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: '#EF4444', color: '#fff', fontSize: '0.78rem', fontWeight: 600 }}>
                {pincodeActionLoading ? 'Removing...' : 'Remove Zone'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminVisits;

