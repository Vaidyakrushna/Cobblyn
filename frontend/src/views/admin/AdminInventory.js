"use client";
import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, XCircle, CheckCircle, Search, RefreshCw, Edit2, X, Plus, Minus } from 'lucide-react';
import { api } from '../../api';

const AdminInventory = () => {
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [restockItem, setRestockItem] = useState(null);
  const [restockForm, setRestockForm] = useState({ size: '', quantity: 1, notes: '' });

  const fetchData = async () => {
    try {
      const [statsData, invData] = await Promise.all([
        api.getInventoryStats(),
        api.getInventory(buildParams())
      ]);
      setStats(statsData);
      setItems(invData.items || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const buildParams = () => {
    const p = new URLSearchParams();
    if (filter !== 'all') p.set('status', filter);
    if (categoryFilter === 'men' || categoryFilter === 'women') p.set('gender', categoryFilter);
    if (categoryFilter === 'accessories') p.set('category', 'accessories');
    if (searchTerm) p.set('search', searchTerm);
    const qs = p.toString();
    return qs ? `?${qs}` : '';
  };

  useEffect(() => { fetchData(); }, [filter, categoryFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleRestock = async (e) => {
    e.preventDefault();
    if (!restockItem || !restockForm.size || restockForm.quantity < 1) return;
    try {
      await api.restockSize(restockItem.id, restockForm);
      setRestockItem(null);
      setRestockForm({ size: '', quantity: 1, notes: '' });
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const handleStockUpdate = async () => {
    if (!editItem) return;
    try {
      await api.updateStock(editItem.id, {
        size_stock: editItem.size_stock,
        low_stock_threshold: editItem.low_stock_threshold
      });
      setEditItem(null);
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const getStatusIcon = (status) => {
    if (status === 'in_stock') return <CheckCircle size={14} color="#10B981" />;
    if (status === 'low_stock') return <AlertTriangle size={14} color="#F59E0B" />;
    return <XCircle size={14} color="#EF4444" />;
  };

  const statCards = stats ? [
    { label: 'Total SKUs', value: stats.total_skus, icon: <Package size={20} />, color: '#2563EB' },
    { label: 'In Stock', value: stats.in_stock, icon: <CheckCircle size={20} />, color: '#10B981' },
    { label: 'Low Stock', value: stats.low_stock, icon: <AlertTriangle size={20} />, color: '#F59E0B' },
    { label: 'Out of Stock', value: stats.out_of_stock, icon: <XCircle size={20} />, color: '#EF4444' },
  ] : [];

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const safePage = page > totalPages ? totalPages : page;
  const paginatedItems = items.slice((safePage - 1) * limit, safePage * limit);

  if (loading) return <div className="admin-loading">Loading inventory...</div>;

  return (
    <div className="admin-page" data-testid="admin-inventory">
      <div className="admin-page-header">
        <div><h1>Stock Inventory</h1><p>Track stock levels across all products and sizes</p></div>
        <button className="admin-btn-primary" onClick={fetchData} data-testid="refresh-inventory-btn"><RefreshCw size={14} /> Refresh</button>
      </div>

      {/* Stats */}
      <div className="admin-stats-grid">
        {statCards.map(c => (
          <div key={c.label} className="admin-stat-card" data-testid={`inv-stat-${c.label.toLowerCase().replace(/\s/g, '-')}`}>
            <div className="stat-icon" style={{ backgroundColor: c.color + '15', color: c.color }}>{c.icon}</div>
            <div className="stat-info"><span className="stat-value">{c.value}</span><span className="stat-label">{c.label}</span></div>
          </div>
        ))}
      </div>

      {stats && (
        <div className="inv-summary-bar" data-testid="inv-summary">
          <span>Total Units: <strong>{stats.total_units?.toLocaleString()}</strong></span>
          <span>Inventory Value: <strong>{'\u20B9'}{stats.total_value?.toLocaleString()}</strong></span>
        </div>
      )}

      {/* Filters */}
      <div className="inv-controls">
        <div className="admin-filters">
          {['all', 'in_stock', 'low_stock', 'out_of_stock'].map(s => (
            <button key={s} className={`admin-filter-btn ${filter === s ? 'active' : ''}`} onClick={() => { setFilter(s); setPage(1); }} data-testid={`inv-filter-${s}`}>
              {s === 'all' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
          <span className="inv-divider">|</span>
          {[
            { v: 'all', l: 'All Categories' },
            { v: 'men', l: 'Men' },
            { v: 'women', l: 'Women' },
            { v: 'accessories', l: 'Accessories' },
          ].map(c => (
            <button key={c.v} className={`admin-filter-btn ${categoryFilter === c.v ? 'active' : ''}`}
              onClick={() => { setCategoryFilter(c.v); setPage(1); }} data-testid={`inv-category-${c.v}`}>
              {c.l}
            </button>
          ))}
        </div>
        <form className="admin-search-bar inv-search" onSubmit={(e) => { e.preventDefault(); setPage(1); handleSearch(e); }}>
          <Search size={16} />
          <input type="text" placeholder="Search by name or SKU..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} data-testid="inv-search-input" />
        </form>
      </div>

      {/* Inventory Table */}
      {items.length === 0 ? <div className="admin-empty">No inventory items found</div> : (
        <div className="admin-table-wrapper">
          <table className="admin-table" data-testid="inventory-table">
            <thead>
              <tr>
                <th>SKU</th><th>Product</th><th>Gender</th><th>Style</th><th>Price</th>
                <th>Size Stock</th><th>Total</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map(item => (
                <tr key={item.id} data-testid={`inv-row-${item.id}`}>
                  <td><strong className="inv-sku">{item.sku || item.article_code}</strong></td>
                  <td>{item.product_name}</td>
                  <td className="inv-gender">{item.gender}</td>
                  <td>{item.style}</td>
                  <td>{'\u20B9'}{item.price?.toLocaleString()}</td>
                  <td>
                    <div className="size-stock-cells">
                      {item.sizes?.map(s => (
                        <span key={s} className={`size-cell ${(item.size_stock?.[s] || 0) === 0 ? 'empty' : (item.size_stock?.[s] || 0) <= 2 ? 'low' : ''}`}>
                          <span className="size-label">{s}</span>
                          <span className="size-qty">{item.size_stock?.[s] || 0}</span>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td><strong>{item.total_stock}</strong></td>
                  <td>
                    <span className={`status-badge status-inv-${item.status}`}>
                      {getStatusIcon(item.status)} {item.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button onClick={() => setRestockItem(item)} title="Restock" data-testid={`restock-${item.id}`}><Plus size={14} /></button>
                      <button onClick={() => setEditItem({ ...item })} title="Edit Stock" data-testid={`edit-stock-${item.id}`}><Edit2 size={14} /></button>
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

      {/* Restock Modal */}
      {restockItem && (
        <div className="admin-modal-overlay" onClick={() => setRestockItem(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setRestockItem(null)}><X size={18} /></button>
            <h3>Restock: {restockItem.product_name}</h3>
            <p className="table-sub" style={{ marginBottom: 16 }}>SKU: {restockItem.sku} | Current Total: {restockItem.total_stock}</p>
            <form onSubmit={handleRestock} className="admin-form">
              <div className="af-field">
                <label>Size</label>
                <select value={restockForm.size} onChange={e => setRestockForm({...restockForm, size: e.target.value})} required>
                  <option value="">Select size</option>
                  {restockItem.sizes?.map(s => (
                    <option key={s} value={s}>UK {s} (Current: {restockItem.size_stock?.[s] || 0})</option>
                  ))}
                </select>
              </div>
              <div className="af-field">
                <label>Quantity to Add</label>
                <input type="number" min="1" value={restockForm.quantity} onChange={e => setRestockForm({...restockForm, quantity: parseInt(e.target.value) || 1})} required />
              </div>
              <div className="af-field">
                <label>Notes</label>
                <input type="text" value={restockForm.notes} onChange={e => setRestockForm({...restockForm, notes: e.target.value})} placeholder="e.g. Vendor shipment #123" />
              </div>
              <button type="submit" className="admin-btn-primary" data-testid="confirm-restock-btn">Confirm Restock</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Stock Modal */}
      {editItem && (
        <div className="admin-modal-overlay" onClick={() => setEditItem(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setEditItem(null)}><X size={18} /></button>
            <h3>Edit Stock: {editItem.product_name}</h3>
            <div className="admin-form">
              <div className="af-field">
                <label>Low Stock Threshold</label>
                <input type="number" min="1" value={editItem.low_stock_threshold || 3} onChange={e => setEditItem({...editItem, low_stock_threshold: parseInt(e.target.value) || 3})} />
              </div>
              <div className="af-field"><label>Stock per Size</label></div>
              <div className="edit-size-grid">
                {editItem.sizes?.map(s => (
                  <div key={s} className="edit-size-row">
                    <span className="edit-size-label">UK {s}</span>
                    <div className="edit-size-controls">
                      <button type="button" onClick={() => {
                        const stock = {...editItem.size_stock};
                        stock[s] = Math.max(0, (parseInt(stock[s]) || 0) - 1);
                        setEditItem({...editItem, size_stock: stock});
                      }}><Minus size={12} /></button>
                      <input type="number" min="0" value={editItem.size_stock?.[s] || 0} onChange={e => {
                        const stock = {...editItem.size_stock};
                        stock[s] = parseInt(e.target.value) || 0;
                        setEditItem({...editItem, size_stock: stock});
                      }} />
                      <button type="button" onClick={() => {
                        const stock = {...editItem.size_stock};
                        stock[s] = (parseInt(stock[s]) || 0) + 1;
                        setEditItem({...editItem, size_stock: stock});
                      }}><Plus size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="inv-edit-total">
                Total: <strong>{Object.values(editItem.size_stock || {}).reduce((s, v) => s + (parseInt(v) || 0), 0)}</strong>
              </div>
              <button className="admin-btn-primary" onClick={handleStockUpdate} data-testid="save-stock-btn">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;
