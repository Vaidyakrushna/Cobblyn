"use client";
import React, { useState, useEffect } from 'react';
import { Eye, ChevronDown } from 'lucide-react';
import { api } from '../../api';

const ORDER_STATUSES = ['pending', 'confirmed', 'in_production', 'quality_check', 'shipped', 'delivered', 'cancelled'];

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

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

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const totalItems = orders.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const safePage = page > totalPages ? totalPages : page;
  const paginatedOrders = orders.slice((safePage - 1) * limit, safePage * limit);

  return (
    <div className="admin-page" data-testid="admin-orders">
      <div className="admin-page-header">
        <div><h1>Order Management</h1><p>Track and manage all customer orders</p></div>
      </div>

      <div className="admin-filters">
        {['all', ...ORDER_STATUSES].map(s => (
          <button key={s} className={`admin-filter-btn ${filter === s ? 'active' : ''}`} onClick={() => { setFilter(s); setPage(1); }}>
            {s === 'all' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {loading ? <div className="admin-loading">Loading...</div> : orders.length === 0 ? (
        <div className="admin-empty">No orders found</div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr><th>Order #</th><th>Customer</th><th>Items</th><th>Amount</th><th>Status</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {paginatedOrders.map(order => (
                <tr key={order.id} data-testid={`order-row-${order.id}`}>
                  <td><strong>{order.order_number}</strong></td>
                  <td>{order.customer_name}<br /><span className="table-sub">{order.customer_email}</span></td>
                  <td>{order.items?.length || 0} item(s)</td>
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
        <div className="admin-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="admin-modal admin-modal-lg" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setSelectedOrder(null)}>&times;</button>
            <h3>Order {selectedOrder.order_number}</h3>
            <div className="order-detail-grid">
              <div className="order-detail-section">
                <h4>Customer</h4>
                <p>{selectedOrder.customer_name}</p>
                <p className="table-sub">{selectedOrder.customer_email}</p>
              </div>
              <div className="order-detail-section">
                <h4>Shipping</h4>
                {selectedOrder.shipping_address && (
                  <p>{selectedOrder.shipping_address.name}<br />{selectedOrder.shipping_address.address}<br />{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} - {selectedOrder.shipping_address.pincode}<br />Ph: {selectedOrder.shipping_address.phone}</p>
                )}
              </div>
              <div className="order-detail-section">
                <h4>Items ({selectedOrder.items?.length})</h4>
                {selectedOrder.items?.map((item, i) => (
                  <div key={i} className="order-item-line">{item.name} - Size {item.size}, {item.color} x{item.quantity} - ₹{(item.price * item.quantity).toLocaleString()}</div>
                ))}
                <div className="order-total">Total: ₹{(selectedOrder.total_amount || 0).toLocaleString()}</div>
              </div>
              {selectedOrder.status_history && (
                <div className="order-detail-section">
                  <h4>Status History</h4>
                  <div className="status-timeline">
                    {selectedOrder.status_history.map((entry, i) => (
                      <div key={i} className="timeline-entry">
                        <span className={`timeline-dot status-${entry.status}`}></span>
                        <div><strong>{entry.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</strong><br /><span className="table-sub">{entry.note} - {new Date(entry.timestamp).toLocaleString()}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
