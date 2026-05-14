"use client";
import React, { useState, useEffect } from 'react';
import { Eye, Search } from 'lucide-react';
import { api } from '../../api';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [fitForm, setFitForm] = useState({});
  const [showFitForm, setShowFitForm] = useState(false);

  const fetchCustomers = async () => {
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const data = await api.getCustomers(params);
      setCustomers(data.customers || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setLoading(true);
    fetchCustomers();
  };

  const viewCustomer = async (id) => {
    try {
      const data = await api.getCustomer(id);
      setSelectedCustomer(data);
    } catch (err) { alert(err.message); }
  };

  const saveFitProfile = async () => {
    try {
      await api.updateFitProfile(selectedCustomer.id, fitForm);
      alert('Fit profile saved!');
      viewCustomer(selectedCustomer.id);
      setShowFitForm(false);
    } catch (err) { alert(err.message); }
  };

  const openFitForm = () => {
    const fp = selectedCustomer.fit_profile || {};
    setFitForm({
      foot_length_left: fp.foot_length_left || '',
      foot_length_right: fp.foot_length_right || '',
      foot_width_left: fp.foot_width_left || '',
      foot_width_right: fp.foot_width_right || '',
      foot_girth_left: fp.foot_girth_left || '',
      foot_girth_right: fp.foot_girth_right || '',
      arch_type: fp.arch_type || 'medium',
      uk_size: fp.uk_size || '',
      scan_source: fp.scan_source || 'manual',
      notes: fp.notes || ''
    });
    setShowFitForm(true);
  };

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const totalItems = customers.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const safePage = page > totalPages ? totalPages : page;
  const paginatedCustomers = customers.slice((safePage - 1) * limit, safePage * limit);

  return (
    <div className="admin-page" data-testid="admin-customers">
      <div className="admin-page-header">
        <div><h1>Customer Management</h1><p>Customer profiles, fit data, and order history</p></div>
      </div>

      <form className="admin-search-bar" onSubmit={handleSearch}>
        <Search size={18} />
        <input type="text" placeholder="Search by name or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} data-testid="customer-search" />
        <button type="submit" className="admin-btn-primary">Search</button>
      </form>

      {loading ? <div className="admin-loading">Loading...</div> : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Email</th><th>Orders</th><th>Fit Profile</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {paginatedCustomers.map(c => (
                <tr key={c.id} data-testid={`customer-row-${c.id}`}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.email}</td>
                  <td>{c.order_count}</td>
                  <td>{c.has_fit_profile ? <span className="badge-success">Scanned</span> : <span className="badge-pending">Not yet</span>}</td>
                  <td>{c.created_at ? new Date(c.created_at).toLocaleDateString() : '-'}</td>
                  <td><button className="table-action-btn" onClick={() => viewCustomer(c.id)} data-testid={`view-customer-${c.id}`}><Eye size={16} /></button></td>
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

      {selectedCustomer && !showFitForm && (
        <div className="admin-modal-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="admin-modal admin-modal-lg" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setSelectedCustomer(null)}>&times;</button>
            <h3>{selectedCustomer.name}</h3>
            <p className="table-sub">{selectedCustomer.email}</p>

            <div className="customer-detail-grid">
              <div className="customer-section">
                <h4>Fit Vault</h4>
                {selectedCustomer.fit_profile ? (
                  <div className="fit-data">
                    <div className="fit-row"><span>Left Foot</span><span>Length: {selectedCustomer.fit_profile.foot_length_left}mm | Width: {selectedCustomer.fit_profile.foot_width_left}mm | Girth: {selectedCustomer.fit_profile.foot_girth_left}mm</span></div>
                    <div className="fit-row"><span>Right Foot</span><span>Length: {selectedCustomer.fit_profile.foot_length_right}mm | Width: {selectedCustomer.fit_profile.foot_width_right}mm | Girth: {selectedCustomer.fit_profile.foot_girth_right}mm</span></div>
                    <div className="fit-row"><span>Arch Type</span><span>{selectedCustomer.fit_profile.arch_type}</span></div>
                    <div className="fit-row"><span>UK Size</span><span>{selectedCustomer.fit_profile.uk_size}</span></div>
                    <div className="fit-row"><span>Scan Source</span><span>{selectedCustomer.fit_profile.scan_source}</span></div>
                    {selectedCustomer.fit_profile.notes && <div className="fit-row"><span>Notes</span><span>{selectedCustomer.fit_profile.notes}</span></div>}
                    <p className="fit-welcome">Welcome back! We have the {selectedCustomer.fit_profile.scan_date || '2026'} scan on file.</p>
                  </div>
                ) : <p className="table-sub">No fit profile recorded yet.</p>}
                <button className="admin-btn-secondary" onClick={openFitForm}>
                  {selectedCustomer.fit_profile ? 'Update Fit Profile' : 'Record Fit Measurements'}
                </button>
              </div>

              <div className="customer-section">
                <h4>Recent Orders ({selectedCustomer.order_count})</h4>
                {selectedCustomer.recent_orders?.length > 0 ? (
                  <div className="customer-orders-list">
                    {selectedCustomer.recent_orders.map(o => (
                      <div key={o.id} className="customer-order-line">
                        <span>{o.order_number}</span>
                        <span className={`status-badge status-${o.status}`}>{o.status}</span>
                        <span>₹{o.total_amount?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="table-sub">No orders yet.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {showFitForm && (
        <div className="admin-modal-overlay" onClick={() => setShowFitForm(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowFitForm(false)}>&times;</button>
            <h3>Fit Profile - {selectedCustomer.name}</h3>
            <div className="admin-form">
              <h4 style={{ marginBottom: 8 }}>Left Foot (mm)</h4>
              <div className="af-row">
                <div className="af-field"><label>Length</label><input type="number" step="0.1" value={fitForm.foot_length_left} onChange={e => setFitForm({...fitForm, foot_length_left: parseFloat(e.target.value)})} /></div>
                <div className="af-field"><label>Width</label><input type="number" step="0.1" value={fitForm.foot_width_left} onChange={e => setFitForm({...fitForm, foot_width_left: parseFloat(e.target.value)})} /></div>
                <div className="af-field"><label>Girth</label><input type="number" step="0.1" value={fitForm.foot_girth_left} onChange={e => setFitForm({...fitForm, foot_girth_left: parseFloat(e.target.value)})} /></div>
              </div>
              <h4 style={{ marginBottom: 8, marginTop: 16 }}>Right Foot (mm)</h4>
              <div className="af-row">
                <div className="af-field"><label>Length</label><input type="number" step="0.1" value={fitForm.foot_length_right} onChange={e => setFitForm({...fitForm, foot_length_right: parseFloat(e.target.value)})} /></div>
                <div className="af-field"><label>Width</label><input type="number" step="0.1" value={fitForm.foot_width_right} onChange={e => setFitForm({...fitForm, foot_width_right: parseFloat(e.target.value)})} /></div>
                <div className="af-field"><label>Girth</label><input type="number" step="0.1" value={fitForm.foot_girth_right} onChange={e => setFitForm({...fitForm, foot_girth_right: parseFloat(e.target.value)})} /></div>
              </div>
              <div className="af-row" style={{ marginTop: 16 }}>
                <div className="af-field"><label>Arch Type</label><select value={fitForm.arch_type} onChange={e => setFitForm({...fitForm, arch_type: e.target.value})}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
                <div className="af-field"><label>UK Size</label><input value={fitForm.uk_size} onChange={e => setFitForm({...fitForm, uk_size: e.target.value})} /></div>
                <div className="af-field"><label>Scan Source</label><select value={fitForm.scan_source} onChange={e => setFitForm({...fitForm, scan_source: e.target.value})}><option value="manual">Manual</option><option value="lidar">LiDAR</option><option value="3d_scanner">3D Scanner</option></select></div>
              </div>
              <div className="af-field" style={{ marginTop: 16 }}><label>Notes</label><textarea value={fitForm.notes} onChange={e => setFitForm({...fitForm, notes: e.target.value})} rows="2" /></div>
              <button className="admin-btn-primary" onClick={saveFitProfile} style={{ marginTop: 16 }}>Save Fit Profile</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
