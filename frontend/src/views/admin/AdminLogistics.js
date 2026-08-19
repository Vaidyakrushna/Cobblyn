"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Truck, ArrowRight, Clipboard, Plus, CheckCircle, 
  Clock, AlertTriangle, User, RefreshCw, X, Download, Tag
} from 'lucide-react';
import { api } from '../../api';

function AdminLogistics() {
  const [activeTab, setActiveTab] = useState('summary'); // summary, handovers, shipments, inbound, returns
  
  // Data Lists
  const [summary, setSummary] = useState({ active_handovers: 0, in_transit_shipments: 0, pending_returns: 0, pending_inbound: 0 });
  const [handovers, setHandovers] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [inbound, setInbound] = useState([]);
  const [returns, setReturns] = useState([]);
  
  // Reference Lists
  const [rawMaterials, setRawMaterials] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Forms
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [handoverForm, setHandoverForm] = useState({
    workshop_id: '', material_id: '', quantity: '', expected_return_date: '', notes: ''
  });

  const [showCompleteHandoverModal, setShowCompleteHandoverModal] = useState(false);
  const [selectedHandover, setSelectedHandover] = useState(null);
  const [completeForm, setCompleteForm] = useState({
    yield_qty: '', scrap_qty: '', notes: ''
  });

  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [shipmentForm, setShipmentForm] = useState({
    order_id: '', carrier_name: 'Shiprocket', tracking_no: '', shipping_charges: '0', estimated_delivery: '', notes: ''
  });

  const [showInboundModal, setShowInboundModal] = useState(false);
  const [inboundForm, setInboundForm] = useState({
    supplier_name: '', item_name: '', quantity: '', expected_delivery_date: '', notes: '', material_id: ''
  });

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnForm, setReturnForm] = useState({
    order_id: '', customer_name: '', reason: '', fit_adjustments: '', notes: ''
  });

  // Fetch Logic
  const fetchSummary = useCallback(async () => {
    try {
      const data = await api.request('/admin/logistics/summary');
      setSummary(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchHandovers = useCallback(async () => {
    try {
      const data = await api.request('/admin/logistics/handovers');
      setHandovers(data.handovers || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchShipments = useCallback(async () => {
    try {
      const data = await api.request('/admin/logistics/shipments');
      setShipments(data.shipments || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchInbound = useCallback(async () => {
    try {
      const data = await api.request('/admin/logistics/inbound');
      setInbound(data.inbound || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchReturns = useCallback(async () => {
    try {
      const data = await api.request('/admin/logistics/returns');
      setReturns(data.returns || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchRawMaterials = useCallback(async () => {
    try {
      const data = await api.request('/admin/raw-materials');
      setRawMaterials(data.materials || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchWorkshops = useCallback(async () => {
    try {
      const data = await api.request('/admin/vendors');
      setWorkshops(data.vendors || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await api.request('/admin/orders');
      setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchSummary(),
      fetchHandovers(),
      fetchShipments(),
      fetchInbound(),
      fetchReturns(),
      fetchRawMaterials(),
      fetchWorkshops(),
      fetchOrders()
    ]);
    setLoading(false);
  }, [fetchSummary, fetchHandovers, fetchShipments, fetchInbound, fetchReturns, fetchRawMaterials, fetchWorkshops, fetchOrders]);

  useEffect(() => {
    setMounted(true);
    loadAllData();
  }, []);

  // Handover Handlers
  const handleCreateHandover = async (e) => {
    e.preventDefault();
    const w = workshops.find(v => v.id === handoverForm.workshop_id);
    const m = rawMaterials.find(rm => rm.material_id === handoverForm.material_id);
    if (!w || !m) {
      alert("Invalid workshop or material selection.");
      return;
    }
    try {
      await api.request('/admin/logistics/handovers', {
        method: 'POST',
        body: JSON.stringify({
          workshop_id: handoverForm.workshop_id,
          workshop_name: w.name,
          material_id: handoverForm.material_id,
          material_name: m.name,
          quantity: parseFloat(handoverForm.quantity),
          expected_return_date: handoverForm.expected_return_date || null,
          notes: handoverForm.notes
        })
      });
      setShowHandoverModal(false);
      setHandoverForm({ workshop_id: '', material_id: '', quantity: '', expected_return_date: '', notes: '' });
      fetchHandovers();
      fetchSummary();
    } catch (err) {
      alert("Failed to log handover: " + err.message);
    }
  };

  const handleOpenCompleteHandover = (h) => {
    setSelectedHandover(h);
    setCompleteForm({ yield_qty: h.quantity, scrap_qty: '0', notes: '' });
    setShowCompleteHandoverModal(true);
  };

  const handleCompleteHandoverSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHandover) return;
    try {
      await api.request(`/admin/logistics/handovers/${selectedHandover.id}/complete`, {
        method: 'PUT',
        body: JSON.stringify({
          yield_qty: parseFloat(completeForm.yield_qty || '0'),
          scrap_qty: parseFloat(completeForm.scrap_qty || '0'),
          notes: completeForm.notes
        })
      });
      setShowCompleteHandoverModal(false);
      setSelectedHandover(null);
      fetchHandovers();
      fetchSummary();
    } catch (err) {
      alert("Failed to complete handover: " + err.message);
    }
  };

  // Shipment Handlers
  const handleRegisterShipment = async (e) => {
    e.preventDefault();
    if (!shipmentForm.order_id) {
      alert("Please select a packed order.");
      return;
    }
    try {
      await api.request(`/admin/logistics/shipments/${shipmentForm.order_id}`, {
        method: 'POST',
        body: JSON.stringify({
          carrier_name: shipmentForm.carrier_name,
          tracking_no: shipmentForm.tracking_no,
          shipping_charges: parseFloat(shipmentForm.shipping_charges || '0'),
          estimated_delivery: shipmentForm.estimated_delivery || null,
          notes: shipmentForm.notes
        })
      });
      setShowShipmentModal(false);
      setShipmentForm({ order_id: '', carrier_name: 'Shiprocket', tracking_no: '', shipping_charges: '0', estimated_delivery: '', notes: '' });
      fetchShipments();
      fetchSummary();
    } catch (err) {
      alert("Failed to register shipment: " + err.message);
    }
  };

  const handleUpdateShipmentStatus = async (shipmentId, status) => {
    try {
      await api.request(`/admin/logistics/shipments/${shipmentId}/status?status=${status}`, {
        method: 'PUT'
      });
      fetchShipments();
      fetchSummary();
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  // Inbound Handlers
  const handleCreateInbound = async (e) => {
    e.preventDefault();
    try {
      await api.request('/admin/logistics/inbound', {
        method: 'POST',
        body: JSON.stringify({
          supplier_name: inboundForm.supplier_name,
          item_name: inboundForm.item_name,
          quantity: parseFloat(inboundForm.quantity),
          expected_delivery_date: inboundForm.expected_delivery_date || null,
          notes: inboundForm.notes,
          material_id: inboundForm.material_id || null
        })
      });
      setShowInboundModal(false);
      setInboundForm({ supplier_name: '', item_name: '', quantity: '', expected_delivery_date: '', notes: '', material_id: '' });
      fetchInbound();
      fetchSummary();
    } catch (err) {
      alert("Failed to log inbound consignment: " + err.message);
    }
  };

  const handleReceiveInbound = async (inboundId) => {
    const confirmRec = window.confirm("Mark this raw material cargo shipment as fully received and sync with inventory levels?");
    if (!confirmRec) return;
    try {
      await api.request(`/admin/logistics/inbound/${inboundId}/receive`, {
        method: 'PUT'
      });
      fetchInbound();
      fetchSummary();
    } catch (err) {
      alert("Failed to receive consignment: " + err.message);
    }
  };

  // Returns Handlers
  const handleRegisterReturn = async (e) => {
    e.preventDefault();
    try {
      await api.request('/admin/logistics/returns', {
        method: 'POST',
        body: JSON.stringify(returnForm)
      });
      setShowReturnModal(false);
      setReturnForm({ order_id: '', customer_name: '', reason: '', fit_adjustments: '', notes: '' });
      fetchReturns();
      fetchSummary();
    } catch (err) {
      alert("Failed to register return: " + err.message);
    }
  };

  const handleUpdateReturnStatus = async (returnId, status) => {
    try {
      await api.request(`/admin/logistics/returns/${returnId}/status?status=${status}`, {
        method: 'PUT'
      });
      fetchReturns();
      fetchSummary();
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  if (!mounted || loading) return <div className="admin-loading" style={{ padding: '24px', color: '#78716c' }}>Loading logistics channels…</div>;

  return (
    <div className="admin-page" data-testid="admin-logistics-page" style={{ padding: '24px', background: '#F7F5F2', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', color: '#1c1917', margin: 0 }}>Logistics & Shipment Tracking</h1>
          <p style={{ fontSize: '0.85rem', color: '#78716c', margin: '4px 0 0 0' }}>Manage artisan workshop handovers, outbound customer parcels, inbound tannery consignments, and refit exchanges</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={loadAllData}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #e7e5e4', padding: '8px 16px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, color: '#44403c', cursor: 'pointer' }}
          >
            <RefreshCw size={14} /> Refresh Channels
          </button>
        </div>
      </div>

      {/* Overview stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div 
          onClick={() => setActiveTab('summary')}
          style={{ background: '#fff', border: '1px solid #e7e5e4', padding: '20px', borderRadius: '12px', cursor: 'pointer', borderLeft: activeTab === 'summary' ? '4px solid #9d2706' : '1px solid #e7e5e4' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.7rem', color: '#78716c', fontWeight: 600, textTransform: 'uppercase' }}>Artisan Handovers</span>
            <span style={{ color: '#9d2706', background: '#fff1f2', padding: '4px', borderRadius: '50%' }}><Clipboard size={16} /></span>
          </div>
          <strong style={{ fontSize: '1.4rem', color: '#1c1917' }}>{summary.active_handovers} Active</strong>
          <div style={{ fontSize: '0.65rem', color: '#a8a29e', marginTop: '4px' }}>Raw materials at workshops</div>
        </div>

        <div 
          onClick={() => setActiveTab('shipments')}
          style={{ background: '#fff', border: '1px solid #e7e5e4', padding: '20px', borderRadius: '12px', cursor: 'pointer', borderLeft: activeTab === 'shipments' ? '4px solid #9d2706' : '1px solid #e7e5e4' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.7rem', color: '#78716c', fontWeight: 600, textTransform: 'uppercase' }}>Customer Shipments</span>
            <span style={{ color: '#16a34a', background: '#f0fdf4', padding: '4px', borderRadius: '50%' }}><Truck size={16} /></span>
          </div>
          <strong style={{ fontSize: '1.4rem', color: '#16a34a' }}>{summary.in_transit_shipments} Transit</strong>
          <div style={{ fontSize: '0.65rem', color: '#78716c', marginTop: '4px' }}>Outbound customer orders</div>
        </div>

        <div 
          onClick={() => setActiveTab('inbound')}
          style={{ background: '#fff', border: '1px solid #e7e5e4', padding: '20px', borderRadius: '12px', cursor: 'pointer', borderLeft: activeTab === 'inbound' ? '4px solid #9d2706' : '1px solid #e7e5e4' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.7rem', color: '#78716c', fontWeight: 600, textTransform: 'uppercase' }}>Tannery Inbounds</span>
            <span style={{ color: '#2563eb', background: '#eff6ff', padding: '4px', borderRadius: '50%' }}><Layers size={16} /></span>
          </div>
          <strong style={{ fontSize: '1.4rem', color: '#2563eb' }}>{summary.pending_inbound} Pending</strong>
          <div style={{ fontSize: '0.65rem', color: '#78716c', marginTop: '4px' }}>Supplier consignments en route</div>
        </div>

        <div 
          onClick={() => setActiveTab('returns')}
          style={{ background: '#fff', border: '1px solid #e7e5e4', padding: '20px', borderRadius: '12px', cursor: 'pointer', borderLeft: activeTab === 'returns' ? '4px solid #9d2706' : '1px solid #e7e5e4' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.7rem', color: '#78716c', fontWeight: 600, textTransform: 'uppercase' }}>Refits & Returns</span>
            <span style={{ color: '#d97706', background: '#fffbeb', padding: '4px', borderRadius: '50%' }}><RefreshCw size={16} /></span>
          </div>
          <strong style={{ fontSize: '1.4rem', color: '#ca8a04' }}>{summary.pending_returns} Cases</strong>
          <div style={{ fontSize: '0.65rem', color: '#a8a29e', marginTop: '4px' }}>Active size fit corrections</div>
        </div>
      </div>

      {/* Main Tab bar navigation */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e7e5e4', marginBottom: '24px', flexWrap: 'wrap', gap: '8px' }}>
        <button 
          onClick={() => setActiveTab('summary')}
          style={{ padding: '12px 18px', background: 'transparent', border: 'none', borderBottom: activeTab === 'summary' ? '3px solid #9d2706' : 'none', color: activeTab === 'summary' ? '#9d2706' : '#78716c', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
        >
          🛠️ Artisan Handovers
        </button>
        <button 
          onClick={() => setActiveTab('shipments')}
          style={{ padding: '12px 18px', background: 'transparent', border: 'none', borderBottom: activeTab === 'shipments' ? '3px solid #9d2706' : 'none', color: activeTab === 'shipments' ? '#9d2706' : '#78716c', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
        >
          📦 Outbound Parcels
        </button>
        <button 
          onClick={() => setActiveTab('inbound')}
          style={{ padding: '12px 18px', background: 'transparent', border: 'none', borderBottom: activeTab === 'inbound' ? '3px solid #9d2706' : 'none', color: activeTab === 'inbound' ? '#9d2706' : '#78716c', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
        >
          🐄 Incoming Cargo
        </button>
        <button 
          onClick={() => setActiveTab('returns')}
          style={{ padding: '12px 18px', background: 'transparent', border: 'none', borderBottom: activeTab === 'returns' ? '3px solid #9d2706' : 'none', color: activeTab === 'returns' ? '#9d2706' : '#78716c', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
        >
          🔄 Reverse Returns & Exchanges
        </button>
      </div>

      {/* 1. ARTISAN HANDOVERS TAB */}
      {activeTab === 'summary' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#1c1917', margin: 0 }}>Materials Dispatched to External Artisan Workshops</h3>
            <button 
              onClick={() => setShowHandoverModal(true)}
              style={{ background: '#9d2706', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} /> Dispatch Materials
            </button>
          </div>

          <div className="admin-table-wrapper" style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: '12px', padding: '8px' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e7e5e4' }}>
                  <th style={{ padding: '12px' }}>Artisan Workshop</th>
                  <th style={{ padding: '12px' }}>Material Sent</th>
                  <th style={{ padding: '12px' }}>Quantity dispatched</th>
                  <th style={{ padding: '12px' }}>Expected Return</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px' }}>Yield / Waste Results</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Clear Action</th>
                </tr>
              </thead>
              <tbody>
                {handovers.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#a8a29e', fontSize: '0.78rem' }}>No active material dispatches logged.</td>
                  </tr>
                ) : (
                  handovers.map(h => (
                    <tr key={h.id} style={{ borderBottom: '1px solid #f5f5f4' }}>
                      <td style={{ padding: '12px' }}>
                        <strong style={{ fontSize: '0.82rem', color: '#1c1917' }}>{h.workshop_name}</strong>
                        <div style={{ fontSize: '0.68rem', color: '#78716c', marginTop: '2px' }}>Logged: {new Date(h.created_at).toLocaleDateString('en-IN')}</div>
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.8rem', color: '#44403c' }}>{h.material_name}</td>
                      <td style={{ padding: '12px', fontSize: '0.8rem', fontWeight: 600, color: '#1c1917' }}>{h.quantity} units</td>
                      <td style={{ padding: '12px', fontSize: '0.75rem', color: '#78716c' }}>{h.expected_return_date ? new Date(h.expected_return_date).toLocaleDateString('en-IN') : '—'}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          fontSize: '0.62rem',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: h.status === 'at_workshop' ? '#fee2e2' : '#dcfce7',
                          color: h.status === 'at_workshop' ? '#ef4444' : '#16a34a'
                        }}>
                          {h.status === 'at_workshop' ? 'At Workshop' : 'Returned'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.72rem', color: '#44403c' }}>
                        {h.status === 'returned' ? (
                          <div>
                            <div>Yield Pairs: <strong>{h.yield_qty || 0}</strong></div>
                            <div style={{ color: '#dc2626', marginTop: '2px' }}>Scrap Waste: <strong>{h.scrap_qty || 0}</strong></div>
                          </div>
                        ) : 'Pending Return...'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {h.status === 'at_workshop' ? (
                          <button
                            onClick={() => handleOpenCompleteHandover(h)}
                            style={{ background: '#9d2706', border: 'none', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Receive Crafted
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600 }}>✓ Logged</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. CUSTOMER OUTBOUND PARCELS TAB */}
      {activeTab === 'shipments' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#1c1917', margin: 0 }}>Domestic & International Courier Shipments</h3>
            <button 
              onClick={() => setShowShipmentModal(true)}
              style={{ background: '#9d2706', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} /> Register Shipment Dispatch
            </button>
          </div>

          <div className="admin-table-wrapper" style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: '12px', padding: '8px' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e7e5e4' }}>
                  <th style={{ padding: '12px' }}>Order Reference & Customer</th>
                  <th style={{ padding: '12px' }}>Courier Partner</th>
                  <th style={{ padding: '12px' }}>Tracking number</th>
                  <th style={{ padding: '12px' }}>Est. Delivery Date</th>
                  <th style={{ padding: '12px' }}>Transit Status</th>
                  <th style={{ padding: '12px' }}>Shipping Charges</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Transition Status</th>
                </tr>
              </thead>
              <tbody>
                {shipments.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#a8a29e', fontSize: '0.78rem' }}>No customer shipments registered.</td>
                  </tr>
                ) : (
                  shipments.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f5f5f4' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#9d2706', fontWeight: 700 }}>#{s.order_id?.substring(18).toUpperCase() || 'ORDER'}</div>
                        <strong style={{ fontSize: '0.82rem', color: '#1c1917' }}>{s.customer_name}</strong>
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.78rem', color: '#44403c' }}>{s.carrier_name}</td>
                      <td style={{ padding: '12px', fontSize: '0.72rem', color: '#78716c', fontFamily: 'monospace' }}>{s.tracking_no}</td>
                      <td style={{ padding: '12px', fontSize: '0.75rem', color: '#78716c' }}>{s.estimated_delivery ? new Date(s.estimated_delivery).toLocaleDateString('en-IN') : '—'}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          fontSize: '0.62rem',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: s.status === 'delivered' ? '#dcfce7' : s.status === 'in_transit' ? '#eff6ff' : '#fee2e2',
                          color: s.status === 'delivered' ? '#16a34a' : s.status === 'in_transit' ? '#2563eb' : '#ef4444'
                        }}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.8rem', fontWeight: 600, color: '#1c1917' }}>INR {s.shipping_charges || '0.00'}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {s.status === 'in_transit' && (
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleUpdateShipmentStatus(s.id, 'delivered')}
                              style={{ background: '#dcfce7', border: '1px solid #b2f2bb', color: '#16a34a', padding: '4px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Delivered
                            </button>
                            <button
                              onClick={() => handleUpdateShipmentStatus(s.id, 'returned')}
                              style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Returned
                            </button>
                          </div>
                        )}
                        {s.status === 'delivered' && (
                          <span style={{ fontSize: '0.72rem', color: '#16a34a' }}>Delivered on {new Date(s.delivered_at).toLocaleDateString('en-IN')}</span>
                        )}
                        {s.status === 'returned' && (
                          <span style={{ fontSize: '0.72rem', color: '#dc2626' }}>RTO Returned</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. SUPPLIER INCOMING CARGO TAB */}
      {activeTab === 'inbound' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#1c1917', margin: 0 }}>Raw Material Consignment Cargoes (Tanneries & Sole Suppliers)</h3>
            <button 
              onClick={() => setShowInboundModal(true)}
              style={{ background: '#9d2706', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} /> Log Incoming Shipment
            </button>
          </div>

          <div className="admin-table-wrapper" style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: '12px', padding: '8px' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e7e5e4' }}>
                  <th style={{ padding: '12px' }}>Supplier / Tannery</th>
                  <th style={{ padding: '12px' }}>Material Consignment</th>
                  <th style={{ padding: '12px' }}>Expected Quantity</th>
                  <th style={{ padding: '12px' }}>Est. Receipt Date</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px' }}>Notes / Reference</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Receipt Action</th>
                </tr>
              </thead>
              <tbody>
                {inbound.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#a8a29e', fontSize: '0.78rem' }}>No incoming supplier shipments recorded.</td>
                  </tr>
                ) : (
                  inbound.map(cargo => (
                    <tr key={cargo.id} style={{ borderBottom: '1px solid #f5f5f4' }}>
                      <td style={{ padding: '12px' }}>
                        <strong style={{ fontSize: '0.82rem', color: '#1c1917' }}>{cargo.supplier_name}</strong>
                        <div style={{ fontSize: '0.68rem', color: '#78716c', marginTop: '2px' }}>Logged: {new Date(cargo.created_at).toLocaleDateString('en-IN')}</div>
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.8rem', color: '#44403c' }}>{cargo.item_name}</td>
                      <td style={{ padding: '12px', fontSize: '0.8rem', fontWeight: 600, color: '#1c1917' }}>{cargo.quantity} units</td>
                      <td style={{ padding: '12px', fontSize: '0.75rem', color: '#78716c' }}>{cargo.expected_delivery_date ? new Date(cargo.expected_delivery_date).toLocaleDateString('en-IN') : '—'}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          fontSize: '0.62rem',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: cargo.status === 'received' ? '#dcfce7' : '#eff6ff',
                          color: cargo.status === 'received' ? '#16a34a' : '#2563eb'
                        }}>
                          {cargo.status === 'received' ? 'Received' : 'In Transit'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.72rem', color: '#78716c' }}>
                        {cargo.notes || '—'}
                        {cargo.material_id && (
                          <div style={{ color: '#ca8a04', fontWeight: 600, fontSize: '0.65rem', marginTop: '4px' }}>⚡ Auto Inventory Stock Sync enabled</div>
                        )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {cargo.status === 'in_transit' ? (
                          <button
                            onClick={() => handleReceiveInbound(cargo.id)}
                            style={{ background: '#9d2706', border: 'none', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Mark Arrived
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600 }}>Arrived on {new Date(cargo.received_at).toLocaleDateString('en-IN')}</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. REVERSE LOGISTICS TAB */}
      {activeTab === 'returns' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#1c1917', margin: 0 }}>Reverse Returns, Exchanges, & Custom Refits</h3>
            <button 
              onClick={() => setShowReturnModal(true)}
              style={{ background: '#9d2706', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} /> Log Return Case
            </button>
          </div>

          <div className="admin-table-wrapper" style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: '12px', padding: '8px' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e7e5e4' }}>
                  <th style={{ padding: '12px' }}>Order ID & Customer</th>
                  <th style={{ padding: '12px' }}>Reason for Return</th>
                  <th style={{ padding: '12px' }}>Custom Fit Adjustments required</th>
                  <th style={{ padding: '12px' }}>Registered Date</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Transition State</th>
                </tr>
              </thead>
              <tbody>
                {returns.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#a8a29e', fontSize: '0.78rem' }}>No return exchanges registered.</td>
                  </tr>
                ) : (
                  returns.map(ret => (
                    <tr key={ret.id} style={{ borderBottom: '1px solid #f5f5f4' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#9d2706', fontWeight: 700 }}>#{ret.order_id?.substring(18).toUpperCase() || 'ORDER'}</div>
                        <strong style={{ fontSize: '0.82rem', color: '#1c1917' }}>{ret.customer_name}</strong>
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.78rem', color: '#44403c' }}>{ret.reason}</td>
                      <td style={{ padding: '12px', fontSize: '0.75rem', color: '#9d2706', fontStyle: 'italic', fontWeight: 600 }}>{ret.fit_adjustments || 'No adjustments noted.'}</td>
                      <td style={{ padding: '12px', fontSize: '0.75rem', color: '#78716c' }}>{new Date(ret.created_at).toLocaleDateString('en-IN')}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          fontSize: '0.62rem',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: ret.status === 'completed' ? '#dcfce7' : ret.status === 'in_transit' ? '#eff6ff' : '#fee2e2',
                          color: ret.status === 'completed' ? '#16a34a' : ret.status === 'in_transit' ? '#2563eb' : '#ef4444'
                        }}>
                          {ret.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {ret.status === 'registered' && (
                          <button
                            onClick={() => handleUpdateReturnStatus(ret.id, 'in_transit')}
                            style={{ background: '#eff6ff', border: '1px solid #d0e2ff', color: '#2563eb', padding: '4px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Set In Transit
                          </button>
                        )}
                        {ret.status === 'in_transit' && (
                          <button
                            onClick={() => handleUpdateReturnStatus(ret.id, 'completed')}
                            style={{ background: '#dcfce7', border: '1px solid #b2f2bb', color: '#16a34a', padding: '4px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Mark Resolved
                          </button>
                        )}
                        {ret.status === 'completed' && (
                          <span style={{ fontSize: '0.72rem', color: '#16a34a' }}>Resolved on {new Date(ret.completed_at).toLocaleDateString('en-IN')}</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODALS BLOCK --- */}

      {/* 1. DISPATCH MATERIALS TO ARTISANS MODAL */}
      {showHandoverModal && (
        <div className="admin-modal-overlay" onClick={() => setShowHandoverModal(false)} style={{ zIndex: 1200 }}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <button className="admin-modal-close" onClick={() => setShowHandoverModal(false)}><X size={18} /></button>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', marginBottom: '16px' }}>Dispatch Raw Materials to Workshop</h3>
            <form onSubmit={handleCreateHandover} className="admin-form">
              <div className="af-field">
                <label>Select Workshop Vendor *</label>
                <select value={handoverForm.workshop_id} onChange={e => setHandoverForm({...handoverForm, workshop_id: e.target.value})} required>
                  <option value="">-- Choose Workshop --</option>
                  {workshops.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div className="af-row">
                <div className="af-field">
                  <label>Select Raw Material SKU *</label>
                  <select value={handoverForm.material_id} onChange={e => setHandoverForm({...handoverForm, material_id: e.target.value})} required>
                    <option value="">-- Choose Material --</option>
                    {rawMaterials.map(rm => (
                      <option key={rm.id} value={rm.material_id}>{rm.name} ({rm.category})</option>
                    ))}
                  </select>
                </div>
                <div className="af-field">
                  <label>Quantity Dispatched *</label>
                  <input type="number" step="any" min="0.1" value={handoverForm.quantity} onChange={e => setHandoverForm({...handoverForm, quantity: e.target.value})} required />
                </div>
              </div>

              <div className="af-field">
                <label>Expected Return Date (Optional)</label>
                <input type="date" value={handoverForm.expected_return_date} onChange={e => setHandoverForm({...handoverForm, expected_return_date: e.target.value})} />
              </div>

              <div className="af-field">
                <label>Dispatch Handover Notes</label>
                <textarea rows="3" placeholder="Specify order number, batch references or instructions..." value={handoverForm.notes} onChange={e => setHandoverForm({...handoverForm, notes: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #e7e5e4', borderRadius: '6px', fontSize: '0.78rem' }} />
              </div>

              <button type="submit" className="admin-btn-primary" style={{ width: '100%', marginTop: '12px' }}>Confirm Material Dispatch</button>
            </form>
          </div>
        </div>
      )}

      {/* 2. RECEIVE HANDOVER COMPLETE MODAL */}
      {showCompleteHandoverModal && selectedHandover && (
        <div className="admin-modal-overlay" onClick={() => { setShowCompleteHandoverModal(false); setSelectedHandover(null); }} style={{ zIndex: 1200 }}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => { setShowCompleteHandoverModal(false); setSelectedHandover(null); }}><X size={18} /></button>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', marginBottom: '8px' }}>Receive Completed Artisan Crafted Units</h3>
            <p style={{ fontSize: '0.75rem', color: '#78716c', marginBottom: '16px' }}>Review yield statistics from **{selectedHandover.workshop_name}**</p>
            
            <form onSubmit={handleCompleteHandoverSubmit} className="admin-form">
              <div className="af-row">
                <div className="af-field">
                  <label>Yield Product/Upper Pairs *</label>
                  <input type="number" step="any" value={completeForm.yield_qty} onChange={e => setCompleteForm({...completeForm, yield_qty: e.target.value})} required />
                </div>
                <div className="af-field">
                  <label>Scrap / Wastage Material Qty</label>
                  <input type="number" step="any" value={completeForm.scrap_qty} onChange={e => setCompleteForm({...completeForm, scrap_qty: e.target.value})} required />
                </div>
              </div>
              <div className="af-field">
                <label>Yield Quality & Handover Notes</label>
                <textarea rows="3" placeholder="Inspect stitching quality, lasting defects, etc." value={completeForm.notes} onChange={e => setCompleteForm({...completeForm, notes: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #e7e5e4', borderRadius: '6px', fontSize: '0.78rem' }} />
              </div>
              <button type="submit" className="admin-btn-primary" style={{ width: '100%', marginTop: '12px' }}>Confirm Material Receipt & Log Yield</button>
            </form>
          </div>
        </div>
      )}

      {/* 3. REGISTER OUTBOUND DISPATCH MODAL */}
      {showShipmentModal && (
        <div className="admin-modal-overlay" onClick={() => setShowShipmentModal(false)} style={{ zIndex: 1200 }}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <button className="admin-modal-close" onClick={() => setShowShipmentModal(false)}><X size={18} /></button>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', marginBottom: '16px' }}>Register Customer Shipment Dispatch</h3>
            <form onSubmit={handleRegisterShipment} className="admin-form">
              <div className="af-field">
                <label>Select Customer Order *</label>
                <select value={shipmentForm.order_id} onChange={e => setOrderForm(e)} required>
                  <option value="">-- Pick Order --</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>
                      Order #{o.id?.substring(18).toUpperCase()} - {o.shipping_address?.name || 'Customer'} (Status: {o.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="af-row">
                <div className="af-field">
                  <label>Courier Partner *</label>
                  <select value={shipmentForm.carrier_name} onChange={e => setShipmentForm({...shipmentForm, carrier_name: e.target.value})} required>
                    <option value="Shiprocket">Shiprocket (Aggregator)</option>
                    <option value="Delhivery">Delhivery</option>
                    <option value="Blue Dart">Blue Dart</option>
                    <option value="DHL Express">DHL Express</option>
                    <option value="FedEx">FedEx</option>
                  </select>
                </div>
                <div className="af-field">
                  <label>Tracking Number (AWB) *</label>
                  <input type="text" placeholder="AWB Tracking ID" value={shipmentForm.tracking_no} onChange={e => setShipmentForm({...shipmentForm, tracking_no: e.target.value})} required />
                </div>
              </div>

              <div className="af-row">
                <div className="af-field">
                  <label>Shipping Fee Paid (INR)</label>
                  <input type="number" step="any" value={shipmentForm.shipping_charges} onChange={e => setShipmentForm({...shipmentForm, shipping_charges: e.target.value})} />
                </div>
                <div className="af-field">
                  <label>Est. Delivery Date</label>
                  <input type="date" value={shipmentForm.estimated_delivery} onChange={e => setShipmentForm({...shipmentForm, estimated_delivery: e.target.value})} />
                </div>
              </div>

              <div className="af-field">
                <label>Dispatch / Packaging Notes</label>
                <textarea rows="2" placeholder="Specify fragile indicators, special double box packing, etc." value={shipmentForm.notes} onChange={e => setShipmentForm({...shipmentForm, notes: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #e7e5e4', borderRadius: '6px', fontSize: '0.78rem' }} />
              </div>

              <button type="submit" className="admin-btn-primary" style={{ width: '100%', marginTop: '12px' }}>Mark Shipped & Set Tracking</button>
            </form>
          </div>
        </div>
      )}

      {/* 4. LOG INBOUND MODAL */}
      {showInboundModal && (
        <div className="admin-modal-overlay" onClick={() => setShowInboundModal(false)} style={{ zIndex: 1200 }}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <button className="admin-modal-close" onClick={() => setShowInboundModal(false)}><X size={18} /></button>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', marginBottom: '16px' }}>Log Inbound Material Consignment Cargo</h3>
            <form onSubmit={handleCreateInbound} className="admin-form">
              <div className="af-field">
                <label>Supplier / Tannery Name *</label>
                <input type="text" placeholder="e.g. Chennai Tannery Leather Corp" value={inboundForm.supplier_name} onChange={e => setInboundForm({...inboundForm, supplier_name: e.target.value})} required />
              </div>

              <div className="af-field">
                <label>Consignment Cargo Details (Item name) *</label>
                <input type="text" placeholder="e.g. 10 Leather rolls Goodyearwelt skins" value={inboundForm.item_name} onChange={e => setInboundForm({...inboundForm, item_name: e.target.value})} required />
              </div>

              <div className="af-row">
                <div className="af-field">
                  <label>Consignment Quantity *</label>
                  <input type="number" step="any" min="0.1" value={inboundForm.quantity} onChange={e => setInboundForm({...inboundForm, quantity: e.target.value})} required />
                </div>
                <div className="af-field">
                  <label>Associate Raw Material SKU (For Auto Inventory Sync)</label>
                  <select value={inboundForm.material_id} onChange={e => setInboundForm({...inboundForm, material_id: e.target.value})}>
                    <option value="">-- Choose Material SKU --</option>
                    {rawMaterials.map(rm => (
                      <option key={rm.id} value={rm.material_id}>{rm.name} ({rm.category})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="af-field">
                <label>Expected Delivery Date</label>
                <input type="date" value={inboundForm.expected_delivery_date} onChange={e => setInboundForm({...inboundForm, expected_delivery_date: e.target.value})} />
              </div>

              <div className="af-field">
                <label>Cargo Shipment Notes</label>
                <textarea rows="2" placeholder="Tracking references, freight details, customs info, etc." value={inboundForm.notes} onChange={e => setInboundForm({...inboundForm, notes: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #e7e5e4', borderRadius: '6px', fontSize: '0.78rem' }} />
              </div>

              <button type="submit" className="admin-btn-primary" style={{ width: '100%', marginTop: '12px' }}>Register Incoming Cargo</button>
            </form>
          </div>
        </div>
      )}

      {/* 5. LOG CUSTOMER RETURN MODAL */}
      {showReturnModal && (
        <div className="admin-modal-overlay" onClick={() => setShowReturnModal(false)} style={{ zIndex: 1200 }}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <button className="admin-modal-close" onClick={() => setShowReturnModal(false)}><X size={18} /></button>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', marginBottom: '16px' }}>Register Return & Refit Request</h3>
            <form onSubmit={handleRegisterReturn} className="admin-form">
              <div className="af-row">
                <div className="af-field">
                  <label>Order ID Reference *</label>
                  <input type="text" placeholder="e.g. 64d92a10b429384920" value={returnForm.order_id} onChange={e => setReturnForm({...returnForm, order_id: e.target.value})} required />
                </div>
                <div className="af-field">
                  <label>Customer Name *</label>
                  <input type="text" placeholder="Full Name" value={returnForm.customer_name} onChange={e => setReturnForm({...returnForm, customer_name: e.target.value})} required />
                </div>
              </div>

              <div className="af-field">
                <label>Reason for return / Fit Issue *</label>
                <input type="text" placeholder="e.g. Too tight around instep, heel slips" value={returnForm.reason} onChange={e => setReturnForm({...returnForm, reason: e.target.value})} required />
              </div>

              <div className="af-field">
                <label>Fit Adjustment Instructions *</label>
                <input type="text" placeholder="e.g. Stretch width by 0.5 size, pad heel grips" value={returnForm.fit_adjustments} onChange={e => setReturnForm({...returnForm, fit_adjustments: e.target.value})} required />
              </div>

              <div className="af-field">
                <label>Case Notes</label>
                <textarea rows="2" placeholder="Actionable directions for in-house artisans..." value={returnForm.notes} onChange={e => setReturnForm({...returnForm, notes: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #e7e5e4', borderRadius: '6px', fontSize: '0.78rem' }} />
              </div>

              <button type="submit" className="admin-btn-primary" style={{ width: '100%', marginTop: '12px' }}>Register Return File</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );

  // Helper to handle order details population in shipments form
  function setOrderForm(e) {
    const ordId = e.target.value;
    const matchedOrder = orders.find(o => o.id === ordId);
    setShipmentForm({
      ...shipmentForm,
      order_id: ordId,
      estimated_delivery: matchedOrder?.estimated_delivery_date || ''
    });
  }
}

export default AdminLogistics;
