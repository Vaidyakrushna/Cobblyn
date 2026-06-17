"use client";
﻿import React, { useState, useEffect } from 'react';
import Link from 'next/link';

import { Package, Users, ShoppingCart, Layers, Calculator, MessageSquare, TrendingUp, Clock, Calendar, CalendarCheck, Phone, Mail, ArrowRight } from 'lucide-react';
import { api } from '../../api';

const VISIT_STATUS_COLOR = { pending: '#F59E0B', confirmed: '#2563EB', visited: '#10B981', cancelled: '#EF4444' };

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  const [periodValue, setPeriodValue] = useState('');
  const [recentVisits, setRecentVisits] = useState([]);

  // Defaults for period inputs
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = today.slice(0, 7); // YYYY-MM
  const thisYear = today.slice(0, 4); // YYYY

  useEffect(() => {
    if (period === 'day' && !periodValue) setPeriodValue(today);
    if (period === 'month' && !periodValue) setPeriodValue(thisMonth);
    if (period === 'year' && !periodValue) setPeriodValue(thisYear);
    if (period === 'all') setPeriodValue('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        let qs = '';
        if (period !== 'all' && periodValue) {
          qs = `?period=${period}&value=${encodeURIComponent(periodValue)}`;
        } else if (period !== 'all') {
          // wait for periodValue
          setLoading(false);
          return;
        }
        const data = await api.adminDashboard(qs);
        setStats(data);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchStats();
  }, [period, periodValue]);

  // Recent scheduled visits (independent of period filter)
  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const data = await api.listVisits('?limit=5');
        setRecentVisits((data.items || []).slice(0, 5));
      } catch (e) { /* non-fatal */ }
    };
    fetchRecent();
  }, []);

  const cards = stats ? [
    { label: 'Total Products', value: stats.total_products || 0, icon: <Package size={22} />, color: '#9d2706' },
    { label: 'Total Customers', value: stats.total_users || 0, icon: <Users size={22} />, color: '#2563EB' },
    { label: 'Total Orders', value: stats.total_orders || 0, icon: <ShoppingCart size={22} />, color: '#10B981' },
    { label: 'Pending Orders', value: stats.pending_orders || 0, icon: <Clock size={22} />, color: '#F59E0B' },
    { label: 'In Production', value: stats.in_production || 0, icon: <TrendingUp size={22} />, color: '#8B5CF6' },
    { label: 'Materials', value: stats.total_materials || 0, icon: <Layers size={22} />, color: '#EC4899' },
    { label: 'Pricing Rules', value: stats.total_rules || 0, icon: <Calculator size={22} />, color: '#14B8A6' },
    { label: 'Open Tickets', value: stats.open_tickets || 0, icon: <MessageSquare size={22} />, color: '#EF4444' },
  ] : [];

  return (
    <div className="admin-page" data-testid="admin-dashboard">
      <div className="admin-page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your Cobblyn business {period !== 'all' && periodValue ? `Â· ${period}: ${periodValue}` : 'Â· all-time'}</p>
        </div>

        <div className="admin-period-filter" data-testid="admin-period-filter" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Calendar size={16} color="#6B7280" />
          <div className="admin-filters" style={{ marginRight: 0 }}>
            {[
              { v: 'all', l: 'All' },
              { v: 'year', l: 'Year' },
              { v: 'month', l: 'Month' },
              { v: 'day', l: 'Day' },
            ].map(p => (
              <button key={p.v}
                className={`admin-filter-btn ${period === p.v ? 'active' : ''}`}
                onClick={() => setPeriod(p.v)}
                data-testid={`period-${p.v}`}>
                {p.l}
              </button>
            ))}
          </div>
          {period === 'day' && (
            <input type="date" value={periodValue} max={today}
              onChange={(e) => setPeriodValue(e.target.value)}
              className="admin-period-input" data-testid="period-day-input"
              style={{ padding: '6px 10px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 13 }} />
          )}
          {period === 'month' && (
            <input type="month" value={periodValue} max={thisMonth}
              onChange={(e) => setPeriodValue(e.target.value)}
              className="admin-period-input" data-testid="period-month-input"
              style={{ padding: '6px 10px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 13 }} />
          )}
          {period === 'year' && (
            <input type="number" min="2020" max={thisYear} value={periodValue}
              onChange={(e) => setPeriodValue(e.target.value)}
              className="admin-period-input" data-testid="period-year-input" placeholder="YYYY"
              style={{ padding: '6px 10px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 13, width: 100 }} />
          )}
        </div>
      </div>

      {loading ? <div className="admin-loading">Loading dashboard...</div> : (
        <>
          <div className="admin-stats-grid">
            {cards.map(card => (
              <div key={card.label} className="admin-stat-card" data-testid={`stat-${card.label.toLowerCase().replace(/\s/g, '-')}`}>
                <div className="stat-icon" style={{ backgroundColor: card.color + '15', color: card.color }}>{card.icon}</div>
                <div className="stat-info">
                  <span className="stat-value">{card.value.toLocaleString()}</span>
                  <span className="stat-label">{card.label}</span>
                </div>
              </div>
            ))}
          </div>

          {stats?.total_revenue > 0 && (
            <div className="admin-revenue-card">
              <h3>Revenue (Delivered) {period !== 'all' && periodValue ? `Â· ${periodValue}` : ''}</h3>
              <span className="revenue-amount">{'\u20B9'}{stats.total_revenue.toLocaleString()}</span>
            </div>
          )}

          {stats?.recent_orders?.length > 0 && (
            <div className="admin-section">
              <h3>Recent Orders</h3>
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr><th>Order #</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {stats.recent_orders.map(order => (
                      <tr key={order.id}>
                        <td><strong>{order.order_number}</strong></td>
                        <td>{order.customer_name}</td>
                        <td>{'\u20B9'}{order.total_amount?.toLocaleString()}</td>
                        <td><span className={`status-badge status-${order.status}`}>{order.status}</span></td>
                        <td>{new Date(order.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Schedule-a-Visit panel */}
          <div className="admin-section" data-testid="dashboard-recent-visits">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                <CalendarCheck size={18} color="#9d2706" /> Schedule a Visit
              </h3>
              <Link href="/admin/visits" data-testid="dashboard-view-all-visits"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#1a1a1a', fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>
                View all <ArrowRight size={14} />
              </Link>
            </div>
            {recentVisits.length === 0 ? (
              <div className="admin-empty">No visit requests yet</div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table" data-testid="dashboard-visits-table">
                  <thead>
                    <tr><th>Customer</th><th>Contact</th><th>Visit Date</th><th>Style / For</th><th>PIN</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {recentVisits.map(v => (
                      <tr key={v.id} data-testid={`dashboard-visit-${v.id}`}>
                        <td>
                          <strong>{v.first_name} {v.last_name}</strong>
                          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                            Requested {new Date(v.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td style={{ fontSize: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={11} color="#6B7280" /> {v.contact_number}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}><Mail size={11} color="#6B7280" /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{v.email}</span></div>
                        </td>
                        <td><strong>{v.visit_date}</strong></td>
                        <td><div>{v.style}</div><div style={{ fontSize: 11, color: '#6B7280', textTransform: 'capitalize' }}>For {v.visit_for}</div></td>
                        <td>{v.pin_code}</td>
                        <td>
                          <span className="status-badge" style={{ backgroundColor: (VISIT_STATUS_COLOR[v.status] || '#6B7280') + '15', color: VISIT_STATUS_COLOR[v.status] || '#6B7280', textTransform: 'capitalize' }}>
                            {v.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;

