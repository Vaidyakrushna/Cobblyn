"use client";
import React, { useState, useEffect } from 'react';
import { Factory, Users, Clock, Zap, ChevronRight, Eye, X, UserPlus, Trash2, FileText, CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { api } from '../../api';

const STAGE_COLORS = {
  order_received: '#6B7280',
  pattern_cutting: '#8B5CF6',
  upper_assembly: '#3B82F6',
  sole_attachment: '#06B6D4',
  finishing: '#C9A84C',
  quality_check: '#EC4899',
  ready_to_ship: '#10B981',
};

const PRIORITY_COLORS = { express: '#EF4444', rush: '#F59E0B', normal: '#6B7280' };

const AdminProduction = () => {
  const [view, setView] = useState('queue'); // queue, job_detail, workers
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [showWorkerForm, setShowWorkerForm] = useState(false);
  const [workerForm, setWorkerForm] = useState({ name: '', email: '', password: '' });
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [createForm, setCreateForm] = useState({ order_id: '', priority: 'normal', assigned_to: '', notes: '' });

  const fetchData = async () => {
    try {
      const [statsData, jobsData] = await Promise.all([
        api.getProductionStats(),
        api.getProductionJobs(buildParams())
      ]);
      setStats(statsData);
      setJobs(jobsData.jobs || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const buildParams = () => {
    const p = new URLSearchParams();
    if (stageFilter !== 'all') p.set('stage', stageFilter);
    if (statusFilter !== 'all') p.set('status', statusFilter);
    const qs = p.toString();
    return qs ? `?${qs}` : '';
  };

  useEffect(() => { fetchData(); }, [stageFilter, statusFilter]);

  const fetchWorkers = async () => {
    try {
      const data = await api.getWorkers();
      setWorkers(data.workers || []);
    } catch (err) { console.error(err); }
  };

  const openJobDetail = async (jobId) => {
    try {
      const data = await api.getProductionJob(jobId);
      setSelectedJob(data);
      setView('job_detail');
    } catch (err) { alert(err.message); }
  };

  const updateStage = async (jobId, stage, status, notes) => {
    try {
      await api.updateProductionStage(jobId, { stage, status, notes });
      const updated = await api.getProductionJob(jobId);
      setSelectedJob(updated);
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const assignWorkerToJob = async (jobId, workerName) => {
    try {
      await api.assignWorker(jobId, { worker_name: workerName });
      const updated = await api.getProductionJob(jobId);
      setSelectedJob(updated);
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const handleAddWorker = async (e) => {
    e.preventDefault();
    try {
      await api.addWorker(workerForm);
      setWorkerForm({ name: '', email: '', password: '' });
      setShowWorkerForm(false);
      fetchWorkers();
    } catch (err) { alert(err.message); }
  };

  const handleRemoveWorker = async (id) => {
    if (!window.confirm('Remove this worker?')) return;
    try { await api.removeWorker(id); fetchWorkers(); } catch (err) { alert(err.message); }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      await api.createProductionJob(createForm);
      setShowCreateJob(false);
      setCreateForm({ order_id: '', priority: 'normal', assigned_to: '', notes: '' });
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const fetchPendingOrders = async () => {
    try {
      const data = await api.getOrders('?status=confirmed');
      setPendingOrders(data.orders || []);
    } catch (err) { console.error(err); }
  };

  const stages = stats?.stages || [];

  if (loading) return <div className="admin-loading">Loading production...</div>;

  return (
    <div className="admin-page prod-page" data-testid="admin-production">
      <div className="admin-page-header">
        <div><h1>Production & Factory</h1><p>Manage order queue, workflow milestones, and tech packs</p></div>
        <div className="prod-header-actions">
          <button className={`admin-filter-btn ${view === 'queue' ? 'active' : ''}`} onClick={() => setView('queue')} data-testid="prod-view-queue">Order Queue</button>
          <button className={`admin-filter-btn ${view === 'workers' ? 'active' : ''}`} onClick={() => { setView('workers'); fetchWorkers(); }} data-testid="prod-view-workers">Workers</button>
          <button className="admin-btn-primary" onClick={() => { setShowCreateJob(true); fetchPendingOrders(); }} data-testid="create-job-btn">
            <Factory size={14} /> New Production Job
          </button>
        </div>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="admin-stats-grid">
          <div className="admin-stat-card"><div className="stat-icon" style={{ backgroundColor: '#8B5CF615', color: '#8B5CF6' }}><Factory size={20} /></div><div className="stat-info"><span className="stat-value">{stats.active_jobs}</span><span className="stat-label">Active Jobs</span></div></div>
          <div className="admin-stat-card"><div className="stat-icon" style={{ backgroundColor: '#10B98115', color: '#10B981' }}><CheckCircle size={20} /></div><div className="stat-info"><span className="stat-value">{stats.completed_today}</span><span className="stat-label">Completed Today</span></div></div>
          <div className="admin-stat-card"><div className="stat-icon" style={{ backgroundColor: '#EF444415', color: '#EF4444' }}><Zap size={20} /></div><div className="stat-info"><span className="stat-value">{stats.rush_orders + stats.express_orders}</span><span className="stat-label">Rush / Express</span></div></div>
          <div className="admin-stat-card"><div className="stat-icon" style={{ backgroundColor: '#2563EB15', color: '#2563EB' }}><Clock size={20} /></div><div className="stat-info"><span className="stat-value">{stats.total_jobs}</span><span className="stat-label">Total Jobs</span></div></div>
        </div>
      )}

      {/* Stage Pipeline Bar */}
      {stats && view === 'queue' && (
        <div className="prod-pipeline" data-testid="production-pipeline">
          {stages.map(s => (
            <div key={s.name} className={`pipeline-stage ${stageFilter === s.name ? 'active' : ''}`}
              onClick={() => setStageFilter(stageFilter === s.name ? 'all' : s.name)}
              style={{ '--stage-color': STAGE_COLORS[s.name] || '#666' }}
              data-testid={`pipeline-${s.name}`}>
              <span className="pipeline-count">{stats.stage_counts?.[s.name] || 0}</span>
              <span className="pipeline-label">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ===== QUEUE VIEW ===== */}
      {view === 'queue' && (
        <>
          <div className="admin-filters" style={{ marginTop: 16 }}>
            {['all', 'in_progress', 'completed'].map(s => (
              <button key={s} className={`admin-filter-btn ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
                {s === 'all' ? 'All Status' : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </button>
            ))}
          </div>

          {jobs.length === 0 ? <div className="admin-empty">No production jobs found</div> : (
            <div className="prod-job-list" data-testid="production-job-list">
              {jobs.map(job => (
                <div key={job.id} className={`prod-job-card priority-${job.priority}`} data-testid={`prod-job-${job.id}`}>
                  <div className="pj-header">
                    <div className="pj-order-info">
                      <span className="pj-order-num">#{job.order_number}</span>
                      <span className="pj-priority" style={{ color: PRIORITY_COLORS[job.priority] }}>{job.priority?.toUpperCase()}</span>
                    </div>
                    <span className={`status-badge status-${job.status === 'completed' ? 'delivered' : 'in_production'}`}>
                      {job.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="pj-body">
                    <div className="pj-customer">{job.customer_name}</div>
                    <div className="pj-meta">
                      <span>{job.items?.length || 0} item(s)</span>
                      <span>{'\u20B9'}{job.total_amount?.toLocaleString()}</span>
                      {job.assigned_to && <span className="pj-assigned">Assigned: {job.assigned_to}</span>}
                    </div>
                    {/* Mini stage progress */}
                    <div className="pj-stage-bar">
                      {job.stages?.map((s, i) => (
                        <div key={s.name} className={`pj-stage-dot ${s.status}`} title={`${s.label}: ${s.status}`}
                          style={{ backgroundColor: s.status === 'completed' ? STAGE_COLORS[s.name] : s.status === 'in_progress' ? STAGE_COLORS[s.name] : '#e5e5e5' }}>
                        </div>
                      ))}
                      <span className="pj-current-stage">{job.current_stage?.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                  <div className="pj-actions">
                    <button onClick={() => openJobDetail(job.id)} data-testid={`view-job-${job.id}`}><Eye size={14} /> Details</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ===== JOB DETAIL VIEW ===== */}
      {view === 'job_detail' && selectedJob && (
        <div className="prod-detail" data-testid="job-detail-panel">
          <button className="admin-btn-secondary" onClick={() => { setView('queue'); setSelectedJob(null); }} style={{ marginTop: 0, marginBottom: 20 }} data-testid="back-to-queue-btn">&larr; Back to Queue</button>

          <div className="pd-header">
            <div>
              <h2>Order #{selectedJob.order_number}</h2>
              <div className="pd-meta">
                <span>{selectedJob.customer_name} ({selectedJob.customer_email})</span>
                <span className="pj-priority" style={{ color: PRIORITY_COLORS[selectedJob.priority] }}>{selectedJob.priority?.toUpperCase()}</span>
                {selectedJob.assigned_to && <span>Assigned: <strong>{selectedJob.assigned_to}</strong></span>}
              </div>
            </div>
            <div className="pd-assign">
              <select onChange={e => { if (e.target.value) assignWorkerToJob(selectedJob.id, e.target.value); }} defaultValue="" data-testid="assign-worker-select">
                <option value="" disabled>Assign worker...</option>
                {workers.length === 0 && <option disabled>Load workers first</option>}
                {workers.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
              </select>
              <button className="admin-btn-secondary" style={{ marginTop: 0 }} onClick={fetchWorkers}>Load Workers</button>
            </div>
          </div>

          {/* Workflow Milestones */}
          <div className="pd-section">
            <h3>Workflow Milestones</h3>
            <div className="pd-workflow" data-testid="workflow-milestones">
              {selectedJob.stages?.map((s, i) => (
                <div key={s.name} className={`wf-stage ${s.status}`} data-testid={`wf-stage-${s.name}`}>
                  <div className="wf-indicator" style={{ '--stage-clr': STAGE_COLORS[s.name] }}>
                    {s.status === 'completed' ? <CheckCircle size={20} /> : s.status === 'in_progress' ? <ArrowRight size={20} /> : <Circle size={20} />}
                  </div>
                  <div className="wf-info">
                    <span className="wf-label">{s.label}</span>
                    <span className="wf-status">{s.status?.replace(/_/g, ' ')}</span>
                    {s.started_at && <span className="wf-time">Started: {new Date(s.started_at).toLocaleString('en-IN')}</span>}
                    {s.completed_at && <span className="wf-time">Done: {new Date(s.completed_at).toLocaleString('en-IN')}</span>}
                    {s.notes && <span className="wf-notes">{s.notes}</span>}
                  </div>
                  {s.status !== 'completed' && s.name !== 'order_received' && (
                    <div className="wf-actions">
                      {s.status === 'pending' && (
                        <button className="wf-btn start" onClick={() => updateStage(selectedJob.id, s.name, 'in_progress')} data-testid={`start-${s.name}`}>Start</button>
                      )}
                      {s.status === 'in_progress' && (
                        <button className="wf-btn complete" onClick={() => updateStage(selectedJob.id, s.name, 'completed')} data-testid={`complete-${s.name}`}>Complete</button>
                      )}
                    </div>
                  )}
                  {i < selectedJob.stages.length - 1 && <div className="wf-connector"></div>}
                </div>
              ))}
            </div>
          </div>

          {/* Tech Pack */}
          <div className="pd-section">
            <h3><FileText size={16} /> Tech Pack</h3>
            <div className="pd-techpack" data-testid="tech-pack">
              {selectedJob.tech_pack?.material_specs?.length > 0 && (
                <div className="tp-block">
                  <h4>Material Specifications</h4>
                  <table className="admin-table">
                    <thead><tr><th>Item</th><th>Material</th><th>Color</th><th>Size</th><th>Qty</th></tr></thead>
                    <tbody>
                      {selectedJob.tech_pack.material_specs.map((m, i) => (
                        <tr key={i}><td>{m.item_name}</td><td>{m.material}</td><td>{m.color}</td><td>{m.size}</td><td>{m.quantity}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="tp-details-grid">
                {selectedJob.tech_pack?.construction && <div className="tp-detail"><span>Construction</span><strong>{selectedJob.tech_pack.construction}</strong></div>}
                {selectedJob.tech_pack?.color_code && <div className="tp-detail"><span>Color Code</span><strong>{selectedJob.tech_pack.color_code}</strong></div>}
                {selectedJob.tech_pack?.last_type && <div className="tp-detail"><span>Last Type</span><strong>{selectedJob.tech_pack.last_type}</strong></div>}
              </div>
              {selectedJob.tech_pack?.special_instructions && (
                <div className="tp-block"><h4>Special Instructions</h4><p className="tp-notes">{selectedJob.tech_pack.special_instructions}</p></div>
              )}
              {selectedJob.tech_pack?.design_notes && (
                <div className="tp-block"><h4>Design Notes</h4><p className="tp-notes">{selectedJob.tech_pack.design_notes}</p></div>
              )}
            </div>
          </div>

          {/* Items & Shipping */}
          <div className="pd-section pd-two-col">
            <div>
              <h3>Order Items</h3>
              {selectedJob.items?.map((item, i) => (
                <div key={i} className="order-item-line">{item.name} - Size {item.size}, {item.color} x{item.quantity} - {'\u20B9'}{(item.price * item.quantity).toLocaleString()}</div>
              ))}
              <div className="order-total">Total: {'\u20B9'}{selectedJob.total_amount?.toLocaleString()}</div>
            </div>
            {selectedJob.shipping_address && (
              <div>
                <h3>Shipping Address</h3>
                <p style={{ fontSize: '0.78rem', lineHeight: 1.8, color: '#555' }}>
                  {selectedJob.shipping_address.name}<br />
                  {selectedJob.shipping_address.address}<br />
                  {selectedJob.shipping_address.city}, {selectedJob.shipping_address.state} - {selectedJob.shipping_address.pincode}<br />
                  Ph: {selectedJob.shipping_address.phone}
                </p>
              </div>
            )}
          </div>

          {/* Activity Log */}
          {selectedJob.activity_log?.length > 0 && (
            <div className="pd-section">
              <h3>Activity Log</h3>
              <div className="pd-activity-log">
                {selectedJob.activity_log.map((entry, i) => (
                  <div key={i} className="al-entry">
                    <span className="al-action">{entry.action}</span>
                    <span className="al-meta">by {entry.by} - {new Date(entry.timestamp).toLocaleString('en-IN')}</span>
                    {entry.notes && <span className="al-notes">{entry.notes}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== WORKERS VIEW ===== */}
      {view === 'workers' && (
        <div className="prod-workers" data-testid="workers-panel">
          <div className="section-header" style={{ marginBottom: 20 }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem' }}>Factory Workers</h3>
            <button className="admin-btn-primary" onClick={() => setShowWorkerForm(true)} data-testid="add-worker-btn"><UserPlus size={14} /> Add Worker</button>
          </div>

          {workers.length === 0 ? <div className="admin-empty">No factory workers registered</div> : (
            <div className="admin-table-wrapper">
              <table className="admin-table" data-testid="workers-table">
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Active Jobs</th><th>Actions</th></tr></thead>
                <tbody>
                  {workers.map(w => (
                    <tr key={w.id} data-testid={`worker-row-${w.id}`}>
                      <td><strong>{w.name}</strong></td>
                      <td>{w.email}</td>
                      <td><span className={`status-badge ${w.role === 'admin' ? 'status-confirmed' : 'status-in_production'}`}>{w.role}</span></td>
                      <td>{w.active_jobs}</td>
                      <td>
                        {w.role === 'factory_worker' && (
                          <button className="table-action-btn" onClick={() => handleRemoveWorker(w.id)} data-testid={`remove-worker-${w.id}`}><Trash2 size={14} /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Worker Modal */}
      {showWorkerForm && (
        <div className="admin-modal-overlay" onClick={() => setShowWorkerForm(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowWorkerForm(false)}><X size={18} /></button>
            <h3>Add Factory Worker</h3>
            <p className="table-sub" style={{ marginBottom: 16 }}>Worker can log in to view production pipeline and update milestones.</p>
            <form onSubmit={handleAddWorker} className="admin-form">
              <div className="af-field"><label>Name *</label><input type="text" value={workerForm.name} onChange={e => setWorkerForm({...workerForm, name: e.target.value})} required data-testid="worker-name-input" /></div>
              <div className="af-field"><label>Email *</label><input type="email" value={workerForm.email} onChange={e => setWorkerForm({...workerForm, email: e.target.value})} required data-testid="worker-email-input" /></div>
              <div className="af-field"><label>Password *</label><input type="password" value={workerForm.password} onChange={e => setWorkerForm({...workerForm, password: e.target.value})} required data-testid="worker-password-input" /></div>
              <button type="submit" className="admin-btn-primary" data-testid="save-worker-btn">Add Worker</button>
            </form>
          </div>
        </div>
      )}

      {/* Create Production Job Modal */}
      {showCreateJob && (
        <div className="admin-modal-overlay" onClick={() => setShowCreateJob(false)}>
          <div className="admin-modal admin-modal-lg" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowCreateJob(false)}><X size={18} /></button>
            <h3>Create Production Job</h3>
            <p className="table-sub" style={{ marginBottom: 16 }}>Select a confirmed order to send to production.</p>
            {pendingOrders.length === 0 ? (
              <div className="admin-empty" style={{ padding: 30 }}>No confirmed orders available for production</div>
            ) : (
              <form onSubmit={handleCreateJob} className="admin-form">
                <div className="af-field">
                  <label>Select Order *</label>
                  <select value={createForm.order_id} onChange={e => setCreateForm({...createForm, order_id: e.target.value})} required data-testid="select-order-for-job">
                    <option value="">Choose an order...</option>
                    {pendingOrders.map(o => (
                      <option key={o.id} value={o.id}>#{o.order_number} - {o.customer_name} ({'\u20B9'}{o.total_amount?.toLocaleString()})</option>
                    ))}
                  </select>
                </div>
                <div className="af-row">
                  <div className="af-field">
                    <label>Priority</label>
                    <select value={createForm.priority} onChange={e => setCreateForm({...createForm, priority: e.target.value})}>
                      <option value="normal">Normal</option><option value="rush">Rush</option><option value="express">Express</option>
                    </select>
                  </div>
                  <div className="af-field">
                    <label>Assign To</label>
                    <input type="text" value={createForm.assigned_to} onChange={e => setCreateForm({...createForm, assigned_to: e.target.value})} placeholder="Worker name" />
                  </div>
                </div>
                <div className="af-field"><label>Notes</label><textarea value={createForm.notes} onChange={e => setCreateForm({...createForm, notes: e.target.value})} rows="2" placeholder="Production notes..." /></div>
                <button type="submit" className="admin-btn-primary" data-testid="submit-create-job">Send to Production</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProduction;
