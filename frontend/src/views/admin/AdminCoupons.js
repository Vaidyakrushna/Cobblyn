"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Tag } from 'lucide-react';
import { api } from '../../api';

const empty = { code: '', type: 'percentage', value: 10, min_purchase: 0, max_discount: '', usage_limit: '', valid_from: '', valid_until: '', description: '', active: true };

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [confirmDel, setConfirmDel] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try { const d = await api.listCoupons(); setCoupons(d.items || []); } catch (e) {}
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const save = async () => {
    if (!form.code || !form.value) return alert('Code and value are required');
    const body = { ...form };
    body.value = parseFloat(body.value);
    body.min_purchase = parseFloat(body.min_purchase || 0);
    body.max_discount = body.max_discount ? parseFloat(body.max_discount) : null;
    body.usage_limit = body.usage_limit ? parseInt(body.usage_limit) : null;
    if (!body.valid_from) delete body.valid_from;
    if (!body.valid_until) delete body.valid_until;
    try {
      if (editing === 'new') await api.createCoupon(body);
      else await api.updateCoupon(editing, body);
      setEditing(null); setForm(empty); fetchData();
    } catch (e) { alert(e.message); }
  };

  if (loading) return <div className="admin-loading">Loading…</div>;
  return (
    <div className="admin-page" data-testid="admin-coupons-page">
      <div className="admin-page-header">
        <div><h1>Coupons & Discounts</h1><p>Promo codes for the storefront</p></div>
        <button className="admin-btn-primary" onClick={() => { setForm(empty); setEditing('new'); }} data-testid="admin-new-coupon-btn">
          <Plus size={14} /> New Coupon
        </button>
      </div>
      {coupons.length === 0 ? <div className="admin-empty">No coupons yet</div> : (
        <div className="admin-table-wrapper">
          <table className="admin-table" data-testid="admin-coupons-table">
            <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min Purchase</th><th>Used / Limit</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.id} data-testid={`coupon-row-${c.id}`} style={{ opacity: c.active ? 1 : 0.55 }}>
                  <td><strong style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Tag size={13} />{c.code}</strong>{c.description && <div style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }}>{c.description}</div>}</td>
                  <td>{c.type}</td>
                  <td>{c.type === 'percentage' ? `${c.value}%` : `\u20B9${c.value}`}{c.max_discount ? <span style={{ color: '#6B7280', fontSize: 11 }}> (max {'\u20B9'}{c.max_discount})</span> : ''}</td>
                  <td>{'\u20B9'}{c.min_purchase || 0}</td>
                  <td>{c.used_count || 0}{c.usage_limit ? ` / ${c.usage_limit}` : ''}</td>
                  <td><span className="status-badge" style={{ backgroundColor: c.active ? '#10B98115' : '#9CA3AF15', color: c.active ? '#10B981' : '#6B7280' }}>{c.active ? 'Active' : 'Inactive'}</span></td>
                  <td><div className="table-actions">
                    <button onClick={() => { setForm({ ...empty, ...c, max_discount: c.max_discount || '', usage_limit: c.usage_limit || '' }); setEditing(c.id); }} data-testid={`edit-coupon-${c.id}`}><Edit2 size={14} /></button>
                    <button onClick={() => setConfirmDel(c)} data-testid={`delete-coupon-${c.id}`}><Trash2 size={14} color="#EF4444" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <div className="admin-modal-overlay" onClick={() => setEditing(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setEditing(null)}><X size={18} /></button>
            <h3>{editing === 'new' ? 'New Coupon' : 'Edit Coupon'}</h3>
            <div className="admin-form">
              <div className="frow">
                <div className="af-field"><label>Code *</label><input value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="WELCOME10" data-testid="coupon-form-code" /></div>
                <div className="af-field"><label>Type</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value})}><option value="percentage">Percentage (%)</option><option value="fixed">Fixed (\u20B9)</option></select></div>
              </div>
              <div className="frow">
                <div className="af-field"><label>Value *</label><input type="number" min="0" value={form.value} onChange={e => setForm({...form, value: e.target.value})} data-testid="coupon-form-value" /></div>
                <div className="af-field"><label>Min Purchase (\u20B9)</label><input type="number" min="0" value={form.min_purchase} onChange={e => setForm({...form, min_purchase: e.target.value})} /></div>
              </div>
              <div className="frow">
                <div className="af-field"><label>Max Discount Cap (\u20B9, optional)</label><input type="number" min="0" value={form.max_discount} onChange={e => setForm({...form, max_discount: e.target.value})} placeholder="Only for percentage type" /></div>
                <div className="af-field"><label>Usage Limit</label><input type="number" min="0" value={form.usage_limit} onChange={e => setForm({...form, usage_limit: e.target.value})} placeholder="Unlimited" /></div>
              </div>
              <div className="frow">
                <div className="af-field"><label>Valid From</label><input type="datetime-local" value={form.valid_from} onChange={e => setForm({...form, valid_from: e.target.value})} /></div>
                <div className="af-field"><label>Valid Until</label><input type="datetime-local" value={form.valid_until} onChange={e => setForm({...form, valid_until: e.target.value})} /></div>
              </div>
              <div className="af-field"><label>Description</label><input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Shown to customers on validation" /></div>
              <div className="af-field"><label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} /> Active</label></div>
              <button className="admin-btn-primary" onClick={save} data-testid="coupon-form-save" style={{ marginTop: 16, width: '100%' }}>{editing === 'new' ? 'Create' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
      {confirmDel && (
        <div className="admin-modal-overlay" onClick={() => setConfirmDel(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <button className="admin-modal-close" onClick={() => setConfirmDel(null)}><X size={18} /></button>
            <h3>Delete coupon {confirmDel.code}?</h3>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button onClick={() => setConfirmDel(null)} className="admin-btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={async () => { await api.deleteCoupon(confirmDel.id); setConfirmDel(null); fetchData(); }} className="admin-btn-primary" style={{ flex: 1, background: '#EF4444' }} data-testid="confirm-delete-coupon">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminCoupons;
