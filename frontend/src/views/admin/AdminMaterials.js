"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { api } from '../../api';
import ImageUploader from '../../components/ImageUploader';

const AdminMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'leather', type: 'Premium', image_url: '', color_hex: '#3B2316', price_modifier: 0, description: '', available: true });
  const [filter, setFilter] = useState('all');

  const fetchMaterials = async () => {
    try {
      const params = filter !== 'all' ? `?category=${filter}` : '';
      const data = await api.getMaterials(params);
      setMaterials(data.materials || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchMaterials(); }, [filter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateMaterial(editingId, form);
      } else {
        await api.createMaterial(form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ name: '', category: 'leather', type: 'Premium', image_url: '', color_hex: '#3B2316', price_modifier: 0, description: '', available: true });
      fetchMaterials();
    } catch (err) { alert('Error: ' + err.message); }
  };

  const handleEdit = (mat) => {
    setForm({ name: mat.name, category: mat.category, type: mat.type || 'Premium', image_url: mat.image_url || '', color_hex: mat.color_hex || '', price_modifier: mat.price_modifier || 0, description: mat.description || '', available: mat.available !== false });
    setEditingId(mat.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this material?')) return;
    try { await api.deleteMaterial(id); fetchMaterials(); } catch (err) { alert(err.message); }
  };

  return (
    <div className="admin-page" data-testid="admin-materials">
      <div className="admin-page-header">
        <div><h1>Material & Texture Library</h1><p>Manage leathers, soles, linings and textures for the configurator</p></div>
        <button className="admin-btn-primary" onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', category: 'leather', type: 'Premium', image_url: '', color_hex: '#3B2316', price_modifier: 0, description: '', available: true }); }} data-testid="add-material-btn">
          <Plus size={16} /> Add Material
        </button>
      </div>

      <div className="admin-filters">
        {['all', 'leather', 'sole', 'lining', 'texture'].map(cat => (
          <button key={cat} className={`admin-filter-btn ${filter === cat ? 'active' : ''}`} onClick={() => setFilter(cat)}>{cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}</button>
        ))}
      </div>

      {loading ? <div className="admin-loading">Loading...</div> : (
        <div className="admin-card-grid">
          {materials.map(mat => (
            <div key={mat.id} className="material-admin-card" data-testid={`material-card-${mat.id}`}>
              <div className="mat-card-visual">
                {mat.image_url ? <img src={mat.image_url} alt={mat.name} /> : <div className="mat-color-block" style={{ backgroundColor: mat.color_hex || '#ccc' }}></div>}
              </div>
              <div className="mat-card-info">
                <h4>{mat.name}</h4>
                <div className="mat-card-meta">
                  <span className="mat-category">{mat.category}</span>
                  <span className="mat-type">{mat.type}</span>
                </div>
                {mat.price_modifier > 0 && <span className="mat-price">+{mat.price_modifier.toLocaleString()}</span>}
                <p className="mat-desc">{mat.description}</p>
              </div>
              <div className="mat-card-actions">
                <button onClick={() => handleEdit(mat)} data-testid={`edit-material-${mat.id}`}><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(mat.id)} data-testid={`delete-material-${mat.id}`}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowForm(false)}><X size={20} /></button>
            <h3>{editingId ? 'Edit Material' : 'Add Material'}</h3>
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="af-row">
                <div className="af-field"><label>Name *</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                <div className="af-field"><label>Category</label><select value={form.category} onChange={e => setForm({...form, category: e.target.value})}><option value="leather">Leather</option><option value="sole">Sole</option><option value="lining">Lining</option><option value="texture">Texture</option></select></div>
              </div>
              <div className="af-row">
                <div className="af-field"><label>Type</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value})}><option value="Premium">Premium</option><option value="Semi Premium">Semi Premium</option></select></div>
                <div className="af-field"><label>Price Modifier (₹)</label><input type="number" value={form.price_modifier} onChange={e => setForm({...form, price_modifier: parseInt(e.target.value) || 0})} /></div>
              </div>
              <div className="af-field"><ImageUploader value={form.image_url} onChange={(url) => setForm({...form, image_url: url})} label="Material Image (paste URL or upload)" testId="material-image" /></div>
              <div className="af-row">
                <div className="af-field"><label>Color Hex</label><input type="color" value={form.color_hex} onChange={e => setForm({...form, color_hex: e.target.value})} /></div>
                <div className="af-field"><label>Available</label><select value={form.available} onChange={e => setForm({...form, available: e.target.value === 'true'})}><option value="true">Yes</option><option value="false">No</option></select></div>
              </div>
              <div className="af-field"><label>Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows="2" /></div>
              <button type="submit" className="admin-btn-primary">{editingId ? 'Update' : 'Create'} Material</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMaterials;
