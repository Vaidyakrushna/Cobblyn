"use client";
import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, X } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const Stars = ({ rating, size = 14, onSet }) => (
  <div style={{ display: 'inline-flex', gap: 2 }}>
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={size}
        fill={i <= rating ? '#9d2706' : 'none'} color={i <= rating ? '#9d2706' : '#D1D5DB'}
        style={onSet ? { cursor: 'pointer' } : {}}
        onClick={onSet ? () => onSet(i) : undefined}
        data-testid={onSet ? `star-set-${i}` : undefined} />
    ))}
  </div>
);

const ProductReviews = ({ productId }) => {
  const { isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ count: 0, avg: 0, distribution: {} });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ rating: 5, title: '', body: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const d = await api.listReviews(productId);
      setReviews(d.items || []); setSummary(d.summary || { count: 0, avg: 0, distribution: {} });
    } catch (e) {}
  };
  useEffect(() => { if (productId) load(); }, [productId]);

  const submit = async () => {
    if (!form.title.trim() || !form.body.trim()) { setError('Title and body required'); return; }
    setError(''); setSubmitting(true);
    try {
      await api.createReview(productId, form);
      setShowForm(false); setForm({ rating: 5, title: '', body: '' }); load();
    } catch (e) { setError(e.message); }
    setSubmitting(false);
  };

  return (
    <section data-testid="product-reviews-section" style={{ marginTop: 60, paddingTop: 40, borderTop: '1px solid #E5E7EB' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Customer Reviews</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Stars rating={Math.round(summary.avg)} size={18} />
            <span style={{ fontSize: 14, color: '#6B7280' }} data-testid="reviews-summary">
              {summary.avg ? `${summary.avg.toFixed(1)} / 5` : 'No ratings yet'} · {summary.count} review{summary.count === 1 ? '' : 's'}
            </span>
          </div>
        </div>
        {isAuthenticated && (
          <button onClick={() => setShowForm(true)} data-testid="write-review-btn"
            style={{ padding: '10px 18px', background: '#1a1a1a', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, letterSpacing: '0.04em' }}>
            WRITE A REVIEW
          </button>
        )}
      </div>

      {reviews.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontSize: 14, background: '#FAFAFA' }} data-testid="no-reviews">
          Be the first to review this product.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {reviews.map(r => (
            <div key={r.id} data-testid={`review-${r.id}`} style={{ padding: 20, background: '#FAFAFA', border: '1px solid #F0F0F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <Stars rating={r.rating} />
                  <h4 style={{ marginTop: 6, fontSize: 15, fontWeight: 600 }}>{r.title}</h4>
                </div>
                <div style={{ textAlign: 'right', fontSize: 12, color: '#6B7280' }}>
                  <div>{r.user_name}</div>
                  <div>{new Date(r.created_at).toLocaleDateString()}</div>
                  {r.verified_purchase && (
                    <div style={{ marginTop: 4, color: '#10B981', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <ShieldCheck size={11} /> Verified Purchase
                    </div>
                  )}
                </div>
              </div>
              <p style={{ fontSize: 14, color: '#4B5563', whiteSpace: 'pre-wrap' }}>{r.body}</p>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} data-testid="review-form-modal">
            <button className="admin-modal-close" onClick={() => setShowForm(false)}><X size={18} /></button>
            <h3>Write a Review</h3>
            <div className="admin-form" style={{ marginTop: 16 }}>
              <div className="af-field"><label>Your rating</label><Stars rating={form.rating} size={28} onSet={(r) => setForm({...form, rating: r})} /></div>
              <div className="af-field"><label>Title *</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Loved the craftsmanship" data-testid="review-title-input" /></div>
              <div className="af-field"><label>Your review *</label><textarea rows="4" value={form.body} onChange={e => setForm({...form, body: e.target.value})} placeholder="Share your experience..." data-testid="review-body-input" /></div>
              {error && <div style={{ color: '#EF4444', fontSize: 13 }}>{error}</div>}
              <button className="admin-btn-primary" onClick={submit} disabled={submitting} data-testid="submit-review-btn"
                style={{ marginTop: 16, width: '100%' }}>{submitting ? 'Submitting…' : 'Submit Review'}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
export default ProductReviews;
