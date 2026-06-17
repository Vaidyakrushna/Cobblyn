"use client";
import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Plus, Trash2, CheckCircle2, AlertTriangle, 
  Upload, Layers, IndianRupee, Link as LinkIcon, RefreshCw,
  Eye, Check, EyeOff
} from 'lucide-react';
import api from '../../api';

const AdminAssets = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState('');
  
  // Form state
  const [form, setForm] = useState({
    name: '',
    region: 'leather',
    type: 'material',
    color_hex: '',
    price_modifier: 0,
    available: true
  });
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');

  // Fetch customizable assets
  const fetchAssets = async () => {
    try {
      const res = await api.request('/assets');
      setAssets(res.assets || []);
    } catch (err) {
      console.error('Failed to fetch assets:', err);
      showToast('❌ Failed to retrieve customizer swatches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setFilePreview(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return showToast('⚠️ Please enter an asset name.');
    
    setActionLoading(true);
    try {
      let finalUrl = '';
      
      if (file) {
        // 1. Upload structural image to validation API
        const uploadRes = await api.uploadImage(file);
        const uploadedUrl = uploadRes.url;
        
        // 2. Rewrite image URL to use our high-performance CDN-caching proxy endpoint
        const filename = uploadRes.filename;
        const backendBase = uploadedUrl.split('/api/uploads/')[0];
        finalUrl = `${backendBase}/api/assets/cdn/${filename}`;
      } else if (form.type === 'color' && form.color_hex) {
        // Color swatches do not strictly require an image file
        finalUrl = '';
      } else {
        throw new Error('Please choose a swatch/texture file to upload.');
      }

      // 3. Create the customizable customizer asset record
      await api.request('/assets', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          region: form.region,
          type: form.type,
          image_url: finalUrl,
          color_hex: form.color_hex || null,
          price_modifier: Number(form.price_modifier),
          available: form.available
        })
      });

      showToast('✨ Customizer asset added to CDN registry successfully!');
      
      // Reset form
      setForm({
        name: '',
        region: 'leather',
        type: 'material',
        color_hex: '',
        price_modifier: 0,
        available: true
      });
      setFile(null);
      setFilePreview('');
      fetchAssets();
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (assetId) => {
    if (!confirm('Are you sure you want to delete this customizer asset?')) return;
    
    setActionLoading(true);
    try {
      await api.request(`/assets/${assetId}`, { method: 'DELETE' });
      showToast('🗑️ Asset deleted successfully.');
      fetchAssets();
    } catch (err) {
      showToast(`❌ Failed to delete asset: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAvailability = async (asset) => {
    try {
      await api.request(`/assets/${asset.id}`, {
        method: 'PUT',
        body: JSON.stringify({ available: !asset.available })
      });
      showToast(`✨ Availability updated for ${asset.name}`);
      fetchAssets();
    } catch (err) {
      showToast(`❌ Failed: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '24px 32px', color: '#1c1917', minHeight: '80vh' }}>
      
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', background: '#111', border: '1px solid #9d2706', borderRadius: '8px', padding: '12px 24px', color: '#fff', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1100, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
          <Layers size={16} color="#9d2706" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e7e5e4', paddingBottom: '20px', marginBottom: '24px' }}>
        <div>
          <span style={{ fontSize: '0.62rem', color: '#9d2706', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>BESPOKE ATELIER</span>
          <h1 style={{ margin: '4px 0 0 0', fontFamily: 'Montserrat, sans-serif', fontSize: '1.6rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={28} color="#9d2706" /> Customizer Assets CDN Manager
          </h1>
        </div>
        <button 
          onClick={fetchAssets}
          style={{
            padding: '8px 12px',
            fontSize: '0.75rem',
            background: '#111',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh CDN List
        </button>
      </div>

      {/* Main Grid: Upload Form (Left) & Active Swatches Grid (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Left: Upload Asset Form */}
        <div style={{ background: '#FAF9F6', border: '1px solid #9d2706', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '0.85rem', fontWeight: 700, color: '#9d2706', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px dashed rgba(157,39,6,0.3)', paddingBottom: '8px' }}>
            📥 Register Swatch to CDN
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Material / Color Name</label>
              <input 
                type="text" 
                placeholder="e.g. Gilded Cork Suede" 
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem', color: '#1F2937' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Customizer Region</label>
                <select 
                  value={form.region}
                  onChange={(e) => setForm(prev => ({ ...prev, region: e.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem', color: '#1F2937', background: '#fff' }}
                >
                  <option value="leather">Leather Upper</option>
                  <option value="sole">Outsole</option>
                  <option value="heel">Heel Block</option>
                  <option value="lining">Lining</option>
                  <option value="laces">Laces</option>
                  <option value="vamp">Vamp/Toe</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Asset Category</label>
                <select 
                  value={form.type}
                  onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem', color: '#1F2937', background: '#fff' }}
                >
                  <option value="material">Texture/Material</option>
                  <option value="color">Solid Color</option>
                  <option value="texture">Detailed Shader</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Color Hex (Optional)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="#9d2706" 
                    value={form.color_hex}
                    onChange={(e) => setForm(prev => ({ ...prev, color_hex: e.target.value }))}
                    style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem', color: '#1F2937', fontFamily: 'monospace' }}
                  />
                  {form.color_hex && (
                    <div style={{ width: '38px', height: '38px', borderRadius: '6px', border: '1px solid #d1d5db', background: form.color_hex }} />
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Price Modifier (INR)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', fontWeight: 'bold', color: '#6b7280' }}>₹</span>
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={form.price_modifier}
                    onChange={(e) => setForm(prev => ({ ...prev, price_modifier: e.target.value }))}
                    style={{ width: '100%', padding: '10px 10px 10px 24px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem', color: '#1F2937' }}
                  />
                </div>
              </div>
            </div>

            {/* File Drag / Upload container */}
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Texture Swatch File</label>
              <div style={{ border: '2px dashed #9d2706', borderRadius: '8px', background: '#fff', padding: '20px', textAlign: 'center', position: 'relative', cursor: 'pointer', transition: 'all 0.2s' }}>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                />
                {filePreview ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <img src={filePreview} alt="Preview" style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #9d2706' }} />
                    <span style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 600 }}>✓ {file.name.slice(0, 16)}...</span>
                  </div>
                ) : (
                  <div style={{ color: '#6b7280' }}>
                    <Upload size={24} color="#9d2706" style={{ margin: '0 auto 8px' }} />
                    <span style={{ fontSize: '0.72rem', display: 'block', fontWeight: 600 }}>Drag or Click to Upload</span>
                    <span style={{ fontSize: '0.62rem', display: 'block', marginTop: '2px' }}>Supported: JPEG, PNG, WEBP (Max 5MB)</span>
                  </div>
                )}
              </div>
            </div>

            <button 
              type="submit"
              disabled={actionLoading}
              style={{
                width: '100%',
                padding: '12px',
                background: '#111',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '8px'
              }}
            >
              {actionLoading ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={16} />} Upload & Register to CDN
            </button>
          </form>
        </div>

        {/* Right: CDN Assets Display */}
        <div>
          <div style={{ background: 'rgba(157, 39, 6, 0.05)', border: '1px solid rgba(157, 39, 6, 0.25)', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.72rem', color: '#9A7D32', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            <span><strong>High-Performance CDN Active:</strong> All swatches uploaded here are instantly optimized and served through the server edge cache proxy with immutable headers (<code>Cache-Control: public, max-age=31536000</code>).</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>Loading customizer dynamic assets...</div>
          ) : assets.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '80px 20px', textAlign: 'center', color: '#6b7280' }}>
              <Layers size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: '#1f2937' }}>No CDN Swatches Uploaded</h4>
              <p style={{ margin: 0, fontSize: '0.75rem' }}>Use the builder on the left to upload your custom materials or texture maps.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
              {assets.map((asset) => (
                <div 
                  key={asset.id}
                  style={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.01)',
                    display: 'flex',
                    flexDirection: 'column',
                    opacity: asset.available ? 1 : 0.65,
                    transition: 'all 0.2s'
                  }}
                >
                  {/* Swatch Display */}
                  <div style={{ height: '140px', background: '#F9FAFB', borderBottom: '1px solid #e5e7eb', position: 'relative', overflow: 'hidden' }}>
                    {asset.image_url ? (
                      <img 
                        src={asset.image_url} 
                        alt={asset.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: asset.color_hex || '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', fontFamily: 'monospace', padding: '4px 8px', background: 'rgba(255,255,255,0.7)', borderRadius: '4px', border: '1px solid #d1d5db' }}>{asset.color_hex}</span>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div style={{ position: 'absolute', top: '10px', left: '10px', background: asset.available ? '#059669' : '#4b5563', color: '#fff', fontSize: '0.62rem', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {asset.available ? 'Active' : 'Disabled'}
                    </div>

                    <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(17,17,17,0.85)', color: '#9d2706', fontSize: '0.62rem', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {asset.region}
                    </div>
                  </div>

                  {/* Swatch Info */}
                  <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '8px', marginBottom: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#111' }}>{asset.name}</h4>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#9d2706' }}>
                        {asset.price_modifier > 0 ? `+ ₹${asset.price_modifier.toLocaleString()}` : 'No Cost'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.68rem', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
                      <div>Type: <strong style={{ color: '#4b5563', textTransform: 'capitalize' }}>{asset.type}</strong></div>
                      {asset.image_url && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <LinkIcon size={10} />
                          <span 
                            title={asset.image_url} 
                            style={{ 
                              fontFamily: 'monospace', 
                              fontSize: '0.6rem', 
                              whiteSpace: 'nowrap', 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              maxWidth: '180px',
                              cursor: 'pointer',
                              textDecoration: 'underline'
                            }}
                            onClick={() => window.open(asset.image_url, '_blank')}
                          >
                            ...{asset.image_url.slice(-24)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                      <button
                        onClick={() => handleToggleAvailability(asset)}
                        style={{
                          flex: 1,
                          padding: '6px',
                          fontSize: '0.7rem',
                          background: 'none',
                          border: '1px solid #d1d5db',
                          color: '#4b5563',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        {asset.available ? (
                          <><EyeOff size={12} /> Disable</>
                        ) : (
                          <><Eye size={12} /> Enable</>
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(asset.id)}
                        disabled={actionLoading}
                        style={{
                          padding: '6px 10px',
                          background: 'none',
                          border: '1px solid #f3f4f6',
                          color: '#dc2626',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        title="Delete Swatch"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default AdminAssets;
