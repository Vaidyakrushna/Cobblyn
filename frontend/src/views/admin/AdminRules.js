"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { api } from '../../api';

const AdminRules = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', condition_field: 'material', condition_value: '', action: 'add_price', action_value: 0, active: true, priority: 0, description: '' });

  const fetchRules = async () => {
    try {
      const data = await api.getRules();
      setRules(data.rules || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchRules(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) { await api.updateRule(editingId, form); }
      else { await api.createRule(form); }
      setShowForm(false);
      setEditingId(null);
      fetchRules();
    } catch (err) { alert(err.message); }
  };

  const handleEdit = (rule) => {
    setForm({ name: rule.name, condition_field: rule.condition_field, condition_value: rule.condition_value, action: rule.action, action_value: rule.action_value, active: rule.active, priority: rule.priority || 0, description: rule.description || '' });
    setEditingId(rule.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this rule?')) return;
    try { await api.deleteRule(id); fetchRules(); } catch (err) { alert(err.message); }
  };

  const toggleActive = async (rule) => {
    try { await api.updateRule(rule.id, { active: !rule.active }); fetchRules(); } catch (err) { console.error(err); }
  };

  const conditionFields = ['material', 'style', 'sole_type', 'construction', 'color', 'category', 'gender'];

  return (
    <div className="admin-page" data-testid="admin-rules">
      <div className="admin-page-header">
        <div><h1>Pricing Rules Engine</h1><p>Set conditional pricing logic for bespoke orders</p></div>
        <button className="admin-btn-primary" onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', condition_field: 'material', condition_value: '', action: 'add_price', action_value: 0, active: true, priority: 0, description: '' }); }} data-testid="add-rule-btn">
          <Plus size={16} /> Add Rule
        </button>
      </div>

      {loading ? <div className="admin-loading">Loading...</div> : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr><th>Rule Name</th><th>Condition</th><th>Action</th><th>Amount</th><th>Priority</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {rules.map(rule => (
                <tr key={rule.id} data-testid={`rule-row-${rule.id}`}>
                  <td><strong>{rule.name}</strong><br /><span className="table-sub">{rule.description}</span></td>
                  <td><span className="condition-tag">If {rule.condition_field} = "{rule.condition_value}"</span></td>
                  <td>{rule.action === 'add_price' ? 'Add to Price' : 'Multiply %'}</td>
                  <td className="rule-amount">{rule.action === 'add_price' ? `+₹${rule.action_value.toLocaleString()}` : `+${rule.action_value}%`}</td>
                  <td>
                    <span style={{ fontWeight: '600', color: '#C9A84C', background: '#C9A84C10', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                      {rule.priority ?? 0}
                    </span>
                  </td>
                  <td>
                    <button className={`toggle-btn ${rule.active ? 'active' : ''}`} onClick={() => toggleActive(rule)} data-testid={`toggle-rule-${rule.id}`}>
                      {rule.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                    </button>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button onClick={() => handleEdit(rule)}><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(rule.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowForm(false)}><X size={20} /></button>
            <h3>{editingId ? 'Edit Rule' : 'Add Pricing Rule'}</h3>
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="af-field"><label>Rule Name *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="e.g., Shell Cordovan Premium" /></div>
              <div className="af-row">
                <div className="af-field"><label>If (Field)</label><select value={form.condition_field} onChange={e => setForm({...form, condition_field: e.target.value})}>{conditionFields.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
                <div className="af-field"><label>Equals (Value)</label><input value={form.condition_value} onChange={e => setForm({...form, condition_value: e.target.value})} required placeholder="e.g., Shell Cordovan" /></div>
              </div>
              <div className="af-row">
                <div className="af-field"><label>Then (Action)</label><select value={form.action} onChange={e => setForm({...form, action: e.target.value})}><option value="add_price">Add to Price (₹)</option><option value="multiply_price">Multiply (%)</option></select></div>
                <div className="af-field"><label>Amount</label><input type="number" value={form.action_value} onChange={e => setForm({...form, action_value: parseInt(e.target.value) || 0})} required /></div>
                <div className="af-field"><label>Priority Order</label><input type="number" value={form.priority} onChange={e => setForm({...form, priority: parseInt(e.target.value) || 0})} placeholder="e.g. 0" /></div>
              </div>
              <div className="af-field"><label>Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows="2" placeholder="Explain when this rule applies" /></div>
              <button type="submit" className="admin-btn-primary">{editingId ? 'Update' : 'Create'} Rule</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRules;
