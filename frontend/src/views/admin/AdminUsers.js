"use client";
import React, { useState, useEffect } from 'react';
import { Shield, UserX, UserCheck, RefreshCw } from 'lucide-react';
import { api } from '../../api';

const ROLES = [
  { v: 'user', l: 'User', color: '#6B7280' },
  { v: 'staff', l: 'Staff', color: '#2563EB' },
  { v: 'admin', l: 'Admin', color: '#8B5CF6' },
  { v: 'super_admin', l: 'Super Admin', color: '#10B981' },
];

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try { const d = await api.listAdminUsers(); setUsers(d.items || []); } catch (e) {}
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const changeRole = async (u, role) => {
    if (!window.confirm(`Change ${u.email} to ${role}?`)) return;
    try { await api.updateUserRole(u.id, role); fetch(); } catch (e) { alert(e.message); }
  };
  const toggleBlock = async (u) => {
    if (!window.confirm(`${u.blocked ? 'Unblock' : 'Block'} ${u.email}?`)) return;
    try { await api.blockUser(u.id, !u.blocked); fetch(); } catch (e) { alert(e.message); }
  };

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const totalItems = users.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const safePage = page > totalPages ? totalPages : page;
  const paginatedUsers = users.slice((safePage - 1) * limit, safePage * limit);

  if (loading) return <div className="admin-loading">Loading…</div>;
  return (
    <div className="admin-page" data-testid="admin-users-page">
      <div className="admin-page-header">
        <div><h1>Users & Roles</h1><p>Manage staff access, block customers</p></div>
        <button className="admin-btn-primary" onClick={fetch}><RefreshCw size={14} /> Refresh</button>
      </div>
      <div className="admin-table-wrapper">
        <table className="admin-table" data-testid="admin-users-table">
          <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
          <tbody>
            {paginatedUsers.map(u => {
              const role = ROLES.find(r => r.v === u.role) || ROLES[0];
              return (
                <tr key={u.id} data-testid={`user-row-${u.id}`} style={{ opacity: u.blocked ? 0.5 : 1 }}>
                  <td><strong>{u.name || '-'}</strong></td>
                  <td>{u.email}</td>
                  <td><span className="status-badge" style={{ backgroundColor: role.color + '15', color: role.color, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Shield size={11} />{role.l}</span></td>
                  <td><span className="status-badge" style={{ backgroundColor: u.blocked ? '#EF444415' : '#10B98115', color: u.blocked ? '#EF4444' : '#10B981' }}>{u.blocked ? 'Blocked' : 'Active'}</span></td>
                  <td style={{ fontSize: 12 }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <select value={u.role} onChange={(e) => changeRole(u, e.target.value)} data-testid={`role-select-${u.id}`}
                        style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 4 }}>
                        {ROLES.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
                      </select>
                      <button onClick={() => toggleBlock(u)} title={u.blocked ? 'Unblock' : 'Block'} data-testid={`block-${u.id}`}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                        {u.blocked ? <UserCheck size={14} color="#10B981" /> : <UserX size={14} color="#EF4444" />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
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
    </div>
  );
};
export default AdminUsers;
