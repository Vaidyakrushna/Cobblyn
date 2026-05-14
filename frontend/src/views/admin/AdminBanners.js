"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, MoveUp, MoveDown, Eye, EyeOff } from 'lucide-react';
import { api } from '../../api';
import ImageUploader from '../../components/ImageUploader';

const emptyBanner = {
  eyebrow: 'NEW COLLECTION',
  title: '',
  subtitle: '',
  price: '',
  image: '',
  primary_cta: 'Shop Now',
  primary_cta_link: '/men',
  secondary_cta: 'Learn More',
  secondary_cta_link: '#',
  sort_order: 0,
  active: true,
};

const AdminBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | id
  const [form, setForm] = useState(emptyBanner);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [section, setSection] = useState('slider');

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const data = await api.listBanners(`?section=${section}`);
      setBanners(data.items || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchBanners(); }, [section]);

  const openNew = () => {
    const nextOrder = banners.length ? Math.max(...banners.map(b => b.sort_order || 0)) + 1 : 0;
    setForm({ ...emptyBanner, sort_order: nextOrder, section: section });
    setEditing('new');
  };

  const openEdit = (b) => {
    setForm({
      eyebrow: b.eyebrow || '',
      title: b.title || '',
      subtitle: b.subtitle || '',
      price: b.price || '',
      image: b.image || '',
      primary_cta: b.primary_cta || '',
      primary_cta_link: b.primary_cta_link || '',
      secondary_cta: b.secondary_cta || '',
      secondary_cta_link: b.secondary_cta_link || '',
      sort_order: b.sort_order || 0,
      active: b.active !== false,
      section: b.section || 'slider',
    });
    setEditing(b.id);
  };

  const closeForm = () => { setEditing(null); setForm(emptyBanner); };

  const handleSave = async () => {
    if (!form.title.trim() || !form.image.trim()) {
      alert('Title and image are required.');
      return;
    }
    setSaving(true);
    try {
      if (editing === 'new') await api.createBanner(form);
      else await api.updateBanner(editing, form);
      closeForm();
      fetchBanners();
    } catch (err) { alert('Save failed: ' + err.message); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.deleteBanner(deleteConfirm.id);
      setDeleteConfirm(null);
      fetchBanners();
    } catch (err) { alert('Delete failed: ' + err.message); }
  };

  const handleToggleActive = async (b) => {
    try { await api.updateBanner(b.id, { active: !b.active }); fetchBanners(); }
    catch (err) { alert(err.message); }
  };

  const handleMove = async (b, direction) => {
    const idx = banners.findIndex(x => x.id === b.id);
    const swapWith = banners[idx + direction];
    if (!swapWith) return;
    try {
      await Promise.all([
        api.updateBanner(b.id, { sort_order: swapWith.sort_order }),
        api.updateBanner(swapWith.id, { sort_order: b.sort_order }),
      ]);
      fetchBanners();
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="admin-loading">Loading assets...</div>;

  const tabs = [
    { id: 'slider', label: 'Hero Slider' },
    { id: 'signature', label: 'Signature Style' },
    { id: 'explore', label: 'Explore Collection' },
    { id: 'luxe', label: 'Luxe Collection' }
  ];

  return (
    <div className="admin-page" data-testid="admin-banners-page">
      <div className="admin-page-header">
        <div><h1>Home Page Assets</h1><p>Manage the home page sections: slider, signature styles, explore, and luxe</p></div>
        <button className="admin-btn-primary" onClick={openNew} data-testid="admin-new-banner-btn">
          <Plus size={14} /> New Asset
        </button>
      </div>

      <div className="admin-filters" style={{ marginBottom: 16 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setSection(t.id)} className={`admin-filter-btn ${section === t.id ? 'active' : ''}`}>
            {t.label}
          </button>
        ))}
      </div>

      {banners.length === 0 ? (
        <div className="admin-empty">No banners yet. Add your first hero slide to start.</div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table" data-testid="admin-banners-table">
            <thead>
              <tr>
                <th style={{ width: 70 }}>Order</th><th>Image</th><th>Title</th>
                <th>Subtitle</th><th>CTA</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((b, idx) => (
                <tr key={b.id} data-testid={`banner-row-${b.id}`} style={{ opacity: b.active ? 1 : 0.55 }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <strong>{b.sort_order ?? idx}</strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <button onClick={() => handleMove(b, -1)} disabled={idx === 0} title="Move up"
                          style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'not-allowed' : 'pointer', padding: 2 }}><MoveUp size={11} /></button>
                        <button onClick={() => handleMove(b, 1)} disabled={idx === banners.length - 1} title="Move down"
                          style={{ background: 'none', border: 'none', cursor: idx === banners.length - 1 ? 'not-allowed' : 'pointer', padding: 2 }}><MoveDown size={11} /></button>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ width: 80, height: 56, borderRadius: 4, overflow: 'hidden', background: '#F3F4F6' }}>
                      {b.image && <img src={b.image} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 11, color: '#C9A84C', fontWeight: 600, letterSpacing: '0.08em' }}>{b.eyebrow}</div>
                    <strong>{b.title}</strong>
                  </td>
                  <td style={{ fontSize: 13, color: '#6B7280', maxWidth: 280 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {b.subtitle}
                    </div>
                    {b.price && <div style={{ marginTop: 4 }}><strong>{b.price}</strong></div>}
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {b.primary_cta && <div>{b.primary_cta} <span style={{ color: '#9CA3AF' }}>→</span> <code style={{ background: '#F3F4F6', padding: '1px 4px', borderRadius: 3 }}>{b.primary_cta_link}</code></div>}
                    {b.secondary_cta && <div style={{ marginTop: 4, color: '#6B7280' }}>{b.secondary_cta} → <code style={{ background: '#F3F4F6', padding: '1px 4px', borderRadius: 3 }}>{b.secondary_cta_link}</code></div>}
                  </td>
                  <td>
                    <button onClick={() => handleToggleActive(b)} data-testid={`banner-toggle-${b.id}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 500,
                               background: b.active ? '#10B98115' : '#9CA3AF15', color: b.active ? '#10B981' : '#6B7280',
                               border: 'none', cursor: 'pointer' }}>
                      {b.active ? <Eye size={12} /> : <EyeOff size={12} />} {b.active ? 'Active' : 'Hidden'}
                    </button>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button onClick={() => openEdit(b)} title="Edit" data-testid={`edit-banner-${b.id}`}><Edit2 size={14} /></button>
                      <button onClick={() => setDeleteConfirm(b)} title="Delete" data-testid={`delete-banner-${b.id}`}><Trash2 size={14} color="#EF4444" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="admin-modal-overlay" onClick={closeForm}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <button className="admin-modal-close" onClick={closeForm}><X size={18} /></button>
            <h3>{editing === 'new' ? 'New Banner' : 'Edit Banner'}</h3>

            <div className="admin-form" style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 }}>
              <div className="frow">
                <div className="af-field">
                  <label>Eyebrow Tag</label>
                  <input type="text" value={form.eyebrow} onChange={(e) => setForm({...form, eyebrow: e.target.value})}
                    placeholder="NEW COLLECTION" data-testid="banner-form-eyebrow" />
                </div>
                <div className="af-field">
                  <label>Sort Order</label>
                  <input type="number" value={form.sort_order} onChange={(e) => setForm({...form, sort_order: parseInt(e.target.value) || 0})} />
                </div>
              </div>

              <div className="af-field">
                <label>Title *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})}
                  placeholder="Crafted for the Discerning" data-testid="banner-form-title" />
              </div>

              <div className="af-field">
                <label>Subtitle</label>
                <textarea rows="2" value={form.subtitle} onChange={(e) => setForm({...form, subtitle: e.target.value})}
                  placeholder="Bespoke footwear handcrafted to your exact specifications..." data-testid="banner-form-subtitle" />
              </div>

              <div className="af-field">
                <label>Price Text (optional)</label>
                <input type="text" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})}
                  placeholder="₹6,000" />
              </div>

              <div style={{ marginTop: 16 }}>
                <ImageUploader value={form.image} onChange={(url) => setForm({...form, image: url})}
                  label="Banner Image *" testId="banner-form-image" />
              </div>

              <div className="frow" style={{ marginTop: 16 }}>
                <div className="af-field">
                  <label>Primary CTA Text</label>
                  <input type="text" value={form.primary_cta} onChange={(e) => setForm({...form, primary_cta: e.target.value})} placeholder="Shop Now" />
                </div>
                <div className="af-field">
                  <label>Primary CTA Link</label>
                  <input type="text" value={form.primary_cta_link} onChange={(e) => setForm({...form, primary_cta_link: e.target.value})} placeholder="/men" />
                </div>
              </div>

              <div className="frow">
                <div className="af-field">
                  <label>Secondary CTA Text</label>
                  <input type="text" value={form.secondary_cta} onChange={(e) => setForm({...form, secondary_cta: e.target.value})} placeholder="Learn More" />
                </div>
                <div className="af-field">
                  <label>Secondary CTA Link</label>
                  <input type="text" value={form.secondary_cta_link} onChange={(e) => setForm({...form, secondary_cta_link: e.target.value})} placeholder="#" />
                </div>
              </div>

              <div className="af-field">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.active} onChange={(e) => setForm({...form, active: e.target.checked})} />
                  <span>Active (visible on home page)</span>
                </label>
              </div>

              <button type="button" className="admin-btn-primary" onClick={handleSave} disabled={saving}
                data-testid="banner-form-save"
                style={{ marginTop: 16, width: '100%' }}>
                {saving ? 'Saving…' : (editing === 'new' ? 'Create Banner' : 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="admin-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <button className="admin-modal-close" onClick={() => setDeleteConfirm(null)}><X size={18} /></button>
            <h3>Delete Banner?</h3>
            <p style={{ marginTop: 8, marginBottom: 24 }}>Delete <strong>{deleteConfirm.title}</strong>? This cannot be undone.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setDeleteConfirm(null)} className="admin-btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleDelete} className="admin-btn-primary" data-testid="confirm-delete-banner"
                style={{ flex: 1, background: '#EF4444' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBanners;
