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
  const [galleryImages, setGalleryImages] = useState([]);

  // Dynamic & Static Fallback Material Options
  const defaultMaterials = [
    'Full-Grain Calf Leather', 
    'Italian Calfskin', 
    'Premium Suede', 
    'Embroidered Heritage Silk', 
    'Patent Leather', 
    'Brushed Velvet'
  ];

  const [materialOptions, setMaterialOptions] = useState(defaultMaterials.sort());
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [customMaterial, setCustomMaterial] = useState('');

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const data = await api.listBanners(`?section=${section}`);
      setBanners(data.items || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchBanners(); }, [section]);

  // Fetch unique materials from materials library when component mounts
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const data = await api.getMaterials();
        const names = (data.materials || []).map(m => m.name);
        const combined = Array.from(new Set([...defaultMaterials, ...names])).sort();
        setMaterialOptions(combined);
      } catch (err) {
        console.error('Failed to fetch materials:', err);
        setMaterialOptions(defaultMaterials.sort());
      }
    };
    fetchMaterials();
  }, []);

  const openNew = () => {
    const nextOrder = banners.length ? Math.max(...banners.map(b => b.sort_order || 0)) + 1 : 0;
    setForm({ 
      ...emptyBanner, 
      eyebrow: section === 'slider' ? 'NEW COLLECTION' : 'BESTSELLER',
      sort_order: nextOrder, 
      section: section 
    });
    setSelectedMaterial('');
    setCustomMaterial('');
    setGalleryImages(['', '', '']);
    setEditing('new');
  };

  const openEdit = (b) => {
    const imgList = (b.image || '').split(',').filter(Boolean);
    const primary = imgList[0] || '';
    const gallery = [imgList[1] || '', imgList[2] || '', imgList[3] || ''];
    
    const matName = b.subtitle || '';
    const isStandard = materialOptions.includes(matName) || defaultMaterials.includes(matName);

    if (matName === '') {
      setSelectedMaterial('');
      setCustomMaterial('');
    } else if (isStandard) {
      setSelectedMaterial(matName);
      setCustomMaterial('');
    } else {
      setSelectedMaterial('Other');
      setCustomMaterial(matName);
    }

    setForm({
      eyebrow: b.eyebrow || '',
      title: b.title || '',
      subtitle: b.subtitle || '',
      price: b.price || '',
      image: primary,
      primary_cta: b.primary_cta || '',
      primary_cta_link: b.primary_cta_link || '',
      secondary_cta: b.secondary_cta || '',
      secondary_cta_link: b.secondary_cta_link || '',
      sort_order: b.sort_order || 0,
      active: b.active !== false,
      section: b.section || 'slider',
    });
    setGalleryImages(gallery);
    setEditing(b.id);
  };

  const closeForm = () => {
    setEditing(null);
    setForm(emptyBanner);
    setSelectedMaterial('');
    setCustomMaterial('');
    setGalleryImages(['', '', '']);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.image.trim()) {
      alert('Title and image are required.');
      return;
    }
    setSaving(true);
    try {
      const finalImages = [form.image, ...galleryImages].filter(Boolean).join(',');
      const payload = { ...form, image: finalImages };

      if (editing === 'new') await api.createBanner(payload);
      else await api.updateBanner(editing, payload);
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
          <Plus size={14} /> {
            section === 'slider' ? 'New Hero Slide' :
            section === 'signature' ? 'New Signature Style' :
            section === 'explore' ? 'New Explore Tile' : 'New Luxe Tile'
          }
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
        <div className="admin-empty">No assets yet. Add your first {section === 'slider' ? 'hero slide' : 'collection tile'} to start.</div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table" data-testid="admin-banners-table">
            <thead>
              {section === 'slider' ? (
                <tr>
                  <th style={{ width: 70 }}>Order</th>
                  <th>Image</th>
                  <th>Title &amp; Tag</th>
                  <th>Subtitle &amp; Price</th>
                  <th>Call to Actions</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              ) : (
                <tr>
                  <th style={{ width: 70 }}>Order</th>
                  <th>Images (Primary + Gallery)</th>
                  <th>Product Name &amp; Badge</th>
                  <th>Material &amp; Specs</th>
                  <th>Display Price</th>
                  <th>Product Link</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              )}
            </thead>
            <tbody>
              {banners.map((b, idx) => {
                const imgList = (b.image || '').split(',').filter(Boolean);
                const primaryImage = imgList[0] || '';
                const galleryList = imgList.slice(1);

                return (
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

                    {section === 'slider' ? (
                      /* Slider Tab Columns */
                      <>
                        <td>
                          <div style={{ width: 80, height: 56, borderRadius: 4, overflow: 'hidden', background: '#F3F4F6' }}>
                            {primaryImage && <img src={primaryImage} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: 11, color: '#9d2706', fontWeight: 600, letterSpacing: '0.08em' }}>{b.eyebrow}</div>
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
                      </>
                    ) : (
                      /* Grid Collections Tab Columns */
                      <>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {/* Primary display image */}
                            <div style={{ width: 80, height: 56, borderRadius: 4, overflow: 'hidden', background: '#F3F4F6', border: '1px solid #E5E7EB' }}>
                              {primaryImage && <img src={primaryImage} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                            </div>
                            {/* Additional perspective gallery images */}
                            {galleryList.length > 0 && (
                              <div style={{ display: 'flex', gap: 4 }}>
                                {galleryList.map((gImg, gIdx) => (
                                  <div key={gIdx} style={{ width: 22, height: 22, borderRadius: 3, overflow: 'hidden', background: '#F3F4F6', border: '1px solid #9d2706' }} title={`Perspective ${gIdx + 1}`}>
                                    <img src={gImg} alt="Gallery Perspective" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          {b.eyebrow && (
                            <span style={{ display: 'inline-block', fontSize: 9, background: '#9d270620', color: '#9d2706', padding: '2px 6px', borderRadius: 4, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>
                              {b.eyebrow}
                            </span>
                          )}
                          <div><strong>{b.title}</strong></div>
                        </td>
                        <td style={{ fontSize: 13, color: '#4B5563' }}>
                          {b.subtitle}
                        </td>
                        <td>
                          <strong style={{ color: '#111827' }}>{b.price || '—'}</strong>
                        </td>
                        <td>
                          {b.primary_cta_link ? (
                            <code style={{ background: '#F3F4F6', padding: '2px 6px', borderRadius: 4, fontSize: 11, color: '#374151' }}>{b.primary_cta_link}</code>
                          ) : (
                            <span style={{ color: '#9CA3AF', fontSize: 11, fontStyle: 'italic' }}>Direct Link Not Set</span>
                          )}
                        </td>
                      </>
                    )}

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
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="admin-modal-overlay" onClick={closeForm}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <button className="admin-modal-close" onClick={closeForm}><X size={18} /></button>
            <h3>{editing === 'new' ? `New ${section === 'slider' ? 'Hero Slide' : 'Collection Tile'}` : `Edit ${section === 'slider' ? 'Hero Slide' : 'Collection Tile'}`}</h3>

            <div className="admin-form" style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 }}>
              
              {section === 'slider' ? (
                /* HERO SLIDER SECTION FIELDS */
                <>
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
                </>
              ) : (
                /* GRID TILES FIELDS (Signature, Explore, Luxe) */
                <>
                  <div className="frow">
                    <div className="af-field">
                      <label>Badge / Tag (e.g. BESTSELLER, LUXE, NEW)</label>
                      <input type="text" value={form.eyebrow} onChange={(e) => setForm({...form, eyebrow: e.target.value})}
                        placeholder="BESTSELLER" data-testid="banner-form-eyebrow" />
                    </div>
                    <div className="af-field">
                      <label>Sort Order</label>
                      <input type="number" value={form.sort_order} onChange={(e) => setForm({...form, sort_order: parseInt(e.target.value) || 0})} />
                    </div>
                  </div>

                  <div className="af-field">
                    <label>Product Name / Tile Title *</label>
                    <input type="text" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})}
                      placeholder="e.g. Classic Oxford" data-testid="banner-form-title" />
                  </div>

                  <div className="frow">
                    <div className="af-field">
                      <label>Material &amp; Details *</label>
                      <select 
                        value={selectedMaterial} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedMaterial(val);
                          if (val !== 'Other') {
                            setForm({ ...form, subtitle: val });
                          } else {
                            setForm({ ...form, subtitle: customMaterial });
                          }
                        }}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #E5E7EB', outline: 'none', background: 'white' }}
                      >
                        <option value="">-- Select Material --</option>
                        {materialOptions.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                        <option value="Other">Other (Custom Material)</option>
                      </select>
                    </div>
                    <div className="af-field">
                      <label>Display Price *</label>
                      <input type="text" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})}
                        placeholder="₹8,500" />
                    </div>
                  </div>

                  {selectedMaterial === 'Other' && (
                    <div className="af-field" style={{ marginTop: 12 }}>
                      <label>Specify Custom Material Name *</label>
                      <input 
                        type="text" 
                        value={customMaterial} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomMaterial(val);
                          setForm({ ...form, subtitle: val });
                        }}
                        placeholder="e.g. Suede &amp; Brushed Velvet" 
                        required
                      />
                    </div>
                  )}

                  <div className="af-field">
                    <label>CTA Target Link / Product Detail Link</label>
                    <input type="text" value={form.primary_cta_link} onChange={(e) => setForm({...form, primary_cta_link: e.target.value})}
                      placeholder="e.g. /men/product/64f0ea8a2bc..." />
                    <span style={{ fontSize: 10, color: '#6B7280', marginTop: 4, display: 'block' }}>
                      Allows customers to navigate directly to the product detail or collection view on click.
                    </span>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <ImageUploader value={form.image} onChange={(url) => setForm({...form, image: url})}
                      label="Primary Display Image *" testId="banner-form-image" />
                  </div>

                  {/* MULTI-IMAGE GALLERY STORAGE */}
                  <div style={{ marginTop: 24, borderTop: '1px solid #E5E7EB', paddingTop: 20 }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827', marginBottom: 6 }}>
                      📷 Additional Gallery Images (Multi-perspective transitions)
                    </h4>
                    <p style={{ fontSize: '0.7rem', color: '#6B7280', marginBottom: 16 }}>
                      Add up to 3 extra angles or alternate images. The home page grid will smoothly swap to these angles on hover!
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {[0, 1, 2].map((gIdx) => (
                        <div key={gIdx} style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#F9FAFB', padding: '12px 16px', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                          <div style={{ flex: 1 }}>
                            <ImageUploader 
                              value={galleryImages[gIdx] || ''} 
                              onChange={(url) => {
                                const nextList = [...galleryImages];
                                nextList[gIdx] = url;
                                setGalleryImages(nextList);
                              }}
                              label={`Gallery Image ${gIdx + 1}`}
                            />
                          </div>
                          {galleryImages[gIdx] && (
                            <button 
                              type="button" 
                              onClick={() => {
                                const nextList = [...galleryImages];
                                nextList[gIdx] = '';
                                setGalleryImages(nextList);
                              }}
                              style={{ padding: '6px 12px', background: '#EF444415', color: '#EF4444', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', height: 38, marginTop: 24 }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="af-field" style={{ marginTop: 16 }}>
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
