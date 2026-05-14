"use client";
import React, { useState, useEffect } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { api } from '../../api';

const AdminTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState('');

  const fetchTickets = async () => {
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const data = await api.adminGetTickets(params);
      setTickets(data.tickets || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, [filter]);

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
                  <strong>{ticket.subject}</strong>
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
          <div className="admin-modal admin-modal-lg" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setSelectedTicket(null)}>&times;</button>
            <div className="ticket-detail-header">
              <h3>{selectedTicket.subject}</h3>
              <span className={`status-badge status-${selectedTicket.status}`}>{selectedTicket.status}</span>
            </div>
            <p className="table-sub">{selectedTicket.user_name} - {selectedTicket.category}</p>

            <div className="chat-messages">
              {(selectedTicket.messages || []).map((msg, i) => (
                <div key={i} className={`chat-msg ${msg.sender === 'admin' ? 'admin-msg' : 'customer-msg'}`}>
                  <div className="msg-sender">{msg.sender === 'admin' ? (msg.admin_name || 'Admin') : selectedTicket.user_name}</div>
                  <div className="msg-text">{msg.message}</div>
                  <div className="msg-time">{new Date(msg.timestamp).toLocaleString()}</div>
                </div>
              ))}
            </div>

            {selectedTicket.status !== 'closed' && (
              <div className="chat-reply-box">
                <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Type your reply..." rows="2" />
                <div className="chat-reply-actions">
                  <button className="admin-btn-primary" onClick={sendReply}><Send size={14} /> Send Reply</button>
                  <button className="admin-btn-danger" onClick={() => closeTicket(selectedTicket.id)}>Close Ticket</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTickets;
