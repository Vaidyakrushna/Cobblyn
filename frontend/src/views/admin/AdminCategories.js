"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { FolderTree, Plus, Pencil, Trash2, X, Search } from 'lucide-react';
import { api } from '../../api';

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '', slug: '', description: '', parent_id: '', image_url: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.request('/categories');
      setCategories(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Auto-generate slug from name
      ...(name === 'name' ? { slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') } : {})
    }));
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ name: '', slug: '', description: '', parent_id: '', image_url: '' });
    setShowModal(true);
  };

  const openEditModal = (category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || '',
      parent_id: category.parent_id || '',
      image_url: category.image_url || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', slug: '', description: '', parent_id: '', image_url: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.parent_id) payload.parent_id = null;

      if (editingId) {
        await api.request(`/categories/${editingId}`, {
          method: 'PUT', body: JSON.stringify(payload)
        });
      } else {
        await api.request('/categories', {
          method: 'POST', body: JSON.stringify(payload)
        });
      }
      closeModal();
      fetchCategories();
    } catch (err) {
      setError(err.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.request(`/categories/${id}`, { method: 'DELETE' });
      fetchCategories();
    } catch (err) {
      setError(err.message || 'Failed to delete category');
    }
  };

  const getParentName = (parentId) => {
    const parent = categories.find(c => c.id === parentId);
    return parent ? parent.name : '—';
  };

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="admin-loading">Loading categories…</div>;

  return (
    <div className="admin-page" data-testid="admin-categories-page">
      <div className="admin-page-header">
        <div>
          <h1>Categories</h1>
          <p>Manage product categories and hierarchy</p>
        </div>
        <button className="admin-btn-primary" onClick={openCreateModal} data-testid="add-category-btn">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {error && (
        <div className="auth-error" style={{ marginBottom: 20 }}>{error}
          <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b', fontWeight: 600 }}>&times;</button>
        </div>
      )}

      <div className="admin-search-bar" data-testid="category-search">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search categories…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table" data-testid="categories-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Parent</th>
              <th>Description</th>
              <th style={{ width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(category => (
              <tr key={category.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FolderTree size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    <strong style={{ fontWeight: 500 }}>{category.name}</strong>
                  </div>
                </td>
                <td><span className="condition-tag">{category.slug}</span></td>
                <td>{category.parent_id ? getParentName(category.parent_id) : <span style={{color:'var(--mid-grey)'}}>Top Level</span>}</td>
                <td><span className="table-sub">{category.description || '—'}</span></td>
                <td>
                  <div className="table-actions">
                    <button onClick={() => openEditModal(category)} title="Edit" data-testid={`edit-cat-${category.id}`}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(category.id)} title="Delete" data-testid={`delete-cat-${category.id}`}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--mid-grey)' }}>
                  {searchTerm ? 'No categories match your search.' : 'No categories yet. Click "Add Category" to create one.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} data-testid="category-modal">
            <button className="admin-modal-close" onClick={closeModal}><X size={20} /></button>
            <h3>{editingId ? 'Edit Category' : 'New Category'}</h3>
            <form onSubmit={handleSubmit} className="admin-form" data-testid="category-form">
              <div className="af-row">
                <div className="af-field">
                  <label>Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="af-field">
                  <label>Slug *</label>
                  <input type="text" name="slug" value={formData.slug} onChange={handleInputChange} required />
                </div>
              </div>
              <div className="af-field">
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" />
              </div>
              <div className="af-row">
                <div className="af-field">
                  <label>Parent Category</label>
                  <select name="parent_id" value={formData.parent_id} onChange={handleInputChange}>
                    <option value="">None (Top Level)</option>
                    {categories.filter(c => c.id !== editingId).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="af-field">
                  <label>Image URL</label>
                  <input type="text" name="image_url" value={formData.image_url} onChange={handleInputChange} placeholder="https://..." />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" className="admin-btn-primary" style={{ flex: 1 }}>
                  {editingId ? 'Update Category' : 'Create Category'}
                </button>
                <button type="button" className="admin-btn-secondary" onClick={closeModal} style={{ marginTop: 0 }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCategories;
