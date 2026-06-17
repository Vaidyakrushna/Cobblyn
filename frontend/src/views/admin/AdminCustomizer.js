"use client";
import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Plus, Trash2, CheckCircle2, AlertTriangle, 
  Upload, Layers, IndianRupee, Link as LinkIcon, RefreshCw,
  Eye, Check, EyeOff, Settings, Calculator, FileText, Layout,
  Sliders, Edit2, X, ToggleLeft, ToggleRight
} from 'lucide-react';
import api from '../../api';

const AdminCustomizer = () => {
  const [activeTab, setActiveTab] = useState('flow'); // 'flow' | 'catalog' | 'materials'
  const [toast, setToast] = useState('');

  // Atelier Flow settings state (Mock/Localstorage persistence for demo and runtime control)
  const [steps, setSteps] = useState([
    { id: 'gender', label: 'Gender Choice', description: 'Step 0: Choose Men or Women cards', visible: true },
    { id: 'model', label: 'Category Model', description: 'Step 1: Choose category (e.g. Oxford, Derby)', visible: true },
    { id: 'submodel', label: 'Silhouette Submodel', description: 'Step 2: Choose distinct style silhouette', visible: true },
    { id: 'leather', label: 'Leather Selection', description: 'Step 3: Customize leather grade', visible: true },
    { id: 'color', label: 'Colorway Picker', description: 'Step 4: Choose color hex option', visible: true },
    { id: 'sole', label: 'Outsoles Selection', description: 'Step 5: Select sole type', visible: true },
    { id: 'size', label: 'Fit & Sizing', description: 'Step 6: Choose sizing parameters', visible: true },
    { id: 'summary', label: 'Summary & Monogram', description: 'Step 7: Personal monogram & place order', visible: true }
  ]);

  // Model/Silhouette Catalog State
  const [catalog, setCatalog] = useState({
    men: [
      { name: 'Oxford', desc: 'Classic closed-lacing elegance', img: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=500&q=80&fit=crop' },
      { name: 'Derby', desc: 'Open-lacing versatility', img: 'https://images.unsplash.com/photo-1616696038562-574c18066055?w=500&q=80&fit=crop' },
      { name: 'Loafer', desc: 'Slip-on sophistication', img: 'https://images.pexels.com/photos/29258015/pexels-photo-29258015.jpeg?auto=compress&cs=tinysrgb&w=500' }
    ],
    women: [
      { name: 'Ballerina', desc: 'Graceful flat elegance', img: 'https://images.unsplash.com/photo-1774802536876-88b0e1ca7453?w=500&q=80&fit=crop' },
      { name: 'Boots', desc: 'Sculpted ankle silhouette', img: 'https://images.unsplash.com/photo-1720603989488-1f3d16b7be9d?w=500&q=80&fit=crop' }
    ]
  });

  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [editingCatalogGender, setEditingCatalogGender] = useState('men');
  const [editingCatalogIndex, setEditingCatalogIndex] = useState(null);
  const [catalogForm, setCatalogForm] = useState({ name: '', desc: '', img: '' });

  // CDN Assets / Swatches State
  const [assets, setAssets] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [subTab, setSubTab] = useState('swatches'); // 'swatches' | 'rules'

  const [assetForm, setAssetForm] = useState({
    name: '',
    region: 'leather',
    type: 'material',
    color_hex: '',
    price_modifier: 0,
    available: true
  });
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');

  // Rules Engine State
  const [rules, setRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    condition_field: 'material',
    condition_value: '',
    action: 'add_price',
    action_value: 0,
    active: true,
    priority: 0,
    conditions: [],
    logical_operator: 'AND',
    description: ''
  });

  const conditionFields = ['material', 'style', 'sole_type', 'construction', 'color', 'category', 'gender'];

  useEffect(() => {
    // Load persisted flow settings if any
    const savedSteps = localStorage.getItem('byond_customizer_steps');
    if (savedSteps) {
      try { setSteps(JSON.parse(savedSteps)); } catch (e) {}
    }
    const savedCatalog = localStorage.getItem('byond_customizer_catalog');
    if (savedCatalog) {
      try { setCatalog(JSON.parse(savedCatalog)); } catch (e) {}
    }

    fetchAssets();
    fetchRules();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  // 1. Atelier Flow Handlers
  const handleToggleStep = (index) => {
    const updated = [...steps];
    updated[index].visible = !updated[index].visible;
    setSteps(updated);
    localStorage.setItem('byond_customizer_steps', JSON.stringify(updated));
    showToast(`✨ Flow step visibility updated for ${updated[index].label}`);
  };

  const handleMoveStep = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === steps.length - 1) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...steps];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setSteps(updated);
    localStorage.setItem('byond_customizer_steps', JSON.stringify(updated));
    showToast(`✨ Stepper sequence updated successfully!`);
  };

  // 2. Model Catalog Handlers
  const handleOpenCatalogModal = (gender, index = null) => {
    setEditingCatalogGender(gender);
    setEditingCatalogIndex(index);
    if (index !== null) {
      setCatalogForm(catalog[gender][index]);
    } else {
      setCatalogForm({ name: '', desc: '', img: '' });
    }
    setShowCatalogModal(true);
  };

  const handleSaveCatalogItem = (e) => {
    e.preventDefault();
    if (!catalogForm.name.trim()) return showToast('⚠️ Please enter a model name.');

    const updatedCatalog = { ...catalog };
    if (editingCatalogIndex !== null) {
      updatedCatalog[editingCatalogGender][editingCatalogIndex] = catalogForm;
    } else {
      updatedCatalog[editingCatalogGender].push(catalogForm);
    }
    setCatalog(updatedCatalog);
    localStorage.setItem('byond_customizer_catalog', JSON.stringify(updatedCatalog));
    setShowCatalogModal(false);
    showToast('✨ Model Catalog updated successfully!');
  };

  const handleDeleteCatalogItem = (gender, index) => {
    if (!confirm('Are you sure you want to delete this catalog model?')) return;
    const updatedCatalog = { ...catalog };
    updatedCatalog[gender].splice(index, 1);
    setCatalog(updatedCatalog);
    localStorage.setItem('byond_customizer_catalog', JSON.stringify(updatedCatalog));
    showToast('🗑️ Model deleted from catalog.');
  };

  // 3. CDN Assets Handlers
  const fetchAssets = async () => {
    try {
      const res = await api.request('/assets');
      setAssets(res.assets || []);
    } catch (err) {
      console.error('Failed to fetch assets:', err);
      showToast('❌ Failed to retrieve customizer swatches.');
    } finally {
      setAssetsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setFilePreview(URL.createObjectURL(selected));
    }
  };

  const handleAssetSubmit = async (e) => {
    e.preventDefault();
    if (!assetForm.name.trim()) return showToast('⚠️ Please enter an asset name.');
    
    setActionLoading(true);
    try {
      let finalUrl = '';
      if (file) {
        const uploadRes = await api.uploadImage(file);
        const uploadedUrl = uploadRes.url;
        const filename = uploadRes.filename;
        const backendBase = uploadedUrl.split('/api/uploads/')[0];
        finalUrl = `${backendBase}/api/assets/cdn/${filename}`;
      } else if (assetForm.type === 'color' && assetForm.color_hex) {
        finalUrl = '';
      } else {
        throw new Error('Please choose a swatch/texture file to upload.');
      }

      await api.request('/assets', {
        method: 'POST',
        body: JSON.stringify({
          name: assetForm.name,
          region: assetForm.region,
          type: assetForm.type,
          image_url: finalUrl,
          color_hex: assetForm.color_hex || null,
          price_modifier: Number(assetForm.price_modifier),
          available: assetForm.available
        })
      });

      showToast('✨ Customizer asset added to CDN registry!');
      setAssetForm({
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

  const handleToggleAssetAvailability = async (asset) => {
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

  const handleAssetDelete = async (assetId) => {
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

  // 4. Rules Engine Handlers
  const fetchRules = async () => {
    try {
      const res = await api.request('/rules');
      setRules(res.rules || []);
    } catch (err) {
      console.error('Failed to fetch rules:', err);
    } finally {
      setRulesLoading(false);
    }
  };

  const handleRuleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (editingRuleId) {
        await api.request(`/rules/${editingRuleId}`, {
          method: 'PUT',
          body: JSON.stringify(ruleForm)
        });
        showToast('✨ Pricing rule updated successfully!');
      } else {
        await api.request('/rules', {
          method: 'POST',
          body: JSON.stringify(ruleForm)
        });
        showToast('✨ Pricing rule created successfully!');
      }
      setShowRuleForm(false);
      setEditingRuleId(null);
      setRuleForm({
        name: '',
        condition_field: 'material',
        condition_value: '',
        action: 'add_price',
        action_value: 0,
        active: true,
        priority: 0,
        conditions: [],
        logical_operator: 'AND',
        description: ''
      });
      fetchRules();
    } catch (err) {
      showToast(`❌ Failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRuleEdit = (rule) => {
    setRuleForm({
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
    setEditingRuleId(rule.id);
    setShowRuleForm(true);
  };

  const handleToggleRuleActive = async (rule) => {
    try {
      await api.request(`/rules/${rule.id}`, {
        method: 'PUT',
        body: JSON.stringify({ active: !rule.active })
      });
      showToast(`✨ Rule status updated for ${rule.name}`);
      fetchRules();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRuleDelete = async (ruleId) => {
    if (!confirm('Are you sure you want to delete this pricing rule?')) return;
    try {
      await api.request(`/rules/${ruleId}`, { method: 'DELETE' });
      showToast('🗑️ Pricing rule deleted.');
      fetchRules();
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '24px 32px', color: '#1c1917', minHeight: '85vh', background: '#fff' }}>
      
      {/* Toast Notification */}
      {toast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', background: '#111', border: '1px solid #C9A84C', borderRadius: '8px', padding: '12px 24px', color: '#fff', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1100, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
          <Settings size={16} color="#C9A84C" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ borderBottom: '1px solid #e7e5e4', paddingBottom: '20px', marginBottom: '24px' }}>
        <span style={{ fontSize: '0.62rem', color: '#C9A84C', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>BESPOKE ATELIER</span>
        <h1 style={{ margin: '4px 0 0 0', fontFamily: 'Montserrat, sans-serif', fontSize: '1.8rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Sliders size={28} color="#C9A84C" /> Customizer Configuration Suite
        </h1>
        <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: '#78716c' }}>
          Take full command of the bespoke customization landing, steps visibility, models catalog, and CDN swatches pricing rules.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid #f3f4f6', marginBottom: '32px', paddingBottom: '1px' }}>
        {[
          { id: 'flow', label: 'Atelier Step Flow', icon: <Sliders size={16} /> },
          { id: 'catalog', label: 'Model & Silhouette Catalog', icon: <Layout size={16} /> },
          { id: 'materials', label: 'Material Swatches & Pricing', icon: <Layers size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #C9A84C' : '2px solid transparent',
              color: activeTab === tab.id ? '#C9A84C' : '#78716c',
              cursor: 'pointer',
              marginBottom: '-2px',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content 1: Atelier Flow Settings */}
      {activeTab === 'flow' && (
        <div style={{ maxWidth: '800px' }}>
          <div style={{ background: '#FAF9F6', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#1c1917', fontWeight: 600 }}>Customizer Step Sequencer</h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#78716c', lineHeight: 1.5 }}>
              Toggle visibility of customizer steps to streamline user paths, or re-order steps. Visibility changes are cached locally and immediately reflected on the storefront configurator.
            </p>
          </div>

          <div style={{ border: '1px solid #e7e5e4', borderRadius: '12px', overflow: 'hidden' }}>
            {steps.map((s, idx) => (
              <div 
                key={s.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '16px 24px', 
                  background: s.visible ? '#fff' : '#f9fafb',
                  borderBottom: idx === steps.length - 1 ? 'none' : '1px solid #e7e5e4',
                  opacity: s.visible ? 1 : 0.65
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#C9A84C', width: '24px' }}>{idx + 1}.</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>{s.label}</h4>
                    <span style={{ fontSize: '0.7rem', color: '#78716c' }}>{s.description}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {/* Visibility toggle button */}
                  <button
                    onClick={() => handleToggleStep(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: s.visible ? '#059669' : '#78716c',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    {s.visible ? (
                      <><Eye size={16} /> Visible</>
                    ) : (
                      <><EyeOff size={16} /> Hidden</>
                    )}
                  </button>

                  {/* Ordering arrows */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => handleMoveStep(idx, 'up')}
                      disabled={idx === 0}
                      style={{ padding: '6px 8px', border: '1px solid #e7e5e4', background: '#fff', cursor: idx === 0 ? 'not-allowed' : 'pointer', borderRadius: '4px', fontSize: '0.65rem' }}
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => handleMoveStep(idx, 'down')}
                      disabled={idx === steps.length - 1}
                      style={{ padding: '6px 8px', border: '1px solid #e7e5e4', background: '#fff', cursor: idx === steps.length - 1 ? 'not-allowed' : 'pointer', borderRadius: '4px', fontSize: '0.65rem' }}
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab content 2: Model & Silhouette Catalog */}
      {activeTab === 'catalog' && (
        <div>
          {['men', 'women'].map(gender => (
            <div key={gender} style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e7e5e4', paddingBottom: '8px', marginBottom: '20px' }}>
                <h3 style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.9rem', color: '#C9A84C' }}>
                  {gender === 'men' ? "Men's Silhouette Categories" : "Women's Silhouette Categories"}
                </h3>
                <button
                  onClick={() => handleOpenCatalogModal(gender)}
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.75rem',
                    background: '#111',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={14} /> Add Category
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {catalog[gender].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#fff',
                      border: '1px solid #e7e5e4',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.01)',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <div style={{ height: '140px', background: '#F9FAFB', overflow: 'hidden' }}>
                      <img src={item.img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', fontWeight: 700 }}>{item.name}</h4>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#78716c', lineHeight: 1.4 }}>{item.desc}</p>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                        <button
                          onClick={() => handleOpenCatalogModal(gender, idx)}
                          style={{ flex: 1, padding: '6px', fontSize: '0.7rem', background: 'none', border: '1px solid #d1d5db', color: '#4b5563', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                        >
                          <Edit2 size={12} /> Edit Details
                        </button>
                        <button
                          onClick={() => handleDeleteCatalogItem(gender, idx)}
                          style={{ padding: '6px 10px', background: 'none', border: '1px solid #f3f4f6', color: '#dc2626', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab content 3: Material Swatches & Rules */}
      {activeTab === 'materials' && (
        <div>
          {/* Sub Tab Switcher */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            <button
              onClick={() => setSubTab('swatches')}
              style={{
                padding: '8px 16px',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '20px',
                border: 'none',
                background: subTab === 'swatches' ? '#111' : '#f3f4f6',
                color: subTab === 'swatches' ? '#fff' : '#4b5563',
                cursor: 'pointer'
              }}
            >
              Material Swatches CDN Manager
            </button>
            <button
              onClick={() => setSubTab('rules')}
              style={{
                padding: '8px 16px',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '20px',
                border: 'none',
                background: subTab === 'rules' ? '#111' : '#f3f4f6',
                color: subTab === 'rules' ? '#fff' : '#4b5563',
                cursor: 'pointer'
              }}
            >
              Pricing Rules Engine
            </button>
          </div>

          {/* Sub tab A: Swatches Manager */}
          {subTab === 'swatches' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '32px', alignItems: 'start' }}>
              {/* Form Upload */}
              <div style={{ background: '#FAF9F6', border: '1px solid #C9A84C', borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '0.85rem', fontWeight: 700, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px dashed rgba(201,168,76,0.3)', paddingBottom: '8px' }}>
                  📥 Register Swatch to CDN
                </h3>
                <form onSubmit={handleAssetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Swatch Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Gilded Cork Suede" 
                      value={assetForm.name}
                      onChange={(e) => setAssetForm(prev => ({ ...prev, name: e.target.value }))}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem', color: '#1F2937' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Customizer Region</label>
                      <select 
                        value={assetForm.region}
                        onChange={(e) => setAssetForm(prev => ({ ...prev, region: e.target.value }))}
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
                        value={assetForm.type}
                        onChange={(e) => setAssetForm(prev => ({ ...prev, type: e.target.value }))}
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
                          placeholder="#C9A84C" 
                          value={assetForm.color_hex}
                          onChange={(e) => setAssetForm(prev => ({ ...prev, color_hex: e.target.value }))}
                          style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem', color: '#1F2937', fontFamily: 'monospace' }}
                        />
                        {assetForm.color_hex && (
                          <div style={{ width: '38px', height: '38px', borderRadius: '6px', border: '1px solid #d1d5db', background: assetForm.color_hex }} />
                        )}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Price Modifier (INR)</label>
                      <input 
                        type="number" 
                        placeholder="0" 
                        value={assetForm.price_modifier}
                        onChange={(e) => setAssetForm(prev => ({ ...prev, price_modifier: e.target.value }))}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem', color: '#1F2937' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Texture Swatch Image File</label>
                    <div style={{ border: '2px dashed #C9A84C', borderRadius: '8px', background: '#fff', padding: '20px', textAlign: 'center', position: 'relative', cursor: 'pointer' }}>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                      />
                      {filePreview ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <img src={filePreview} alt="Preview" style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #C9A84C' }} />
                          <span style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 600 }}>✓ {file.name.slice(0, 16)}...</span>
                        </div>
                      ) : (
                        <div style={{ color: '#6b7280' }}>
                          <Upload size={24} color="#C9A84C" style={{ margin: '0 auto 8px' }} />
                          <span style={{ fontSize: '0.72rem', display: 'block', fontWeight: 600 }}>Drag or Click to Upload</span>
                          <span style={{ fontSize: '0.62rem', display: 'block', marginTop: '2px' }}>JPEG, PNG, WEBP</span>
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
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {actionLoading ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={16} />} Upload to CDN
                  </button>
                </form>
              </div>

              {/* Swatches Grid */}
              <div>
                {assetsLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#78716c' }}>Loading CDN assets...</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                    {assets.map(asset => (
                      <div
                        key={asset.id}
                        style={{
                          background: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          opacity: asset.available ? 1 : 0.6
                        }}
                      >
                        <div style={{ height: '110px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', position: 'relative' }}>
                          {asset.image_url ? (
                            <img src={asset.image_url} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', background: asset.color_hex || '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.8)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>{asset.color_hex}</span>
                            </div>
                          )}
                          <div style={{ position: 'absolute', top: '6px', left: '6px', background: asset.available ? '#059669' : '#4b5563', color: '#fff', fontSize: '0.55rem', padding: '2px 6px', borderRadius: '3px', fontWeight: 800 }}>
                            {asset.available ? 'Active' : 'Disabled'}
                          </div>
                          <div style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(0,0,0,0.7)', color: '#C9A84C', fontSize: '0.55rem', padding: '2px 6px', borderRadius: '3px', textTransform: 'uppercase' }}>
                            {asset.region}
                          </div>
                        </div>
                        <div style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '6px', marginBottom: '8px' }}>
                            <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700 }}>{asset.name}</h4>
                            <span style={{ fontSize: '0.7rem', color: '#C9A84C', fontWeight: 700 }}>
                              {asset.price_modifier > 0 ? `+₹${asset.price_modifier}` : 'Free'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid #f3f4f6', paddingTop: '8px', marginTop: '12px' }}>
                            <button
                              onClick={() => handleToggleAssetAvailability(asset)}
                              style={{ flex: 1, padding: '4px', fontSize: '0.65rem', background: 'none', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              {asset.available ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              onClick={() => handleAssetDelete(asset.id)}
                              style={{ padding: '4px 8px', background: 'none', border: '1px solid #f3f4f6', color: '#dc2626', borderRadius: '4px', cursor: 'pointer' }}
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
          )}

          {/* Sub tab B: Pricing Rules Engine */}
          {subTab === 'rules' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Active Customizer Pricing Rules</h3>
                <button
                  onClick={() => { setShowRuleForm(true); setEditingRuleId(null); setRuleForm({ name: '', condition_field: 'material', condition_value: '', action: 'add_price', action_value: 0, active: true, priority: 0, conditions: [], logical_operator: 'AND', description: '' }); }}
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.75rem',
                    background: '#111',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={14} /> Add Rule
                </button>
              </div>

              {rulesLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#78716c' }}>Loading rules...</div>
              ) : (
                <div style={{ border: '1px solid #e7e5e4', borderRadius: '12px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e7e5e4' }}>
                        <th style={{ padding: '12px 20px' }}>Rule Name</th>
                        <th style={{ padding: '12px 20px' }}>Condition</th>
                        <th style={{ padding: '12px 20px' }}>Action</th>
                        <th style={{ padding: '12px 20px' }}>Amount</th>
                        <th style={{ padding: '12px 20px' }}>Priority</th>
                        <th style={{ padding: '12px 20px' }}>Status</th>
                        <th style={{ padding: '12px 20px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rules.map(rule => (
                        <tr key={rule.id} style={{ borderBottom: '1px solid #e7e5e4', opacity: rule.active ? 1 : 0.65 }}>
                          <td style={{ padding: '12px 20px' }}>
                            <strong>{rule.name}</strong>
                            <div style={{ fontSize: '0.7rem', color: '#78716c' }}>{rule.description}</div>
                          </td>
                          <td style={{ padding: '12px 20px' }}>
                            {rule.conditions && rule.conditions.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '0.6rem', color: '#C9A84C', fontWeight: 700 }}>MATCH {rule.logical_operator}</span>
                                {rule.conditions.map((c, idx) => (
                                  <span key={idx} style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '3px', fontSize: '0.65rem' }}>
                                    If {c.field} {c.operator === 'not_equals' ? '!=' : '='} "{c.value}"
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '3px', fontSize: '0.65rem' }}>If {rule.condition_field} = "{rule.condition_value}"</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 20px' }}>{rule.action === 'add_price' ? 'Add Price' : 'Multiply'}</td>
                          <td style={{ padding: '12px 20px', color: '#C9A84C', fontWeight: 700 }}>
                            {rule.action === 'add_price' ? `+₹${rule.action_value}` : `+${rule.action_value}%`}
                          </td>
                          <td style={{ padding: '12px 20px' }}>{rule.priority}</td>
                          <td style={{ padding: '12px 20px' }}>
                            <button
                              onClick={() => handleToggleRuleActive(rule)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: rule.active ? '#059669' : '#78716c' }}
                            >
                              {rule.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                            </button>
                          </td>
                          <td style={{ padding: '12px 20px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => handleRuleEdit(rule)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563' }}><Edit2 size={14} /></button>
                              <button onClick={() => handleRuleDelete(rule.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Catalog Modal */}
      {showCatalogModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '480px', position: 'relative' }}>
            <button onClick={() => setShowCatalogModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 600 }}>{editingCatalogIndex !== null ? 'Edit Model' : 'Add Model to Catalog'}</h3>
            
            <form onSubmit={handleSaveCatalogItem} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Model Name</label>
                <input 
                  type="text" 
                  value={catalogForm.name} 
                  onChange={e => setCatalogForm({ ...catalogForm, name: e.target.value })} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem' }}
                  placeholder="e.g. Oxford"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Description</label>
                <textarea 
                  value={catalogForm.desc} 
                  onChange={e => setCatalogForm({ ...catalogForm, desc: e.target.value })} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem' }}
                  placeholder="Enter design details"
                  rows={3}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Image URL</label>
                <input 
                  type="text" 
                  value={catalogForm.img} 
                  onChange={e => setCatalogForm({ ...catalogForm, img: e.target.value })} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem' }}
                  placeholder="Paste picture URL"
                />
              </div>

              <button type="submit" style={{ width: '100%', padding: '12px', background: '#111', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', cursor: 'pointer' }}>
                Save Model Details
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {showRuleForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '560px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setShowRuleForm(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}><X size={20} /></button>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 600 }}>{editingRuleId ? 'Edit Pricing Rule' : 'Add Pricing Rule'}</h3>
            
            <form onSubmit={handleRuleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Rule Name *</label>
                <input 
                  type="text" 
                  value={ruleForm.name} 
                  onChange={e => setRuleForm({ ...ruleForm, name: e.target.value })} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem' }}
                  placeholder="e.g. Cordovan Premium Grade"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Condition Attribute</label>
                  <select 
                    value={ruleForm.condition_field}
                    onChange={e => setRuleForm({ ...ruleForm, condition_field: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem', background: '#fff' }}
                  >
                    {conditionFields.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Matching Value</label>
                  <input 
                    type="text" 
                    value={ruleForm.condition_value} 
                    onChange={e => setRuleForm({ ...ruleForm, condition_value: e.target.value })} 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem' }}
                    placeholder="e.g. Cordovan"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Action</label>
                  <select 
                    value={ruleForm.action}
                    onChange={e => setRuleForm({ ...ruleForm, action: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem', background: '#fff' }}
                  >
                    <option value="add_price">Add to Price (₹)</option>
                    <option value="multiply_price">Multiply (%)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Value Amount</label>
                  <input 
                    type="number" 
                    value={ruleForm.action_value} 
                    onChange={e => setRuleForm({ ...ruleForm, action_value: parseInt(e.target.value) || 0 })} 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Priority Order</label>
                  <input 
                    type="number" 
                    value={ruleForm.priority} 
                    onChange={e => setRuleForm({ ...ruleForm, priority: parseInt(e.target.value) || 0 })} 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Rule Description</label>
                <textarea 
                  value={ruleForm.description} 
                  onChange={e => setRuleForm({ ...ruleForm, description: e.target.value })} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem' }}
                  placeholder="Explain when this pricing modifier is applied"
                  rows={2}
                />
              </div>

              <button type="submit" style={{ width: '100%', padding: '12px', background: '#111', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', cursor: 'pointer' }}>
                {editingRuleId ? 'Update Rule' : 'Create Pricing Rule'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCustomizer;
