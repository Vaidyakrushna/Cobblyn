"use client";
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Factory, Users, Clock, Zap, ChevronRight, Eye, X, UserPlus, Trash2, FileText, CheckCircle, Circle, ArrowRight, Star, MessageSquare } from 'lucide-react';
import { api } from '../../api';

const STAGE_COLORS = {
  order_received: '#6B7280',
  pattern_cutting: '#8B5CF6',
  assembling_finishing: '#3B82F6',
  quality_check: '#EC4899',
  ready_to_ship: '#06B6D4',
  delivered: '#10B981',
};

const PRIORITY_COLORS = { express: '#EF4444', rush: '#F59E0B', normal: '#6B7280' };

const AdminProduction = () => {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
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
  const [draggedOverColumn, setDraggedOverColumn] = useState(null);
  const [fulfillmentFilter, setFulfillmentFilter] = useState('inhouse');
  const [vendors, setVendors] = useState([]);
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    specialty: '',
    monthly_capacity: 100,
    average_lead_time_days: 14,
    address: '',
    gst_no: '',
    satisfaction_score: 5.0,
    blacklisted: false
  });
  const [expandedJobId, setExpandedJobId] = useState(null);

  const [selectedVendorPerformance, setSelectedVendorPerformance] = useState(null);
  const [fulfilledJobs, setFulfilledJobs] = useState([]);
  const [loadingFulfilled, setLoadingFulfilled] = useState(false);
  const [perfTab, setPerfTab] = useState('specs'); // specs, feedback
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackJobId, setFeedbackJobId] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, comment: '' });

  const handleOpenPerformance = async (vendor) => {
    setSelectedVendorPerformance(vendor);
    setPerfTab('specs');
    setLoadingFulfilled(true);
    try {
      const data = await api.getVendorFulfilled(vendor.id);
      setFulfilledJobs(data.fulfilled_jobs || []);
    } catch (err) {
      console.error("Failed to load fulfilled orders:", err);
    } finally {
      setLoadingFulfilled(false);
    }
  };

  const refreshPerformance = async (vendorId) => {
    setLoadingFulfilled(true);
    try {
      const data = await api.getVendorFulfilled(vendorId);
      setFulfilledJobs(data.fulfilled_jobs || []);
    } catch (err) {
      console.error("Failed to load fulfilled orders:", err);
    } finally {
      setLoadingFulfilled(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!selectedVendorPerformance || !feedbackJobId) return;
    try {
      const res = await api.submitVendorFeedback(
        selectedVendorPerformance.id,
        feedbackJobId,
        {
          rating: parseInt(feedbackForm.rating),
          comment: feedbackForm.comment
        }
      );
      
      // Update local performance drawer scores
      setSelectedVendorPerformance(prev => ({
        ...prev,
        satisfaction_score: res.new_satisfaction_score
      }));
      
      // Reset form & modal
      setFeedbackForm({ rating: 5, comment: '' });
      setShowFeedbackModal(false);
      setFeedbackJobId(null);
      
      // Refresh listings
      fetchVendors();
      refreshPerformance(selectedVendorPerformance.id);
    } catch (err) {
      alert("Failed to submit feedback: " + err.message);
    }
  };

  const handleAddVendor = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...vendorForm,
        specialty: vendorForm.specialty.split(',').map(s => s.trim()).filter(Boolean),
        monthly_capacity: parseInt(vendorForm.monthly_capacity) || 100,
        average_lead_time_days: parseInt(vendorForm.average_lead_time_days) || 14,
        satisfaction_score: parseFloat(vendorForm.satisfaction_score) || 5.0
      };
      await api.request('/admin/vendors', { method: 'POST', body: JSON.stringify(data) });
      setVendorForm({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        specialty: '',
        monthly_capacity: 100,
        average_lead_time_days: 14,
        address: '',
        gst_no: '',
        satisfaction_score: 5.0,
        blacklisted: false
      });
      setShowVendorForm(false);
      fetchVendors();
    } catch (err) { alert('Failed to add vendor: ' + err.message); }
  };

  const handleToggleVendorStatus = async (vendorId, currentActive) => {
    try {
      await api.request(`/admin/vendors/${vendorId}`, {
        method: 'PUT',
        body: JSON.stringify({ active: !currentActive })
      });
      fetchVendors();
    } catch (err) { alert('Failed to update status: ' + err.message); }
  };

  const handleToggleVendorBlacklist = async (vendorId, currentBlacklisted) => {
    try {
      await api.request(`/admin/vendors/${vendorId}`, {
        method: 'PUT',
        body: JSON.stringify({ blacklisted: !currentBlacklisted })
      });
      fetchVendors();
    } catch (err) { alert('Failed to update blacklist status: ' + err.message); }
  };

  const handleDragStart = (e, jobId) => {
    e.dataTransfer.setData('text/plain', jobId);
  };

  const handleDrop = async (e, targetColumnId) => {
    e.preventDefault();
    setDraggedOverColumn(null);
    const jobId = e.dataTransfer.getData('text/plain');
    if (!jobId) return;

    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    try {
      const status = targetColumnId === 'delivered' ? 'completed' : 'in_progress';
      await api.updateProductionStage(jobId, { stage: targetColumnId, status: status });
      fetchData();
    } catch (err) {
      alert('Failed to transition stage: ' + err.message);
    }
  };

  const handleFulfillmentChange = async (jobId, type, vendorName = null) => {
    try {
      await api.updateJobOperational(jobId, {
        crafted_by: type,
        fulfillment_vendor: vendorName
      });
      fetchData();
      fetchVendors();
      if (selectedJob && selectedJob.id === jobId) {
        const updated = await api.getProductionJob(jobId);
        setSelectedJob(updated);
      }
    } catch (err) {
      alert('Failed to update fulfillment routing: ' + err.message);
    }
  };

  const fetchData = async () => {
    try {
      const [statsData, jobsData] = await Promise.all([
        api.getProductionStats(),
        api.getProductionJobs(buildParams())
      ]);
      setStats(statsData);
      setJobs(jobsData.jobs || []);
      fetchVendors();
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

  useEffect(() => {
    if (tab) {
      setView(tab);
      if (tab === 'vendors') {
        fetchVendors();
      } else if (tab === 'workers') {
        fetchWorkers();
      }
    } else {
      setView('queue');
    }
  }, [tab]);

  const fetchVendors = async () => {
    try {
      const data = await api.getVendors();
      setVendors(data.vendors || []);
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

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

  if (tab === 'vendors' && view !== 'job_detail') {
    return (
      <div className="admin-page prod-page" data-testid="admin-production">
        <div className="admin-page-header">
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', color: '#1c1917', margin: 0 }}>Manufacturing Vendors & Partners</h1>
            <p style={{ fontSize: '0.85rem', color: '#78716c', margin: '4px 0 0 0' }}>Manage external shoe craft workshops, capacity volumes, and rating performances</p>
          </div>
          <div className="prod-header-actions">
            <button className="admin-btn-primary" onClick={() => setShowVendorForm(true)} data-testid="add-vendor-btn" style={{ margin: 0 }}>
              <UserPlus size={14} /> Add New Vendor
            </button>
          </div>
        </div>

        {/* ===== VENDORS VIEW ===== */}
        <div className="prod-vendors" data-testid="vendors-panel" style={{ marginTop: '24px' }}>
          {vendors.length === 0 ? (
            <div className="admin-empty">No active vendors registered</div>
          ) : (
            <div className="admin-table-wrapper" style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e7e5e4', padding: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', marginBottom: '32px' }}>
              <table className="admin-table" data-testid="vendors-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #e7e5e4' }}>
                    <th style={{ padding: '12px' }}>Vendor & Specialty</th>
                    <th style={{ padding: '12px' }}>Contact Person</th>
                    <th style={{ padding: '12px' }}>GST & Address</th>
                    <th style={{ padding: '12px' }}>Orders (Active / Done)</th>
                    <th style={{ padding: '12px' }}>Avg. Completion</th>
                    <th style={{ padding: '12px' }}>Rating</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px' }}>Blacklisted</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map(v => (
                    <tr key={v.id} data-testid={`vendor-row-${v.id}`} style={{ borderBottom: '1px solid #f5f5f4' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 700, color: '#1c1917', fontSize: '0.85rem' }}>{v.name}</div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                          {v.specialty?.map((spec, i) => (
                            <span key={i} style={{ fontSize: '0.6rem', padding: '1px 6px', background: '#f5f5f4', color: '#44403c', borderRadius: '4px', fontWeight: 600 }}>
                              {spec}
                            </span>
                          ))}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#a8a29e', marginTop: '4px' }}>Vendor ID: <span style={{ fontFamily: 'monospace' }}>{v.id}</span></div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#44403c' }}>{v.contact_person}</div>
                        <div style={{ fontSize: '0.7rem', color: '#78716c', marginTop: '2px' }}>{v.email}</div>
                        <div style={{ fontSize: '0.7rem', color: '#78716c' }}>{v.phone}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontSize: '0.72rem', color: '#44403c', fontWeight: 500, maxWidth: '200px', whiteSpace: 'normal', lineBreak: 'anywhere' }}>{v.address || 'N/A'}</div>
                        <div style={{ fontSize: '0.68rem', color: '#78716c', marginTop: '4px' }}>GST: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v.gst_no || 'N/A'}</span></div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#d97706', background: '#fffbeb', padding: '2px 8px', borderRadius: '12px' }} title="Assigned / Active">
                            {v.assigned_orders || 0} active
                          </span>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '2px 8px', borderRadius: '12px' }} title="Completed">
                            {v.completed_orders || 0} done
                          </span>
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#a8a29e', marginTop: '6px' }}>Cap: {v.monthly_capacity || 100}/mo • LT: {v.average_lead_time_days || 14}d</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1c1917' }}>
                          {v.avg_completion_time?.formatted || 'N/A'}
                        </div>
                        {v.avg_completion_time?.formatted && v.avg_completion_time.formatted !== 'N/A' && (
                          <div style={{ fontSize: '0.6rem', color: '#78716c', marginTop: '2px' }}>
                            from completed orders
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: '#9d2706', fontSize: '0.9rem' }}>★</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#44403c' }}>{parseFloat(v.satisfaction_score || 5.0).toFixed(1)}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button
                          onClick={() => handleToggleVendorStatus(v.id, v.active !== false)}
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '20px',
                            border: 'none',
                            cursor: 'pointer',
                            background: v.active !== false ? '#f0fdf4' : '#fef2f2',
                            color: v.active !== false ? '#16a34a' : '#dc2626',
                            transition: 'all 0.2s ease'
                          }}
                          data-testid={`vendor-status-toggle-${v.id}`}
                        >
                          {v.active !== false ? '● Active' : '● Inactive'}
                        </button>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button
                          onClick={() => handleToggleVendorBlacklist(v.id, v.blacklisted === true)}
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '20px',
                            border: 'none',
                            cursor: 'pointer',
                            background: v.blacklisted === true ? '#fef2f2' : '#f5f5f4',
                            color: v.blacklisted === true ? '#dc2626' : '#57534e',
                            transition: 'all 0.2s ease'
                          }}
                          data-testid={`vendor-blacklist-toggle-${v.id}`}
                        >
                          {v.blacklisted === true ? '⚠️ Blacklisted' : '✅ Clear'}
                        </button>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleOpenPerformance(v)}
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid #9d2706',
                            cursor: 'pointer',
                            background: 'transparent',
                            color: '#9d2706',
                            transition: 'all 0.2s ease',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          data-testid={`vendor-perf-btn-${v.id}`}
                        >
                          📊 Performance
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Ordering Queue Flow Tracker Section */}
          <div style={{ marginTop: '40px' }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.15rem', color: '#1c1917', margin: 0 }}>Vendor Orders Tracking Queue</h3>
              <p style={{ fontSize: '0.78rem', color: '#78716c', margin: '4px 0 0 0' }}>Monitor real-time stage progression and fulfillment tracking across all active vendor orders</p>
            </div>

            {(() => {
              const vendorJobs = jobs.filter(j => j.crafted_by === 'vendor');
              if (vendorJobs.length === 0) {
                return <div className="admin-empty" style={{ padding: '24px' }}>No active vendor orders in the queue</div>;
              }

              return (
                <div className="admin-table-wrapper" style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e7e5e4', padding: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: '1px solid #e7e5e4' }}>
                        <th style={{ padding: '12px', width: '220px' }}>Order & Customer</th>
                        <th style={{ padding: '12px', width: '150px' }}>Assigned Vendor</th>
                        <th style={{ padding: '12px', width: '140px' }}>Fulfillment State</th>
                        <th style={{ padding: '12px' }}>Ordering Progress Flow Stage</th>
                        <th style={{ padding: '12px', width: '160px' }}>Fulfillment Control</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendorJobs.map(job => {
                        // Steps configuration
                        const steps = [
                          { label: 'Assigned', name: 'order_received', active: job.current_stage === 'order_received', done: job.stages?.[0]?.status === 'completed' },
                          { label: 'Confirmed', name: 'vendor_confirmed', active: false, done: job.stages?.[0]?.status === 'completed' },
                          { label: 'Cutting', name: 'pattern_cutting', active: job.current_stage === 'pattern_cutting', done: job.stages?.[1]?.status === 'completed' },
                          { label: 'Assembling & Finishing', name: 'assembling_finishing', active: job.current_stage === 'assembling_finishing', done: job.stages?.[2]?.status === 'completed' },
                          { label: 'Quality checks', name: 'quality_check', active: job.current_stage === 'quality_check', done: job.stages?.[3]?.status === 'completed' },
                          { label: 'Ready to ship', name: 'ready_to_ship', active: job.current_stage === 'ready_to_ship', done: job.stages?.[4]?.status === 'completed' },
                          { label: 'Delivered', name: 'delivered', active: job.current_stage === 'delivered', done: job.status === 'completed' || job.stages?.[5]?.status === 'completed' }
                        ];

                        const assignedAt = job.assigned_at ? new Date(job.assigned_at) : new Date(job.created_at);
                        const expiryTime = new Date(assignedAt.getTime() + 12 * 60 * 60 * 1000);
                        const diffMs = expiryTime - new Date();
                        const hoursLeft = Math.floor(diffMs / (60 * 60 * 1000));
                        const minutesLeft = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
                        const isOverdue = diffMs <= 0;
                        const isExpanded = expandedJobId === job.id;

                        return (
                          <React.Fragment key={job.id}>
                            <tr 
                              style={{ borderBottom: '1px solid #f5f5f4', cursor: 'pointer', background: isExpanded ? '#fafaf9' : 'transparent', transition: 'all 0.15s ease' }}
                              onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                            >
                              <td style={{ padding: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  {(() => {
                                    const itemImage = job.items?.[0]?.images?.[0] || job.items?.[0]?.image || "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=100&q=80";
                                    return (
                                      <div style={{ width: '40px', height: '30px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #e7e5e4', background: '#000', flexShrink: 0 }}>
                                        <img src={itemImage} alt="Shoe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      </div>
                                    );
                                  })()}
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 700, color: '#1c1917', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      #{job.order_number}
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); openJobDetail(job.id); }}
                                        style={{ background: 'transparent', border: 'none', color: '#9d2706', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 600, padding: 0, textDecoration: 'underline' }}
                                      >
                                        (Details)
                                      </button>
                                    </span>
                                    <span style={{ fontSize: '0.72rem', color: '#44403c', marginTop: '2px' }}>{job.customer_name}</span>
                                    <span style={{ fontSize: '0.62rem', color: '#78716c', marginTop: '2px' }}>
                                      📅 Assigned: {assignedAt.toLocaleDateString()} {assignedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '12px' }} onClick={e => e.stopPropagation()}>
                                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#9d2706', display: 'block' }}>
                                  🤝 {job.fulfillment_vendor || 'Unassigned'}
                                </span>
                                {(() => {
                                  const matchedVendor = vendors.find(v => v.name === job.fulfillment_vendor);
                                  if (matchedVendor && matchedVendor.portal_token) {
                                    return (
                                      <button
                                        onClick={() => {
                                          const link = `${window.location.origin}/vendor/portal/${matchedVendor.portal_token}`;
                                          navigator.clipboard.writeText(link);
                                          alert('✓ Secure magic link copied to clipboard!');
                                        }}
                                        style={{
                                          background: 'transparent',
                                          border: 'none',
                                          color: '#78716c',
                                          fontSize: '0.65rem',
                                          cursor: 'pointer',
                                          padding: '2px 0',
                                          textDecoration: 'underline',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '2px',
                                          marginTop: '4px'
                                        }}
                                      >
                                        🔗 Copy Magic Link
                                      </button>
                                    );
                                  }
                                  return null;
                                })()}
                              </td>
                              <td style={{ padding: '12px' }}>
                                <span style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  background: job.status === 'completed' ? '#f0fdf4' : '#fffbeb',
                                  color: job.status === 'completed' ? '#16a34a' : '#d97706',
                                  textTransform: 'uppercase',
                                  display: 'inline-block',
                                  marginBottom: '4px'
                                }}>
                                  {job.status === 'completed' ? 'Delivered' : job.current_stage?.replace(/_/g, ' ')}
                                </span>
                                {job.vendor_confirmed ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                      ✅ Confirmed
                                    </span>
                                    {job.vendor_confirmed_at && (
                                      <span style={{ fontSize: '0.58rem', color: '#78716c' }}>
                                        {new Date(job.vendor_confirmed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{
                                      fontSize: '0.65rem',
                                      fontWeight: 700,
                                      color: isOverdue ? '#dc2626' : '#d97706',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '2px'
                                    }}>
                                      ⏳ {isOverdue ? 'SLA EXPIRED' : `SLA: ${hoursLeft}h ${minutesLeft}m`}
                                    </span>
                                    <span style={{ fontSize: '0.58rem', color: '#78716c' }}>
                                      awaiting ack.
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '12px' }}>
                                {isExpanded ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', padding: '8px 0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', flexWrap: 'wrap' }}>
                                      {steps.map((step, idx) => {
                                        const isDone = step.done;
                                        const isActive = step.active || (idx === 1 && !isDone && steps[0].done);
                                        return (
                                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '12px', background: isDone ? '#f0fdf4' : isActive ? '#eff6ff' : '#f5f5f4', border: isDone ? '1px solid #bbf7d0' : isActive ? '1px solid #bfdbfe' : '1px solid #e5e5e5' }}>
                                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isDone ? '#16a34a' : isActive ? '#2563eb' : '#a3a3a3' }} />
                                              <span style={{ fontSize: '0.65rem', fontWeight: (isDone || isActive) ? 700 : 500, color: isDone ? '#15803d' : isActive ? '#1d4ed8' : '#737373' }}>
                                                {step.label}
                                              </span>
                                            </div>
                                            {idx < steps.length - 1 && (
                                              <span style={{ color: '#d4d4d4', fontSize: '0.75rem', fontWeight: 300 }}>&rarr;</span>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {/* Stage Completion Logs */}
                                    <div style={{ background: '#fcfbfb', border: '1px dashed #e7e5e4', borderRadius: '8px', padding: '8px 12px', fontSize: '0.7rem', color: '#57534e' }}>
                                      <strong style={{ display: 'block', marginBottom: '4px', textTransform: 'uppercase', fontSize: '0.62rem', letterSpacing: '0.05em', color: '#78716c' }}>Atelier Craft Log Timestamps:</strong>
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                                        <div>📅 Assigned: <span style={{ fontWeight: 600 }}>{job.assigned_at ? new Date(job.assigned_at).toLocaleString() : new Date(job.created_at).toLocaleString()}</span></div>
                                        {job.vendor_confirmed_at && (
                                          <div>✅ Confirmed: <span style={{ fontWeight: 600 }}>{new Date(job.vendor_confirmed_at).toLocaleString()}</span></div>
                                        )}
                                        {job.stages?.map((s, idx) => {
                                          if (s.status === 'completed' && s.completed_at) {
                                            return (
                                              <div key={idx}>
                                                🔨 {s.label}: <span style={{ fontWeight: 600 }}>{new Date(s.completed_at).toLocaleString()}</span>
                                              </div>
                                            );
                                          }
                                          return null;
                                        })}
                                      </div>
                                      {job.tech_pack?.special_instructions && (
                                        <div style={{ marginTop: '6px', borderTop: '1px solid #f5f5f4', paddingTop: '4px', fontStyle: 'italic', color: '#a8a29e' }}>
                                          Special Instructions: "{job.tech_pack.special_instructions}"
                                        </div>
                                      )}
                                      <div style={{ marginTop: '12px', borderTop: '1px solid #e7e5e4', paddingTop: '10px', display: 'flex', gap: '8px' }}>
                                        <button
                                          onClick={() => openJobDetail(job.id)}
                                          style={{
                                            padding: '6px 12px',
                                            background: '#9d2706',
                                            color: '#000',
                                            border: 'none',
                                            borderRadius: '6px',
                                            fontSize: '0.68rem',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            transition: 'all 0.15s ease'
                                          }}
                                        >
                                          👁️ View Details & Workshop Preview
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      padding: '6px 12px',
                                      borderRadius: '20px',
                                      background: '#fafaf9',
                                      border: '1px solid #e7e5e4',
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                                    }}>
                                      <span style={{
                                        display: 'inline-block',
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: '#9d2706',
                                        boxShadow: '0 0 8px #9d2706',
                                        animation: 'pulse 1.5s infinite alternate'
                                      }} />
                                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#44403c', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                        {(() => {
                                          const activeStep = steps.find(s => s.active) || steps.find(s => !s.done) || steps[steps.length - 1];
                                          return activeStep.label;
                                        })()}
                                      </span>
                                    </div>
                                    <span style={{ fontSize: '0.62rem', color: '#a8a29e', fontStyle: 'italic' }}>
                                      (click row to view full flow)
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '12px' }} onClick={e => e.stopPropagation()}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <button
                                    onClick={async () => {
                                      if (confirm(`Are you sure you want to revert Order #${job.order_number} to the In-House production queue?`)) {
                                        await handleFulfillmentChange(job.id, 'inhouse', null);
                                      }
                                    }}
                                    style={{
                                      padding: '4px 8px',
                                      background: '#fef2f2',
                                      color: '#dc2626',
                                      border: '1px solid #fee2e2',
                                      borderRadius: '6px',
                                      fontSize: '0.68rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      justifyContent: 'center',
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    🏠 Revert In-House
                                  </button>
                                  
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.62rem', color: '#78716c', fontWeight: 600 }}>Reassign:</span>
                                    <select
                                      value={job.fulfillment_vendor || ''}
                                      onChange={async (e) => {
                                        const nextVendor = e.target.value;
                                        if (nextVendor && nextVendor !== job.fulfillment_vendor) {
                                          if (confirm(`Reassign Order #${job.order_number} to partner workshop '${nextVendor}'? This will reset the 12-hour SLA.`)) {
                                            await handleFulfillmentChange(job.id, 'vendor', nextVendor);
                                          }
                                        }
                                      }}
                                      style={{
                                        padding: '2px 4px',
                                        border: '1px solid #e7e5e4',
                                        borderRadius: '4px',
                                        fontSize: '0.65rem',
                                        background: '#fff',
                                        color: '#44403c',
                                        outline: 'none',
                                        cursor: 'pointer',
                                        maxWidth: '100px'
                                      }}
                                    >
                                      <option value="" disabled>Change...</option>
                                      {vendors
                                        .filter(v => v.active !== false && v.name !== job.fulfillment_vendor)
                                        .map(v => (
                                          <option key={v.id} value={v.name}>{v.name}</option>
                                        ))}
                                    </select>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Add Vendor Modal */}
        {showVendorForm && (
          <div className="admin-modal-overlay" onClick={() => setShowVendorForm(false)}>
            <div className="admin-modal admin-modal-lg" onClick={e => e.stopPropagation()}>
              <button className="admin-modal-close" onClick={() => setShowVendorForm(false)}><X size={18} /></button>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem' }}>Add Manufacturing Vendor</h3>
              <p className="table-sub" style={{ marginBottom: 16 }}>Register a new premium shoe-craft workshop partner to the Atelier Network.</p>
              <form onSubmit={handleAddVendor} className="admin-form">
                <div className="af-row">
                  <div className="af-field">
                    <label>Workshop / Brand Name *</label>
                    <input type="text" value={vendorForm.name} onChange={e => setVendorForm({...vendorForm, name: e.target.value})} required placeholder="e.g. Tuscan Handcrafters Ltd" data-testid="vendor-name-input" />
                  </div>
                  <div className="af-field">
                    <label>GST Registration No. *</label>
                    <input type="text" value={vendorForm.gst_no} onChange={e => setVendorForm({...vendorForm, gst_no: e.target.value})} required placeholder="e.g. 09AAAAA1111A1Z1" data-testid="vendor-gst-input" />
                  </div>
                </div>

                <div className="af-row">
                  <div className="af-field">
                    <label>Contact Person Name *</label>
                    <input type="text" value={vendorForm.contact_person} onChange={e => setVendorForm({...vendorForm, contact_person: e.target.value})} required placeholder="e.g. Gianni Russo" />
                  </div>
                  <div className="af-field">
                    <label>Contact Phone Number *</label>
                    <input type="text" value={vendorForm.phone} onChange={e => setVendorForm({...vendorForm, phone: e.target.value})} required placeholder="e.g. +91 98765 43210" />
                  </div>
                </div>

                <div className="af-row">
                  <div className="af-field">
                    <label>Email Address *</label>
                    <input type="email" value={vendorForm.email} onChange={e => setVendorForm({...vendorForm, email: e.target.value})} required placeholder="e.g. partnerships@tuscan.com" />
                  </div>
                  <div className="af-field">
                    <label>Craft Specialties (comma-separated) *</label>
                    <input type="text" value={vendorForm.specialty} onChange={e => setVendorForm({...vendorForm, specialty: e.target.value})} required placeholder="e.g. Brogues, Goodyear Welt, Exotic Leathers" />
                  </div>
                </div>

                <div className="af-row">
                  <div className="af-field">
                    <label>Monthly Production Capacity (pairs) *</label>
                    <input type="number" value={vendorForm.monthly_capacity} onChange={e => setVendorForm({...vendorForm, monthly_capacity: e.target.value})} required />
                  </div>
                  <div className="af-field">
                    <label>Average Lead Time (days) *</label>
                    <input type="number" value={vendorForm.average_lead_time_days} onChange={e => setVendorForm({...vendorForm, average_lead_time_days: e.target.value})} required />
                  </div>
                </div>

                <div className="af-row">
                  <div className="af-field">
                    <label>Initial Quality / Satisfaction Score (1.0 - 5.0) *</label>
                    <input type="number" step="0.1" min="1" max="5" value={vendorForm.satisfaction_score} onChange={e => setVendorForm({...vendorForm, satisfaction_score: e.target.value})} required />
                  </div>
                  <div className="af-field">
                    <label>Status</label>
                    <div style={{ display: 'flex', gap: '16px', height: '40px', alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500, cursor: 'pointer', fontSize: '0.78rem' }}>
                        <input type="checkbox" checked={vendorForm.blacklisted} onChange={e => setVendorForm({...vendorForm, blacklisted: e.target.checked})} />
                        Mark as Blacklisted
                      </label>
                    </div>
                  </div>
                </div>

                <div className="af-field">
                  <label>Physical Workshop Address *</label>
                  <textarea value={vendorForm.address} onChange={e => setVendorForm({...vendorForm, address: e.target.value})} required rows="2" placeholder="Full workshop manufacturing unit address..." />
                </div>

                <button type="submit" className="admin-btn-primary" style={{ width: '100%', marginTop: '12px' }} data-testid="save-vendor-btn">Register Manufacturing Vendor</button>
              </form>
            </div>
          </div>
        )}

        {/* Performance Drawer */}
        {selectedVendorPerformance && (
          <div className="perf-drawer-overlay" onClick={() => setSelectedVendorPerformance(null)}>
            <div className="perf-drawer" onClick={e => e.stopPropagation()}>
              <div className="perf-drawer-header">
                <div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', color: '#1c1917', margin: 0 }}>
                    {selectedVendorPerformance.name}
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#78716c', margin: '4px 0 0 0' }}>
                    Workshop Performance Profile & Metrics
                  </p>
                </div>
                <button
                  onClick={() => setSelectedVendorPerformance(null)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#78716c' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div className="perf-tabs">
                <button
                  className={`perf-tab-btn ${perfTab === 'specs' ? 'active' : ''}`}
                  onClick={() => setPerfTab('specs')}
                >
                  📈 Specs & Jobs
                </button>
                <button
                  className={`perf-tab-btn ${perfTab === 'feedback' ? 'active' : ''}`}
                  onClick={() => setPerfTab('feedback')}
                >
                  ⭐ Customer Feedback Book
                </button>
              </div>

              {/* Drawer Content */}
              <div className="perf-drawer-content">
                {perfTab === 'specs' && (
                  <div>
                    {/* General Specs Card */}
                    <div style={{ background: '#fafaf9', border: '1px solid #e7e5e4', borderRadius: '12px', padding: '18px', marginBottom: '24px' }}>
                      <h4 style={{ margin: '0 0 16px 0', fontSize: '0.82rem', color: '#1c1917', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e7e5e4', paddingBottom: '8px' }}>Workshop Specifications</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', fontSize: '0.78rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f5f5f4', paddingBottom: '6px' }}>
                          <span style={{ color: '#78716c', fontWeight: 500 }}>Capacity</span>
                          <strong style={{ color: '#44403c' }}>{selectedVendorPerformance.monthly_capacity} pairs/mo</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f5f5f4', paddingBottom: '6px' }}>
                          <span style={{ color: '#78716c', fontWeight: 500 }}>Est. Lead Time</span>
                          <strong style={{ color: '#44403c' }}>{selectedVendorPerformance.average_lead_time_days} days</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f5f5f4', paddingBottom: '6px' }}>
                          <span style={{ color: '#78716c', fontWeight: 500 }}>Active Orders</span>
                          <strong style={{ color: '#d97706' }}>{selectedVendorPerformance.assigned_orders || 0} active</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f5f5f4', paddingBottom: '6px' }}>
                          <span style={{ color: '#78716c', fontWeight: 500 }}>Completed Orders</span>
                          <strong style={{ color: '#16a34a' }}>{selectedVendorPerformance.completed_orders || 0} done</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f5f5f4', paddingBottom: '6px', gridColumn: 'span 2' }}>
                          <span style={{ color: '#78716c', fontWeight: 500 }}>GST Number</span>
                          <strong style={{ color: '#44403c', fontFamily: 'monospace' }}>{selectedVendorPerformance.gst_no || 'N/A'}</strong>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gridColumn: 'span 2', gap: '6px' }}>
                          <span style={{ color: '#78716c', fontWeight: 500 }}>Physical Address</span>
                          <div style={{ color: '#44403c', fontSize: '0.75rem', lineHeight: '1.5', background: '#fff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e7e5e4' }}>
                            {selectedVendorPerformance.address || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Historical Completed Deliveries */}
                    <div>
                      <h4 style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#1c1917', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed Deliveries History</h4>
                      {loadingFulfilled ? (
                        <div style={{ fontSize: '0.78rem', color: '#78716c' }}>Loading fulfilled orders...</div>
                      ) : fulfilledJobs.length === 0 ? (
                        <div style={{ border: '1.5px dashed #e7e5e4', borderRadius: '8px', padding: '24px', textAlign: 'center', color: '#a8a29e', fontSize: '0.78rem' }}>
                          No completed orders delivered by this workshop yet.
                        </div>
                      ) : (
                        fulfilledJobs.map(job => (
                          <div
                            key={job.id}
                            style={{
                              background: '#fff',
                              border: '1px solid #e7e5e4',
                              borderRadius: '12px',
                              padding: '16px',
                              marginBottom: '12px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.01)',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                              <div>
                                <strong style={{ fontSize: '0.85rem', color: '#1c1917' }}>Order #{job.order_number}</strong>
                                <span style={{ fontSize: '0.7rem', color: '#78716c', background: '#fafaf9', padding: '2px 8px', borderRadius: '12px', marginLeft: '8px', border: '1px solid #e7e5e4', fontWeight: 600 }}>
                                  {job.customer_name}
                                </span>
                              </div>

                              {/* Feedback Status */}
                              {job.customer_feedback ? (
                                <div style={{ display: 'flex', gap: '2px' }}>
                                  {[...Array(5)].map((_, i) => (
                                    <span
                                      key={i}
                                      style={{
                                        color: i < job.customer_feedback.rating ? '#9d2706' : '#d6d3d1',
                                        fontSize: '0.85rem'
                                      }}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setFeedbackJobId(job.id);
                                    setShowFeedbackModal(true);
                                  }}
                                  style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    padding: '5px 12px',
                                    background: '#9d2706',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    boxShadow: '0 2px 6px rgba(157,39,6,0.15)'
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                                  onMouseLeave={e => e.currentTarget.style.filter = 'none'}
                                >
                                  ✍️ Record Feedback
                                </button>
                              )}
                            </div>

                            {/* Completed Date */}
                            <div style={{ fontSize: '0.68rem', color: '#a8a29e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>📅 Delivered:</span>
                              <span style={{ color: '#44403c', fontWeight: 600 }}>
                                {job.completed_at ? new Date(job.completed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                              </span>
                            </div>

                            {/* Crafted Items List */}
                            {job.items && job.items.length > 0 && (
                              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f5f5f4' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'block', marginBottom: '4px' }}>Crafted Items</span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  {job.items.map((item, idx) => (
                                    <div key={idx} style={{ fontSize: '0.72rem', color: '#44403c', display: 'flex', justifyContent: 'space-between' }}>
                                      <span>👞 {item.name} ({item.color})</span>
                                      <strong style={{ color: '#78716c' }}>Size UK {item.size} • Qty {item.quantity}</strong>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {job.customer_feedback?.comment && (
                              <div
                                style={{
                                  background: '#fafaf9',
                                  borderLeft: '3px solid #9d2706',
                                  padding: '8px 12px',
                                  fontSize: '0.72rem',
                                  color: '#57534e',
                                  marginTop: '12px',
                                  fontStyle: 'italic',
                                  borderRadius: '0 8px 8px 0'
                                }}
                              >
                                "{job.customer_feedback.comment}"
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {perfTab === 'feedback' && (
                  <div>
                    {/* Overall Rating Banner */}
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #1c1917 0%, #44403c 100%)',
                        color: '#fff',
                        borderRadius: '12px',
                        padding: '20px',
                        textAlign: 'center',
                        marginBottom: '24px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                      }}
                    >
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a8a29e', display: 'block', marginBottom: '4px' }}>
                        Overall Satisfaction
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span style={{ color: '#9d2706', fontSize: '2.2rem' }}>★</span>
                        <strong style={{ fontSize: '2.5rem', fontFamily: "'Playfair Display', serif" }}>
                          {parseFloat(selectedVendorPerformance.satisfaction_score || 5.0).toFixed(1)}
                        </strong>
                        <span style={{ fontSize: '1rem', color: '#a8a29e' }}>/ 5.0</span>
                      </div>
                      <p style={{ fontSize: '0.7rem', color: '#a8a29e', margin: '8px 0 0 0' }}>
                        Calculated from all customer follow-up ratings on completed orders
                      </p>
                    </div>

                    {/* Customer Star Testimonials */}
                    <div>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#1c1917', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer Reviews & Testimonials</h4>
                      {loadingFulfilled ? (
                        <div style={{ fontSize: '0.78rem', color: '#78716c' }}>Loading feedback...</div>
                      ) : fulfilledJobs.filter(j => j.customer_feedback?.rating).length === 0 ? (
                        <div style={{ border: '1.5px dashed #e7e5e4', borderRadius: '8px', padding: '24px', textAlign: 'center', color: '#a8a29e', fontSize: '0.78rem' }}>
                          No customer feedback logged yet. Click "Specs & Jobs" to record feedback for a completed delivery.
                        </div>
                      ) : (
                        fulfilledJobs
                          .filter(job => job.customer_feedback?.rating)
                          .map(job => (
                            <div key={job.id} className="testimonial-card" style={{ background: 'rgba(255, 255, 255, 0.7)', border: '1px solid rgba(157, 39, 6, 0.15)', borderRadius: '12px', padding: '16px', marginBottom: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.01)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <div>
                                  <strong style={{ fontSize: '0.85rem', color: '#1c1917' }}>Order #{job.order_number}</strong>
                                  <span style={{ fontSize: '0.7rem', color: '#78716c', background: '#fafaf9', padding: '2px 8px', borderRadius: '12px', marginLeft: '8px', border: '1px solid #e7e5e4', fontWeight: 600 }}>
                                    {job.customer_name}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', gap: '2px' }}>
                                  {[...Array(5)].map((_, i) => (
                                    <span
                                      key={i}
                                      style={{
                                        color: i < job.customer_feedback.rating ? '#9d2706' : '#d6d3d1',
                                        fontSize: '0.85rem'
                                      }}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <p style={{ margin: '0 0 10px 0', fontSize: '0.78rem', color: '#44403c', fontStyle: 'italic', lineHeight: '1.5', background: '#fafaf9', borderLeft: '3px solid #9d2706', padding: '8px 12px', borderRadius: '0 8px 8px 0' }}>
                                "{job.customer_feedback.comment || 'No written comment recorded.'}"
                              </p>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.62rem', color: '#a8a29e' }}>
                                <span>📅 Delivered: {job.completed_at ? new Date(job.completed_at).toLocaleDateString('en-IN') : 'N/A'}</span>
                                {job.customer_feedback.submitted_at && (
                                  <span>Logged: {new Date(job.customer_feedback.submitted_at).toLocaleDateString('en-IN')}</span>
                                )}
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Record Feedback Modal */}
        {showFeedbackModal && (
          <div className="admin-modal-overlay" onClick={() => setShowFeedbackModal(false)} style={{ zIndex: 1100 }}>
            <div className="admin-modal" onClick={e => e.stopPropagation()}>
              <button className="admin-modal-close" onClick={() => setShowFeedbackModal(false)}><X size={18} /></button>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', color: '#1c1917', margin: '0 0 4px 0' }}>Record Concierge Feedback</h3>
              <p style={{ fontSize: '0.78rem', color: '#78716c', marginBottom: '20px' }}>Log customer satisfaction rating and comment for completed Order.</p>
              
              <form onSubmit={handleSubmitFeedback} className="admin-form">
                <div className="af-field">
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#44403c', marginBottom: '8px' }}>Satisfaction Rating *</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '1.8rem',
                          color: star <= feedbackForm.rating ? '#9d2706' : '#d6d3d1',
                          padding: 0,
                          transition: 'transform 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        ★
                      </button>
                    ))}
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#44403c', marginLeft: '8px' }}>
                      {feedbackForm.rating} Star{feedbackForm.rating > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className="af-field" style={{ marginTop: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#44403c', marginBottom: '8px' }}>Customer Feedback Comment *</label>
                  <textarea
                    value={feedbackForm.comment}
                    onChange={e => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                    required
                    rows="4"
                    placeholder="e.g. Customer loved the Goodyear welt finishing. Highly satisfied with the leather selection."
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #e7e5e4',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontFamily: 'inherit',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="admin-btn-primary"
                  style={{ width: '100%', marginTop: '24px', marginHorizontal: 0 }}
                >
                  Save Concierge Feedback
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

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
          <style>{`
            .kanban-board {
              display: flex;
              gap: 10px;
              margin-top: 24px;
              align-items: start;
              overflow-x: auto;
              padding-bottom: 16px;
            }
            .kanban-column {
              flex: 1;
              min-width: 170px;
              max-width: 250px;
              background: #fafaf9;
              border: 1px solid #e7e5e4;
              border-radius: 12px;
              padding: 10px;
              min-height: 480px;
              display: flex;
              flex-direction: column;
              transition: all 0.3s ease;
            }
            @media (max-width: 1024px) {
              .kanban-column {
                min-width: 200px;
                flex-shrink: 0;
              }
            }
            .kanban-column.drag-over {
              background: rgba(157, 39, 6, 0.05);
              border-color: #9d2706;
              box-shadow: 0 0 10px rgba(157,39,6,0.1);
            }
            .kanban-column-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;
              padding-bottom: 6px;
              border-bottom: 2px solid var(--col-color);
            }
            .kanban-column-title {
              font-family: 'Montserrat', sans-serif;
              font-size: 0.72rem;
              font-weight: 700;
              color: #292524;
              text-transform: uppercase;
              letter-spacing: 0.03em;
            }
            .kanban-column-count {
              font-size: 0.65rem;
              font-weight: 700;
              background: #e7e5e4;
              color: #57534e;
              padding: 1px 6px;
              border-radius: 10px;
            }
            .kanban-column-desc {
              font-size: 0.6rem;
              color: #a8a29e;
              margin: -6px 0 10px 0;
              line-height: 1.2;
            }
            .kanban-cards-container {
              display: flex;
              flex-direction: column;
              gap: 8px;
              flex: 1;
              min-height: 400px;
            }
            .kanban-card {
              background: #fff;
              border: 1px solid #e7e5e4;
              border-radius: 8px;
              padding: 10px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.02);
              cursor: grab;
              transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .kanban-card:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(0,0,0,0.05);
              border-color: #9d2706;
            }
            .kanban-card:active {
              cursor: grabbing;
            }
            .k-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 6px;
            }
            .k-ord {
              font-family: 'Montserrat', sans-serif;
              font-weight: 700;
              font-size: 0.78rem;
              color: #1c1917;
            }
            .k-priority {
              font-size: 0.55rem;
              font-weight: 700;
              padding: 1px 4px;
              border-radius: 3px;
              text-transform: uppercase;
              letter-spacing: 0.02em;
            }
            .k-cust {
              font-weight: 600;
              font-size: 0.72rem;
              color: #44403c;
              margin-bottom: 2px;
            }
            .k-items {
              font-size: 0.62rem;
              color: #78716c;
              margin-bottom: 8px;
              line-height: 1.3;
            }
            .k-footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding-top: 8px;
              border-top: 1px solid #f5f5f4;
            }
            .k-assigned {
              font-size: 0.6rem;
              color: #a8a29e;
              font-style: italic;
            }
            .k-btn {
              background: transparent;
              border: none;
              color: #9d2706;
              font-weight: 600;
              font-size: 0.7rem;
              display: flex;
              align-items: center;
              gap: 4px;
              cursor: pointer;
              padding: 0;
            }
            .k-btn:hover {
              color: #854d0e;
            }
            .perf-drawer-overlay {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(28, 25, 23, 0.4);
              backdrop-filter: blur(8px);
              z-index: 1000;
              display: flex;
              justify-content: flex-end;
              animation: fadeIn 0.25s ease;
            }
            .perf-drawer {
              width: 500px;
              max-width: 100%;
              background: rgba(255, 255, 255, 0.9);
              backdrop-filter: blur(20px);
              border-left: 1px solid rgba(157, 39, 6, 0.2);
              box-shadow: -10px 0 30px rgba(0,0,0,0.05);
              height: 100%;
              display: flex;
              flex-direction: column;
              animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideIn {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
            .perf-drawer-header {
              padding: 24px;
              border-bottom: 1px solid #e7e5e4;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              background: linear-gradient(135deg, rgba(157, 39, 6, 0.03) 0%, transparent 100%);
            }
            .perf-tabs {
              display: flex;
              border-bottom: 1px solid #e7e5e4;
              padding: 0 24px;
              background: #fafaf9;
            }
            .perf-tab-btn {
              padding: 14px 20px;
              font-family: 'Montserrat', sans-serif;
              font-size: 0.72rem;
              font-weight: 700;
              color: #78716c;
              background: transparent;
              border: none;
              border-bottom: 2px solid transparent;
              cursor: pointer;
              transition: all 0.2s ease;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .perf-tab-btn.active {
              color: #9d2706;
              border-bottom-color: #9d2706;
            }
            .perf-drawer-content {
              flex: 1;
              overflow-y: auto;
              padding: 24px;
            }
            .testimonial-card {
              background: rgba(255, 255, 255, 0.6);
              border: 1px solid rgba(157, 39, 6, 0.15);
              border-radius: 12px;
              padding: 16px;
              margin-bottom: 16px;
              box-shadow: 0 4px 15px rgba(0,0,0,0.01);
              transition: all 0.2s ease;
            }
            .testimonial-card:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(157, 39, 6, 0.05);
              border-color: rgba(157, 39, 6, 0.3);
            }
          `}</style>

          {(() => {
            const getJobColumn = (job) => {
              if (job.status === 'completed') return 'delivered';
              return job.current_stage || 'order_received';
            };

            const kanbanColumns = [
              { id: 'order_received', label: 'Order Received', color: '#6B7280', desc: 'Order received & queued' },
              { id: 'pattern_cutting', label: 'Pattern Cutting', color: '#8B5CF6', desc: 'Pattern cutting & prep' },
              { id: 'assembling_finishing', label: 'Assembling & Finishing', color: '#3B82F6', desc: 'Assembly & finishing' },
              { id: 'quality_check', label: 'Quality Check', color: '#EC4899', desc: 'Final inspection & QA' },
              { id: 'ready_to_ship', label: 'Dispatched', color: '#06B6D4', desc: 'Dispatched & ready to ship' },
              { id: 'delivered', label: 'Delivered', color: '#10B981', desc: 'Successfully delivered' }
            ];

            // Only custom/offline orders directed In-House are shown on this board
            const displayJobs = jobs.filter(job => job.crafted_by !== 'vendor');

            return (
              <div className="kanban-board" data-testid="kanban-board">
                {kanbanColumns.map(col => {
                  let filteredJobs = displayJobs.filter(j => getJobColumn(j) === col.id);
                  if (col.id === 'delivered') {
                    filteredJobs.sort((a, b) => {
                      const aDelivered = a.stages?.find(s => s.name === 'delivered')?.completed_at || a.completed_at || '';
                      const bDelivered = b.stages?.find(s => s.name === 'delivered')?.completed_at || b.completed_at || '';
                      return bDelivered.localeCompare(aDelivered);
                    });
                  }

                  return (
                    <div 
                      key={col.id} 
                      className={`kanban-column ${draggedOverColumn === col.id ? 'drag-over' : ''}`}
                      style={{ '--col-color': col.color }}
                      onDragOver={(e) => { e.preventDefault(); setDraggedOverColumn(col.id); }}
                      onDragLeave={() => setDraggedOverColumn(null)}
                      onDrop={(e) => handleDrop(e, col.id)}
                      data-testid={`kanban-col-${col.id}`}
                    >
                      <div className="kanban-column-header">
                        <span className="kanban-column-title" style={{ color: col.color }}>{col.label}</span>
                        <span className="kanban-column-count">{filteredJobs.length}</span>
                      </div>
                      <span className="kanban-column-desc">{col.desc}</span>
                      
                      <div className="kanban-cards-container">
                        {filteredJobs.length === 0 ? (
                           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '120px', border: '1.5px dashed #e7e5e4', borderRadius: '8px', padding: '12px', color: '#a8a29e', fontSize: '0.68rem', textAlign: 'center', background: '#fafaf9' }}>
                             <span>No active jobs</span>
                           </div>
                        ) : (
                          filteredJobs.map(job => (
                            <div 
                              key={job.id} 
                              className="kanban-card"
                              draggable={col.id !== 'delivered'}
                              onDragStart={(e) => handleDragStart(e, job.id)}
                              data-testid={`kanban-card-${job.id}`}
                            >
                              <div className="k-header">
                                <span className="k-ord">#{job.order_number}</span>
                                <span 
                                  className="k-priority" 
                                  style={{ 
                                    backgroundColor: job.priority === 'express' ? '#fef2f2' : job.priority === 'rush' ? '#fffbeb' : '#f4f4f5', 
                                    color: PRIORITY_COLORS[job.priority] || '#6B7280' 
                                  }}
                                >
                                  {job.priority}
                                </span>
                              </div>
                              <div className="k-cust">{job.customer_name}</div>
                              <div className="k-items">
                                {job.items?.map((item, idx) => (
                                  <div key={idx} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                    {item.name} (UK {item.size})
                                  </div>
                                ))}
                              </div>
                              
                              {col.id === 'delivered' && (
                                <div style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                                  <CheckCircle size={10} />
                                  Delivered: {(() => {
                                    const compAt = job.stages?.find(s => s.name === 'delivered')?.completed_at || job.completed_at;
                                    return compAt ? new Date(compAt).toLocaleDateString('en-IN') : 'N/A';
                                  })()}
                                </div>
                              )}
                              
                              {col.id !== 'delivered' && (
                                <div className="k-fulfillment-selector" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #e7e5e4', marginBottom: '8px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#78716c' }}>Route:</span>
                                    <select 
                                      value={job.crafted_by || 'inhouse'} 
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        handleFulfillmentChange(job.id, val, val === 'vendor' ? (vendors[0]?.name || '') : null);
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      style={{ fontSize: '0.65rem', padding: '2px 4px', borderRadius: '4px', border: '1px solid #d6d3d1', background: '#fff', color: '#44403c' }}
                                      data-testid={`crafted-by-select-${job.id}`}
                                    >
                                      <option value="inhouse">🏠 In-House</option>
                                      <option value="vendor">🤝 Vendor</option>
                                    </select>
                                  </div>
                                  {job.crafted_by === 'vendor' && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                      <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#78716c' }}>Vendor:</span>
                                      <select
                                        value={job.fulfillment_vendor || ''}
                                        onChange={(e) => handleFulfillmentChange(job.id, 'vendor', e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ fontSize: '0.65rem', padding: '2px 4px', borderRadius: '4px', border: '1px solid #d6d3d1', background: '#fff', color: '#44403c', width: '90px' }}
                                        data-testid={`vendor-select-${job.id}`}
                                      >
                                        <option value="" disabled>Select Vendor</option>
                                        {vendors.map(v => (
                                          <option key={v.id} value={v.name}>{v.name}</option>
                                        ))}
                                      </select>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="k-footer">
                                <span className="k-assigned">
                                  {job.assigned_to ? `Assigned: ${job.assigned_to}` : 'Unassigned'}
                                </span>
                                <button className="k-btn" onClick={() => openJobDetail(job.id)} data-testid={`view-job-${job.id}`}>
                                  <Eye size={12} /> Details
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </>
      )}

      {/* ===== JOB DETAIL VIEW ===== */}
      {view === 'job_detail' && selectedJob && (
        <div className="prod-detail" data-testid="job-detail-panel">
          <button className="admin-btn-secondary" onClick={() => { setView(tab || 'queue'); setSelectedJob(null); }} style={{ marginTop: 0, marginBottom: 20 }} data-testid="back-to-queue-btn">&larr; Back to Queue</button>

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

          {/* Fulfillment & Routing */}
          <div className="pd-section" style={{ background: '#fafaf9', border: '1px solid #e7e5e4', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
            <h3 style={{ marginTop: 0, borderBottom: '1px solid #e7e5e4', paddingBottom: '8px', fontSize: '0.9rem', color: '#1c1917' }}>Fulfillment & Routing</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#78716c', marginBottom: '4px' }}>Production Route</label>
                <select
                  value={selectedJob.crafted_by || 'inhouse'}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleFulfillmentChange(selectedJob.id, val, val === 'vendor' ? (vendors[0]?.name || '') : null);
                  }}
                  style={{ fontSize: '0.8rem', padding: '6px 12px', borderRadius: '6px', border: '1px solid #d6d3d1', minWidth: '160px', background: '#fff' }}
                  data-testid="detail-crafted-by-select"
                >
                  <option value="inhouse">🏠 In-House Production</option>
                  <option value="vendor">🤝 Vendor Fulfillment</option>
                </select>
              </div>

              {selectedJob.crafted_by === 'vendor' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#78716c', marginBottom: '4px' }}>Assigned Vendor</label>
                  <select
                    value={selectedJob.fulfillment_vendor || ''}
                    onChange={(e) => handleFulfillmentChange(selectedJob.id, 'vendor', e.target.value)}
                    style={{ fontSize: '0.8rem', padding: '6px 12px', borderRadius: '6px', border: '1px solid #d6d3d1', minWidth: '180px', background: '#fff' }}
                    data-testid="detail-vendor-select"
                  >
                    <option value="" disabled>Select a vendor...</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#78716c', marginBottom: '4px' }}>Job Priority</label>
                <select
                  value={selectedJob.priority || 'normal'}
                  onChange={async (e) => {
                    try {
                      await api.updateJobOperational(selectedJob.id, { priority: e.target.value });
                      const updated = await api.getProductionJob(selectedJob.id);
                      setSelectedJob(updated);
                      fetchData();
                    } catch (err) { alert(err.message); }
                  }}
                  style={{ fontSize: '0.8rem', padding: '6px 12px', borderRadius: '6px', border: '1px solid #d6d3d1', minWidth: '120px', background: '#fff' }}
                  data-testid="detail-priority-select"
                >
                  <option value="normal">Normal</option>
                  <option value="rush">Rush</option>
                  <option value="express">Express</option>
                </select>
              </div>
            </div>
          </div>

          {/* Workshop Portal Preview */}
          {selectedJob.crafted_by === 'vendor' && (
            <div className="pd-section" style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #fcd34d', paddingBottom: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.1rem' }}>👁️</span>
                <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#78350f', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Workshop Portal Preview</h3>
                <span style={{ marginLeft: 'auto', background: selectedJob.vendor_confirmed ? '#d1fae5' : '#fee2e2', color: selectedJob.vendor_confirmed ? '#065f46' : '#991b1b', border: `1px solid ${selectedJob.vendor_confirmed ? '#a7f3d0' : '#fecaca'}`, padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700 }}>
                  {selectedJob.vendor_confirmed ? '✓ Confirmed by Workshop' : '⏳ Awaiting Acceptance'}
                </span>
              </div>
              <p style={{ fontSize: '0.72rem', color: '#78350f', lineHeight: 1.5, margin: '0 0 12px 0' }}>
                Below is the exact data subset exposed to the partner workshop based on their active authorization state and current production stage:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', background: 'rgba(255,255,255,0.6)', borderRadius: '8px', padding: '12px' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Exposed Reference Number</span>
                  <strong style={{ fontSize: '0.85rem', color: '#1c1917' }}>
                    {selectedJob.vendor_confirmed ? selectedJob.order_number : `COBBLYN-W-${selectedJob.id?.substring(selectedJob.id.length - 5).toUpperCase()}`}
                  </strong>
                </div>

                <div>
                  <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Exposed Customer Personal Details</span>
                  <strong style={{ fontSize: '0.8rem', color: '#1c1917', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {selectedJob.vendor_confirmed && (selectedJob.current_stage === 'ready_to_ship' || selectedJob.current_stage === 'delivered') ? (
                      <span>🟢 {selectedJob.customer_name} ({selectedJob.customer_email || 'Hidden'})</span>
                    ) : (
                      <span>🔒 Confidential ({!selectedJob.vendor_confirmed ? 'Awaiting Acceptance' : 'In Production'})</span>
                    )}
                  </strong>
                </div>

                <div>
                  <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Exposed Shipping Address</span>
                  <strong style={{ fontSize: '0.8rem', color: '#1c1917' }}>
                    {selectedJob.vendor_confirmed && (selectedJob.current_stage === 'ready_to_ship' || selectedJob.current_stage === 'delivered') ? (
                      <span>🟢 Unlocked (Full coordinates visible)</span>
                    ) : (
                      <span>🔒 Locked (Hidden from Workshop)</span>
                    )}
                  </strong>
                </div>

                <div>
                  <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Exposed Tech Pack Specifications</span>
                  <strong style={{ fontSize: '0.8rem', color: '#1c1917' }}>
                    {selectedJob.vendor_confirmed ? (
                      <span>🟢 Full (Measurements, special instructions & design notes visible)</span>
                    ) : (
                      <span>🔒 Limited (Basic material specs only; details locked)</span>
                    )}
                  </strong>
                </div>
              </div>
            </div>
          )}

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
