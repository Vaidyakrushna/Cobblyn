"use client";
import React, { useState } from 'react';
import { X, Ruler } from 'lucide-react';

// UK -> US (Men +1, Women +1.5), EU (UK+33), India (UK+1)
const SIZE_TABLE_MEN = [
  { uk: 6, us: 7, eu: 39, ind: 7 }, { uk: 7, us: 8, eu: 40, ind: 8 },
  { uk: 8, us: 9, eu: 41, ind: 9 }, { uk: 9, us: 10, eu: 42, ind: 10 },
  { uk: 10, us: 11, eu: 43, ind: 11 }, { uk: 11, us: 12, eu: 44, ind: 12 },
  { uk: 12, us: 13, eu: 45, ind: 13 },
];
const SIZE_TABLE_WOMEN = [
  { uk: 3, us: 5, eu: 36, ind: 4 }, { uk: 4, us: 6, eu: 37, ind: 5 },
  { uk: 5, us: 6.5, eu: 38, ind: 6 }, { uk: 6, us: 7.5, eu: 39, ind: 7 },
  { uk: 7, us: 8.5, eu: 40, ind: 8 }, { uk: 8, us: 9.5, eu: 41, ind: 9 },
  { uk: 9, us: 10.5, eu: 42, ind: 10 },
];

const FIT_TIPS = [
  { label: 'Foot length is between two sizes', tip: 'Pick the larger size for daily wear, smaller for occasion shoes' },
  { label: 'Wide feet', tip: 'Size up by ½ for extra room across the metatarsals' },
  { label: 'Narrow feet', tip: 'Stay true to size; consider an insole for snug fit' },
  { label: 'High arch', tip: 'Choose Goodyear-welt or rubber-sole styles for cushioning' },
];

const SizeGuide = ({ open, onClose, gender = 'men' }) => {
  const [tab, setTab] = useState(gender === 'women' ? 'women' : 'men');
  if (!open) return null;
  const table = tab === 'women' ? SIZE_TABLE_WOMEN : SIZE_TABLE_MEN;

  return (
    <div className="admin-modal-overlay" onClick={onClose} data-testid="size-guide-modal">
      <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <button className="admin-modal-close" onClick={onClose} data-testid="size-guide-close"><X size={18} /></button>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Ruler size={18} /> Size Guide</h3>
        <p style={{ color: '#6B7280', fontSize: 13, marginTop: 8 }}>Compare sizes across regions. Cobblyn defaults to UK.</p>

        <div style={{ display: 'flex', gap: 8, marginTop: 16, marginBottom: 16 }}>
          <button onClick={() => setTab('men')} className={`admin-filter-btn ${tab === 'men' ? 'active' : ''}`} data-testid="size-tab-men">Men</button>
          <button onClick={() => setTab('women')} className={`admin-filter-btn ${tab === 'women' ? 'active' : ''}`} data-testid="size-tab-women">Women</button>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table" data-testid="size-conversion-table">
            <thead><tr><th>UK</th><th>US</th><th>EU</th><th>India</th></tr></thead>
            <tbody>
              {table.map(r => (
                <tr key={r.uk}><td><strong>{r.uk}</strong></td><td>{r.us}</td><td>{r.eu}</td><td>{r.ind}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <h4 style={{ marginTop: 24, fontSize: 14, fontWeight: 600 }}>Fit Recommendations</h4>
        <div style={{ marginTop: 8 }}>
          {FIT_TIPS.map((t, i) => (
            <div key={i} style={{ padding: '10px 12px', borderLeft: '3px solid #9d2706', marginBottom: 8, background: '#FAFAFA' }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{t.label}</div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{t.tip}</div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 12, color: '#6B7280', marginTop: 16 }}>
          Tip: Measure your foot in the evening (when it's largest) and add 0.5 cm of room from your longest toe.
        </p>
      </div>
    </div>
  );
};
export default SizeGuide;
