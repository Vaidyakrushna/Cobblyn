"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Search, Image as ImageIcon, Check, AlertCircle } from 'lucide-react';
import { api } from '../../api';
import ImageUploader from '../../components/ImageUploader';

const emptyAccessory = {
  name: '',
  sku: '',
  category: 'belts',
  subcategory: '',
  material: '',
  price: 0,
  tag: '',
  description: '',
  colors: [{ name: 'Black', hex: '#1a1a1a' }],
  sizes: ['One Size'],
  images: [''],
  features: [''],
  specifications: {},
  in_stock: true,
  stock_qty: 10
};

const CATEGORIES = [
  { slug: 'belts', label: 'Belts' },
  { slug: 'socks', label: 'Socks' },
  { slug: 'wallets', label: 'Wallets' },
  { slug: 'lace', label: 'Lace' },
  { slug: 'key-rings', label: 'Key Rings' },
  { slug: 'travel-kit', label: 'Travel Kit' },
  { slug: 'shoe-care', label: 'Shoe Care' }
];

const AdminAccessories = () => {
  const [accessories, setAccessories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [editing, setEditing] = useState(null); // null | 'new' | accessoryId
  const [form, setForm] = useState(emptyAccessory);
  const [specsList, setSpecsList] = useState([]); // [{ key: '', value: '' }]
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const filteredAccessories = accessories.filter(acc => {
    // Category filter
    if (catFilter !== 'all') {
      if ((acc.category || '').toLowerCase() !== catFilter.toLowerCase()) return false;
    }
    // Search
    if (!search) return true;
    const q = search.toLowerCase();
    return (acc.name || '').toLowerCase().includes(q) ||
           (acc.sku || '').toLowerCase().includes(q) ||
           (acc.material || '').toLowerCase().includes(q) ||
           (acc.subcategory || '').toLowerCase().includes(q);
  });

  const totalItems = filteredAccessories.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const safePage = page > totalPages ? totalPages : page;
  const paginatedAccessories = filteredAccessories.slice((safePage - 1) * limit, safePage * limit);

  const fetchAccessories = async () => {
    setLoading(true);
    try {
      // Fetch all for client-side pagination
      const data = await api.getAccessories({ limit: 1000 });
      setAccessories(data.accessories || []);
    } catch (err) {
      console.error('Error fetching accessories:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAccessories();
  }, []);

  const openNew = () => {
    setForm(emptyAccessory);
    setSpecsList([{ key: '', value: '' }]);
    setEditing('new');
  };

  const openEdit = (p) => {
    setForm({
      name: p.name || '',
      sku: p.sku || '',
      category: p.category || 'belts',
      subcategory: p.subcategory || '',
      material: p.material || '',
      price: p.price || 0,
      tag: p.tag || '',
      description: p.description || '',
      colors: p.colors?.length ? p.colors : [{ name: 'Black', hex: '#1a1a1a' }],
      sizes: p.sizes?.length ? p.sizes : ['One Size'],
      images: p.images?.length ? p.images : [''],
      features: p.features?.length ? p.features : [''],
      specifications: p.specifications || {},
      in_stock: p.in_stock !== undefined ? p.in_stock : true,
      stock_qty: p.stock_qty !== undefined ? p.stock_qty : 0
    });

    const sList = Object.entries(p.specifications || {}).map(([key, value]) => ({ key, value }));
    setSpecsList(sList.length ? sList : [{ key: '', value: '' }]);
    setEditing(p.id);
  };

  const closeForm = () => {
    setEditing(null);
    setForm(emptyAccessory);
    setSpecsList([]);
  };

  const updateField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const updateArrayItem = (key, idx, value) => {
    setForm(prev => {
      const arr = [...prev[key]];
      arr[idx] = value;
      return { ...prev, [key]: arr };
    });
  };

  const addArrayItem = (key, defaultVal = '') => {
    setForm(prev => ({ ...prev, [key]: [...prev[key], defaultVal] }));
  };

  const removeArrayItem = (key, idx) => {
    setForm(prev => ({ ...prev, [key]: prev[key].filter((_, i) => i !== idx) }));
  };

  const updateColor = (idx, field, value) => {
    setForm(prev => {
      const colors = [...prev.colors];
      colors[idx] = { ...colors[idx], [field]: value };
      return { ...prev, colors };
    });
  };

  // Specifications key-value handers
  const updateSpecItem = (idx, field, value) => {
    const list = [...specsList];
    list[idx] = { ...list[idx], [field]: value };
    setSpecsList(list);
  };

  const addSpecItem = () => {
    setSpecsList(prev => [...prev, { key: '', value: '' }]);
  };

  const removeSpecItem = (idx) => {
    setSpecsList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.sku.trim() || !form.price) {
      alert('Please fill out product name, SKU, and price.');
      return;
    }
    setSaving(true);
    try {
      const specObj = {};
      specsList.forEach(item => {
        if (item.key.trim()) {
          specObj[item.key.trim()] = item.value;
        }
      });

      const payload = {
        ...form,
        price: parseInt(form.price),
        stock_qty: parseInt(form.stock_qty || 0),
        in_stock: parseInt(form.stock_qty || 0) > 0 ? form.in_stock : false,
        images: form.images.filter(Boolean),
        features: form.features.filter(Boolean),
        colors: form.colors.filter(c => c.name && c.hex),
        sizes: form.sizes.filter(Boolean),
        specifications: specObj
      };

      if (editing === 'new') {
        await api.createAccessory(payload);
      } else {
        await api.updateAccessory(editing, payload);
      }
      closeForm();
      fetchAccessories();
    } catch (err) {
      alert('Save failed: ' + err.message);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.deleteAccessory(deleteConfirm.id);
      setDeleteConfirm(null);
      fetchAccessories();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleBulkUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await api.bulkUploadAccessories(file);
      alert(`Bulk upload complete!\nCreated: ${res.created}\nUpdated: ${res.updated}\nErrors: ${res.errors?.length || 0}`);
      if (res.errors?.length) {
        console.error('Bulk upload errors:', res.errors);
      }
      fetchAccessories();
    } catch (err) {
      alert('Bulk upload failed: ' + err.message);
    }
    e.target.value = '';
  };

  if (loading) return <div className="admin-loading">Loading accessories catalog...</div>;

  return (
    <div className="admin-page" data-testid="admin-accessories-page">
      <div className="admin-page-header">
        <div>
          <h1>Accessories Management</h1>
          <p>Create, update, and manage your accessories product listing</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <label className="admin-btn-secondary" data-testid="admin-bulk-upload-accessories"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '8px 14px', border: '1px solid #1a1a1a', background: '#fff', color: '#1a1a1a', fontSize: 12, fontWeight: 500 }}>
            <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleBulkUpload} />
            Bulk Upload (CSV)
          </label>
          <button className="admin-btn-primary" onClick={openNew} data-testid="admin-new-accessory-btn">
            <Plus size={14} /> New Accessory
          </button>
        </div>
      </div>

      <div className="inv-controls">
        <div className="admin-filters" style={{ flexWrap: 'wrap', gap: '4px' }}>
          <button
            className={`admin-filter-btn ${catFilter === 'all' ? 'active' : ''}`}
            onClick={() => { setCatFilter('all'); setPage(1); }}
            data-testid="admin-accessories-filter-all"
          >
            All
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c.slug}
              className={`admin-filter-btn ${catFilter === c.slug ? 'active' : ''}`}
              onClick={() => { setCatFilter(c.slug); setPage(1); }}
              data-testid={`admin-accessories-filter-${c.slug}`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <form className="admin-search-bar inv-search" onSubmit={(e) => e.preventDefault()}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search accessories by name, SKU, category..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            data-testid="admin-accessories-search"
          />
        </form>
      </div>

      {filteredAccessories.length === 0 ? (
        <div className="admin-empty">No accessories products found matching criteria.</div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table" data-testid="admin-accessories-table">
            <thead>
              <tr>
                <th>Thumbnail</th>
                <th>SKU</th>
                <th>Name</th>
                <th>Category</th>
                <th>Material</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Tag</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAccessories.map(acc => (
                <tr key={acc.id} data-testid={`admin-accessory-row-${acc.sku}`}>
                  <td>
                    <div style={{ width: 56, height: 56, borderRadius: 6, overflow: 'hidden', background: '#f3f3f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {acc.images?.[0] ? (
                        <img src={acc.images[0]} alt={acc.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <ImageIcon size={24} color="#ccc" />
                      )}
                    </div>
                  </td>
                  <td><span className="mono-text">{acc.sku}</span></td>
                  <td style={{ fontWeight: 500 }}>{acc.name}</td>
                  <td style={{ textTransform: 'capitalize' }}>
                    {CATEGORIES.find(c => c.slug === acc.category)?.label || acc.category}
                  </td>
                  <td>{acc.material || '-'}</td>
                  <td>₹{(acc.price || 0).toLocaleString()}</td>
                  <td>
                    <span className={`status-badge ${acc.stock_qty > 0 ? 'status-active' : 'status-cancelled'}`}
                          style={{
                            background: acc.stock_qty > 10 ? '#ECFDF5' : acc.stock_qty > 0 ? '#FFFBEB' : '#FEF2F2',
                            color: acc.stock_qty > 10 ? '#047857' : acc.stock_qty > 0 ? '#B45309' : '#B91C1C'
                          }}>
                      {acc.stock_qty} pcs
                    </span>
                  </td>
                  <td>{acc.tag ? <span className="status-badge" style={{ backgroundColor: 'var(--accent)', color: '#fff', fontSize: '10px' }}>{acc.tag}</span> : '-'}</td>
                  <td>
                    <div className="table-actions">
                      <button onClick={() => openEdit(acc)} title="Edit" data-testid={`edit-accessory-${acc.sku}`}><Edit2 size={14} /></button>
                      <button onClick={() => setDeleteConfirm(acc)} title="Delete" data-testid={`delete-accessory-${acc.sku}`}><Trash2 size={14} color="#EF4444" /></button>
                    </div>
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

      {/* Edit / Create Form Modal */}
      {editing && (
        <div className="admin-modal-overlay" onClick={closeForm}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 760 }}>
            <button className="admin-modal-close" onClick={closeForm}><X size={18} /></button>
            <h3>{editing === 'new' ? 'Add New Accessory' : 'Edit Accessory Product'}</h3>

            <div className="admin-form" style={{ maxHeight: '72vh', overflowY: 'auto', paddingRight: 8 }}>
              <div className="frow">
                <div className="af-field">
                  <label>Accessory Name *</label>
                  <input type="text" value={form.name} onChange={(e) => updateField('name', e.target.value)} data-testid="accessory-form-name" placeholder="e.g. Full-Grain Classic Belt" />
                </div>
                <div className="af-field">
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>SKU (Stock Keeping Unit) *</span>
                    <button type="button" onClick={() => {
                      const prefix = {
                        'belts': 'BLT', 'socks': 'SOK', 'wallets': 'WLT',
                        'lace': 'LCE', 'key-rings': 'KEY', 'travel-kit': 'TRV',
                        'shoe-care': 'SHC'
                      };
                      const catPrefix = prefix[form.category] || 'ACC';
                      const randomId = Math.floor(100 + Math.random() * 900);
                      updateField('sku', `ACC-${catPrefix}-${randomId}`);
                    }} style={{ background: 'none', border: 'none', color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer', fontSize: 11, padding: 0 }} title="Generate random SKU based on category">
                      Auto-Generate SKU
                    </button>
                  </label>
                  <input type="text" value={form.sku} onChange={(e) => updateField('sku', e.target.value)} data-testid="accessory-form-sku" placeholder="e.g. ACC-BLT-001" />
                </div>
              </div>

              <div className="frow">
                <div className="af-field">
                  <label>Category *</label>
                  <select value={form.category} onChange={(e) => updateField('category', e.target.value)} data-testid="accessory-form-category">
                    {CATEGORIES.map(c => (
                      <option key={c.slug} value={c.slug}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="af-field">
                  <label>Subcategory</label>
                  <input type="text" value={form.subcategory} onChange={(e) => updateField('subcategory', e.target.value)} placeholder="e.g. Dress Belts, Toiletry Bags" />
                </div>
              </div>

              <div className="frow">
                <div className="af-field">
                  <label>Material</label>
                  <input type="text" value={form.material} onChange={(e) => updateField('material', e.target.value)} placeholder="e.g. Full-Grain Italian Leather" />
                </div>
                <div className="af-field">
                  <label>Price (₹) *</label>
                  <input type="number" min="0" value={form.price} onChange={(e) => updateField('price', e.target.value)} data-testid="accessory-form-price" />
                </div>
              </div>

              <div className="frow">
                <div className="af-field">
                  <label>Stock Quantity</label>
                  <input type="number" min="0" value={form.stock_qty} onChange={(e) => updateField('stock_qty', e.target.value)} data-testid="accessory-form-stock" />
                </div>
                <div className="af-field">
                  <label>Promo Tag</label>
                  <input type="text" value={form.tag} onChange={(e) => updateField('tag', e.target.value)} placeholder="e.g. Bestseller, Premium, New" />
                </div>
              </div>

              <div className="af-field">
                <label>Description</label>
                <textarea rows="3" value={form.description} onChange={(e) => updateField('description', e.target.value)} data-testid="accessory-form-description" placeholder="Write a compelling story about this accessory..." />
              </div>

              <div className="frow">
                <div className="af-field" style={{ flex: 1 }}>
                  <label>Sizes / Variants (comma-separated)</label>
                  <input type="text" value={form.sizes.join(', ')}
                    onChange={(e) => updateField('sizes', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    placeholder="e.g. S, M, L, XL or 28, 30, 32 or One Size" />
                </div>
                <div className="af-field" style={{ flex: '0 0 150px' }}>
                  <label>Stock Status</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.in_stock} onChange={(e) => updateField('in_stock', e.target.checked)} />
                    <span>In Stock Available</span>
                  </label>
                </div>
              </div>

              <div className="af-field">
                <label>Colors</label>
                {form.colors.map((c, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <input type="text" placeholder="Color name (e.g. Tan)" value={c.name}
                      onChange={(e) => updateColor(idx, 'name', e.target.value)} style={{ flex: 1 }} />
                    <input type="color" value={c.hex || '#000000'}
                      onChange={(e) => updateColor(idx, 'hex', e.target.value)} style={{ width: 50 }} />
                    <button type="button" onClick={() => removeArrayItem('colors', idx)} className="admin-btn-icon" style={{ padding: '0 8px' }}><Trash2 size={14} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem('colors', { name: '', hex: '#000000' })} className="admin-btn-link">+ Add color option</button>
              </div>

              <div className="af-field">
                <label>Product Images (upload or enter public URL)</label>
                {form.images.map((img, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <ImageUploader value={img}
                        onChange={(url) => updateArrayItem('images', idx, url)}
                        label={`Accessory Image ${idx + 1}`}
                        testId={`accessory-image-${idx}`} />
                    </div>
                    <button type="button" onClick={() => removeArrayItem('images', idx)} className="admin-btn-icon" style={{ marginTop: 22 }} title="Remove">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem('images', '')} className="admin-btn-link" data-testid="accessory-add-image-btn">+ Add another image</button>
              </div>

              <div className="af-field">
                <label>Key Selling Features (Bullet points)</label>
                {form.features.map((f, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <input type="text" value={f} onChange={(e) => updateArrayItem('features', idx, e.target.value)}
                      placeholder="e.g. Hand-burnished bevelled edges" style={{ flex: 1 }} />
                    <button type="button" onClick={() => removeArrayItem('features', idx)} className="admin-btn-icon" style={{ padding: '0 8px' }}><Trash2 size={14} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem('features', '')} className="admin-btn-link">+ Add feature point</button>
              </div>

              <div className="af-field">
                <label>Specifications (Key-Value attributes)</label>
                <div style={{ background: '#f9f9f9', padding: 12, borderRadius: 6, border: '1px dashed #ddd', marginBottom: 8 }}>
                  {specsList.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <input type="text" placeholder="Key (e.g. Width)" value={item.key}
                        onChange={(e) => updateSpecItem(idx, 'key', e.target.value)} style={{ flex: 1 }} />
                      <input type="text" placeholder="Value (e.g. 35 mm)" value={item.value}
                        onChange={(e) => updateSpecItem(idx, 'value', e.target.value)} style={{ flex: 1 }} />
                      <button type="button" onClick={() => removeSpecItem(idx)} className="admin-btn-icon" style={{ padding: '0 8px' }}><Trash2 size={14} /></button>
                    </div>
                  ))}
                  <button type="button" onClick={addSpecItem} className="admin-btn-link" style={{ marginTop: 4 }}>+ Add specification row</button>
                </div>
              </div>

              <button type="button" className="admin-btn-primary" onClick={handleSave} disabled={saving} data-testid="accessory-form-save"
                style={{ marginTop: 24, width: '100%' }}>
                {saving ? 'Saving changes...' : (editing === 'new' ? 'Create Accessory Product' : 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="admin-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <button className="admin-modal-close" onClick={() => setDeleteConfirm(null)}><X size={18} /></button>
            <h3>Delete Accessory Product?</h3>
            <p style={{ marginTop: 8, marginBottom: 24 }}>
              Are you sure you want to delete the accessory <strong>{deleteConfirm.name}</strong> (SKU: {deleteConfirm.sku})? This will remove it permanently.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setDeleteConfirm(null)} className="admin-btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleDelete} className="admin-btn-primary" data-testid="confirm-delete-accessory"
                style={{ flex: 1, background: '#EF4444' }}>Delete Permanently</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAccessories;
