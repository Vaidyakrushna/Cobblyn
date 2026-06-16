"use client";
import React, { useState, useEffect } from 'react';
import { Eye, ChevronDown, Check, Activity } from 'lucide-react';
import { api } from '../../api';

const ORDER_STATUSES = ['pending', 'confirmed', 'in_production', 'quality_check', 'shipped', 'delivered', 'cancelled', 'waiting_for_payment'];

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Modification Flow states
  const [isEditing, setIsEditing] = useState(false);
  const [editItems, setEditItems] = useState([]);
  const [editAddress, setEditAddress] = useState({});
  const [editNotes, setEditNotes] = useState('');

  // Operational state for Logistics & Courier Partner Assignment
  const [courierPartner, setCourierPartner] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [savingOperational, setSavingOperational] = useState(false);

  useEffect(() => {
    if (selectedOrder) {
      setCourierPartner(selectedOrder.courier_partner || '');
      setTrackingNumber(selectedOrder.tracking_number || '');
    } else {
      setCourierPartner('');
      setTrackingNumber('');
    }
  }, [selectedOrder]);

  const fetchOrders = async () => {
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const data = await api.getOrders(params);
      setOrders(data.orders || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [filter]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, { status: newStatus });
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        const updated = await api.getOrder(orderId);
        setSelectedOrder(updated);
      }
    } catch (err) { alert(err.message); }
  };

  const saveCourierAssignment = async () => {
    if (!selectedOrder) return;
    setSavingOperational(true);
    try {
      await api.updateOrderOperational(selectedOrder.id, {
        courier_partner: courierPartner,
        tracking_number: trackingNumber
      });
      const updated = await api.getOrder(selectedOrder.id);
      setSelectedOrder(updated);
      fetchOrders();
      alert('Courier assignment updated successfully!');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to update courier assignment');
    }
    setSavingOperational(false);
  };

  const startEditing = (order) => {
    setEditItems(JSON.parse(JSON.stringify(order.items || [])));
    setEditAddress({ ...(order.shipping_address || {}) });
    setEditNotes(order.notes || '');
    setIsEditing(true);
  };

  const saveDirectModification = async () => {
    try {
      await api.directModifyOrder(selectedOrder.id, {
        items: editItems,
        shipping_address: editAddress,
        notes: editNotes
      });
      alert("Order directly modified successfully!");
      setIsEditing(false);
      fetchOrders();
      const updated = await api.getOrder(selectedOrder.id);
      setSelectedOrder(updated);
    } catch (err) {
      alert(err.message);
    }
  };

  const approveProposal = async (orderId) => {
    try {
      await api.approveOrderModification(orderId);
      alert("Proposed order changes approved and implemented!");
      fetchOrders();
      const updated = await api.getOrder(orderId);
      setSelectedOrder(updated);
    } catch (err) {
      alert(err.message);
    }
  };

  const rejectProposal = async (orderId) => {
    try {
      await api.rejectOrderModification(orderId);
      alert("Proposed order changes rejected and dismissed.");
      fetchOrders();
      const updated = await api.getOrder(orderId);
      setSelectedOrder(updated);
    } catch (err) {
      alert(err.message);
    }
  };

  // Filter the orders based on typeFilter client-side
  const filteredOrders = orders.filter(order => {
    if (typeFilter === 'all') return true;
    if (typeFilter === 'crafted') return order.production_type === 'crafted';
    if (typeFilter === 'ready_to_ship') return order.production_type === 'ready_to_ship';
    return true;
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const safePage = page > totalPages ? totalPages : page;
  const paginatedOrders = filteredOrders.slice((safePage - 1) * limit, safePage * limit);

  return (
    <div className="admin-page" data-testid="admin-orders">
      <div className="admin-page-header">
        <div><h1>Order Management</h1><p>Track and manage all customer orders</p></div>
      </div>

      <div className="admin-filters" style={{ marginBottom: '12px' }}>
        {['all', ...ORDER_STATUSES].map(s => (
          <button key={s} className={`admin-filter-btn ${filter === s ? 'active' : ''}`} onClick={() => { setFilter(s); setPage(1); }}>
            {s === 'all' ? 'All Status' : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      <div className="admin-filters" style={{ marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid #f5f5f4', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Type Filter:</span>
        {[
          { id: 'all', label: 'All Types' },
          { id: 'crafted', label: '✨ Custom Bespoke' },
          { id: 'ready_to_ship', label: '📦 Ready to Ship' }
        ].map(t => (
          <button
            key={t.id}
            className={`admin-filter-btn ${typeFilter === t.id ? 'active' : ''}`}
            onClick={() => { setTypeFilter(t.id); setPage(1); }}
            style={{ borderRadius: '20px', padding: '4px 14px' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <div className="admin-loading">Loading...</div> : orders.length === 0 ? (
        <div className="admin-empty">No orders found</div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr><th>Order #</th><th>Customer</th><th>Items</th><th>Order Type</th><th>Amount</th><th>Status</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {paginatedOrders.map(order => (
                <tr key={order.id} data-testid={`order-row-${order.id}`}>
                  <td>
                    <strong>{order.order_number}</strong>
                    {order.pending_modification && (
                      <span style={{ display: 'inline-block', marginLeft: '6px', background: '#d97706', color: '#fff', fontSize: '0.58rem', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700 }}>MOD</span>
                    )}
                  </td>
                  <td>{order.customer_name}<br /><span className="table-sub">{order.customer_email}</span></td>
                  <td>{order.items?.length || 0} item(s)</td>
                  <td>
                    {order.production_type === 'crafted' ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#fef3c7',
                        color: '#d97706',
                        border: '1px solid #fde68a',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em'
                      }}>
                        ✨ Custom Bespoke
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#ecfdf5',
                        color: '#059669',
                        border: '1px solid #a7f3d0',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em'
                      }}>
                        📦 Ready to Ship
                      </span>
                    )}
                  </td>
                  <td>{(order.total_amount || 0).toLocaleString()}</td>
                  <td>
                    <select className={`status-select status-${order.status}`} value={order.status} onChange={e => updateStatus(order.id, e.target.value)}>
                      {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                    </select>
                  </td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="table-action-btn" onClick={() => setSelectedOrder(order)} data-testid={`view-order-${order.id}`}><Eye size={16} /></button>
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

      {selectedOrder && (
        <div className="admin-modal-overlay" onClick={() => { setSelectedOrder(null); setIsEditing(false); }}>
          {isEditing ? (
            <div className="admin-modal admin-modal-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
              <button className="admin-modal-close" onClick={() => setIsEditing(false)}>&times;</button>
              <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>Modify Details: Order {selectedOrder.order_number}</h3>
              <div className="order-detail-grid" style={{ marginTop: '20px', gap: '16px' }}>
                
                {/* Items editing */}
                <div className="order-detail-section" style={{ gridColumn: 'span 2' }}>
                  {editItems.map((item, idx) => (
                    <div key={idx} style={{ background: '#fafaf9', padding: '12px', borderRadius: '8px', border: '1px solid #e7e5e4', marginBottom: '10px' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#44403c', marginBottom: '8px' }}>{item.name}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr 1.5fr', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '0.62rem', display: 'block', color: '#78716c', fontWeight: 600 }}>Size (UK)</label>
                          <select value={item.size} onChange={e => {
                            const updated = [...editItems];
                            updated[idx].size = e.target.value;
                            setEditItems(updated);
                          }} style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.75rem', background: '#fff', outline: 'none' }}>
                            {['3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(sz => <option key={sz} value={sz}>{sz}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.62rem', display: 'block', color: '#78716c', fontWeight: 600 }}>Color</label>
                          <input type="text" value={item.color || ''} onChange={e => {
                            const updated = [...editItems];
                            updated[idx].color = e.target.value;
                            setEditItems(updated);
                          }} style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.75rem', background: '#fff', outline: 'none' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.62rem', display: 'block', color: '#78716c', fontWeight: 600 }}>Quantity</label>
                          <input type="number" min="1" max="10" value={item.quantity} onChange={e => {
                            const updated = [...editItems];
                            updated[idx].quantity = Number(e.target.value);
                            setEditItems(updated);
                          }} style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.75rem', background: '#fff', outline: 'none' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.62rem', display: 'block', color: '#78716c', fontWeight: 600 }}>Leather / Material</label>
                          <select value={item.material || 'Full-Grain Leather'} onChange={e => {
                            const updated = [...editItems];
                            updated[idx].material = e.target.value;
                            setEditItems(updated);
                          }} style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.75rem', background: '#fff', outline: 'none' }}>
                            {['Full-Grain Leather', 'Shell Cordovan', 'Suede', 'Nubuck', 'Patent Leather', 'Italian Calfskin'].map(mat => (
                              <option key={mat} value={mat}>{mat}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.62rem', display: 'block', color: '#78716c', fontWeight: 600 }}>Sole Type</label>
                          <select value={item.sole || 'Leather Sole'} onChange={e => {
                            const updated = [...editItems];
                            updated[idx].sole = e.target.value;
                            setEditItems(updated);
                          }} style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.75rem', background: '#fff', outline: 'none' }}>
                            {['Leather Sole', 'Dainite Rubber', 'Crepe Rubber'].map(sl => (
                              <option key={sl} value={sl}>{sl}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shipping Address Editing */}
                <div className="order-detail-section" style={{ gridColumn: 'span 2' }}>
                  <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#78716c' }}>Shipping Address</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.65rem', fontWeight: 600, color: '#78716c' }}>Recipient Name</label>
                      <input type="text" value={editAddress.name || ''} onChange={e => setEditAddress({ ...editAddress, name: e.target.value })} style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.78rem', marginTop: '4px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.65rem', fontWeight: 600, color: '#78716c' }}>Recipient Phone</label>
                      <input type="text" value={editAddress.phone || ''} onChange={e => setEditAddress({ ...editAddress, phone: e.target.value })} style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.78rem', marginTop: '4px' }} />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '0.65rem', fontWeight: 600, color: '#78716c' }}>Address Line</label>
                      <input type="text" value={editAddress.address || ''} onChange={e => setEditAddress({ ...editAddress, address: e.target.value })} style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.78rem', marginTop: '4px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.65rem', fontWeight: 600, color: '#78716c' }}>City</label>
                      <input type="text" value={editAddress.city || ''} onChange={e => setEditAddress({ ...editAddress, city: e.target.value })} style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.78rem', marginTop: '4px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.65rem', fontWeight: 600, color: '#78716c' }}>State</label>
                      <input type="text" value={editAddress.state || ''} onChange={e => setEditAddress({ ...editAddress, state: e.target.value })} style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.78rem', marginTop: '4px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.65rem', fontWeight: 600, color: '#78716c' }}>PIN Code</label>
                      <input type="text" value={editAddress.pincode || ''} onChange={e => setEditAddress({ ...editAddress, pincode: e.target.value })} style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.78rem', marginTop: '4px' }} />
                    </div>
                  </div>
                </div>

                {/* Notes Editing */}
                <div className="order-detail-section" style={{ gridColumn: 'span 2' }}>
                  <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#78716c' }}>Modification Audit Notes</h4>
                  <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="State the reason for this administrative modification..." rows="2" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem', outline: 'none', resize: 'none', marginTop: '4px' }} />
                </div>

                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button className="admin-btn-primary" onClick={saveDirectModification} style={{ marginTop: 0, padding: '8px 20px', fontSize: '0.75rem', fontWeight: 600 }}>Save Modifications</button>
                  <button className="admin-btn-secondary" onClick={() => setIsEditing(false)} style={{ marginTop: 0, padding: '8px 20px', fontSize: '0.75rem', fontWeight: 600, background: '#fff' }}>Cancel</button>
                </div>

              </div>
            </div>
          ) : (
            <div className="admin-modal admin-modal-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: '850px', width: '90%' }}>
              <button className="admin-modal-close" onClick={() => setSelectedOrder(null)}>&times;</button>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f5f5f4', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h3 style={{ margin: 0, fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>Order {selectedOrder.order_number}</h3>
                  {selectedOrder.production_type === 'crafted' ? (
                    <span style={{
                      background: '#fef3c7',
                      color: '#d97706',
                      border: '1px solid #fde68a',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 10px',
                      borderRadius: '20px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      ✨ Custom Bespoke
                    </span>
                  ) : (
                    <span style={{
                      background: '#ecfdf5',
                      color: '#059669',
                      border: '1px solid #a7f3d0',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 10px',
                      borderRadius: '20px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      📦 Ready to Ship
                    </span>
                  )}
                </div>
                {(selectedOrder.status === 'pending' || selectedOrder.status === 'confirmed') && (
                  <button className="admin-btn-secondary" onClick={() => startEditing(selectedOrder)} style={{ margin: 0, padding: '6px 12px', fontSize: '0.72rem', fontWeight: 700, background: '#fafaf9', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    🛠️ Modify Details
                  </button>
                )}
              </div>

              <div className="order-detail-grid">
                
                {/* Proposed Changes Pending Approval Diff Alert */}
                {selectedOrder.pending_modification && (
                  <div className="order-detail-section proposed-modification-banner" style={{ gridColumn: 'span 2', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '12px', padding: '16px', marginBottom: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="pulse-dot" style={{ width: '8px', height: '8px', background: '#d97706', borderRadius: '50%', display: 'inline-block' }}></span>
                        <h4 style={{ margin: 0, color: '#b45309', fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Modification Request</h4>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#78716c' }}>Proposed by: <strong>{selectedOrder.pending_modification.proposed_by}</strong> ({selectedOrder.pending_modification.proposed_email})</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
                      <div>
                        <h5 style={{ margin: '0 0 8px 0', fontSize: '0.72rem', color: '#78716c', fontWeight: 700, textTransform: 'uppercase' }}>Original State</h5>
                        <div style={{ padding: '8px', background: '#fef2f2', borderRadius: '6px', border: '1px solid #fee2e2', fontSize: '0.72rem', minHeight: '110px' }}>
                          {selectedOrder.items?.map((item, i) => (
                            <div key={i} style={{ marginBottom: '4px', textDecoration: 'line-through', color: '#991b1b' }}>
                              {item.name} - Size {item.size}, {item.color}{item.material ? `, ${item.material}` : ''}{item.sole ? `, ${item.sole}` : ''} x{item.quantity} (₹{item.price})
                            </div>
                          ))}
                          {selectedOrder.shipping_address && (
                            <div style={{ marginTop: '8px', borderTop: '1px dashed #fee2e2', paddingTop: '6px', color: '#7f1d1d' }}>
                              <strong>Address:</strong> {selectedOrder.shipping_address.name}, {selectedOrder.shipping_address.address}, {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} - {selectedOrder.shipping_address.pincode}
                            </div>
                          )}
                          {selectedOrder.notes && (
                            <div style={{ color: '#7f1d1d', fontStyle: 'italic', marginTop: '4px' }}>
                              <strong>Notes:</strong> {selectedOrder.notes}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h5 style={{ margin: '0 0 8px 0', fontSize: '0.72rem', color: '#78716c', fontWeight: 700, textTransform: 'uppercase' }}>Proposed Target</h5>
                        <div style={{ padding: '8px', background: '#f0fdf4', borderRadius: '6px', border: '1px solid #dcfce7', fontSize: '0.72rem', minHeight: '110px' }}>
                          {selectedOrder.pending_modification.items?.map((item, i) => (
                            <div key={i} style={{ marginBottom: '4px', color: '#166534', fontWeight: 600 }}>
                              + {item.name} - Size {item.size}, {item.color}{item.material ? `, ${item.material}` : ''}{item.sole ? `, ${item.sole}` : ''} x{item.quantity} (₹{item.price})
                            </div>
                          ))}
                          {selectedOrder.pending_modification.shipping_address && (
                            <div style={{ marginTop: '8px', borderTop: '1px dashed #dcfce7', paddingTop: '6px', color: '#14532d' }}>
                              <strong>Address:</strong> {selectedOrder.pending_modification.shipping_address.name}, {selectedOrder.pending_modification.shipping_address.address}, {selectedOrder.pending_modification.shipping_address.city}, {selectedOrder.pending_modification.shipping_address.state} - {selectedOrder.pending_modification.shipping_address.pincode}
                            </div>
                          )}
                          {selectedOrder.pending_modification.notes && (
                            <div style={{ color: '#14532d', fontStyle: 'italic', marginTop: '4px' }}>
                              <strong>Reason:</strong> {selectedOrder.pending_modification.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'flex-end' }}>
                      <button className="admin-btn-primary" onClick={() => approveProposal(selectedOrder.id)} style={{ padding: '6px 16px', background: '#d97706', border: 'none', color: '#fff', fontSize: '0.72rem', fontWeight: 700, borderRadius: '6px', cursor: 'pointer', marginTop: 0 }}>
                        Approve Changes
                      </button>
                      <button className="admin-btn-danger" onClick={() => rejectProposal(selectedOrder.id)} style={{ padding: '6px 16px', fontSize: '0.72rem', fontWeight: 700, borderRadius: '6px', cursor: 'pointer', marginTop: 0 }}>
                        Dismiss Proposal
                      </button>
                    </div>
                  </div>
                )}

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
                    <div className="order-timeline-expanded" data-testid="order-timeline-expanded" style={{ gridColumn: 'span 2', borderBottom: '1px solid #f5f5f4', paddingBottom: '24px', marginBottom: '8px' }}>
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

                      <h4 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#78716c', fontWeight: 700, margin: '0 0 12px 0' }}>Order Logistics & Transit Status</h4>
                      
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

                      {/* Split Panel: Route Checkpoints vs Courier Partner Assignment */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', marginTop: '20px' }}>
                        
                        {/* Column 1: Route Checkpoints & Location Details */}
                        <div className="transit-route-details" style={{ border: '1px solid #e7e5e4', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                          <div style={{ background: '#fafaf9', padding: '10px 16px', borderBottom: '1px solid #e7e5e4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Activity size={14} color="#9d2706" /> Route Checkpoints & Location Details
                            </span>
                          </div>
                          
                          <div style={{ padding: '16px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            
                            {/* Point 1: Atelier Origin */}
                            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#9d2706', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #f3f4f6', boxShadow: '0 0 0 2px #9d2706' }}></div>
                                <div style={{ width: '2px', height: '35px', background: '#e4e4e7', margin: '4px 0' }}></div>
                              </div>
                              <div style={{ flex: 1, fontSize: '0.78rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <strong style={{ color: '#1c1917', fontFamily: 'Montserrat, sans-serif' }}>Origin Pick-Up: {factoryCity === 'Mumbai Atelier' ? 'Mumbai Central Atelier Terminal' : 'Jaipur Crafting Atelier Terminal'}</strong>
                                  <span style={{ background: '#f5f5f4', padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600, color: '#78716c', textTransform: 'uppercase' }}>
                                    {activeIndex >= 1 ? 'Departed' : 'Processing'}
                                  </span>
                                </div>
                                <p style={{ margin: '4px 0 0 0', color: '#444', fontWeight: 500 }}>
                                  🏢 Address: <span style={{ color: '#1c1917' }}>{factoryCity === 'Mumbai Atelier' ? 'Plot 12, Lower Parel Industrial Estate, Mumbai, Maharashtra - 400013' : 'A-4, Sector 5, Sitapura Industrial Area, Jaipur, Rajasthan - 302022'}</span>
                                </p>
                                <p style={{ margin: '4px 0 0 0', color: '#78716c', fontSize: '0.72rem' }}>
                                  📍 Coordinates: <code style={{ background: '#f5f5f4', padding: '2px 4px', borderRadius: '3px', color: '#b45309' }}>{factoryCoords[0]}° N, {factoryCoords[1]}° E</code>
                                </p>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.7rem', color: '#a1a1aa', fontStyle: 'italic' }}>
                                  🚚 Picked up from vendor by: <strong style={{ color: '#9d2706' }}>{selectedOrder.courier_partner || 'Unassigned Carrier'}</strong>
                                </p>
                              </div>
                            </div>

                            {/* Point 2: Transit Hub Checkpoint (conditional) */}
                            {transitCheckpoints.map((cp, cpIdx) => (
                              <div key={cpIdx} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: activeIndex === 3 ? '#9d2706' : activeIndex > 3 ? '#10B981' : '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #f3f4f6', boxShadow: `0 0 0 2px ${activeIndex >= 3 ? (activeIndex === 3 ? '#9d2706' : '#10B981') : '#e4e4e7'}` }}></div>
                                  <div style={{ width: '2px', height: '35px', background: '#e4e4e7', margin: '4px 0' }}></div>
                                </div>
                                <div style={{ flex: 1, fontSize: '0.78rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <strong style={{ color: '#1c1917', fontFamily: 'Montserrat, sans-serif' }}>Transit Checkpoint: {cp.name}</strong>
                                    <span style={{ background: activeIndex === 3 ? '#fffbeb' : activeIndex > 3 ? '#ecfdf5' : '#f5f5f4', padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600, color: activeIndex === 3 ? '#b45309' : activeIndex > 3 ? '#047857' : '#78716c', textTransform: 'uppercase' }}>
                                      {activeIndex === 3 ? 'Arrived / Sorting' : activeIndex > 3 ? 'Cleared' : 'Pending'}
                                    </span>
                                  </div>
                                  <p style={{ margin: '4px 0 0 0', color: '#444', fontWeight: 500 }}>
                                    🏢 Address: <span style={{ color: '#1c1917' }}>Terminal A-4 sorting complex, AB Road, Dewas Naka, Indore, Madhya Pradesh - 452010</span>
                                  </p>
                                  <p style={{ margin: '4px 0 0 0', color: '#78716c', fontSize: '0.72rem' }}>
                                    📍 Coordinates: <code style={{ background: '#f5f5f4', padding: '2px 4px', borderRadius: '3px', color: '#b45309' }}>{cp.lat.toFixed(4)}° N, {cp.lng.toFixed(4)}° E</code>
                                  </p>
                                  {activeIndex >= 3 && (
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.7rem', color: '#a1a1aa', fontStyle: 'italic' }}>
                                      📡 Location telemetry shared live by carrier: <strong style={{ color: '#1c1917' }}>{selectedOrder.courier_partner}</strong>
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}

                            {/* Point 3: Destination Customer Residence */}
                            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: isDelivered ? '#10B981' : '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #f3f4f6', boxShadow: `0 0 0 2px ${isDelivered ? '#10B981' : '#e4e4e7'}` }}></div>
                              </div>
                              <div style={{ flex: 1, fontSize: '0.78rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <strong style={{ color: '#1c1917', fontFamily: 'Montserrat, sans-serif' }}>Destination Residence Terminal ({customerCity})</strong>
                                  <span style={{ background: isDelivered ? '#ecfdf5' : '#f5f5f4', padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600, color: isDelivered ? '#047857' : '#78716c', textTransform: 'uppercase' }}>
                                    {isDelivered ? 'Delivered' : 'In Transit'}
                                  </span>
                                </div>
                                <p style={{ margin: '4px 0 0 0', color: '#444', fontWeight: 500 }}>
                                  🏢 Address: <span style={{ color: '#1c1917' }}>{selectedOrder.shipping_address?.address || '(No address available)'}, {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state} - {selectedOrder.shipping_address?.pincode}</span>
                                </p>
                                <p style={{ margin: '4px 0 0 0', color: '#78716c', fontSize: '0.72rem' }}>
                                  📍 Coordinates: <code style={{ background: '#f5f5f4', padding: '2px 4px', borderRadius: '3px', color: '#b45309' }}>{customerCoords[0].toFixed(4)}° N, {customerCoords[1].toFixed(4)}° E</code>
                                </p>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.7rem', color: '#a1a1aa', fontStyle: 'italic' }}>
                                  📦 Delivered by last-mile carrier: <strong style={{ color: '#10B981' }}>{selectedOrder.courier_partner || 'Unassigned Carrier'}</strong>
                                </p>
                              </div>
                            </div>

                          </div>
                        </div>

                        {/* Column 2: Courier & Shipment Assignment Control */}
                        <div className="transit-courier-assignment" style={{ border: '1px solid #e7e5e4', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', height: 'fit-content' }}>
                          <div style={{ background: '#fafaf9', padding: '10px 16px', borderBottom: '1px solid #e7e5e4' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Logistics Courier Assignment
                            </span>
                          </div>
                          
                          <div style={{ padding: '16px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {selectedOrder.courier_partner ? (
                              <div style={{ padding: '10px', background: '#ecfdf5', border: '1px solid #d1fae5', borderRadius: '8px', fontSize: '0.75rem' }}>
                                <div style={{ fontWeight: 700, color: '#065f46', marginBottom: '4px' }}>✅ Carrier Assigned</div>
                                <div style={{ color: '#047857' }}>Partner: <strong>{selectedOrder.courier_partner}</strong></div>
                                <div style={{ color: '#047857', marginTop: '2px' }}>Tracking Reference ID: <strong>{selectedOrder.tracking_number}</strong></div>
                              </div>
                            ) : (
                              <div style={{ padding: '10px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', fontSize: '0.75rem' }}>
                                <div style={{ fontWeight: 700, color: '#92400e', marginBottom: '4px' }}>⚠️ Awaiting Carrier Assignment</div>
                                <div style={{ color: '#b45309' }}>Please assign an official shipping partner and input the tracking ID to dispatch.</div>
                              </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#78716c', textTransform: 'uppercase' }}>Courier Partner</label>
                              <select 
                                value={courierPartner} 
                                onChange={(e) => setCourierPartner(e.target.value)} 
                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.78rem', background: '#fff' }}
                              >
                                <option value="">Select Courier Company</option>
                                <option value="BlueDart Express">BlueDart Express</option>
                                <option value="DHL Express">DHL Express</option>
                                <option value="Delhivery Premium">Delhivery Premium</option>
                                <option value="FedEx Priority">FedEx Priority</option>
                                <option value="Professional Couriers">Professional Couriers</option>
                              </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#78716c', textTransform: 'uppercase' }}>Tracking ID</label>
                              <input 
                                type="text" 
                                placeholder="e.g. BYD-BD-90812" 
                                value={trackingNumber} 
                                onChange={(e) => setTrackingNumber(e.target.value)} 
                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.78rem' }}
                              />
                            </div>

                            <button 
                              className="admin-btn-primary" 
                              onClick={saveCourierAssignment} 
                              disabled={savingOperational}
                              style={{ width: '100%', padding: '10px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', marginTop: '4px' }}
                            >
                              {savingOperational ? 'Saving...' : 'Update Courier Assignment'}
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })()}

                <div className="order-detail-section">
                  <h4>Customer</h4>
                  <p><strong>{selectedOrder.customer_name}</strong></p>
                  <p className="table-sub">{selectedOrder.customer_email}</p>
                  {selectedOrder.notes && (
                    <div style={{ marginTop: 12, background: '#fafaf9', padding: 8, borderRadius: 6, fontSize: '0.75rem', border: '1px solid #e7e5e4', color: '#78716c' }}>
                      <strong>Audit Notes:</strong> {selectedOrder.notes}
                    </div>
                  )}
                </div>
                <div className="order-detail-section">
                  <h4>Shipping</h4>
                  {selectedOrder.shipping_address && (
                    <p>{selectedOrder.shipping_address.name}<br />{selectedOrder.shipping_address.address}<br />{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} - {selectedOrder.shipping_address.pincode}<br />Ph: {selectedOrder.shipping_address.phone}</p>
                  )}
                </div>

                <div className="order-detail-section" style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid #f5f5f4', paddingTop: '16px', marginTop: '8px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fulfillment & Specifications</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem' }}>
                      <div>Order Classification: <strong>{selectedOrder.production_type === 'crafted' ? '✨ Custom Bespoke Shoe' : '📦 Ready-to-Ship Standard'}</strong></div>
                      {selectedOrder.production_type === 'crafted' && (
                        <>
                          <div>Crafted By: <strong style={{ textTransform: 'uppercase' }}>{selectedOrder.crafted_by || 'inhouse'}</strong></div>
                          {selectedOrder.fulfillment_vendor && (
                            <div>Vendor Workshop: <strong>{selectedOrder.fulfillment_vendor}</strong></div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Administrative Tracking</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem' }}>
                      <div>Estimated Delivery: <strong>{selectedOrder.estimated_delivery_date ? new Date(selectedOrder.estimated_delivery_date).toLocaleDateString() : 'Not Scheduled'}</strong></div>
                      <div>Logistics Carrier: <strong>{selectedOrder.courier_partner || 'Unassigned'}</strong></div>
                      {selectedOrder.tracking_number && (
                        <div>Tracking Number: <code style={{ background: '#f5f5f4', padding: '2px 4px', borderRadius: '3px' }}>{selectedOrder.tracking_number}</code></div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="order-detail-section" style={{ gridColumn: 'span 2' }}>
                  <h4>Items ({selectedOrder.items?.length})</h4>
                  {selectedOrder.items?.map((item, i) => (
                    <div key={i} className="order-item-line" style={{ padding: '8px 0', borderBottom: '1px solid #f5f5f4', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span><strong>{item.name}</strong> - Size {item.size}, {item.color}{item.material ? `, ${item.material}` : ''}{item.sole ? `, ${item.sole}` : ''} x{item.quantity}</span>
                      <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginTop: '12px', gap: '4px' }}>
                    <div className="order-total" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#9d2706' }}>Total: ₹{(selectedOrder.total_amount || 0).toLocaleString()}</div>
                    {selectedOrder.outstanding_amount > 0 && (
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', padding: '4px 8px', borderRadius: '4px' }}>
                        ⚠️ Outstanding customization balance to clear: ₹{selectedOrder.outstanding_amount.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
                {selectedOrder.status_history && (
                  <div className="order-detail-section" style={{ gridColumn: 'span 2' }}>
                    <h4>Status History</h4>
                    <div className="status-timeline" style={{ marginTop: '10px' }}>
                      {selectedOrder.status_history.map((entry, i) => (
                        <div key={i} className="timeline-entry" style={{ display: 'flex', gap: '12px', marginBottom: '8px', fontSize: '0.75rem' }}>
                          <span className={`timeline-dot status-${entry.status}`} style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d1d5db', display: 'inline-block', marginTop: '4px' }}></span>
                          <div><strong>{entry.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</strong> - {entry.note} <span className="table-sub">({new Date(entry.timestamp).toLocaleString()})</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
