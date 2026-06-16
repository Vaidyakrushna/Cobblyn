"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Search, Image as ImageIcon } from 'lucide-react';
import { api } from '../../api';
import ImageUploader from '../../components/ImageUploader';

const emptyProduct = {
  name: '', style: '', occasion: 'Daily Wear', material: '', gender: 'men',
  price: 0, tag: '', articleCode: '', description: '',
  colors: [{ name: 'Black', hex: '#1a1a1a' }],
  sizes: ['6', '7', '8', '9', '10'],
  images: [''],
  features: [''],
  specifications: { Upper: '', Lining: '', Sole: '', Construction: '' },
  customized: false
};

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [editing, setEditing] = useState(null); // null | 'new' | productId
  const [form, setForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const filteredProducts = products.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (p.name || '').toLowerCase().includes(q) ||
           (p.articleCode || '').toLowerCase().includes(q) ||
           (p.style || '').toLowerCase().includes(q);
  });

  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const safePage = page > totalPages ? totalPages : page;
  const paginatedProducts = filteredProducts.slice((safePage - 1) * limit, safePage * limit);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (genderFilter !== 'all') params.gender = genderFilter;
      params.limit = 1000; // Fetch all for client-side pagination
      const data = await api.getProducts(params);
      setProducts(data.products || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [genderFilter]);

  const openNew = () => {
    setForm(emptyProduct);
    setEditing('new');
  };

  const openEdit = async (p) => {
    setForm({
      name: p.name || '',
      style: p.style || '',
      occasion: p.occasion || 'Daily Wear',
      material: p.material || '',
      gender: p.gender || 'men',
      price: p.price || 0,
      tag: p.tag || '',
      articleCode: p.articleCode || '',
      description: p.description || '',
      colors: p.colors?.length ? p.colors : [{ name: 'Black', hex: '#1a1a1a' }],
      sizes: p.sizes?.length ? p.sizes : ['6', '7', '8', '9', '10'],
      images: p.images?.length ? p.images : [''],
      features: p.features?.length ? p.features : [''],
      specifications: p.specifications || { Upper: '', Lining: '', Sole: '', Construction: '' },
      customized: p.customized || false,
    });
    setEditing(p.id);
  };

  const closeForm = () => { setEditing(null); setForm(emptyProduct); };

  const updateField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const updateSpec = (k, v) => {
    setForm(prev => ({
      ...prev,
      specifications: {
        ...(prev.specifications || {}),
        [k]: v
      }
    }));
  };

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

  const handleSave = async () => {
    if (!form.name.trim() || !form.style.trim() || !form.articleCode.trim() || !form.price) {
      alert('Please fill name, style, article code and price.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseInt(form.price),
        images: form.images.filter(Boolean),
        features: form.features.filter(Boolean),
        colors: form.colors.filter(c => c.name && c.hex),
        sizes: form.sizes.filter(Boolean),
      };
      if (editing === 'new') {
        await api.createProduct(payload);
      } else {
        await api.updateProduct(editing, payload);
      }
      closeForm();
      fetchProducts();
    } catch (err) {
      alert('Save failed: ' + err.message);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.deleteProduct(deleteConfirm.id);
      setDeleteConfirm(null);
      fetchProducts();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  if (loading) return <div className="admin-loading">Loading products...</div>;

  return (
    <div className="admin-page" data-testid="admin-products-page">
      <div className="admin-page-header">
        <div><h1>Products</h1><p>Manage your catalogue — add, edit, and remove products</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <label className="admin-btn-secondary" data-testid="admin-bulk-upload-products"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '8px 14px', border: '1px solid #1a1a1a', background: '#fff', color: '#1a1a1a', fontSize: 12, fontWeight: 500 }}>
            <input type="file" accept=".csv" style={{ display: 'none' }}
              onChange={async (e) => {
                const f = e.target.files?.[0]; if (!f) return;
                try { const r = await api.bulkUploadProducts(f); alert(`Created: ${r.created} · Updated: ${r.updated}${r.errors?.length ? ` · Errors: ${r.errors.length}` : ''}`); fetchProducts(); }
                catch (err) { alert(err.message); }
                e.target.value = '';
              }} />
            Bulk Upload (CSV)
          </label>
          <button className="admin-btn-primary" onClick={openNew} data-testid="admin-new-product-btn">
            <Plus size={14} /> New Product
          </button>
        </div>
      </div>

      <div className="inv-controls">
        <div className="admin-filters">
          {['all', 'men', 'women'].map(g => (
            <button key={g}
              className={`admin-filter-btn ${genderFilter === g ? 'active' : ''}`}
              onClick={() => { setGenderFilter(g); setPage(1); }}
              data-testid={`admin-products-filter-${g}`}>
              {g === 'all' ? 'All' : g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
        <form className="admin-search-bar inv-search" onSubmit={(e) => e.preventDefault()}>
          <Search size={16} />
          <input type="text" placeholder="Search by name, article code or style..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} data-testid="admin-products-search" />
        </form>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="admin-empty">No products found</div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table" data-testid="admin-products-table">
            <thead>
              <tr>
                <th>Image</th><th>SKU</th><th>Name</th><th>Style</th><th>Gender</th>
                <th>Material</th><th>Price</th><th>Tag</th><th>Customized</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map(p => (
                <tr key={p.id} data-testid={`admin-product-row-${p.id}`}>
                  <td>
                    <div style={{ width: 56, height: 56, borderRadius: 6, overflow: 'hidden', background: '#f3f3f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {p.images?.[0]
                        ? <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <ImageIcon size={24} color="#ccc" />}
                    </div>
                  </td>
                  <td><span className="mono-text">{p.articleCode}</span></td>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td>{p.style}</td>
                  <td style={{ textTransform: 'capitalize' }}>{p.gender}</td>
                  <td>{p.material}</td>
                  <td>₹{(p.price || 0).toLocaleString()}</td>
                  <td>{p.tag ? <span className="status-badge">{p.tag}</span> : '-'}</td>
                  <td>
                    {p.customized ? (
                      <span className="status-badge" style={{ background: 'rgba(157,39,6,0.1)', color: '#9d2706', borderColor: 'rgba(157,39,6,0.3)', fontWeight: 600 }}>Yes</span>
                    ) : (
                      <span style={{ color: '#9CA3AF' }}>No</span>
                    )}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button onClick={() => openEdit(p)} title="Edit" data-testid={`edit-product-${p.id}`}><Edit2 size={14} /></button>
                      <button onClick={() => setDeleteConfirm(p)} title="Delete" data-testid={`delete-product-${p.id}`}><Trash2 size={14} color="#EF4444" /></button>
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

      {/* Edit / Create Modal */}
      {editing && (
        <div className="admin-modal-overlay" onClick={closeForm}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <button className="admin-modal-close" onClick={closeForm}><X size={18} /></button>
            <h3>{editing === 'new' ? 'Add New Product' : 'Edit Product'}</h3>

            <div className="admin-form" style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 }}>
              <div className="frow">
                <div className="af-field">
                  <label>Product Name *</label>
                  <input type="text" value={form.name} onChange={(e) => updateField('name', e.target.value)} data-testid="product-form-name" />
                </div>
                <div className="af-field">
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Article Code (SKU) *</span>
                    <button type="button" onClick={() => {
                      const lookup = {
                        'strappy sandals': 'SND', 'peep toe heels': 'PTP', 'silk jutis': 'SJT',
                        'classic loafers': 'CLF', 'ankle boots': 'ANK', 'ballet flats': 'BLT',
                        'boat shoe classic': 'BOT', 'embroidered jutis': 'JTS', 'desert boot': 'DST',
                        'chukka boots': 'DST', 'wing tip brogue': 'WNG', 'derby elegance': 'DRB',
                        'double monk strap': 'MNK', 'penny loafer': 'LFR', 'classic oxford': 'OXF',
                        'ballerina': 'SND', 'peep toes': 'PTP', 'jutis': 'SJT', 'loafers': 'CLF',
                        'boots': 'ANK', 'boat': 'BOT', 'oxford': 'OXF', 'derby': 'DRB',
                        'monk strap': 'MNK', 'loafer': 'LFR'
                      };
                      const sName = (form.name || '').toLowerCase();
                      const sStyle = (form.style || '').toLowerCase();
                      let stCode = lookup[sName] || lookup[sStyle];
                      if (!stCode) {
                        stCode = form.style ? form.style.replace(/\s+/g, '').substring(0,3).toUpperCase() : 'UNK';
                      }
                      const ge = form.gender === 'women' ? 'WA' : 'MA';
                      const num = products.length + 100;
                      updateField('articleCode', `BYD-${stCode}-${ge}-${num}`);
                    }} style={{ background: 'none', border: 'none', color: '#6B7280', textDecoration: 'underline', cursor: 'pointer', fontSize: 11, padding: 0 }} title="Generate SKU: BYD-StyleCode-Gender-Number">
                      Auto-Generate
                    </button>
                  </label>
                  <input type="text" value={form.articleCode} onChange={(e) => updateField('articleCode', e.target.value)} data-testid="product-form-sku" />
                </div>
              </div>

              <div className="frow">
                <div className="af-field">
                  <label>Style *</label>
                  <input type="text" value={form.style} onChange={(e) => updateField('style', e.target.value)} placeholder="e.g. Oxford, Loafer" data-testid="product-form-style" />
                </div>
                <div className="af-field">
                  <label>Occasion</label>
                  <select value={form.occasion} onChange={(e) => updateField('occasion', e.target.value)}>
                    <option>Office</option><option>Casual</option><option>Daily Wear</option>
                    <option>Party</option><option>Wedding</option><option>Travel</option>
                  </select>
                </div>
              </div>

              <div className="frow">
                <div className="af-field">
                  <label>Material</label>
                  <input type="text" value={form.material} onChange={(e) => updateField('material', e.target.value)} placeholder="e.g. Full-Grain Leather" data-testid="product-form-material" />
                </div>
                <div className="af-field">
                  <label>Gender</label>
                  <select value={form.gender} onChange={(e) => updateField('gender', e.target.value)} data-testid="product-form-gender">
                    <option value="men">Men</option><option value="women">Women</option>
                  </select>
                </div>
              </div>

              <div className="frow">
                <div className="af-field">
                  <label>Price (₹) *</label>
                  <input type="number" min="0" value={form.price} onChange={(e) => updateField('price', e.target.value)} data-testid="product-form-price" />
                </div>
                <div className="af-field">
                  <label>Tag (optional)</label>
                  <input type="text" value={form.tag} onChange={(e) => updateField('tag', e.target.value)} placeholder="NEW, BESTSELLER, PREMIUM..." />
                </div>
              </div>

              <div className="frow">
                <div className="af-field" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0' }}>
                  <input 
                    type="checkbox" 
                    id="customized-product"
                    checked={form.customized || false} 
                    onChange={(e) => updateField('customized', e.target.checked)} 
                    style={{ width: 'auto', margin: 0, cursor: 'pointer' }}
                  />
                  <label htmlFor="customized-product" style={{ margin: 0, cursor: 'pointer', fontWeight: 600 }}>Customized Product (Enable 3D customizer option on storefront)</label>
                </div>
              </div>

              <div className="af-field">
                <label>Description</label>
                <textarea rows="3" value={form.description} onChange={(e) => updateField('description', e.target.value)} data-testid="product-form-description" />
              </div>

              <div style={{ margin: '20px 0', padding: '16px', background: '#fcfcfc', border: '1px solid #eef0f2', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6B7280' }}>Product Details (PDP Specifications)</h4>
                <div className="frow" style={{ marginBottom: 12 }}>
                  <div className="af-field">
                    <label>Upper Material</label>
                    <input type="text" placeholder="e.g. Full-Grain Calfskin" 
                      value={form.specifications?.Upper || ''} 
                      onChange={(e) => updateSpec('Upper', e.target.value)} />
                  </div>
                  <div className="af-field">
                    <label>Lining Material</label>
                    <input type="text" placeholder="e.g. Soft Calf Leather" 
                      value={form.specifications?.Lining || ''} 
                      onChange={(e) => updateSpec('Lining', e.target.value)} />
                  </div>
                </div>
                <div className="frow">
                  <div className="af-field">
                    <label>Sole Type</label>
                    <input type="text" placeholder="e.g. Double Leather Sole" 
                      value={form.specifications?.Sole || ''} 
                      onChange={(e) => updateSpec('Sole', e.target.value)} />
                  </div>
                  <div className="af-field">
                    <label>Construction Type</label>
                    <input type="text" placeholder="e.g. Goodyear Welt" 
                      value={form.specifications?.Construction || ''} 
                      onChange={(e) => updateSpec('Construction', e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="af-field">
                <label>Sizes (comma-separated)</label>
                <input type="text" value={form.sizes.join(', ')}
                  onChange={(e) => updateField('sizes', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="6, 7, 8, 9, 10, 11" />
              </div>

              <div className="af-field">
                <label>Colors</label>
                {form.colors.map((c, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <input type="text" placeholder="Color name" value={c.name}
                      onChange={(e) => updateColor(idx, 'name', e.target.value)} style={{ flex: 1 }} />
                    <input type="color" value={c.hex || '#000000'}
                      onChange={(e) => updateColor(idx, 'hex', e.target.value)} style={{ width: 50 }} />
                    <button type="button" onClick={() => removeArrayItem('colors', idx)} className="admin-btn-icon"><Trash2 size={14} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem('colors', { name: '', hex: '#000000' })} className="admin-btn-link">+ Add color</button>
              </div>

              <div className="af-field">
                <label>Product Images (paste URL or upload from your computer)</label>
                {form.images.map((img, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <ImageUploader value={img}
                        onChange={(url) => updateArrayItem('images', idx, url)}
                        label={`Image ${idx + 1}`}
                        testId={`product-image-${idx}`} />
                    </div>
                    <button type="button" onClick={() => removeArrayItem('images', idx)} className="admin-btn-icon"
                      style={{ marginTop: 22 }} title="Remove">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem('images', '')} className="admin-btn-link" data-testid="product-add-image-btn">+ Add another image</button>
              </div>

              <div className="af-field">
                <label>Features</label>
                {form.features.map((f, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <input type="text" value={f} onChange={(e) => updateArrayItem('features', idx, e.target.value)}
                      placeholder="e.g. Goodyear Welt construction" style={{ flex: 1 }} />
                    <button type="button" onClick={() => removeArrayItem('features', idx)} className="admin-btn-icon"><Trash2 size={14} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem('features', '')} className="admin-btn-link">+ Add feature</button>
              </div>

              <button type="button" className="admin-btn-primary" onClick={handleSave} disabled={saving} data-testid="product-form-save"
                style={{ marginTop: 16, width: '100%' }}>
                {saving ? 'Saving…' : (editing === 'new' ? 'Create Product' : 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="admin-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <button className="admin-modal-close" onClick={() => setDeleteConfirm(null)}><X size={18} /></button>
            <h3>Delete Product?</h3>
            <p style={{ marginTop: 8, marginBottom: 24 }}>Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setDeleteConfirm(null)} className="admin-btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleDelete} className="admin-btn-primary" data-testid="confirm-delete-product"
                style={{ flex: 1, background: '#EF4444' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
