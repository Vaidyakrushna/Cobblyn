"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Check, Clock, Scissors, Hammer, ShieldCheck, Truck, Sparkles, 
  Activity, Mail, Phone, User, MapPin, Layers, Award, RefreshCw, AlertTriangle
} from 'lucide-react';
import { api } from '../../../../src/api';

export default function VendorPortalPage() {
  const params = useParams();
  const token = params?.token;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [notesText, setNotesText] = useState({});

  // Verification checklist gate states
  const [gates, setGates] = useState({}); // { [jobId]: { materials: false, capacity: false } }

  // Rejection modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectJobId, setRejectJobId] = useState(null);
  const [rejectReason, setRejectReason] = useState('At Maximum Capacity');
  const [rejectDetails, setRejectDetails] = useState('');

  // Countdown timers state
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchPortalData = async () => {
    if (!token) return;
    try {
      const data = await api.getVendorPortal(token);
      setVendor(data.vendor);
      setJobs(data.jobs || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Access Denied. Invalid or expired token.');
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchPortalData();
  }, [token]);

  const handleConfirmOrder = async (jobId) => {
    try {
      await api.confirmVendorJob(token, jobId);
      alert('✨ Crafting order received and confirmed successfully!');
      fetchPortalData();
    } catch (err) {
      alert(err.message || 'Failed to confirm order receipt');
      fetchPortalData();
    }
  };

  const handleRejectOrder = async () => {
    if (!rejectJobId) return;
    try {
      await api.rejectVendorJob(token, rejectJobId, {
        reason: rejectReason,
        details: rejectDetails
      });
      alert('✓ Crafting assignment successfully declined. The order has been reverted to the in-house queue.');
      setShowRejectModal(false);
      setRejectJobId(null);
      setRejectReason('At Maximum Capacity');
      setRejectDetails('');
      fetchPortalData();
    } catch (err) {
      alert(err.message || 'Failed to decline order assignment');
      fetchPortalData();
    }
  };

  const isGatePassed = (jobId) => {
    const gate = gates[jobId];
    return gate && gate.materials && gate.capacity;
  };

  const toggleGate = (jobId, gateType) => {
    setGates(prev => {
      const current = prev[jobId] || { materials: false, capacity: false };
      return {
        ...prev,
        [jobId]: {
          ...current,
          [gateType]: !current[gateType]
        }
      };
    });
  };

  const handleAdvanceStage = async (jobId, currentStage, notes = '') => {
    const stageFlow = [
      { current: 'order_received', next: 'pattern_cutting', actionStatus: 'completed', label: 'Pattern Cutting' },
      { current: 'pattern_cutting', next: 'assembling_finishing', actionStatus: 'completed', label: 'Assembling & Finishing' },
      { current: 'assembling_finishing', next: 'quality_check', actionStatus: 'completed', label: 'Quality Check' },
      { current: 'quality_check', next: 'ready_to_ship', actionStatus: 'completed', label: 'Dispatched' },
      { current: 'ready_to_ship', next: 'delivered', actionStatus: 'completed', label: 'Delivered' }
    ];

    const step = stageFlow.find(s => s.current === currentStage);
    if (!step) return;

    try {
      await api.updateVendorJobStage(token, jobId, {
        stage: step.current, // Complete the current active stage to advance
        status: 'completed',
        notes: notes || notesText[jobId] || ''
      });
      
      // Clear notes field
      setNotesText(prev => ({ ...prev, [jobId]: '' }));
      alert(`✓ Order advanced successfully!`);
      fetchPortalData();
    } catch (err) {
      alert(err.message || 'Failed to advance production stage');
    }
  };

  // Helper to determine active task action text and icon
  const getStageAction = (stage) => {
    switch (stage) {
      case 'order_received':
        return { label: '✂️ Start Pattern Cutting', icon: <Scissors size={15} /> };
      case 'pattern_cutting':
        return { label: '🧵 Finish & Commence Assembling', icon: <Hammer size={15} /> };
      case 'assembling_finishing':
        return { label: '🔍 Complete Assembly & Send to QA', icon: <ShieldCheck size={15} /> };
      case 'quality_check':
        return { label: '📦 Quality Approved - Ready to Ship', icon: <Truck size={15} /> };
      case 'ready_to_ship':
        return { label: '🚚 Dispatch & Mark as Delivered', icon: <Check size={15} /> };
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0c0a09', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Montserrat, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ border: '3px solid rgba(157, 39, 6, 0.2)', borderTop: '3px solid #9d2706', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }} />
          <p style={{ fontSize: '0.85rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#a1a1aa' }}>Authenticating Workshop...</p>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#0c0a09', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Montserrat, sans-serif' }}>
        <div className="glass-dark-gilded" style={{ maxWidth: '480px', width: '100%', border: '2px solid rgba(239, 68, 68, 0.4)', borderRadius: '16px', padding: '32px', textAlign: 'center', color: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', background: 'rgba(28, 25, 23, 0.85)', backdropFilter: 'blur(12px)' }}>
          <div style={{ background: '#fee2e2', color: '#ef4444', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
            <AlertTriangle size={28} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Access Terminated</h2>
          <p style={{ fontSize: '0.82rem', color: '#d6d3d1', lineHeight: '1.75', marginBottom: '24px' }}>
            This magic link is either expired, invalid, or has been automatically reverted back to the Cobblyn in-house queue due to missing the 12-hour SLA confirmation window.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={() => fetchPortalData()} style={{ padding: '12px', background: '#e11d48', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer' }}>
              Retry Authorization
            </button>
            <button onClick={() => router.push('/login')} style={{ padding: '10px', background: 'transparent', border: '1px solid #44403c', borderRadius: '8px', color: '#a8a29e', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer' }}>
              Go to Store Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pendingJobs = jobs.filter(j => !j.vendor_confirmed);
  const activeJobs = jobs.filter(j => j.vendor_confirmed && j.status !== 'completed');
  const completedJobs = jobs.filter(j => j.status === 'completed');

  return (
    <div style={{ minHeight: '100vh', background: '#0c0a09', color: '#f5f5f4', padding: '24px 16px', fontFamily: 'Montserrat, sans-serif' }}>
      
      {/* HEADER SECTION */}
      <header className="glass-dark-gilded" style={{ maxWidth: '1200px', margin: '0 auto 24px auto', background: 'rgba(28, 25, 23, 0.75)', border: '1px solid rgba(157, 39, 6, 0.25)', borderRadius: '16px', padding: '24px', backdropFilter: 'blur(12px)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: '#9d2706', width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block' }} />
            <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#9d2706' }}>Artisan Network Workspace</span>
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '4px 0', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fff' }}>
            {vendor?.name} Portal
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '12px', fontSize: '0.72rem', color: '#a8a29e' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12} color="#9d2706" /> {vendor?.contact_person}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} color="#9d2706" /> {vendor?.email}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} color="#9d2706" /> {vendor?.phone}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={() => { setRefreshing(true); fetchPortalData(); }} 
            disabled={refreshing}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #44403c', borderRadius: '8px', padding: '10px 16px', color: '#fff', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh Board'}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        
        {/* COLUMN 1: PENDING AWAITING ACTION QUEUE */}
        <section className="glass-dark-gilded" style={{ background: 'rgba(28, 25, 23, 0.45)', border: '1px solid rgba(157, 39, 6, 0.15)', borderRadius: '16px', padding: '24px', backdropFilter: 'blur(10px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #292524', paddingBottom: '12px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9d2706', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              📥 Awaiting Confirmation ({pendingJobs.length})
            </h2>
            <span style={{ fontSize: '0.68rem', color: '#a8a29e', background: 'rgba(157, 39, 6, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(157, 39, 6, 0.2)', fontWeight: 600 }}>
              12-Hour SLA Time Limit
            </span>
          </div>

          {pendingJobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#78716c', fontSize: '0.8rem', border: '1px dashed #292524', borderRadius: '12px' }}>
              No new orders assigned to your workshop. Check back later!
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
              {pendingJobs.map(job => {
                const assignedAt = job.assigned_at ? new Date(job.assigned_at) : new Date(job.created_at);
                const expiryTime = new Date(assignedAt.getTime() + 12 * 60 * 60 * 1000);
                const diffMs = expiryTime - now;
                const hoursLeft = Math.floor(diffMs / (60 * 60 * 1000));
                const minutesLeft = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
                const secondsLeft = Math.floor((diffMs % (60 * 1000)) / 1000);
                const isOverdue = diffMs <= 0;

                return (
                  <div key={job.id} style={{ background: 'rgba(41, 37, 36, 0.65)', border: '1px solid #44403c', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between', position: 'relative', overflow: 'hidden' }}>
                    
                    {/* Expiration countdown badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>Ref: {job.order_number}</span>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: isOverdue ? '#fee2e2' : 'rgba(239, 68, 68, 0.1)',
                        color: isOverdue ? '#ef4444' : '#fca5a5',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.62rem',
                        fontWeight: 700
                      }}>
                        <Clock size={11} />
                        {isOverdue ? 'EXPIRED (SLA Reversion)' : `${hoursLeft}h ${minutesLeft}m ${secondsLeft}s left`}
                      </span>
                    </div>

                    {/* Rush/Express Priority Alert Banner */}
                    {(job.priority === 'rush' || job.priority === 'express') && (
                      <div style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#fca5a5',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '12px'
                      }}>
                        <span style={{ display: 'inline-block', width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%' }} />
                        🚨 RUSH / EXPRESS PRIORITY ORDER
                      </div>
                    )}

                    {/* Dynamic Policy Shield Banner */}
                    <div style={{ background: 'rgba(157, 39, 6, 0.04)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(157, 39, 6, 0.18)', fontSize: '0.68rem', color: '#9d2706', marginBottom: '14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <ShieldCheck size={18} style={{ flexShrink: 0 }} />
                      <span>🔒 Detailed tech specs, custom measurements, and customer profiles unlock instantly upon accepting.</span>
                    </div>

                    {/* Product Crafting Photos (3-4 Angles with Gilded Diagonal Watermarks) */}
                    {job.items?.map((item, itemIdx) => (
                      item.images && item.images.length > 0 && (
                        <div key={itemIdx} style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '12px', scrollbarWidth: 'thin' }}>
                          {item.images.map((imgUrl, imgIdx) => (
                            <div key={imgIdx} style={{ flexShrink: 0, width: '100px', height: '75px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #44403c', background: '#000', position: 'relative' }}>
                              <img src={imgUrl} alt={`${item.name} Angle ${imgIdx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              {/* Diagonal Gilded Watermark */}
                              <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                pointerEvents: 'none',
                                transform: 'rotate(-25deg)',
                                fontSize: '0.45rem',
                                fontWeight: 800,
                                color: 'rgba(157, 39, 6, 0.28)',
                                letterSpacing: '0.08em',
                                whiteSpace: 'nowrap',
                                textTransform: 'uppercase'
                              }}>
                                Cobblyn ATELIER
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    ))}

                    <div style={{ borderTop: '1px solid #44403c', borderBottom: '1px solid #44403c', padding: '12px 0', marginBottom: '16px', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {job.tech_pack?.material_specs?.map((spec, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#d6d3d1' }}><strong>{spec.item_name}</strong> (Qty: {spec.quantity})</span>
                          <span style={{ color: '#a8a29e' }}>Size {spec.size} · {spec.material} · {spec.color}</span>
                        </div>
                      ))}
                      {job.tech_pack?.special_instructions && (
                        <div style={{ background: 'rgba(0,0,0,0.15)', padding: '8px', borderRadius: '6px', fontSize: '0.68rem', color: '#a8a29e', borderLeft: '2px solid #9d2706', marginTop: '4px' }}>
                          <strong>Notes:</strong> {job.tech_pack.special_instructions}
                        </div>
                      )}
                    </div>

                    {/* Pre-Start Material & Capacity Gate */}
                    <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid #292524', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pre-Acceptance Verification Gate</span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', color: '#d6d3d1', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={gates[job.id]?.materials || false} 
                          onChange={() => toggleGate(job.id, 'materials')}
                          style={{ accentColor: '#9d2706', cursor: 'pointer' }}
                        />
                        <span>Confirm raw material & leather availability in workshop</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', color: '#d6d3d1', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={gates[job.id]?.capacity || false} 
                          onChange={() => toggleGate(job.id, 'capacity')}
                          style={{ accentColor: '#9d2706', cursor: 'pointer' }}
                        />
                        <span>Confirm size molds & artisan capacity</span>
                      </label>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button 
                        onClick={() => handleConfirmOrder(job.id)}
                        disabled={isOverdue || !isGatePassed(job.id)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          background: isGatePassed(job.id) ? '#9d2706' : 'rgba(157, 39, 6, 0.12)',
                          border: 'none',
                          borderRadius: '6px',
                          color: isGatePassed(job.id) ? '#000' : 'rgba(255,255,255,0.3)',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: isOverdue || !isGatePassed(job.id) ? 'not-allowed' : 'pointer',
                          opacity: isOverdue ? 0.3 : 1
                        }}
                      >
                        <Check size={14} strokeWidth={3} /> Acknowledge & Start Crafting
                      </button>
                      
                      <button 
                        onClick={() => { setRejectJobId(job.id); setShowRejectModal(true); }}
                        disabled={isOverdue}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          background: 'rgba(239, 68, 68, 0.08)',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          borderRadius: '6px',
                          color: '#fca5a5',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: isOverdue ? 'not-allowed' : 'pointer',
                          opacity: isOverdue ? 0.3 : 1,
                          transition: 'all 0.2s'
                        }}
                      >
                        <AlertTriangle size={14} /> Decline / Reject Assignment
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* COLUMN 2: ACTIVE PRODUCTION QUEUE */}
        <section className="glass-dark-gilded" style={{ background: 'rgba(28, 25, 23, 0.45)', border: '1px solid rgba(157, 39, 6, 0.15)', borderRadius: '16px', padding: '24px', backdropFilter: 'blur(10px)' }}>
          <div style={{ borderBottom: '1px solid #292524', paddingBottom: '12px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9d2706', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              🛠️ Active Work in Progress ({activeJobs.length})
            </h2>
          </div>

          {activeJobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#78716c', fontSize: '0.8rem', border: '1px dashed #292524', borderRadius: '12px' }}>
              No active crafting jobs. Acknowledge pending orders to commence production!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeJobs.map(job => {
                const action = getStageAction(job.current_stage);

                return (
                  <div key={job.id} style={{ background: 'rgba(41, 37, 36, 0.65)', border: '1px solid #44403c', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    {/* Job metadata */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyBetween: 'space-between', alignItems: 'center', gap: '10px', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>Order #{job.order_number}</span>
                        {(job.priority === 'rush' || job.priority === 'express') && (
                          <span style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#fca5a5',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.58rem',
                            fontWeight: 800,
                            marginLeft: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            🚨 RUSH
                          </span>
                        )}
                        <span style={{ fontSize: '0.72rem', color: '#a8a29e', marginLeft: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <User size={12} color="#a8a29e" />
                          Customer: <strong style={{ color: job.current_stage === 'ready_to_ship' || job.current_stage === 'delivered' ? '#9d2706' : '#a8a29e' }}>{job.customer_name}</strong>
                          {!(job.current_stage === 'ready_to_ship' || job.current_stage === 'delivered') && (
                            <span style={{ color: '#9d2706', fontSize: '0.62rem', background: 'rgba(157,39,6,0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(157,39,6,0.2)', marginLeft: '6px' }}>
                              🔒 Info Locked until Dispatch
                            </span>
                          )}
                        </span>
                      </div>
                      <span style={{
                        background: 'rgba(157, 39, 6, 0.15)',
                        color: '#9d2706',
                        border: '1px solid rgba(157, 39, 6, 0.3)',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        ⚡ Active Crafting
                      </span>
                    </div>

                    {/* Shipping Address Displayed when Dispatch-Ready */}
                    {(job.current_stage === 'ready_to_ship' || job.current_stage === 'delivered') && job.shipping_address && Object.keys(job.shipping_address).length > 0 && (
                      <div style={{ background: 'rgba(157, 39, 6, 0.05)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(157, 39, 6, 0.25)', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', fontWeight: 700, color: '#9d2706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          <MapPin size={13} /> Dispatch & Shipping Coordinates
                        </span>
                        <div style={{ color: '#fff', paddingLeft: '20px' }}>
                          <div><strong>Recipient:</strong> {job.customer_name}</div>
                          <div><strong>Email:</strong> {job.customer_email}</div>
                          <div><strong>Address:</strong> {job.shipping_address.street || ''}, {job.shipping_address.city || ''}, {job.shipping_address.state || ''} - {job.shipping_address.zip_code || ''}, {job.shipping_address.country || ''}</div>
                        </div>
                      </div>
                    )}

                    {/* Specifications table */}
                    <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px', border: '1px solid #292524' }}>
                      {/* Product Crafting Photos (3-4 Angles with Gilded Diagonal Watermarks) */}
                      {job.items?.map((item, itemIdx) => (
                        item.images && item.images.length > 0 && (
                          <div key={itemIdx} style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '12px', scrollbarWidth: 'thin' }}>
                            {item.images.map((imgUrl, imgIdx) => (
                              <div key={imgIdx} style={{ flexShrink: 0, width: '100px', height: '75px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #44403c', background: '#000', position: 'relative' }}>
                                <img src={imgUrl} alt={`${item.name} Angle ${imgIdx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                {/* Diagonal Gilded Watermark */}
                                <div style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  pointerEvents: 'none',
                                  transform: 'rotate(-25deg)',
                                  fontSize: '0.45rem',
                                  fontWeight: 800,
                                  color: 'rgba(157, 39, 6, 0.28)',
                                  letterSpacing: '0.08em',
                                  whiteSpace: 'nowrap',
                                  textTransform: 'uppercase'
                                }}>
                                  Cobblyn ATELIER
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      ))}

                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Bespoke Crafting Specs</span>
                      {job.tech_pack?.material_specs?.map((spec, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', borderBottom: idx < job.tech_pack.material_specs.length - 1 ? '1px solid #292524' : 'none', padding: '6px 0', fontSize: '0.75rem' }}>
                          <span style={{ color: '#fff', fontWeight: 700 }}>{spec.item_name} (Size {spec.size})</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', color: '#d6d3d1' }}>
                            <span>Material: <strong>{spec.material}</strong></span>
                            <span>Leather Color: <strong>{spec.color}</strong></span>
                            <span>Quantity: <strong>{spec.quantity} pair(s)</strong></span>
                          </div>
                        </div>
                      ))}
                      {job.tech_pack?.special_instructions && (
                        <div style={{ marginTop: '8px', borderTop: '1px dashed #292524', paddingTop: '8px', fontSize: '0.72rem', color: '#a8a29e' }}>
                          <strong>Artisan Note:</strong> {job.tech_pack.special_instructions}
                        </div>
                      )}
                    </div>

                    {/* Stepper Timeline Progress */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'space-between', borderTop: '1px solid #292524', borderBottom: '1px solid #292524', padding: '16px 0' }}>
                      {job.stages?.map((stage, idx) => {
                        const isCompleted = stage.status === 'completed';
                        const isActive = job.current_stage === stage.name;
                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: isCompleted || isActive ? 1 : 0.35 }}>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              background: isCompleted ? '#9d2706' : isActive ? '#fff' : 'transparent',
                              border: `2px solid ${isCompleted || isActive ? '#9d2706' : '#78716c'}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.55rem',
                              fontWeight: 700,
                              color: isCompleted ? '#000' : isActive ? '#000' : '#78716c'
                            }}>
                              {isCompleted ? '✓' : idx + 1}
                            </div>
                            <span style={{ fontSize: '0.62rem', fontWeight: isActive ? 700 : 500, color: isActive ? '#9d2706' : '#d6d3d1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {stage.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Single tap stage advancement */}
                    {action ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.62rem', color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Add Process Notes (Optional)</label>
                          <input 
                            type="text" 
                            placeholder="Add leather batch ref, quality logs, or operational updates..."
                            value={notesText[job.id] || ''}
                            onChange={(e) => setNotesText(prev => ({ ...prev, [job.id]: e.target.value }))}
                            style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.15)', border: '1px solid #44403c', borderRadius: '6px', color: '#fff', fontSize: '0.75rem', outline: 'none' }}
                          />
                        </div>
                        <button 
                          onClick={() => handleAdvanceStage(job.id, job.current_stage)}
                          style={{
                            padding: '12px 18px',
                            background: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#000',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: 'pointer'
                          }}
                        >
                          {action.icon}
                          {action.label}
                        </button>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#a8a29e', fontStyle: 'italic' }}>
                        All craftsman stages complete. Awaiting dispatch clearance.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* COLUMN 3: COMPLETED LOGS */}
        {completedJobs.length > 0 && (
          <section className="glass-dark-gilded" style={{ background: 'rgba(28, 25, 23, 0.25)', border: '1px solid rgba(157, 39, 6, 0.1)', borderRadius: '16px', padding: '24px', backdropFilter: 'blur(8px)' }}>
            <h2 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a8a29e', borderBottom: '1px solid #292524', paddingBottom: '12px', marginBottom: '16px', marginTop: 0 }}>
              ✓ Completed History ({completedJobs.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {completedJobs.map(job => (
                <div key={job.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '10px 16px', borderRadius: '8px', fontSize: '0.75rem', border: '1px solid #292524' }}>
                  <div>
                    <strong>Order #{job.order_number}</strong> · {job.customer_name}
                  </div>
                  <span style={{ color: '#10b981', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.62rem' }}>Delivered Successfully</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* GLASSMORPHIC REJECTION MODAL */}
      {showRejectModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-dark-gilded" style={{ maxWidth: '460px', width: '100%', background: 'rgba(28, 25, 23, 0.95)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '16px', padding: '24px', color: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0' }}>
              <AlertTriangle size={18} /> Decline Crafting Assignment
            </h3>
            
            <p style={{ fontSize: '0.75rem', color: '#d6d3d1', lineHeight: '1.6', marginBottom: '20px' }}>
              ⚠️ Declining will immediately remove this order from your portal queue and revert it back to the Cobblyn in-house production line.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.62rem', color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Rejection Reason</label>
              {[
                'At Maximum Capacity',
                'Raw Materials / Leather Out of Stock',
                'Outsole Mold/Size Last Unavailable',
                'Other / Custom Reason'
              ].map((reasonOption) => (
                <label key={reasonOption} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', color: '#fff', cursor: 'pointer', background: rejectReason === reasonOption ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.2)', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${rejectReason === reasonOption ? '#9d2706' : '#44403c'}`, transition: 'all 0.2s' }}>
                  <input 
                    type="radio" 
                    name="rejectReason" 
                    value={reasonOption}
                    checked={rejectReason === reasonOption}
                    onChange={(e) => setRejectReason(e.target.value)}
                    style={{ accentColor: '#9d2706' }}
                  />
                  <span>{reasonOption}</span>
                </label>
              ))}
            </div>

            {rejectReason === 'Other / Custom Reason' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.62rem', color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Provide Additional Details</label>
                <textarea 
                  placeholder="Explain the specific bottleneck or reason for declining..."
                  value={rejectDetails}
                  onChange={(e) => setRejectDetails(e.target.value)}
                  style={{ width: '100%', height: '80px', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid #44403c', borderRadius: '8px', color: '#fff', fontSize: '0.75rem', outline: 'none', resize: 'none' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => { setShowRejectModal(false); setRejectJobId(null); }}
                style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #44403c', borderRadius: '6px', color: '#a8a29e', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleRejectOrder}
                style={{ padding: '8px 16px', background: '#ef4444', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
