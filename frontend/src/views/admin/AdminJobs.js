"use client";
import React, { useState, useEffect } from 'react';
import { 
  Cpu, RefreshCw, CheckCircle2, AlertTriangle, Play, 
  ChevronRight, ChevronDown, Clock, Search, RotateCcw, 
  Mail, Image, CreditCard, ArrowUpRight, ShieldAlert 
} from 'lucide-react';
import api from '../../api';

const AdminJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedJobs, setExpandedJobs] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [autoPoll, setAutoPoll] = useState(true);
  const [toast, setToast] = useState('');

  // Fetch jobs registry
  const fetchJobs = async () => {
    try {
      const res = await api.request('/admin/jobs');
      setJobs(res.jobs || []);
    } catch (err) {
      console.error('Failed to fetch background jobs:', err);
      showToast('❌ Failed to retrieve background tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Live background polling every 3 seconds if autopoll is enabled
  useEffect(() => {
    let interval;
    if (autoPoll) {
      interval = setInterval(() => {
        fetchJobs();
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [autoPoll]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const toggleExpand = (jobId) => {
    setExpandedJobs(prev => ({ ...prev, [jobId]: !prev[jobId] }));
  };

  const triggerMockJob = async (type) => {
    setActionLoading(true);
    let payload = {};
    if (type === 'send_email') {
      payload = { to: 'concierge@cobblynshoes.com', subject: 'Atelier Order Confirmed #BYD-2026', template: 'order_receipt' };
    } else if (type === 'render_custom_preview') {
      payload = { submodel: 'Wholecut Oxford', leather: 'Full-Grain Italian', color: 'Burgundy', monogram: 'MAH' };
    } else if (type === 'process_refund') {
      payload = { order_id: 'ORD-991273', amount: 12500, gateway: 'stripe' };
    } else if (type === 'order_workflow_escalation') {
      payload = { order_id: 'ORD-991273', supervisor_escalated: true };
    }

    try {
      const res = await api.request('/admin/jobs/mock', {
        method: 'POST',
        body: JSON.stringify({ type, payload })
      });
      showToast(`✨ Enqueued mock background job ${res.job_id.slice(0, 8)}`);
      fetchJobs();
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const triggerRetry = async (jobId) => {
    setActionLoading(true);
    try {
      await api.request(`/admin/jobs/retry/${jobId}`, { method: 'POST' });
      showToast(`🔄 Re-enqueued task ${jobId.slice(0, 8)} into worker queue.`);
      fetchJobs();
    } catch (err) {
      showToast(`❌ Retry failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter & search logic
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(job.payload).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || job.type === filterType;
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div style={{ padding: '24px 32px', color: '#1c1917', minHeight: '80vh' }}>
      
      {/* Toast popup */}
      {toast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', background: '#111', border: '1px solid #9d2706', borderRadius: '8px', padding: '12px 24px', color: '#fff', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1100, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
          <Cpu size={16} color="#9d2706" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e7e5e4', paddingBottom: '20px', marginBottom: '24px' }}>
        <div>
          <span style={{ fontSize: '0.62rem', color: '#9d2706', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>ATELIER OPERATIONS</span>
          <h1 style={{ margin: '4px 0 0 0', fontFamily: 'Montserrat, sans-serif', fontSize: '1.6rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cpu size={28} color="#9d2706" /> Background Task Queue
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={() => setAutoPoll(!autoPoll)}
            style={{
              padding: '8px 12px',
              fontSize: '0.75rem',
              background: autoPoll ? 'rgba(16, 185, 129, 0.08)' : '#fff',
              border: autoPoll ? '1px solid #10B981' : '1px solid #d1d5db',
              color: autoPoll ? '#059669' : '#4b5563',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Clock size={14} /> {autoPoll ? 'Live Polling Active (3s)' : 'Manual Refresh Only'}
          </button>
          <button 
            onClick={fetchJobs}
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
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Now
          </button>
        </div>
      </div>

      {/* Control / Trigger Mock Tasks Panel */}
      <div style={{ background: '#FAF9F6', border: '1px solid #9d2706', borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '0.8rem', fontWeight: 700, color: '#9d2706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🧪 Dispatch Mock Worker Tasks</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <button 
            disabled={actionLoading}
            onClick={() => triggerMockJob('send_email')}
            style={{ padding: '12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' }}
          >
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(157, 39, 6, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={16} color="#9d2706" />
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '0.75rem', color: '#1f2937' }}>Transactional Email</strong>
              <span style={{ fontSize: '0.62rem', color: '#6b7280' }}>Simulate receipt dispatch (2s)</span>
            </div>
            <Play size={12} color="#6b7280" style={{ marginLeft: 'auto' }} />
          </button>

          <button 
            disabled={actionLoading}
            onClick={() => triggerMockJob('render_custom_preview')}
            style={{ padding: '12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' }}
          >
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(157, 39, 6, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Image size={16} color="#9d2706" />
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '0.75rem', color: '#1f2937' }}>3D Shoe Preview Rendering</strong>
              <span style={{ fontSize: '0.62rem', color: '#6b7280' }}>Simulate GPU map drawing (3.5s)</span>
            </div>
            <Play size={12} color="#6b7280" style={{ marginLeft: 'auto' }} />
          </button>

          <button 
            disabled={actionLoading}
            onClick={() => triggerMockJob('process_refund')}
            style={{ padding: '12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' }}
          >
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(157, 39, 6, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={16} color="#9d2706" />
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '0.75rem', color: '#1f2937' }}>Process Refund Gateway</strong>
              <span style={{ fontSize: '0.62rem', color: '#6b7280' }}>Simulate Stripe handshake (3s)</span>
            </div>
            <Play size={12} color="#6b7280" style={{ marginLeft: 'auto' }} />
          </button>

          <button 
            disabled={actionLoading}
            onClick={() => triggerMockJob('order_workflow_escalation')}
            style={{ padding: '12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' }}
          >
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(157, 39, 6, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUpRight size={16} color="#9d2706" />
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '0.75rem', color: '#1f2937' }}>Workflow Escalation</strong>
              <span style={{ fontSize: '0.62rem', color: '#6b7280' }}>Audit and transition status (1.5s)</span>
            </div>
            <Play size={12} color="#6b7280" style={{ marginLeft: 'auto' }} />
          </button>
        </div>
      </div>

      {/* Filtering Options */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '20px', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input 
            type="text" 
            placeholder="Search by Job ID, type, payload attributes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.8rem', color: '#1f2937' }}
          />
        </div>
        
        <select 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.8rem', color: '#374151', background: '#fff' }}
        >
          <option value="all">All Task Types</option>
          <option value="send_email">Transactional Email</option>
          <option value="render_custom_preview">Shoe Preview Rendering</option>
          <option value="process_refund">Refund Process</option>
          <option value="order_workflow_escalation">Workflow Escalation</option>
        </select>

        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.8rem', color: '#374151', background: '#fff' }}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="running">Running</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Main Task List Table */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.01)' }}>
        {filteredJobs.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#6b7280' }}>
            <Cpu size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: '#1f2937' }}>No Tasks Registered</h4>
            <p style={{ margin: 0, fontSize: '0.75rem' }}>No background tasks match the current search or filters. Use the test triggers above to test.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: '#FAF9F6', borderBottom: '1px solid #e5e7eb', color: '#4b5563', fontWeight: 600 }}>
                <th style={{ padding: '14px 16px', width: '40px' }}></th>
                <th style={{ padding: '14px 16px' }}>Job ID</th>
                <th style={{ padding: '14px 16px' }}>Task Type</th>
                <th style={{ padding: '14px 16px' }}>Status</th>
                <th style={{ padding: '14px 16px', width: '220px' }}>Worker Progress</th>
                <th style={{ padding: '14px 16px' }}>Created At</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => {
                const isExpanded = !!expandedJobs[job.id];
                const cleanType = job.type.replace(/_/g, ' ');
                
                // Status styles
                let statusBg = 'rgba(156, 163, 175, 0.1)';
                let statusColor = '#4b5563';
                let statusLabel = 'Pending';
                
                if (job.status === 'running') {
                  statusBg = 'rgba(245, 158, 11, 0.1)';
                  statusColor = '#d97706';
                  statusLabel = 'Running';
                } else if (job.status === 'completed') {
                  statusBg = 'rgba(16, 185, 129, 0.1)';
                  statusColor = '#059669';
                  statusLabel = 'Completed';
                } else if (job.status === 'failed') {
                  statusBg = 'rgba(239, 68, 68, 0.1)';
                  statusColor = '#dc2626';
                  statusLabel = 'Failed';
                }

                return (
                  <React.Fragment key={job.id}>
                    <tr style={{ borderBottom: '1px solid #f3f4f6', background: isExpanded ? '#FCFBFA' : 'inherit', transition: 'background 0.2s' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <button 
                          onClick={() => toggleExpand(job.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}
                        >
                          {isExpanded ? <ChevronDown size={16} color="#6b7280" /> : <ChevronRight size={16} color="#6b7280" />}
                        </button>
                      </td>
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: 600 }}>
                        {job.id.slice(0, 8)}...
                      </td>
                      <td style={{ padding: '14px 16px', textTransform: 'capitalize', fontWeight: 600 }}>
                        {cleanType}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '9999px', fontSize: '0.68rem', fontWeight: 700, backgroundColor: statusBg, color: statusColor }}>
                          {job.status === 'running' && (
                            <span className="animate-spin" style={{ width: '8px', height: '8px', borderRadius: '50%', border: `1.5px solid ${statusColor}`, borderTopColor: 'transparent', display: 'inline-block' }} />
                          )}
                          {job.status === 'completed' && <CheckCircle2 size={10} />}
                          {job.status === 'failed' && <AlertTriangle size={10} />}
                          {statusLabel}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ flex: 1, height: '6px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
                            <div 
                              style={{ 
                                height: '100%', 
                                width: `${job.progress}%`, 
                                background: job.status === 'failed' ? '#dc2626' : job.status === 'completed' ? '#059669' : '#9d2706',
                                transition: 'width 0.4s ease',
                                borderRadius: '3px'
                              }} 
                            />
                          </div>
                          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#4b5563', minWidth: '32px' }}>{job.progress}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#6b7280' }}>
                        {new Date(job.created_at).toLocaleTimeString()}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        {job.status === 'failed' && (
                          <button 
                            disabled={actionLoading}
                            onClick={() => triggerRetry(job.id)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.7rem',
                              background: 'none',
                              border: '1px solid #dc2626',
                              color: '#dc2626',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.2s'
                            }}
                          >
                            <RotateCcw size={10} /> Retry
                          </button>
                        )}
                        {job.status === 'completed' && (
                          <button 
                            onClick={() => triggerRetry(job.id)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.7rem',
                              background: 'none',
                              border: '1px solid #d1d5db',
                              color: '#4b5563',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <RefreshCw size={10} /> Re-run
                          </button>
                        )}
                        {job.status === 'running' && (
                          <span style={{ fontSize: '0.7rem', fontStyle: 'italic', color: '#9a7d32' }}>Processing...</span>
                        )}
                      </td>
                    </tr>
                    
                    {/* Expanded details row */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} style={{ padding: '16px 20px', background: '#FCFBFA', borderBottom: '1px solid #e5e7eb' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.75rem', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Payload Parameters</h4>
                              <pre style={{ margin: 0, padding: '12px', background: '#1c1c1e', color: '#9effa9', borderRadius: '6px', fontSize: '0.7rem', overflowX: 'auto', fontFamily: 'monospace' }}>
                                {JSON.stringify(job.payload, null, 2)}
                              </pre>
                            </div>
                            
                            <div style={{ fontSize: '0.72rem', color: '#374151' }}>
                              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.75rem', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Task Context</h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div><strong>Unique UUID:</strong> <span style={{ fontFamily: 'monospace' }}>{job.id}</span></div>
                                <div><strong>Enqueued At:</strong> {new Date(job.created_at).toLocaleString()}</div>
                                <div><strong>Started At:</strong> {job.started_at ? new Date(job.started_at).toLocaleString() : 'N/A'}</div>
                                <div><strong>Completed At:</strong> {job.completed_at ? new Date(job.completed_at).toLocaleString() : 'N/A'}</div>
                                <div><strong>Retry Attempts:</strong> {job.retries}</div>
                              </div>

                              {job.error && (
                                <div style={{ marginTop: '16px', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.03)', padding: '10px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontWeight: 700, marginBottom: '6px' }}>
                                    <ShieldAlert size={14} /> Exception Raised
                                  </div>
                                  <div style={{ fontFamily: 'monospace', color: '#b91c1c', fontSize: '0.68rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                    {job.error}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};

export default AdminJobs;
