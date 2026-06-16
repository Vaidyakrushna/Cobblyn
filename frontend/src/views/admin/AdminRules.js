"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { api } from '../../api';

const AdminRules = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', condition_field: 'material', condition_value: '', action: 'add_price', action_value: 0, active: true, priority: 0, conditions: [], logical_operator: 'AND', description: '' });

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
    setForm({ 
      name: rule.name, 
      condition_field: rule.condition_field, 
      condition_value: rule.condition_value, 
      action: rule.action, 
      action_value: rule.action_value, 
      active: rule.active, 
      priority: rule.priority || 0, 
      conditions: rule.conditions || [],
      logical_operator: rule.logical_operator || 'AND',
      description: rule.description || '' 
    });
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
        <button className="admin-btn-primary" onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', condition_field: 'material', condition_value: '', action: 'add_price', action_value: 0, active: true, priority: 0, conditions: [], logical_operator: 'AND', description: '' }); }} data-testid="add-rule-btn">
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
                  <td>
                    {rule.conditions && rule.conditions.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#9d2706', letterSpacing: '0.05em' }}>MATCH {rule.logical_operator || 'AND'}</span>
                        {rule.conditions.map((c, cIdx) => (
                          <span key={cIdx} className="condition-tag" style={{ display: 'inline-block', margin: '1px 0' }}>
                            If {c.field} {c.operator === 'not_equals' ? '!=' : c.operator === 'contains' ? 'contains' : c.operator === 'in' ? 'in' : '='} "{c.value}"
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="condition-tag">If {rule.condition_field} = "{rule.condition_value}"</span>
                    )}
                  </td>
                  <td>{rule.action === 'add_price' ? 'Add to Price' : 'Multiply %'}</td>
                  <td className="rule-amount">{rule.action === 'add_price' ? `+₹${rule.action_value.toLocaleString()}` : `+${rule.action_value}%`}</td>
                  <td>
                    <span style={{ fontWeight: '600', color: '#9d2706', background: '#9d270610', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
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
              {form.conditions && form.conditions.length > 0 ? (
                <div style={{ marginTop: 8, marginBottom: 16, border: '1px solid #E5E7EB', padding: '20px', borderRadius: 8, background: '#F9FAFB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <label style={{ fontWeight: 700, fontSize: 13, color: '#111827', fontFamily: "'Playfair Display', serif" }}>📋 Compound Conditions</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Match:</span>
                      <select 
                        value={form.logical_operator} 
                        onChange={e => setForm({ ...form, logical_operator: e.target.value })}
                        style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #D1D5DB', background: 'white', fontFamily: "'Montserrat', sans-serif", fontSize: '0.78rem' }}
                      >
                        <option value="AND">All (AND)</option>
                        <option value="OR">Any (OR)</option>
                      </select>
                    </div>
                  </div>

                  {form.conditions.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.8fr 40px', gap: '12px', marginBottom: '8px', paddingRight: '4px' }}>
                      <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--dark-grey)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>If Attribute</span>
                      <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--dark-grey)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Operator</span>
                      <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--dark-grey)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Matching Value</span>
                      <span></span>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                    {form.conditions.map((cond, cIdx) => (
                      <div key={cIdx} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.8fr 40px', gap: '12px', alignItems: 'center' }}>
                        <select 
                          value={cond.field} 
                          onChange={e => {
                            const next = [...form.conditions];
                            next[cIdx].field = e.target.value;
                            setForm({ ...form, conditions: next });
                          }}
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', fontSize: '0.78rem', fontFamily: "'Montserrat', sans-serif", background: 'white' }}
                        >
                          {conditionFields.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                        <select 
                          value={cond.operator || 'equals'} 
                          onChange={e => {
                            const next = [...form.conditions];
                            next[cIdx].operator = e.target.value;
                            setForm({ ...form, conditions: next });
                          }}
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', fontSize: '0.78rem', fontFamily: "'Montserrat', sans-serif", background: 'white' }}
                        >
                          <option value="equals">Equals</option>
                          <option value="not_equals">Not Equals</option>
                          <option value="contains">Contains</option>
                          <option value="in">In (List)</option>
                        </select>
                        <input 
                          type="text" 
                          value={cond.value} 
                          onChange={e => {
                            const next = [...form.conditions];
                            next[cIdx].value = e.target.value;
                            setForm({ ...form, conditions: next });
                          }}
                          placeholder="e.g., Shell Cordovan"
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', fontSize: '0.78rem', fontFamily: "'Montserrat', sans-serif", background: 'white' }}
                          required
                        />
                        <button 
                          type="button" 
                          onClick={() => {
                            const next = form.conditions.filter((_, i) => i !== cIdx);
                            setForm({ ...form, conditions: next });
                          }}
                          style={{ display: 'flex', alignItems: 'center', justifycontent: 'center', height: '38px', width: '38px', background: '#EF444415', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer', transition: 'all 0.2s', justifyContent: 'center' }}
                          title="Remove condition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button 
                      type="button" 
                      onClick={() => {
                        setForm({ ...form, conditions: [...form.conditions, { field: 'material', operator: 'equals', value: '' }] });
                      }}
                      style={{ padding: '8px 16px', background: '#9d270615', color: '#9d2706', border: '1px solid rgba(157, 39, 6, 0.3)', cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Montserrat', sans-serif" }}
                    >
                      <Plus size={14} /> Add Condition
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setForm({ ...form, conditions: [] });
                      }}
                      style={{ padding: '8px 16px', background: '#E5E7EB', color: '#374151', border: '1px solid #D1D5DB', cursor: 'pointer', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Montserrat', sans-serif" }}
                    >
                      Reset to Simple Rule
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="af-row">
                    <div className="af-field"><label>If (Field)</label><select value={form.condition_field} onChange={e => setForm({...form, condition_field: e.target.value})}>{conditionFields.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
                    <div className="af-field"><label>Equals (Value)</label><input value={form.condition_value} onChange={e => setForm({...form, condition_value: e.target.value})} required placeholder="e.g., Shell Cordovan" /></div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <button 
                      type="button" 
                      onClick={() => {
                        setForm({ 
                          ...form, 
                          conditions: [{ field: form.condition_field, operator: 'equals', value: form.condition_value }] 
                        });
                      }}
                      style={{ padding: '6px 12px', background: 'none', border: '1px dashed #9d2706', color: '#9d2706', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                    >
                      ✨ Convert to Multi-Condition Compound Rule
                    </button>
                  </div>
                </>
              )}
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
