"use client";
import React, { useState, useEffect, useCallback } from 'react';
import {
  Compass, Plus, Pencil, Trash2, X, ArrowUp, ArrowDown,
  CheckCircle2, XCircle, RotateCcw, Image as ImageIcon, Link as LinkIcon,
  Eye, Layers, ExternalLink, Sparkles
} from 'lucide-react';
import { api } from '../../api';

export default function AdminNavigation() {
  const [navItems, setNavItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const initialForm = {
    title: '',
    nav_type: 'mega_menu', // mega_menu | dropdown | direct_link
    href: '',
    order: 1,
    is_active: true,
    badge: '',
    columns: [
      {
        title: 'Style',
        links: [{ label: '', href: '', is_highlighted: false }]
      }
    ],
    featured_card: {
      enabled: true,
      image_url: '',
      badge_text: 'New In',
      title: '',
      cta_text: 'Explore →',
      link_url: ''
    }
  };

  const [formData, setFormData] = useState(initialForm);

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const fetchNavigation = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.request('/navigation/admin/all');
      setNavItems(res.items || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load navigation menus');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNavigation();
  }, [fetchNavigation]);

  const openCreateModal = () => {
    setEditingId(null);
    const nextOrder = navItems.length > 0 ? Math.max(...navItems.map(i => i.order || 0)) + 1 : 1;
    setFormData({
      ...initialForm,
      order: nextOrder
    });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setFormData({
      title: item.title || '',
      nav_type: item.nav_type || 'mega_menu',
      href: item.href || '',
      order: item.order || 1,
      is_active: item.is_active !== undefined ? item.is_active : true,
      badge: item.badge || '',
      columns: (item.columns && item.columns.length > 0)
        ? JSON.parse(JSON.stringify(item.columns))
        : [{ title: 'Categories', links: [{ label: '', href: '', is_highlighted: false }] }],
      featured_card: item.featured_card ? {
        enabled: item.featured_card.enabled !== undefined ? item.featured_card.enabled : true,
        image_url: item.featured_card.image_url || '',
        badge_text: item.featured_card.badge_text || '',
        title: item.featured_card.title || '',
        cta_text: item.featured_card.cta_text || 'Shop Now →',
        link_url: item.featured_card.link_url || ''
      } : {
        enabled: false,
        image_url: '',
        badge_text: '',
        title: '',
        cta_text: 'Shop Now →',
        link_url: ''
      }
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(initialForm);
  };

  const handleToggleActive = async (item) => {
    try {
      await api.request(`/navigation/admin/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !item.is_active })
      });
      showNotification(`"${item.title}" ${!item.is_active ? 'activated' : 'hidden'} on storefront header.`);
      fetchNavigation();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleMoveOrder = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= navItems.length) return;

    const newItems = [...navItems];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    // Update order numbers
    const payload = newItems.map((item, idx) => ({
      id: item.id,
      order: idx + 1
    }));

    try {
      await api.request('/navigation/admin/reorder', {
        method: 'POST',
        body: JSON.stringify({ items: payload })
      });
      fetchNavigation();
    } catch (err) {
      alert('Failed to reorder items: ' + err.message);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete the navigation item "${title}"?`)) return;
    try {
      await api.request(`/navigation/admin/${id}`, { method: 'DELETE' });
      showNotification(`Deleted "${title}" from navigation.`);
      fetchNavigation();
    } catch (err) {
      alert('Failed to delete item: ' + err.message);
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm('Reset all navigation items to Cobblyn default menus (Men, Women, Customize, Luxe Collection, Accessories)? This will overwrite custom menus.')) return;
    try {
      await api.request('/navigation/admin/reset', { method: 'POST' });
      showNotification('Navigation menus reset to defaults successfully.');
      fetchNavigation();
    } catch (err) {
      alert('Failed to reset defaults: ' + err.message);
    }
  };

  // --- Column & Link State Handlers inside Modal ---

  const handleAddColumn = () => {
    setFormData(prev => ({
      ...prev,
      columns: [
        ...prev.columns,
        { title: 'New Column', links: [{ label: '', href: '', is_highlighted: false }] }
      ]
    }));
  };

  const handleRemoveColumn = (colIdx) => {
    setFormData(prev => ({
      ...prev,
      columns: prev.columns.filter((_, idx) => idx !== colIdx)
    }));
  };

  const handleColumnTitleChange = (colIdx, title) => {
    setFormData(prev => {
      const nextCols = [...prev.columns];
      nextCols[colIdx].title = title;
      return { ...prev, columns: nextCols };
    });
  };

  const handleAddLink = (colIdx) => {
    setFormData(prev => {
      const nextCols = [...prev.columns];
      nextCols[colIdx].links.push({ label: '', href: '', is_highlighted: false });
      return { ...prev, columns: nextCols };
    });
  };

  const handleRemoveLink = (colIdx, linkIdx) => {
    setFormData(prev => {
      const nextCols = [...prev.columns];
      nextCols[colIdx].links = nextCols[colIdx].links.filter((_, idx) => idx !== linkIdx);
      return { ...prev, columns: nextCols };
    });
  };

  const handleLinkChange = (colIdx, linkIdx, field, val) => {
    setFormData(prev => {
      const nextCols = [...prev.columns];
      nextCols[colIdx].links[linkIdx][field] = val;
      return { ...prev, columns: nextCols };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Clean empty links
      const cleanColumns = (formData.columns || [])
        .map(col => ({
          title: col.title.trim(),
          links: (col.links || []).filter(l => l.label && l.label.trim()).map(l => ({
            label: l.label.trim(),
            href: l.href.trim(),
            is_highlighted: !!l.is_highlighted
          }))
        }))
        .filter(col => col.title && col.links.length > 0);

      const payload = {
        title: formData.title.trim(),
        nav_type: formData.nav_type,
        href: formData.href.trim() || '/',
        order: parseInt(formData.order) || 1,
        is_active: formData.is_active,
        badge: formData.badge ? formData.badge.trim() : null,
        columns: formData.nav_type === 'direct_link' ? [] : cleanColumns,
        featured_card: (formData.nav_type !== 'direct_link' && formData.featured_card?.enabled)
          ? formData.featured_card
          : null
      };

      if (editingId) {
        await api.request(`/navigation/admin/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showNotification(`Updated navigation item "${payload.title}".`);
      } else {
        await api.request('/navigation/admin', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showNotification(`Created navigation item "${payload.title}".`);
      }

      closeModal();
      fetchNavigation();
    } catch (err) {
      alert('Error saving navigation item: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={24} style={{ color: '#9d2706' }} />
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', color: '#1c1917', margin: 0 }}>
              Header Navigation & Menus
            </h1>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#78716c', margin: '6px 0 0 0' }}>
            Control top-level storefront links, mega-menu subcategories, filter groupings, and promotional visual cards without changing code.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleResetDefaults}
            className="admin-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
            title="Reset navigation to default structure"
          >
            <RotateCcw size={14} /> Reset Defaults
          </button>
          <button
            onClick={openCreateModal}
            className="admin-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
          >
            <Plus size={16} /> Add Menu Item
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #86efac',
          color: '#166534',
          padding: '10px 16px',
          borderRadius: '8px',
          fontSize: '0.82rem',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          padding: '10px 16px',
          borderRadius: '8px',
          fontSize: '0.82rem',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {/* Navigation Items Table */}
      <div className="admin-table-wrapper" style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e7e5e4', fontSize: '0.75rem', color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '12px 8px', width: '70px' }}>Order</th>
              <th style={{ padding: '12px 12px' }}>Menu Title & Path</th>
              <th style={{ padding: '12px 12px' }}>Type</th>
              <th style={{ padding: '12px 12px' }}>Columns / Sublinks</th>
              <th style={{ padding: '12px 12px' }}>Promo Card</th>
              <th style={{ padding: '12px 12px', textAlign: 'center' }}>Live Status</th>
              <th style={{ padding: '12px 12px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#a8a29e', fontSize: '0.82rem' }}>
                  Loading navigation structure...
                </td>
              </tr>
            ) : navItems.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#a8a29e', fontSize: '0.82rem' }}>
                  No navigation items configured. Click "Add Menu Item" or "Reset Defaults".
                </td>
              </tr>
            ) : (
              navItems.map((item, index) => {
                const totalLinks = (item.columns || []).reduce((sum, col) => sum + (col.links || []).length, 0);
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f5f5f4', transition: 'background 0.2s' }}>
                    {/* Order buttons */}
                    <td style={{ padding: '12px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.75rem', color: '#78716c', minWidth: '18px' }}>
                          #{item.order || index + 1}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <button
                            onClick={() => handleMoveOrder(index, 'up')}
                            disabled={index === 0}
                            style={{ background: 'none', border: 'none', cursor: index === 0 ? 'default' : 'pointer', color: index === 0 ? '#d6d3d1' : '#44403c', padding: 0 }}
                            title="Move Up"
                          >
                            <ArrowUp size={11} />
                          </button>
                          <button
                            onClick={() => handleMoveOrder(index, 'down')}
                            disabled={index === navItems.length - 1}
                            style={{ background: 'none', border: 'none', cursor: index === navItems.length - 1 ? 'default' : 'pointer', color: index === navItems.length - 1 ? '#d6d3d1' : '#44403c', padding: 0 }}
                            title="Move Down"
                          >
                            <ArrowDown size={11} />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Title & Path */}
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '0.88rem', color: '#1c1917' }}>{item.title}</strong>
                        {item.badge && (
                          <span style={{ fontSize: '0.62rem', background: '#fef2f2', color: '#9d2706', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase' }}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#78716c', fontFamily: 'monospace', marginTop: '2px' }}>
                        {item.href}
                      </div>
                    </td>

                    {/* Type Badge */}
                    <td style={{ padding: '12px 12px' }}>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: item.nav_type === 'mega_menu' ? '#fdf4ff' : item.nav_type === 'dropdown' ? '#eff6ff' : '#f5f5f4',
                        color: item.nav_type === 'mega_menu' ? '#86198f' : item.nav_type === 'dropdown' ? '#1e40af' : '#57534e'
                      }}>
                        {item.nav_type === 'mega_menu' ? '⚡ Mega Menu' : item.nav_type === 'dropdown' ? '📑 Dropdown' : '🔗 Direct Link'}
                      </span>
                    </td>

                    {/* Submenu Info */}
                    <td style={{ padding: '12px 12px', fontSize: '0.78rem', color: '#44403c' }}>
                      {item.nav_type === 'direct_link' ? (
                        <span style={{ color: '#a8a29e', fontStyle: 'italic' }}>None (Direct URL)</span>
                      ) : (
                        <div>
                          <span style={{ fontWeight: 600 }}>{(item.columns || []).length} Columns</span>
                          <span style={{ color: '#78716c', marginLeft: '6px' }}>({totalLinks} links)</span>
                          <div style={{ fontSize: '0.68rem', color: '#a8a29e', marginTop: '2px' }}>
                            {(item.columns || []).map(c => c.title).join(' • ')}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Featured Card Info */}
                    <td style={{ padding: '12px 12px' }}>
                      {item.featured_card?.enabled ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {item.featured_card.image_url ? (
                            <img
                              src={item.featured_card.image_url}
                              alt="Promo"
                              style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e7e5e4' }}
                            />
                          ) : (
                            <div style={{ width: '32px', height: '32px', background: '#f5f5f4', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a8a29e' }}>
                              <ImageIcon size={14} />
                            </div>
                          )}
                          <div style={{ fontSize: '0.72rem' }}>
                            <div style={{ fontWeight: 600, color: '#1c1917' }}>{item.featured_card.title || 'Promo Card'}</div>
                            <div style={{ color: '#78716c' }}>{item.featured_card.badge_text || 'Active'}</div>
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: '#a8a29e', fontStyle: 'italic' }}>Disabled</span>
                      )}
                    </td>

                    {/* Status Switch */}
                    <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleToggleActive(item)}
                        style={{
                          background: item.is_active ? '#dcfce7' : '#f5f5f4',
                          border: `1px solid ${item.is_active ? '#86efac' : '#e7e5e4'}`,
                          color: item.is_active ? '#15803d' : '#78716c',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {item.is_active ? '✓ Active' : '✕ Hidden'}
                      </button>
                    </td>

                    {/* Action Buttons */}
                    <td style={{ padding: '12px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          onClick={() => openEditModal(item)}
                          className="admin-btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Edit Menu"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.title)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }}
                          title="Delete Item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT / CREATE MODAL */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={closeModal} style={{ zIndex: 1200 }}>
          <div
            className="admin-modal"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '850px', width: '95%', maxHeight: '90vh', overflowY: 'auto', padding: '24px 30px' }}
          >
            <button className="admin-modal-close" onClick={closeModal}><X size={18} /></button>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.35rem', marginBottom: '8px', color: '#1c1917' }}>
              {editingId ? `Edit Navigation: ${formData.title}` : 'Add New Header Menu Item'}
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#78716c', marginBottom: '20px' }}>
              Configure menu text, layout style, dropdown sub-links, and promotional visual cards.
            </p>

            <form onSubmit={handleSubmit} className="admin-form">
              {/* Top Row: Basic Info */}
              <div style={{ background: '#fafaf9', border: '1px solid #e7e5e4', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.82rem', fontWeight: 700, color: '#1c1917' }}>1. Main Menu Settings</h4>
                <div className="af-row" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '16px' }}>
                  <div className="af-field">
                    <label>Menu Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Men, Sale, Bespoke"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="af-field">
                    <label>Target Page URL / Path *</label>
                    <input
                      type="text"
                      placeholder="e.g. /men, /sale, /customize"
                      value={formData.href}
                      onChange={e => setFormData({ ...formData, href: e.target.value })}
                      required
                    />
                  </div>
                  <div className="af-field">
                    <label>Menu Layout Type</label>
                    <select
                      value={formData.nav_type}
                      onChange={e => setFormData({ ...formData, nav_type: e.target.value })}
                    >
                      <option value="mega_menu">⚡ Mega Menu (Multi-Column + Card)</option>
                      <option value="dropdown">📑 Simple Dropdown List</option>
                      <option value="direct_link">🔗 Direct Link (No Dropdown)</option>
                    </select>
                  </div>
                </div>

                <div className="af-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '12px' }}>
                  <div className="af-field">
                    <label>Promo Badge (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. NEW, SALE, HOT"
                      value={formData.badge || ''}
                      onChange={e => setFormData({ ...formData, badge: e.target.value })}
                    />
                  </div>
                  <div className="af-field">
                    <label>Display Sort Order</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.order}
                      onChange={e => setFormData({ ...formData, order: e.target.value })}
                    />
                  </div>
                  <div className="af-field" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '24px' }}>
                    <input
                      type="checkbox"
                      id="nav_is_active"
                      checked={formData.is_active}
                      onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="nav_is_active" style={{ cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                      Visible in Storefront Header
                    </label>
                  </div>
                </div>
              </div>

              {/* Submenu Columns & Links Builder (if not direct_link) */}
              {formData.nav_type !== 'direct_link' && (
                <div style={{ background: '#fafaf9', border: '1px solid #e7e5e4', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: '#1c1917' }}>
                        2. Submenu Columns & Filter Links
                      </h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: '#78716c' }}>
                        Organize your dropdown into category sections (e.g. "Style", "Occasion", "Explore").
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddColumn}
                      className="admin-btn-secondary"
                      style={{ fontSize: '0.72rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Plus size={13} /> Add Column
                    </button>
                  </div>

                  {/* Columns Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: formData.columns.length > 2 ? 'repeat(auto-fit, minmax(220px, 1fr))' : '1fr 1fr', gap: '16px' }}>
                    {formData.columns.map((col, colIdx) => (
                      <div key={colIdx} style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <input
                            type="text"
                            placeholder="Column Heading (e.g. Style)"
                            value={col.title}
                            onChange={e => handleColumnTitleChange(colIdx, e.target.value)}
                            style={{ fontWeight: 700, fontSize: '0.78rem', padding: '4px 8px', border: '1px solid #d6d3d1', borderRadius: '4px', width: '70%' }}
                            required
                          />
                          {formData.columns.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveColumn(colIdx)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                              title="Delete Column"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>

                        {/* Link rows */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px', marginBottom: '8px' }}>
                          {(col.links || []).map((link, linkIdx) => (
                            <div key={linkIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input
                                type="text"
                                placeholder="Label (e.g. Oxford)"
                                value={link.label}
                                onChange={e => handleLinkChange(colIdx, linkIdx, 'label', e.target.value)}
                                style={{ fontSize: '0.72rem', padding: '4px 6px', border: '1px solid #e7e5e4', borderRadius: '4px', flex: 1 }}
                              />
                              <input
                                type="text"
                                placeholder="URL (e.g. /men/style/oxford)"
                                value={link.href}
                                onChange={e => handleLinkChange(colIdx, linkIdx, 'href', e.target.value)}
                                style={{ fontSize: '0.72rem', padding: '4px 6px', border: '1px solid #e7e5e4', borderRadius: '4px', flex: 1.2, fontFamily: 'monospace' }}
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveLink(colIdx, linkIdx)}
                                style={{ background: 'none', border: 'none', color: '#a8a29e', cursor: 'pointer', padding: '2px' }}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddLink(colIdx)}
                          style={{ background: '#f5f5f4', border: '1px dashed #d6d3d1', width: '100%', padding: '4px', borderRadius: '4px', fontSize: '0.68rem', cursor: 'pointer', color: '#44403c', fontWeight: 600 }}
                        >
                          + Add Link
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Promo Featured Card Builder (if not direct_link) */}
              {formData.nav_type !== 'direct_link' && (
                <div style={{ background: '#fafaf9', border: '1px solid #e7e5e4', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: '#1c1917' }}>
                        3. Visual Mega-Menu Promotional Card
                      </h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: '#78716c' }}>
                        Display a featured visual banner card with headline, badge, and direct call-to-action inside the dropdown.
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="checkbox"
                        id="promo_card_enabled"
                        checked={formData.featured_card?.enabled}
                        onChange={e => setFormData({
                          ...formData,
                          featured_card: { ...formData.featured_card, enabled: e.target.checked }
                        })}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <label htmlFor="promo_card_enabled" style={{ cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                        Enable Promo Card
                      </label>
                    </div>
                  </div>

                  {formData.featured_card?.enabled && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                      {/* Left: Inputs */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div className="af-field">
                          <label>Banner Image URL *</label>
                          <input
                            type="text"
                            placeholder="e.g. /wf-nav-men.png or https://images.unsplash.com/..."
                            value={formData.featured_card?.image_url || ''}
                            onChange={e => setFormData({
                              ...formData,
                              featured_card: { ...formData.featured_card, image_url: e.target.value }
                            })}
                          />
                        </div>
                        <div className="af-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div className="af-field">
                            <label>Badge Tag</label>
                            <input
                              type="text"
                              placeholder="e.g. New Arrival, Trending"
                              value={formData.featured_card?.badge_text || ''}
                              onChange={e => setFormData({
                                ...formData,
                                featured_card: { ...formData.featured_card, badge_text: e.target.value }
                              })}
                            />
                          </div>
                          <div className="af-field">
                            <label>CTA Button Text</label>
                            <input
                              type="text"
                              placeholder="e.g. Shop Now →"
                              value={formData.featured_card?.cta_text || ''}
                              onChange={e => setFormData({
                                ...formData,
                                featured_card: { ...formData.featured_card, cta_text: e.target.value }
                              })}
                            />
                          </div>
                        </div>
                        <div className="af-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div className="af-field">
                            <label>Card Title</label>
                            <input
                              type="text"
                              placeholder="e.g. Classic Oxfords"
                              value={formData.featured_card?.title || ''}
                              onChange={e => setFormData({
                                ...formData,
                                featured_card: { ...formData.featured_card, title: e.target.value }
                              })}
                            />
                          </div>
                          <div className="af-field">
                            <label>Target Link URL</label>
                            <input
                              type="text"
                              placeholder="e.g. /men/style/oxford"
                              value={formData.featured_card?.link_url || ''}
                              onChange={e => setFormData({
                                ...formData,
                                featured_card: { ...formData.featured_card, link_url: e.target.value }
                              })}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right: Live Preview */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #e7e5e4', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ fontSize: '0.68rem', color: '#78716c', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase' }}>Live Card Preview</div>
                        <div style={{ position: 'relative', width: '180px', height: '140px', borderRadius: '6px', overflow: 'hidden', background: '#1c1917' }}>
                          {formData.featured_card?.image_url ? (
                            <img
                              src={formData.featured_card.image_url}
                              alt="Preview"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a8a29e' }}>
                              <ImageIcon size={28} />
                            </div>
                          )}
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', color: '#fff' }}>
                            {formData.featured_card?.badge_text && (
                              <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fca5a5' }}>
                                {formData.featured_card.badge_text}
                              </div>
                            )}
                            <div style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                              {formData.featured_card?.title || 'Card Headline'}
                            </div>
                            <div style={{ fontSize: '0.62rem', color: '#cbd5e1', marginTop: '2px' }}>
                              {formData.featured_card?.cta_text || 'Shop Now →'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={closeModal} className="admin-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary" style={{ padding: '10px 24px' }}>
                  {editingId ? 'Save Changes' : 'Create Navigation Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
