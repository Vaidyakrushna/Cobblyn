"use client";
import React, { useState, useEffect } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

const AdminTickets = () => {
  const { user } = useAuth();
  const isAdmin = user && ['admin', 'super_admin'].includes(user.role);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [vaultData, setVaultData] = useState(null);
  const [vaultLoading, setVaultLoading] = useState(false);
  const [vaultCollapsed, setVaultCollapsed] = useState(false);

  // Proposal Pipeline states
  const [proposingOrder, setProposingOrder] = useState(null);
  const [proposalItems, setProposalItems] = useState([]);
  const [proposalAddress, setProposalAddress] = useState({});
  const [proposalNotes, setProposalNotes] = useState('');
  const [priceEstimate, setPriceEstimate] = useState(null);
  const [estimatingPrice, setEstimatingPrice] = useState(false);

  // Live estimated price calculator effect
  useEffect(() => {
    if (proposingOrder && proposalItems.length > 0) {
      setEstimatingPrice(true);
      api.calculateOrderPrice(proposingOrder.id || proposingOrder._id, {
        items: proposalItems,
        shipping_address: proposalAddress
      })
      .then(res => {
        setPriceEstimate(res);
        setEstimatingPrice(false);
      })
      .catch(err => {
        console.error("Price estimation failed:", err);
        setEstimatingPrice(false);
      });
    } else {
      setPriceEstimate(null);
    }
  }, [proposalItems, proposingOrder, proposalAddress]);

  const startProposing = (order) => {
    setProposingOrder(order);
    setProposalItems(JSON.parse(JSON.stringify(order.items || [])));
    setProposalAddress({ ...(order.shipping_address || {}) });
    setProposalNotes('');
  };

  const submitProposal = async () => {
    try {
      await api.createDraftModification(selectedTicket.id || selectedTicket._id, {
        items: proposalItems,
        shipping_address: proposalAddress,
        notes: proposalNotes,
        order_id: proposingOrder.id || proposingOrder._id,
        order_number: proposingOrder.order_number
      });
      alert("Modification proposal draft successfully registered! Awaiting customer confirmation.");
      setProposingOrder(null);
      fetchTickets();
      
      // Refresh vaultData to show updated pending proposal status
      if (selectedTicket?.user_id) {
        api.getCustomer(selectedTicket.user_id).then(data => setVaultData(data));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const pushProposalToAdmin = async (draft) => {
    try {
      await api.proposeOrderModification(draft.order_id, {
        items: draft.items,
        shipping_address: draft.shipping_address,
        notes: draft.notes,
        ticket_id: selectedTicket.id || selectedTicket._id
      });
      alert("Modification proposal successfully pushed for Admin Approval!");
      fetchTickets();
      
      if (selectedTicket?.user_id) {
        api.getCustomer(selectedTicket.user_id).then(data => setVaultData(data));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRecordPayment = async (order) => {
    const outstanding = order.outstanding_amount || 0;
    const confirmPay = confirm(`Record outstanding payment of ₹${outstanding.toLocaleString('en-IN')} for Order #${order.order_number}?`);
    if (!confirmPay) return;
    
    const method = prompt("Enter payment method (e.g. UPI, Credit Card, Cash, Bank Transfer):", "UPI");
    if (!method) return;
    
    try {
      await api.recordOrderPayment(order.id || order._id, {
        amount_paid: outstanding,
        payment_method: method,
        ticket_id: selectedTicket.id || selectedTicket._id
      });
      alert("Extra payment recorded successfully! Order status reverted to Confirmed.");
      
      fetchTickets();
      if (selectedTicket?.user_id) {
        api.getCustomer(selectedTicket.user_id).then(data => setVaultData(data));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const approveProposal = async (orderId) => {
    try {
      await api.approveOrderModification(orderId);
      alert("Proposed order changes approved and implemented!");
      if (selectedTicket?.user_id) {
        api.getCustomer(selectedTicket.user_id).then(data => setVaultData(data));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const rejectProposal = async (orderId) => {
    try {
      await api.rejectOrderModification(orderId);
      alert("Proposed order changes rejected and dismissed.");
      if (selectedTicket?.user_id) {
        api.getCustomer(selectedTicket.user_id).then(data => setVaultData(data));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchTickets = async () => {
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const data = await api.adminGetTickets(params);
      setTickets(data.tickets || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, [filter]);

  useEffect(() => {
    if (selectedTicket?.user_id) {
      setVaultLoading(true);
      api.getCustomer(selectedTicket.user_id)
        .then(data => {
          setVaultData(data);
          setVaultLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch customer vault data:', err);
          setVaultLoading(false);
          setVaultData(null);
        });
    } else {
      setVaultData(null);
    }
  }, [selectedTicket]);

  const sendReply = async () => {
    if (!reply.trim()) return;
    try {
      await api.adminReplyTicket(selectedTicket.id, { message: reply });
      setReply('');
      const updated = tickets.map(t => t.id === selectedTicket.id ? { ...t, messages: [...(t.messages || []), { sender: 'admin', message: reply, timestamp: new Date().toISOString() }] } : t);
      setTickets(updated);
      setSelectedTicket(prev => ({ ...prev, messages: [...(prev.messages || []), { sender: 'admin', message: reply, timestamp: new Date().toISOString() }] }));
    } catch (err) { alert(err.message); }
  };

  const closeTicket = async (id) => {
    try { await api.adminUpdateTicketStatus(id, 'closed'); fetchTickets(); setSelectedTicket(null); } catch (err) { alert(err.message); }
  };

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const totalItems = tickets.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const safePage = page > totalPages ? totalPages : page;
  const paginatedTickets = tickets.slice((safePage - 1) * limit, safePage * limit);

  return (
    <div className="admin-page" data-testid="admin-tickets">
      <div className="admin-page-header">
        <div><h1>Support Tickets</h1><p>Customer queries and design discussions</p></div>
      </div>

      <div className="admin-filters">
        {['all', 'open', 'in_progress', 'closed'].map(s => (
          <button key={s} className={`admin-filter-btn ${filter === s ? 'active' : ''}`} onClick={() => { setFilter(s); setPage(1); }}>
            {s === 'all' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {loading ? <div className="admin-loading">Loading...</div> : tickets.length === 0 ? (
        <div className="admin-empty"><MessageSquare size={40} /><p>No tickets found</p></div>
      ) : (
        <>
          <div className="tickets-list">
            {paginatedTickets.map(ticket => (
              <div key={ticket.id} className={`ticket-card ${selectedTicket?.id === ticket.id ? 'active' : ''}`} onClick={() => setSelectedTicket(ticket)} data-testid={`ticket-${ticket.id}`}>
                <div className="ticket-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong>{ticket.subject}</strong>
                    {ticket.update_order_request && (
                      <span style={{ display: 'inline-block', background: '#d97706', color: '#fff', fontSize: '0.55rem', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700, boxShadow: '0 0 6px rgba(217, 119, 6, 0.3)' }}>Order Update</span>
                    )}
                  </div>
                  <span className={`status-badge status-${ticket.status}`}>{ticket.status}</span>
                </div>
                <div className="ticket-meta">
                  <span>{ticket.user_name} ({ticket.user_email})</span>
                  <span>{ticket.category}</span>
                  <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
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
        </>
      )}

      {selectedTicket && (
        <div className="admin-modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="admin-modal admin-modal-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: '850px', width: '90%' }}>
            <style>{`
              .ticket-split-container {
                display: flex;
                gap: 20px;
                margin-top: 16px;
                height: 480px;
                overflow: hidden;
              }
              .ticket-chat-pane {
                flex: 1;
                display: flex;
                flex-direction: column;
                height: 100%;
                overflow: hidden;
              }
              .customer-vault-pane {
                width: 260px;
                border-left: 1px solid #e7e5e4;
                padding-left: 16px;
                display: flex;
                flex-direction: column;
                height: 100%;
                overflow-y: auto;
                transition: all 0.3s ease;
              }
              .customer-vault-pane.collapsed {
                width: 0;
                padding-left: 0;
                border-left: none;
                overflow: hidden;
              }
              .vault-toggle-btn {
                background: #f5f5f4;
                border: 1px solid #e7e5e4;
                color: #78716c;
                padding: 4px 10px;
                border-radius: 4px;
                font-size: 0.65rem;
                font-weight: 700;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 4px;
                align-self: flex-end;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
              }
              .vault-toggle-btn:hover {
                background: #e7e5e4;
                color: #44403c;
              }
              .chat-messages-container {
                flex: 1;
                overflow-y: auto;
                background: #fafaf9;
                border: 1px solid #e7e5e4;
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 12px;
              }
              .vault-section {
                margin-bottom: 16px;
                padding-bottom: 12px;
                border-bottom: 1px solid #f5f5f4;
              }
              .vault-section h4 {
                font-family: 'Montserrat', sans-serif;
                font-size: 0.7rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #78716c;
                margin: 0 0 8px 0;
              }
              .tier-badge {
                font-size: 0.6rem;
                font-weight: 700;
                padding: 2px 8px;
                border-radius: 20px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                display: inline-block;
              }
              .tier-badge.elite { background: #fef3c7; color: #b45309; border: 1px solid #f59e0b; }
              .tier-badge.vip { background: #f3e8ff; color: #6b21a8; border: 1px solid #8b5cf6; }
              .tier-badge.regular { background: #f3f4f6; color: #4b5563; border: 1px solid #d1d5db; }
              
              .vault-metric {
                font-size: 0.72rem;
                color: #44403c;
                margin-bottom: 5px;
                display: flex;
                justify-content: space-between;
              }
              .vault-metric span { color: #878685; }
              
              .vault-order-item {
                background: #fafaf9;
                border: 1px solid #e7e5e4;
                border-radius: 6px;
                padding: 6px 8px;
                font-size: 0.68rem;
                color: #44403c;
                margin-bottom: 6px;
              }
              .vault-order-header {
                display: flex;
                justify-content: space-between;
                font-weight: 600;
                margin-bottom: 2px;
              }
            `}</style>
            
            <button className="admin-modal-close" onClick={() => setSelectedTicket(null)}>&times;</button>
            
            <div className="ticket-detail-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0 }}>{selectedTicket.subject}</h3>
                <p className="table-sub" style={{ margin: '4px 0 0 0' }}>{selectedTicket.user_name} - {selectedTicket.category}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className={`status-badge status-${selectedTicket.status}`} style={{ margin: 0 }}>{selectedTicket.status}</span>
                
                {selectedTicket.update_order_request && (
                  <>
                    {vaultData?.recent_orders?.find(o => o.status === 'pending' || o.status === 'confirmed') ? (
                      <button 
                        onClick={() => startProposing(vaultData.recent_orders.find(o => o.status === 'pending' || o.status === 'confirmed'))} 
                        style={{ padding: '4px 10px', background: '#d97706', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', marginTop: 0 }}
                      >
                        ✏️ Record Changes
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.62rem', color: '#9c9a96', fontStyle: 'italic', padding: '4px 8px', background: '#f5f5f4', borderRadius: '4px', border: '1px solid #e7e5e4' }}>No active order</span>
                    )}
                  </>
                )}

                <button className="vault-toggle-btn" onClick={() => setVaultCollapsed(!vaultCollapsed)}>
                  {vaultCollapsed ? '🔍 Show Vault' : '❌ Hide Vault'}
                </button>
              </div>
            </div>

            <div className="ticket-split-container">
              <div className="ticket-chat-pane">

                <div className="chat-messages-container">
                  <div className="chat-messages" style={{ height: '100%', overflowY: 'auto' }}>
                    {(selectedTicket.messages || []).map((msg, i) => (
                      <div key={i} className={`chat-msg ${msg.sender === 'admin' ? 'admin-msg' : 'customer-msg'}`}>
                        <div className="msg-sender">{msg.sender === 'admin' ? (msg.admin_name || 'Admin') : selectedTicket.user_name}</div>
                        <div className="msg-text">{msg.message}</div>
                        <div className="msg-time">{new Date(msg.timestamp).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Proposed Modification Draft */}
                {selectedTicket.proposed_modification_draft && (
                  <div style={{ background: '#fffbeb', border: '1.5px solid #9d2706', borderRadius: '8px', padding: '12px', marginBottom: '12px', fontSize: '0.72rem' }}>
                    <h5 style={{ margin: '0 0 6px 0', fontSize: '0.74rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      ✏️ Active Modification Draft
                    </h5>
                    <div style={{ color: '#44403c', marginBottom: '6px' }}>
                      Proposed by: <strong>{selectedTicket.proposed_modification_draft.proposed_by}</strong> on {new Date(selectedTicket.proposed_modification_draft.created_at).toLocaleDateString()}
                    </div>
                    <div style={{ color: '#78716c', marginBottom: '8px' }}>
                      {selectedTicket.proposed_modification_draft.items?.map((item, idx) => (
                        <div key={idx} style={{ marginLeft: '6px' }}>
                          • {item.name} - Size: {item.size}, Color: {item.color}, Leather: {item.material || 'Standard'}, Sole: {item.sole || 'Standard'}
                        </div>
                      ))}
                    </div>
                    {selectedTicket.proposed_modification_draft.notes && (
                      <div style={{ fontStyle: 'italic', background: '#fafaf9', padding: '6px', borderRadius: '4px', border: '1px solid #e7e5e4', color: '#78716c', marginBottom: '8px' }}>
                        "{selectedTicket.proposed_modification_draft.notes}"
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ 
                        padding: '2px 6px', 
                        borderRadius: '3px', 
                        fontSize: '0.58rem', 
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: '#fff',
                        backgroundColor: selectedTicket.proposed_modification_draft.status === 'confirmed' ? '#10b981' : '#f59e0b'
                      }}>
                        {selectedTicket.proposed_modification_draft.status === 'confirmed' ? '✅ Customer Confirmed' : '⏳ Awaiting Customer Review'}
                      </span>

                      {selectedTicket.proposed_modification_draft.status === 'confirmed' && (
                        <button 
                          onClick={() => pushProposalToAdmin(selectedTicket.proposed_modification_draft)}
                          style={{ 
                            padding: '4px 10px', 
                            background: '#9d2706', 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: '4px', 
                            fontSize: '0.68rem', 
                            fontWeight: 700, 
                            cursor: 'pointer',
                            boxShadow: '0 0 10px rgba(157,39,6,0.3)',
                            marginTop: 0
                          }}
                        >
                          🚀 Push to Admin Approval
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Outstanding Payment recording warning */}
                {(() => {
                  const linkedOrder = vaultData?.recent_orders?.find(o => o.id === selectedTicket.order_id || o._id === selectedTicket.order_id);
                  if (linkedOrder && linkedOrder.status === 'waiting_for_payment') {
                    return (
                      <div style={{ background: '#fffbeb', border: '1.5px solid #f59e0b', borderRadius: '8px', padding: '12px', marginBottom: '12px', fontSize: '0.72rem' }}>
                        <div style={{ fontWeight: 700, color: '#d97706', marginBottom: '4px' }}>
                          ⚠️ Outstanding Balance Payment Gating
                        </div>
                        <div style={{ color: '#92400e', marginBottom: '8px' }}>
                          Order #{linkedOrder.order_number} is currently locked in <strong>Waiting for Payment</strong> status.
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, marginTop: '4px' }}>
                            Outstanding Balance: ₹{(linkedOrder.outstanding_amount || 0).toLocaleString('en-IN')}
                          </div>
                        </div>
                        <button 
                          onClick={() => handleRecordPayment(linkedOrder)}
                          style={{ 
                            width: '100%', 
                            padding: '6px 12px', 
                            background: '#d97706', 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: '4px', 
                            fontSize: '0.68rem', 
                            fontWeight: 700, 
                            cursor: 'pointer',
                            marginTop: 0
                          }}
                        >
                          💵 Record Extra Payment
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}

                {selectedTicket.status !== 'closed' && (
                  <div className="chat-reply-box" style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: '8px', padding: '10px' }}>
                    <textarea 
                      value={reply} 
                      onChange={e => setReply(e.target.value)} 
                      placeholder="Type your reply..." 
                      rows="2" 
                      style={{ width: '100%', border: 'none', resize: 'none', outline: 'none', fontSize: '0.8rem' }}
                    />
                    <div className="chat-reply-actions" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e7e5e4' }}>
                      <button className="admin-btn-primary" onClick={sendReply} style={{ marginTop: 0 }}><Send size={12} /> Send Reply</button>
                      <button className="admin-btn-danger" onClick={() => closeTicket(selectedTicket.id)} style={{ marginTop: 0 }}>Close Ticket</button>
                    </div>
                  </div>
                )}
              </div>

              <div className={`customer-vault-pane ${vaultCollapsed ? 'collapsed' : ''}`}>
                {vaultLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <span style={{ fontSize: '0.72rem', color: '#78716c' }}>Fetching Vault Data...</span>
                  </div>
                ) : vaultData ? (
                  <>
                    <div className="vault-section">
                      <h4>Client Identification</h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                        <span className={`tier-badge ${vaultData.client_tier || 'regular'}`}>
                          {vaultData.client_tier?.toUpperCase() || 'REGULAR'}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#9d2706' }}>
                          CLV: {'\u20B9'}{(vaultData.clv || 0.00).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="vault-section">
                      <h4>Bespoke Sizing Scan</h4>
                      {vaultData.fit_profile ? (
                        <>
                          <div className="vault-metric"><span>UK Shoe Size</span><strong>UK {vaultData.fit_profile.uk_size || 'N/A'}</strong></div>
                          <div className="vault-metric"><span>Arch Support</span><strong>{vaultData.fit_profile.arch_type?.toUpperCase() || 'NORMAL'}</strong></div>
                          <div className="vault-metric"><span>Left Length/Width</span><strong>{vaultData.fit_profile.foot_length_left || 270}mm / {vaultData.fit_profile.foot_width_left || 95}mm</strong></div>
                          <div className="vault-metric"><span>Right Length/Width</span><strong>{vaultData.fit_profile.foot_length_right || 270}mm / {vaultData.fit_profile.foot_width_right || 95}mm</strong></div>
                          <div className="vault-metric"><span>Volume Preference</span><strong>{vaultData.fit_profile.fit_preference?.toUpperCase() || 'REGULAR'}</strong></div>
                          
                          <div style={{ marginTop: 10, background: '#111', borderRadius: 8, padding: 8, display: 'flex', justifyContent: 'center' }}>
                            <svg width="120" height="90" viewBox="0 0 100 80">
                              <rect width="100%" height="100%" fill="none" />
                              <path d="M 30,70 C 15,60 12,30 18,15 C 24,5 28,10 32,15 C 38,30 35,60 30,70 Z" fill="rgba(157, 39, 6, 0.06)" stroke="#9d2706" strokeWidth="1" />
                              <path d="M 70,70 C 85,60 88,30 82,15 C 76,5 72,10 68,15 C 62,30 65,60 70,70 Z" fill="rgba(157, 39, 6, 0.06)" stroke="#9d2706" strokeWidth="1" />
                              <text x="50" y="45" fill="rgba(255,255,255,0.4)" fontSize="7" textAnchor="middle" fontFamily="monospace">LiDAR ACTIVE</text>
                            </svg>
                          </div>
                          {vaultData.fit_profile.podiatry_notes && (
                            <div style={{ fontSize: '0.62rem', background: '#fffbeb', border: '1px solid #fef3c7', padding: '6px', borderRadius: '4px', color: '#b45309', marginTop: '8px', lineHeight: 1.3 }}>
                              <strong>Fitting Alert:</strong> {vaultData.fit_profile.podiatry_notes}
                            </div>
                          )}
                        </>
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: '#a8a29e', fontStyle: 'italic' }}>No 3D scan on file yet.</span>
                      )}
                    </div>

                    <div className="vault-section" style={{ borderBottom: 'none', marginBottom: 0 }}>
                      <h4>Order History</h4>
                      {vaultData.recent_orders?.length > 0 ? (
                        vaultData.recent_orders.slice(0, 3).map(o => (
                          <div key={o.id} className="vault-order-item" style={{ position: 'relative' }}>
                            <div className="vault-order-header">
                              <span>#{o.order_number}</span>
                              <span style={{ color: '#b45309' }}>{o.status?.replace(/_/g, ' ')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#78716c', fontSize: '0.62rem', marginTop: 2 }}>
                              <span>{new Date(o.created_at).toLocaleDateString()}</span>
                              <strong>{'\u20B9'}{o.total_amount?.toLocaleString('en-IN')}</strong>
                            </div>
                            {(o.status === 'pending' || o.status === 'confirmed') && (
                              <div style={{ marginTop: '6px', textAlign: 'right', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                {o.pending_modification ? (
                                  <span style={{ fontSize: '0.55rem', color: '#d97706', fontWeight: 700, textTransform: 'uppercase', background: '#fffbeb', padding: '1px 4px', borderRadius: '3px', border: '1px solid #fef3c7' }}>Pending Review</span>
                                ) : <span />}
                                <button onClick={() => startProposing(o)} style={{ padding: '2px 6px', background: '#fafaf9', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.56rem', fontWeight: 700, color: '#9d2706', cursor: 'pointer' }}>
                                  {o.pending_modification ? '📝 Edit Proposal' : '✏️ Propose Changes'}
                                </button>
                              </div>
                            )}
                            
                            {o.pending_modification && (
                              <div style={{ marginTop: '8px', background: '#fffbeb', border: '1px solid #fef3c7', padding: '8px', borderRadius: '6px', fontSize: '0.62rem' }}>
                                <div style={{ fontWeight: 700, color: '#b45309', marginBottom: '4px', textTransform: 'uppercase', fontSize: '0.58rem' }}>Pending Proposal Diff:</div>
                                <div style={{ color: '#991b1b', textDecoration: 'line-through' }}>
                                  {o.items?.[0]?.name} - Size {o.items?.[0]?.size}, {o.items?.[0]?.color}{o.items?.[0]?.material ? `, ${o.items?.[0]?.material}` : ''}{o.items?.[0]?.sole ? `, ${o.items?.[0]?.sole}` : ''}
                                </div>
                                <div style={{ color: '#166534', fontWeight: 600 }}>
                                  + {o.pending_modification.items?.[0]?.name} - Size {o.pending_modification.items?.[0]?.size}, {o.pending_modification.items?.[0]?.color}{o.pending_modification.items?.[0]?.material ? `, ${o.pending_modification.items?.[0]?.material}` : ''}{o.pending_modification.items?.[0]?.sole ? `, ${o.pending_modification.items?.[0]?.sole}` : ''}
                                </div>
                                {o.pending_modification.notes && (
                                  <div style={{ fontStyle: 'italic', marginTop: '4px', color: '#78716c', fontSize: '0.58rem' }}>
                                    " {o.pending_modification.notes} "
                                  </div>
                                )}
                                
                                {isAdmin && (
                                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                                    <button onClick={() => approveProposal(o.id || o._id)} style={{ flex: 1, padding: '3px 4px', background: '#d97706', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 700, fontSize: '0.55rem', cursor: 'pointer', textAlign: 'center' }}>
                                      Approve
                                    </button>
                                    <button onClick={() => rejectProposal(o.id || o._id)} style={{ flex: 1, padding: '3px 4px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 700, fontSize: '0.55rem', cursor: 'pointer', textAlign: 'center' }}>
                                      Reject
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: '#a8a29e', fontStyle: 'italic' }}>No order history.</span>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <span style={{ fontSize: '0.72rem', color: '#a8a29e', fontStyle: 'italic' }}>Customer data unavailable.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {proposingOrder && (
        <div className="admin-modal-overlay" onClick={() => setProposingOrder(null)} style={{ zIndex: 1100, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)' }}>
          <div className="admin-modal admin-modal-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px', width: '90%', background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', position: 'relative' }}>
            <button className="admin-modal-close" onClick={() => setProposingOrder(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#78716c' }}>&times;</button>
            <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, margin: '0 0 16px 0' }}>Suggest Changes: Order {proposingOrder.order_number}</h3>
            
            {/* Retained Basic Customer Details summary box */}
            <div style={{ background: '#fafaf9', padding: '12px', borderRadius: '8px', border: '1px solid #e7e5e4', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '0.72rem', marginBottom: '14px' }}>
              <div><span style={{ color: '#78716c', fontWeight: 600 }}>Customer Name:</span> <strong style={{ color: '#44403c' }}>{selectedTicket.user_name}</strong></div>
              <div><span style={{ color: '#78716c', fontWeight: 600 }}>Customer Email:</span> <strong style={{ color: '#44403c' }}>{selectedTicket.user_email}</strong></div>
              <div><span style={{ color: '#78716c', fontWeight: 600 }}>Order Number:</span> <strong style={{ color: '#9d2706' }}>#{proposingOrder.order_number}</strong></div>
              <div><span style={{ color: '#78716c', fontWeight: 600 }}>Client Tier:</span> <strong style={{ textTransform: 'uppercase', color: '#78716c' }}>{vaultData?.client_tier || 'REGULAR'}</strong></div>
            </div>

            <div className="order-detail-grid" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Proposal items */}
              <div className="order-detail-section">
                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#78716c', letterSpacing: '0.05em', margin: '0 0 8px 0', borderBottom: '1px solid #f5f5f4', paddingBottom: '4px' }}>Items Modification</h4>
                 {proposalItems.map((item, idx) => (
                  <div key={idx} style={{ background: '#fafaf9', padding: '12px', borderRadius: '8px', border: '1px solid #e7e5e4', marginBottom: '10px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#44403c', marginBottom: '8px' }}>{item.name}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.5fr 1.5fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.58rem', color: '#78716c', display: 'block', fontWeight: 600 }}>Size (UK)</label>
                        <select value={item.size} onChange={e => {
                          const updated = [...proposalItems];
                          updated[idx].size = e.target.value;
                          setProposalItems(updated);
                        }} style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.7rem', background: '#fff', outline: 'none' }}>
                          {['3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(sz => <option key={sz} value={sz}>{sz}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.58rem', color: '#78716c', display: 'block', fontWeight: 600 }}>Color</label>
                        <input type="text" value={item.color || ''} onChange={e => {
                          const updated = [...proposalItems];
                          updated[idx].color = e.target.value;
                          setProposalItems(updated);
                        }} style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.7rem', background: '#fff', outline: 'none' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.58rem', color: '#78716c', display: 'block', fontWeight: 600 }}>Leather / Material</label>
                        <select value={item.material || 'Full-Grain Leather'} onChange={e => {
                          const updated = [...proposalItems];
                          updated[idx].material = e.target.value;
                          setProposalItems(updated);
                        }} style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.7rem', background: '#fff', outline: 'none' }}>
                          {['Full-Grain Leather', 'Shell Cordovan', 'Suede', 'Nubuck', 'Patent Leather', 'Italian Calfskin'].map(mat => (
                            <option key={mat} value={mat}>{mat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.58rem', color: '#78716c', display: 'block', fontWeight: 600 }}>Sole Type</label>
                        <select value={item.sole || 'Leather Sole'} onChange={e => {
                          const updated = [...proposalItems];
                          updated[idx].sole = e.target.value;
                          setProposalItems(updated);
                        }} style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.7rem', background: '#fff', outline: 'none' }}>
                          {['Leather Sole', 'Dainite Rubber', 'Crepe Rubber'].map(sl => (
                            <option key={sl} value={sl}>{sl}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Proposal address */}
              <div className="order-detail-section">
                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#78716c', letterSpacing: '0.05em', margin: '0 0 8px 0', borderBottom: '1px solid #f5f5f4', paddingBottom: '4px' }}>Shipping Destination</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.62rem', color: '#78716c', fontWeight: 600 }}>Recipient Name</label>
                    <input type="text" value={proposalAddress.name || ''} onChange={e => setProposalAddress({ ...proposalAddress, name: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.75rem', marginTop: '2px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.62rem', color: '#78716c', fontWeight: 600 }}>Phone Number</label>
                    <input type="text" value={proposalAddress.phone || ''} onChange={e => setProposalAddress({ ...proposalAddress, phone: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.75rem', marginTop: '2px' }} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.62rem', color: '#78716c', fontWeight: 600 }}>Address Line</label>
                    <input type="text" value={proposalAddress.address || ''} onChange={e => setProposalAddress({ ...proposalAddress, address: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.75rem', marginTop: '2px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.62rem', color: '#78716c', fontWeight: 600 }}>City</label>
                    <input type="text" value={proposalAddress.city || ''} onChange={e => setProposalAddress({ ...proposalAddress, city: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.75rem', marginTop: '2px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.62rem', color: '#78716c', fontWeight: 600 }}>State</label>
                    <input type="text" value={proposalAddress.state || ''} onChange={e => setProposalAddress({ ...proposalAddress, state: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.75rem', marginTop: '2px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.62rem', color: '#78716c', fontWeight: 600 }}>PIN Code</label>
                    <input type="text" value={proposalAddress.pincode || ''} onChange={e => setProposalAddress({ ...proposalAddress, pincode: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.75rem', marginTop: '2px' }} />
                  </div>
                </div>
              </div>

              {/* Live pricing estimator box */}
              <div className="order-detail-section" style={{ marginTop: '4px' }}>
                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#78716c', letterSpacing: '0.05em', margin: '0 0 6px 0', borderBottom: '1px solid #f5f5f4', paddingBottom: '4px' }}>Audited Price Preview</h4>
                {estimatingPrice ? (
                  <div style={{ fontSize: '0.7rem', color: '#78716c', fontStyle: 'italic', padding: '6px' }}>Calculating live price estimate from rules engine...</div>
                ) : priceEstimate ? (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '10px', fontSize: '0.72rem', color: '#92400e' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: '2px' }}>
                      <span>Estimated Subtotal:</span>
                      <span>₹{priceEstimate.subtotal?.toLocaleString('en-IN')}</span>
                    </div>
                    {priceEstimate.coupon_discount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', color: '#10b981' }}>
                        <span>Coupon Discount:</span>
                        <span>-₹{priceEstimate.coupon_discount?.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span>Estimated GST (18%):</span>
                      <span>₹{priceEstimate.tax_total?.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.8rem', borderTop: '1px solid #fde68a', paddingTop: '4px', marginTop: '4px', color: '#78350f' }}>
                      <span>Estimated New Total:</span>
                      <span>₹{priceEstimate.total_amount?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.7rem', color: '#a8a29e', fontStyle: 'italic', padding: '6px' }}>Adjust items to calculate estimated price.</div>
                )}
              </div>

              {/* Proposal notes */}
              <div className="order-detail-section">
                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#78716c', letterSpacing: '0.05em', margin: '0 0 8px 0', borderBottom: '1px solid #f5f5f4', paddingBottom: '4px' }}>Proposal Notes / Audit Reason</h4>
                <textarea value={proposalNotes} onChange={e => setProposalNotes(e.target.value)} placeholder="Record customer's suggested change details..." rows="2" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.75rem', resize: 'none', outline: 'none', marginTop: '4px' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button className="admin-btn-primary" onClick={submitProposal} style={{ marginTop: 0, padding: '8px 16px', fontSize: '0.72rem', fontWeight: 600 }}>Submit Proposal</button>
                <button className="admin-btn-secondary" onClick={() => setProposingOrder(null)} style={{ marginTop: 0, padding: '8px 16px', fontSize: '0.72rem', fontWeight: 600, background: '#fff' }}>Cancel</button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTickets;
