"use client";
import React, { useState, useEffect } from 'react';
import { TrendingUp, RotateCcw, AlertCircle, Palette } from 'lucide-react';
import { api } from '../../api';

const StatBlock = ({ icon, title, children, testId }) => (
  <div className="admin-section" data-testid={testId}>
    <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{icon}{title}</h3>
    {children}
  </div>
);

const AdminAnalytics = () => {
  const [sizes, setSizes] = useState([]);
  const [returnRate, setReturnRate] = useState([]);
  const [mismatch, setMismatch] = useState([]);
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, r, m, c] = await Promise.all([
          api.analyticsSizes(),
          api.analyticsReturnRate(),
          api.analyticsSizeMismatch(),
          api.analyticsPopularColors(),
        ]);
        setSizes(s.items || []); setReturnRate(r.items || []);
        setMismatch(m.items || []); setColors(c.colors || []);
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="admin-loading">Loading analytics…</div>;
  return (
    <div className="admin-page" data-testid="admin-analytics-page">
      <div className="admin-page-header">
        <div><h1>Footwear Analytics</h1><p>Size sales, returns, exchanges & customisation trends</p></div>
      </div>

      <StatBlock icon={<TrendingUp size={18} color="#10B981" />} title="Most Sold Sizes" testId="block-most-sold-sizes">
        {sizes.length === 0 ? <div className="admin-empty">No sales yet</div> : (
          <table className="admin-table"><thead><tr><th>Size</th><th>Gender</th><th>Units Sold</th><th>Revenue</th></tr></thead>
            <tbody>{sizes.map((s, i) => <tr key={i}><td>UK {s.size}</td><td className="inv-gender">{s.gender}</td><td>{s.units}</td><td>\u20B9{(s.revenue || 0).toLocaleString()}</td></tr>)}</tbody>
          </table>
        )}
      </StatBlock>

      <StatBlock icon={<RotateCcw size={18} color="#F59E0B" />} title="Per-Product Return Rate" testId="block-return-rate">
        {returnRate.length === 0 ? <div className="admin-empty">No returns yet</div> : (
          <table className="admin-table"><thead><tr><th>Product</th><th>Sold</th><th>Returns</th><th>Return Rate</th></tr></thead>
            <tbody>{returnRate.map(r => (
              <tr key={r.product_id}><td>{r.name}</td><td>{r.sold}</td><td>{r.returns}</td>
                <td><strong style={{ color: r.return_rate_pct > 10 ? '#EF4444' : r.return_rate_pct > 5 ? '#F59E0B' : '#10B981' }}>{r.return_rate_pct}%</strong></td></tr>
            ))}</tbody>
          </table>
        )}
      </StatBlock>

      <StatBlock icon={<AlertCircle size={18} color="#EF4444" />} title="Size Mismatch Trends (Exchanges)" testId="block-size-mismatch">
        {mismatch.length === 0 ? <div className="admin-empty">No exchanges yet</div> : (
          <table className="admin-table"><thead><tr><th>Original Size</th><th>Requested Size</th><th>Count</th></tr></thead>
            <tbody>{mismatch.map((m, i) => <tr key={i}><td>UK {m.original_size}</td><td>UK {m.requested_size}</td><td>{m.count}</td></tr>)}</tbody>
          </table>
        )}
      </StatBlock>

      <StatBlock icon={<Palette size={18} color="#8B5CF6" />} title="Most Popular Colours (Catalogue)" testId="block-popular-colors">
        {colors.length === 0 ? <div className="admin-empty">No colours found</div> : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {colors.map(c => (
              <div key={c.color} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: '#F9FAFB', borderRadius: 16, fontSize: 13 }}>
                <strong>{c.color}</strong><span style={{ color: '#6B7280' }}>· {c.count}</span>
              </div>
            ))}
          </div>
        )}
      </StatBlock>
    </div>
  );
};
export default AdminAnalytics;
