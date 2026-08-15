"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Hammer, 
  Clock, 
  MapPin, 
  RefreshCw, 
  Check, 
  AlertTriangle, 
  ShieldCheck, 
  User, 
  Mail, 
  Phone,
  Settings,
  Lock,
  Unlock,
  FileText,
  ClipboardList,
  Download,
  LogOut,
  Star
} from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function VendorPortalPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token;

  // Global Page Data
  const [vendor, setVendor] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Pre-acceptance gate states
  const [gates, setGates] = useState({});
  const [notesText, setNotesText] = useState({});

  // Decline order dialog states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectJobId, setRejectJobId] = useState(null);
  const [rejectReason, setRejectReason] = useState('At Maximum Capacity');
  const [rejectDetails, setRejectDetails] = useState('');

  // Clock state for SLA countdown timer
  const [now, setNow] = useState(new Date());

  // --- STEP 6 SECURE WORKSPACE STATES ---
  const [isSecureLoggedIn, setIsSecureLoggedIn] = useState(false);
  const [activeSecureTab, setActiveSecureTab] = useState('ledger');
  
  // Login credentials
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginSecret, setLoginSecret] = useState('');
  const [loginErrorMsg, setLoginErrorMsg] = useState('');
  
  // Reset credentials (self-service via token validation)
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetPin, setResetPin] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');
  const [resetErrorMsg, setResetErrorMsg] = useState('');

  // Profile Settings states
  const [editContact, setEditContact] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Secure endpoints data
  const [secureJobs, setSecureJobs] = useState({ completed_jobs: [], declined_jobs: [] });
  const [secureLedger, setSecureLedger] = useState({ ledger: [], total_due: 0, total_paid: 0, balance_outstanding: 0 });

  // PDF report range selection
  const [pdfStartDate, setPdfStartDate] = useState('');
  const [pdfEndDate, setPdfEndDate] = useState('');

  // Clock tick for SLA
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchPortalData = async () => {
    try {
      const res = await fetch(`/api/vendor/portal/${token}`);
      if (!res.ok) throw new Error('Magic authorization expired or invalid');
      const data = await res.json();
      setVendor(data.vendor);
      setJobs(data.jobs || []);

      // Autofill local fields for editing
      setEditContact(data.vendor.contact_person || '');
      setEditEmail(data.vendor.email || '');
      setEditPhone(data.vendor.phone || '');
      setEditAddress(data.vendor.address || '');

      // Initialize pre-acceptance verification gates
      const initialGates = {};
      data.jobs.forEach(j => {
        if (!j.vendor_confirmed) {
          initialGates[j.id] = { materials: false, capacity: false };
        }
      });
      setGates(prev => ({ ...initialGates, ...prev }));
      setError(false);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPortalData();
      checkSecureSession();
    }
  }, [token]);

  // Check if cookies contain active authenticated vendor token
  const checkSecureSession = async () => {
    try {
      const res = await fetch('/api/vendor/portal/me');
      if (res.ok) {
        setIsSecureLoggedIn(true);
        fetchSecureWorkspaceData();
      }
    } catch (err) {
      console.error('Session verify error:', err);
    }
  };

  const fetchSecureWorkspaceData = async () => {
    try {
      const resJobs = await fetch('/api/vendor/portal/jobs/secure');
      if (resJobs.ok) {
        const jobsData = await resJobs.json();
        setSecureJobs(jobsData);
      }
      const resLedger = await fetch('/api/vendor/portal/ledger');
      if (resLedger.ok) {
        const ledgerData = await resLedger.json();
        setSecureLedger(ledgerData);
      }
    } catch (err) {
      console.error('Secure fetch error:', err);
    }
  };

  const handleSecureLogin = async (e) => {
    e.preventDefault();
    setLoginErrorMsg('');
    try {
      const res = await fetch('/api/vendor/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier,
          secret: loginSecret
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Authentication failed');
      }
      setIsSecureLoggedIn(true);
      setLoginIdentifier('');
      setLoginSecret('');
      fetchSecureWorkspaceData();
    } catch (err) {
      setLoginErrorMsg(err.message);
    }
  };

  const handleSecureLogout = async () => {
    await fetch('/api/vendor/portal/logout', { method: 'POST' });
    setIsSecureLoggedIn(false);
    setSecureJobs({ completed_jobs: [], declined_jobs: [] });
    setSecureLedger({ ledger: [], total_due: 0, total_paid: 0, balance_outstanding: 0 });
  };

  const handleResetSecurity = async (e) => {
    e.preventDefault();
    setResetErrorMsg('');
    setResetSuccessMsg('');
    try {
      const res = await fetch('/api/vendor/portal/reset-security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          new_password: resetPassword || null,
          new_pin: resetPin || null
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Reset failed');
      }
      setResetSuccessMsg('✓ Credentials updated successfully. You can log in now!');
      setResetPassword('');
      setResetPin('');
      setShowResetForm(false);
    } catch (err) {
      setResetErrorMsg(err.message);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccessMsg('');
    try {
      const res = await fetch('/api/vendor/portal/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_person: editContact,
          email: editEmail,
          phone: editPhone,
          address: editAddress
        })
      });
      if (!res.ok) throw new Error('Profile update failed');
      setProfileSuccessMsg('✓ Workshop contact and address information updated successfully!');
      fetchPortalData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Date-based PDF ledger report generation using jsPDF
  const handleGeneratePdfReport = () => {
    if (!pdfStartDate || !pdfEndDate) {
      alert('Please select both start and end dates.');
      return;
    }

    const start = new Date(pdfStartDate);
    const end = new Date(pdfEndDate);
    end.setHours(23, 59, 59, 999);

    const filtered = secureLedger.ledger.filter(entry => {
      const date = new Date(entry.created_at);
      return date >= start && date <= end;
    });

    const doc = new jsPDF();
    
    // Primary aesthetic fonts/branding
    doc.setFillColor(157, 39, 6); // Brand Accent Red
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('COBBLYN ATELIER', 14, 18);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text('Partner Workshop Financial Report', 14, 25);

    doc.setTextColor(10, 10, 10);
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'bold');
    doc.text(`Workshop Name:`, 14, 45);
    doc.setFont('Helvetica', 'normal');
    doc.text(`${vendor?.name}`, 50, 45);

    doc.setFont('Helvetica', 'bold');
    doc.text(`Period Covered:`, 14, 51);
    doc.setFont('Helvetica', 'normal');
    doc.text(`${pdfStartDate}  to  ${pdfEndDate}`, 50, 51);

    // Ledger Summary Box
    doc.setFillColor(247, 245, 242);
    doc.rect(14, 60, 182, 24, 'F');
    
    let rangeTotalDue = 0;
    let rangeTotalPaid = 0;
    filtered.forEach(entry => {
      rangeTotalDue += entry.amount_due || 0;
      rangeTotalPaid += entry.amount_paid || 0;
    });

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Outstanding Balance:', 20, 68);
    doc.text('Period Total Invoiced:', 20, 74);
    doc.text('Period Total Cleared:', 20, 80);

    doc.setFont('Helvetica', 'normal');
    doc.text(`INR ${(rangeTotalDue - rangeTotalPaid).toFixed(2)}`, 65, 68);
    doc.text(`INR ${rangeTotalDue.toFixed(2)}`, 65, 74);
    doc.text(`INR ${rangeTotalPaid.toFixed(2)}`, 65, 80);

    // Draw table headers
    let y = 98;
    doc.setFillColor(10, 10, 10);
    doc.rect(14, y - 5, 182, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Date', 16, y);
    doc.text('Order Ref', 45, y);
    doc.text('Amount Due', 85, y);
    doc.text('Amount Paid', 125, y);
    doc.text('Fulfillment Status', 165, y);

    // Write table entries
    doc.setTextColor(10, 10, 10);
    doc.setFont('Helvetica', 'normal');
    
    filtered.forEach((entry, i) => {
      y += 10;
      // Handle page overflow if necessary
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      
      const entryDate = new Date(entry.created_at).toLocaleDateString();
      doc.text(entryDate, 16, y);
      doc.text(entry.order_number || 'N/A', 45, y);
      doc.text(`INR ${entry.amount_due.toFixed(2)}`, 85, y);
      doc.text(`INR ${entry.amount_paid.toFixed(2)}`, 125, y);
      doc.text(entry.payment_status?.toUpperCase() || 'PENDING', 165, y);

      // Light underline
      doc.setDrawColor(229, 229, 229);
      doc.line(14, y + 3, 196, y + 3);
    });

    doc.save(`Ledger_Report_${vendor?.name.replace(/\s+/g, '_')}_${pdfStartDate}.pdf`);
  };

  const toggleGate = (jobId, gateName) => {
    setGates(prev => ({
      ...prev,
      [jobId]: {
        ...prev[jobId],
        [gateName]: !prev[jobId]?.[gateName]
      }
    }));
  };

  const isGatePassed = (jobId) => {
    const g = gates[jobId];
    return g && g.materials && g.capacity;
  };

  const handleConfirmOrder = async (jobId) => {
    try {
      const res = await fetch(`/api/vendor/portal/${token}/jobs/${jobId}/confirm`, {
        method: 'POST'
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.detail || 'Failed to confirm order');
        return;
      }
      fetchPortalData();
    } catch (err) {
      console.error(err);
      alert('Error confirming order');
    }
  };

  const handleRejectOrder = async () => {
    if (!rejectJobId) return;
    try {
      const res = await fetch(`/api/vendor/portal/${token}/jobs/${rejectJobId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: rejectReason,
          details: rejectDetails
        })
      });
      if (!res.ok) {
        alert('Failed to decline order');
        return;
      }
      setShowRejectModal(false);
      setRejectJobId(null);
      setRejectDetails('');
      fetchPortalData();
    } catch (err) {
      console.error(err);
      alert('Error declining order');
    }
  };

  const handleAdvanceStage = async (jobId, currentStage) => {
    const notes = notesText[jobId] || '';
    try {
      const res = await fetch(`/api/vendor/portal/${token}/jobs/${jobId}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: currentStage,
          status: 'completed',
          notes: notes
        })
      });
      if (!res.ok) {
        alert('Failed to advance stage');
        return;
      }
      setNotesText(prev => ({ ...prev, [jobId]: '' }));
      fetchPortalData();
    } catch (err) {
      console.error(err);
      alert('Error advancing production stage');
    }
  };

  const getStageAction = (stage) => {
    switch (stage) {
      case 'order_received':
        return { label: '🧵 Finish & Commence Assembling', icon: <Hammer size={15} /> };
      case 'assembling_finishing':
        return { label: '🔍 Complete Assembly & Send to QA', icon: <ShieldCheck size={15} /> };
      case 'quality_check':
        return { label: '📦 Quality Approved - Ready to Ship', icon: <Settings size={15} /> };
      case 'ready_to_ship':
        return { label: '🚚 Dispatch & Mark as Delivered', icon: <Check size={15} /> };
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#E8E5E0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0A0A0A', fontFamily: 'Montserrat, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ border: '3px solid rgba(157, 39, 6, 0.1)', borderTop: '3px solid #9d2706', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }} />
          <p style={{ fontSize: '0.85rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#4B5563' }}>Authenticating Workshop...</p>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#E8E5E0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Montserrat, sans-serif' }}>
        <div style={{ maxWidth: '480px', width: '100%', border: '1px solid #fca5a5', borderRadius: '16px', padding: '32px', textAlign: 'center', color: '#0A0A0A', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', background: '#fff' }}>
          <div style={{ background: '#fee2e2', color: '#ef4444', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
            <AlertTriangle size={28} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Access Terminated</h2>
          <p style={{ fontSize: '0.82rem', color: '#4B5563', lineHeight: '1.75', marginBottom: '24px' }}>
            This magic link is either expired, invalid, or has been automatically reverted back to the Cobblyn in-house queue due to missing the 12-hour SLA confirmation window.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={() => fetchPortalData()} style={{ padding: '12px', background: '#9d2706', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer' }}>
              Retry Authorization
            </button>
            <button onClick={() => router.push('/login')} style={{ padding: '10px', background: 'transparent', border: '1px solid #d1d5db', borderRadius: '8px', color: '#4B5563', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer' }}>
              Go to Store Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pendingJobs = jobs.filter(j => !j.vendor_confirmed);
  const activeJobs = jobs.filter(j => j.vendor_confirmed && j.status !== 'completed');

  return (
    <div style={{ minHeight: '100vh', background: '#E8E5E0', color: '#0A0A0A', padding: '24px 16px', fontFamily: 'Montserrat, sans-serif' }}>
      
      {/* HEADER SECTION */}
      <header style={{ maxWidth: '1200px', margin: '0 auto 24px auto', background: '#fff', border: '1px solid #d1d5db', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: '#9d2706', width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block' }} />
            <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#9d2706' }}>Artisan Network Workspace</span>
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '4px 0', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0A0A0A' }}>
            {vendor?.name} Portal
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '12px', fontSize: '0.72rem', color: '#4B5563' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12} color="#9d2706" /> {vendor?.contact_person}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} color="#9d2706" /> {vendor?.email}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} color="#9d2706" /> {vendor?.phone}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={() => { setRefreshing(true); fetchPortalData(); }} 
            disabled={refreshing}
            style={{ background: '#fff', border: '1px solid #c4c4c4', borderRadius: '8px', padding: '10px 16px', color: '#0A0A0A', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh Board'}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        
        {/* PUBLIC QUEUE INFO DISCLAIMER */}
        <div style={{ background: 'rgba(157, 39, 6, 0.05)', border: '1px solid rgba(157, 39, 6, 0.25)', borderRadius: '12px', padding: '16px', fontSize: '0.75rem', color: '#2A2826', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Unlock size={24} style={{ color: '#9d2706', flexShrink: 0 }} />
          <div>
            <strong>Magic Link Access Active:</strong> Pending jobs and active production boards are displayed below without a password. 
            To view completed orders history, financial ledgers, decline sheets, or update security credentials, scroll down to authenticate with the **Secure Workshop Workspace**.
          </div>
        </div>

        {/* COLUMN 1: PENDING AWAITING ACTION QUEUE */}
        <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9d2706', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              📥 Awaiting Confirmation ({pendingJobs.length})
            </h2>
            <span style={{ fontSize: '0.68rem', color: '#4B5563', background: 'rgba(157, 39, 6, 0.05)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(157, 39, 6, 0.15)', fontWeight: 600 }}>
              12-Hour SLA Time Limit
            </span>
          </div>

          {pendingJobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#7f7f7f', fontSize: '0.8rem', border: '1px dashed #cccccc', borderRadius: '12px' }}>
              No new orders assigned to your workshop. Check back later!
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
              {pendingJobs.map(job => {
                const assignedAt = job.assigned_at ? new Date(job.assigned_at) : new Date(job.created_at);
                const expiryTime = new Date(assignedAt.getTime() + 12 * 60 * 60 * 1000);
                const diffMs = expiryTime - now;
                const hoursLeft = Math.max(0, Math.floor(diffMs / (60 * 60 * 1000)));
                const minutesLeft = Math.max(0, Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000)));
                const secondsLeft = Math.max(0, Math.floor((diffMs % (60 * 1000)) / 1000));
                const isOverdue = diffMs <= 0;

                return (
                  <div key={job.id} style={{ background: '#F7F5F2', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between', position: 'relative', overflow: 'hidden' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0A0A0A' }}>Ref: {job.order_number}</span>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: isOverdue ? '#fee2e2' : 'rgba(239, 68, 68, 0.05)',
                        color: '#ef4444',
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

                    {(job.priority === 'rush' || job.priority === 'express') && (
                      <div style={{
                        background: 'rgba(239, 68, 68, 0.05)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
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

                    <div style={{ background: 'rgba(157, 39, 6, 0.04)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(157, 39, 6, 0.18)', fontSize: '0.68rem', color: '#9d2706', marginBottom: '14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <ShieldCheck size={18} style={{ flexShrink: 0 }} />
                      <span>🔒 Detailed tech specs, custom measurements, and customer profiles unlock instantly upon accepting.</span>
                    </div>

                    {job.items?.map((item, itemIdx) => (
                      item.images && item.images.length > 0 && (
                        <div key={itemIdx} style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '12px', scrollbarWidth: 'thin' }}>
                          {item.images.map((imgUrl, imgIdx) => (
                            <div key={imgIdx} style={{ flexShrink: 0, width: '100px', height: '75px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e5e7eb', background: '#fff', position: 'relative' }}>
                              <img src={imgUrl} alt={`${item.name} Angle ${imgIdx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                                color: 'rgba(157, 39, 6, 0.18)',
                                letterSpacing: '0.08em',
                                whiteSpace: 'nowrap',
                                textTransform: 'uppercase',
                                width: '100%'
                              }}>
                                Cobblyn ATELIER
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    ))}

                    <div style={{ borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', padding: '12px 0', marginBottom: '16px', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {job.tech_pack?.material_specs?.map((spec, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#2A2826' }}><strong>{spec.item_name}</strong> (Qty: {spec.quantity})</span>
                          <span style={{ color: '#4B5563' }}>Size {spec.size} · {spec.material} · {spec.color}</span>
                        </div>
                      ))}
                      {job.tech_pack?.special_instructions && (
                        <div style={{ background: 'rgba(157, 39, 6, 0.04)', padding: '8px', borderRadius: '6px', fontSize: '0.68rem', color: '#2A2826', borderLeft: '2px solid #9d2706', marginTop: '4px' }}>
                          <strong>Notes:</strong> {job.tech_pack.special_instructions}
                        </div>
                      )}
                    </div>

                    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pre-Acceptance Verification Gate</span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', color: '#2A2826', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={gates[job.id]?.materials || false} 
                          onChange={() => toggleGate(job.id, 'materials')}
                          style={{ accentColor: '#9d2706', cursor: 'pointer' }}
                        />
                        <span>Confirm raw material & leather availability in workshop</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', color: '#2A2826', cursor: 'pointer' }}>
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
                          color: isGatePassed(job.id) ? '#fff' : '#9ca3af',
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
                          background: '#fee2e2',
                          border: '1px solid #fca5a5',
                          borderRadius: '6px',
                          color: '#ef4444',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: isOverdue ? 'not-allowed' : 'pointer',
                          opacity: isOverdue ? 0.3 : 1
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
        <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9d2706', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              🛠️ Active Work in Progress ({activeJobs.length})
            </h2>
          </div>

          {activeJobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#7f7f7f', fontSize: '0.8rem', border: '1px dashed #cccccc', borderRadius: '12px' }}>
              No active crafting jobs. Acknowledge pending orders to commence production!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeJobs.map(job => {
                const action = getStageAction(job.current_stage);

                return (
                  <div key={job.id} style={{ background: '#F7F5F2', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                      <div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0A0A0A' }}>Order #{job.order_number}</span>
                        {(job.priority === 'rush' || job.priority === 'express') && (
                          <span style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
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
                        <span style={{ fontSize: '0.72rem', color: '#4B5563', marginLeft: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <User size={12} color="#6B7280" />
                          Customer: <strong style={{ color: job.current_stage === 'ready_to_ship' || job.current_stage === 'delivered' ? '#9d2706' : '#4B5563' }}>{job.customer_name}</strong>
                          {!(job.current_stage === 'ready_to_ship' || job.current_stage === 'delivered') && (
                            <span style={{ color: '#9d2706', fontSize: '0.62rem', background: 'rgba(157,39,6,0.05)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(157,39,6,0.15)', marginLeft: '6px' }}>
                              🔒 Info Locked until Dispatch
                            </span>
                          )}
                        </span>
                      </div>
                      <span style={{
                        background: 'rgba(157, 39, 6, 0.1)',
                        color: '#9d2706',
                        border: '1px solid rgba(157, 39, 6, 0.2)',
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

                    {(job.current_stage === 'ready_to_ship' || job.current_stage === 'delivered') && job.shipping_address && Object.keys(job.shipping_address).length > 0 && (
                      <div style={{ background: '#F9FAFB', padding: '14px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', fontWeight: 700, color: '#9d2706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          <MapPin size={13} /> Dispatch & Shipping Coordinates
                        </span>
                        <div style={{ color: '#2A2826', paddingLeft: '20px' }}>
                          <div><strong>Recipient:</strong> {job.customer_name}</div>
                          <div><strong>Email:</strong> {job.customer_email}</div>
                          <div><strong>Address:</strong> {job.shipping_address.street || job.shipping_address.address || ''}, {job.shipping_address.city || ''}, {job.shipping_address.state || ''} - {job.shipping_address.zip_code || job.shipping_address.pincode || ''}, {job.shipping_address.country || 'India'}</div>
                        </div>
                      </div>
                    )}

                    <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      {job.items?.map((item, itemIdx) => (
                        item.images && item.images.length > 0 && (
                          <div key={itemIdx} style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '12px', scrollbarWidth: 'thin' }}>
                            {item.images.map((imgUrl, imgIdx) => (
                              <div key={imgIdx} style={{ flexShrink: 0, width: '100px', height: '75px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e5e7eb', background: '#fff', position: 'relative' }}>
                                <img src={imgUrl} alt={`${item.name} Angle ${imgIdx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                                  color: 'rgba(157, 39, 6, 0.18)',
                                  letterSpacing: '0.08em',
                                  whiteSpace: 'nowrap',
                                  textTransform: 'uppercase',
                                  width: '100%'
                                }}>
                                  Cobblyn ATELIER
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      ))}

                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Bespoke Crafting Specs</span>
                      {job.tech_pack?.material_specs?.map((spec, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', borderBottom: idx < job.tech_pack.material_specs.length - 1 ? '1px solid #e5e7eb' : 'none', padding: '6px 0', fontSize: '0.75rem' }}>
                          <span style={{ color: '#0A0A0A', fontWeight: 700 }}>{spec.item_name} (Size {spec.size})</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', color: '#2A2826' }}>
                            <span>Material: <strong>{spec.material}</strong></span>
                            <span>Leather Color: <strong>{spec.color}</strong></span>
                            <span>Quantity: <strong>{spec.quantity} pair(s)</strong></span>
                          </div>
                        </div>
                      ))}
                      {job.tech_pack?.special_instructions && (
                        <div style={{ marginTop: '8px', borderTop: '1px dashed #e5e7eb', paddingTop: '8px', fontSize: '0.72rem', color: '#4B5563' }}>
                          <strong>Artisan Note:</strong> {job.tech_pack.special_instructions}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', padding: '16px 0' }}>
                      {job.stages?.map((stage, idx) => {
                        const isCompleted = stage.status === 'completed';
                        const isActive = job.current_stage === stage.name;
                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: isCompleted || isActive ? 1 : 0.35 }}>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              background: isCompleted ? '#9d2706' : isActive ? '#E8E5E0' : 'transparent',
                              border: `2px solid ${isCompleted || isActive ? '#9d2706' : '#78716c'}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.55rem',
                              fontWeight: 700,
                              color: isCompleted ? '#fff' : isActive ? '#000' : '#78716c'
                            }}>
                              {isCompleted ? '✓' : idx + 1}
                            </div>
                            <span style={{ fontSize: '0.62rem', fontWeight: isActive ? 700 : 500, color: isActive ? '#9d2706' : '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {stage.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {action ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.62rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Add Process Notes (Optional)</label>
                          <input 
                            type="text" 
                            placeholder="Add leather batch ref, quality logs, or operational updates..."
                            value={notesText[job.id] || ''}
                            onChange={(e) => setNotesText(prev => ({ ...prev, [job.id]: e.target.value }))}
                            style={{ width: '100%', padding: '8px 12px', background: '#fff', border: '1px solid #d1d5db', color: '#0A0A0A', fontSize: '0.75rem', outline: 'none' }}
                          />
                        </div>
                        <button 
                           onClick={() => handleAdvanceStage(job.id, job.current_stage)}
                           style={{
                             padding: '12px 18px',
                             background: '#9d2706',
                             border: 'none',
                             borderRadius: '6px',
                             color: '#fff',
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
                      <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#4B5563', fontStyle: 'italic' }}>
                        All craftsman stages complete. Awaiting dispatch clearance.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 🔐 SECURE WORKSPACE AREA */}
        <section style={{ background: '#fff', border: '1px solid #d1d5db', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', marginTop: '24px' }}>
          <div style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0A0A0A', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Lock size={18} color="#9d2706" /> Secure Workshop Workspace
            </h2>
            {isSecureLoggedIn && (
              <button 
                onClick={handleSecureLogout}
                style={{ padding: '6px 12px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#ef4444', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <LogOut size={12} /> Log Out
              </button>
            )}
          </div>

          {!isSecureLoggedIn ? (
            /* SECURE LOGIN PAGE FOR WORKSHOPS */
            <div style={{ maxWidth: '460px', margin: '0 auto', padding: '16px 0' }}>
              <p style={{ fontSize: '0.78rem', color: '#4B5563', textAlign: 'center', lineHeight: '1.6', marginBottom: '20px' }}>
                Access credentials are required to view completed invoices, payments clearance ledgers, rejection logs, and update profiles.
              </p>

              {loginErrorMsg && (
                <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#ef4444', padding: '12px', borderRadius: '8px', fontSize: '0.75rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={16} />
                  <span>{loginErrorMsg}</span>
                </div>
              )}

              {resetSuccessMsg && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '12px', borderRadius: '8px', fontSize: '0.75rem', marginBottom: '16px' }}>
                  {resetSuccessMsg}
                </div>
              )}

              {!showResetForm ? (
                /* Standard Phone/Email Login Form */
                <form onSubmit={handleSecureLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#4B5563', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>Workshop Mobile Number or Email</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. +91 98290 12345 or rajesh@jaipurheritage.com"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.8rem', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#4B5563', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>PIN Code or Password</label>
                    <input 
                      type="password"
                      required
                      placeholder="Enter 4-6 digit PIN or secret password"
                      value={loginSecret}
                      onChange={(e) => setLoginSecret(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.8rem', outline: 'none' }}
                    />
                  </div>
                  <button 
                    type="submit"
                    style={{ padding: '12px', background: '#0A0A0A', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', transition: 'all 0.2s', marginTop: '10px' }}
                  >
                    🔐 Unlock Secure Workspace
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setShowResetForm(true); setLoginErrorMsg(''); }}
                    style={{ background: 'none', border: 'none', color: '#9d2706', fontSize: '0.72rem', textDecoration: 'underline', cursor: 'pointer', textAlign: 'center', marginTop: '4px' }}
                  >
                    Setup credentials / Reset PIN or Password
                  </button>
                </form>
              ) : (
                /* Reset credentials Form using URL Token Verification */
                <form onSubmit={handleResetSecurity} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ background: 'rgba(157, 39, 6, 0.05)', border: '1px solid rgba(157, 39, 6, 0.15)', padding: '12px', borderRadius: '8px', fontSize: '0.7rem', color: '#9d2706', lineHeight: '1.5' }}>
                    💡 <strong>Self-Service Auth Setup:</strong> Your magic token link provides ownership. You can instantly configure a PIN (used for mobile login) or Password here.
                  </div>
                  {resetErrorMsg && (
                    <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#ef4444', padding: '10px', borderRadius: '6px', fontSize: '0.72rem' }}>
                      {resetErrorMsg}
                    </div>
                  )}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#4B5563', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>Configure Secure Password</label>
                    <input 
                      type="password"
                      placeholder="Enter new password (optional)"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.8rem', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#4B5563', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>Configure 4-Digit Login PIN</label>
                    <input 
                      type="password"
                      maxLength={6}
                      placeholder="e.g. 1234 (optional)"
                      value={resetPin}
                      onChange={(e) => setResetPin(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.8rem', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button 
                      type="button" 
                      onClick={() => setShowResetForm(false)}
                      style={{ flex: 1, padding: '10px', background: '#F7F5F2', border: '1px solid #d1d5db', borderRadius: '6px', color: '#4B5563', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Back to Login
                    </button>
                    <button 
                      type="submit"
                      style={{ flex: 2, padding: '10px', background: '#9d2706', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}
                    >
                      Save Credentials
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* AUTHENTICATED WORKSPACE CONTAINER */
            <div>
              {/* Workspace Navigation Tabs */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', marginBottom: '24px' }}>
                {[
                  { id: 'ledger', label: '📊 Financial Ledger', icon: <ClipboardList size={14} /> },
                  { id: 'history', label: '💬 Completed & Feedback', icon: <Star size={14} /> },
                  { id: 'declines', label: '🚫 Rejection Archives', icon: <AlertTriangle size={14} /> },
                  { id: 'settings', label: '⚙️ Workshop Settings', icon: <Settings size={14} /> }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSecureTab(tab.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: activeSecureTab === tab.id ? '#9d2706' : '#d1d5db',
                      background: activeSecureTab === tab.id ? '#9d2706' : '#fff',
                      color: activeSecureTab === tab.id ? '#fff' : '#4B5563',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB CONTENT: LEDGER */}
              {activeSecureTab === 'ledger' && (
                <div>
                  {/* Ledger Summary Stats Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: '#F7F5F2', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                      <span style={{ fontSize: '0.62rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Total Earned</span>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0A0A0A', margin: '4px 0' }}>INR {secureLedger.total_due?.toFixed(2)}</h3>
                    </div>
                    <div style={{ background: '#F7F5F2', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                      <span style={{ fontSize: '0.62rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Cleared/Paid</span>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a', margin: '4px 0' }}>INR {secureLedger.total_paid?.toFixed(2)}</h3>
                    </div>
                    <div style={{ background: '#F7F5F2', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                      <span style={{ fontSize: '0.62rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Outstanding Balance</span>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#9d2706', margin: '4px 0' }}>INR {secureLedger.balance_outstanding?.toFixed(2)}</h3>
                    </div>
                  </div>

                  {/* DATE RANGE REPORT GENERATOR */}
                  <div style={{ background: '#fff', border: '1px solid #d1d5db', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '16px' }}>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <label style={{ display: 'block', fontSize: '0.62rem', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Start Date</label>
                      <input 
                        type="date" 
                        value={pdfStartDate}
                        onChange={(e) => setPdfStartDate(e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.75rem', outline: 'none' }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <label style={{ display: 'block', fontSize: '0.62rem', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>End Date</label>
                      <input 
                        type="date" 
                        value={pdfEndDate}
                        onChange={(e) => setPdfEndDate(e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.75rem', outline: 'none' }}
                      />
                    </div>
                    <button 
                      onClick={handleGeneratePdfReport}
                      style={{ padding: '10px 16px', background: '#9d2706', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                    >
                      <Download size={14} /> Download PDF Invoice Report
                    </button>
                  </div>

                  {/* Ledger Table */}
                  <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '12px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', background: '#fff' }}>
                      <thead>
                        <tr style={{ background: '#F7F5F2', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                          <th style={{ padding: '12px' }}>Date Registered</th>
                          <th style={{ padding: '12px' }}>Order Number</th>
                          <th style={{ padding: '12px' }}>Amount Due</th>
                          <th style={{ padding: '12px' }}>Amount Cleared</th>
                          <th style={{ padding: '12px' }}>Payment Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {secureLedger.ledger.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#6B7280' }}>No billing ledgers found.</td>
                          </tr>
                        ) : (
                          secureLedger.ledger.map(entry => (
                            <tr key={entry.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <td style={{ padding: '12px' }}>{new Date(entry.created_at).toLocaleDateString()}</td>
                              <td style={{ padding: '12px', fontWeight: 700 }}>{entry.order_number}</td>
                              <td style={{ padding: '12px' }}>INR {entry.amount_due?.toFixed(2)}</td>
                              <td style={{ padding: '12px' }}>INR {entry.amount_paid?.toFixed(2)}</td>
                              <td style={{ padding: '12px' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.62rem',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  background: entry.payment_status === 'settled' ? '#dcfce7' : entry.payment_status === 'partially_paid' ? '#fef9c3' : '#fee2e2',
                                  color: entry.payment_status === 'settled' ? '#16a34a' : entry.payment_status === 'partially_paid' ? '#ca8a04' : '#ef4444'
                                }}>
                                  {entry.payment_status || 'PENDING'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: COMPLETED & RATINGS */}
              {activeSecureTab === 'history' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                  {secureJobs.completed_jobs.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#6B7280', background: '#F7F5F2', borderRadius: '12px', border: '1px dashed #cccccc' }}>
                      No completed shoe crafting jobs in history.
                    </div>
                  ) : (
                    secureJobs.completed_jobs.map(job => (
                      <div key={job.id} style={{ background: '#F7F5F2', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800 }}>Order #{job.order_number}</span>
                          <span style={{ fontSize: '0.65rem', color: '#6B7280' }}>Completed: {new Date(job.completed_at).toLocaleDateString()}</span>
                        </div>

                        {/* Customer Feedback Rating Display */}
                        {job.rating ? (
                          <div style={{ background: '#fff', border: '1px solid #e5e7eb', padding: '10px', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                              {[1, 2, 3, 4, 5].map(starNum => (
                                <Star 
                                  key={starNum} 
                                  size={13} 
                                  fill={starNum <= job.rating ? '#ca8a04' : 'none'} 
                                  color="#ca8a04" 
                                />
                              ))}
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, marginLeft: '6px', color: '#ca8a04' }}>{job.rating} / 5</span>
                            </div>
                            {job.feedback_comment && (
                              <p style={{ fontSize: '0.7rem', color: '#4B5563', margin: 0, fontStyle: 'italic' }}>
                                "{job.feedback_comment}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <div style={{ background: 'rgba(0,0,0,0.02)', padding: '8px', borderRadius: '6px', fontSize: '0.68rem', color: '#6B7280', textAlign: 'center' }}>
                            No feedback rating logged for this delivery.
                          </div>
                        )}

                        <div style={{ borderTop: '1px dashed #d1d5db', paddingTop: '8px', fontSize: '0.7rem', color: '#4B5563' }}>
                          <span>Customer: <strong>{job.customer_name}</strong> ({job.customer_email})</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB CONTENT: DECLINES */}
              {activeSecureTab === 'declines' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {secureJobs.declined_jobs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280', background: '#F7F5F2', borderRadius: '12px', border: '1px dashed #cccccc' }}>
                      No declined assignments logged in history.
                    </div>
                  ) : (
                    secureJobs.declined_jobs.map(job => (
                      <div key={job.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fee2e2', padding: '12px 16px', borderRadius: '8px', fontSize: '0.75rem', border: '1px solid #fca5a5' }}>
                        <div>
                          <strong style={{ color: '#ef4444' }}>Declined Order #{job.order_number}</strong>
                          <div style={{ fontSize: '0.68rem', color: '#ef4444', marginTop: '2px' }}>{job.reason}</div>
                        </div>
                        <span style={{ fontSize: '0.65rem', color: '#b91c1c' }}>Date: {new Date(job.declined_at).toLocaleDateString()}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB CONTENT: SETTINGS */}
              {activeSecureTab === 'settings' && (
                <div style={{ maxWidth: '600px' }}>
                  {profileSuccessMsg && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '12px', borderRadius: '8px', fontSize: '0.75rem', marginBottom: '16px' }}>
                      {profileSuccessMsg}
                    </div>
                  )}

                  <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: '#4B5563', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>Contact Person Name</label>
                        <input 
                          type="text" 
                          required
                          value={editContact}
                          onChange={(e) => setEditContact(e.target.value)}
                          style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.8rem', outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: '#4B5563', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>WhatsApp/Login Phone Number</label>
                        <input 
                          type="text" 
                          required
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.8rem', outline: 'none' }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: '#4B5563', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>Workshop Email Address</label>
                      <input 
                        type="email" 
                        required
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.8rem', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: '#4B5563', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>Physical Workshop/Factory Address</label>
                      <textarea 
                        required
                        rows={3}
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        placeholder="Provide details about your factory coordinates..."
                        style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', resize: 'none' }}
                      />
                    </div>
                    <button 
                      type="submit"
                      style={{ padding: '12px', background: '#9d2706', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', alignSelf: 'flex-start' }}
                    >
                      Save Workshop Profile
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* REJECTION MODAL */}
      {showRejectModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ maxWidth: '460px', width: '100%', background: '#fff', border: '1px solid #fca5a5', borderRadius: '16px', padding: '24px', color: '#0A0A0A', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0' }}>
              <AlertTriangle size={18} /> Decline Crafting Assignment
            </h3>
            
            <p style={{ fontSize: '0.75rem', color: '#4B5563', lineHeight: '1.6', marginBottom: '20px' }}>
              ⚠️ Declining will immediately remove this order from your portal queue and revert it back to the Cobblyn in-house production line.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.62rem', color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Rejection Reason</label>
              {[
                'At Maximum Capacity',
                'Raw Materials / Leather Out of Stock',
                'Outsole Mold/Size Last Unavailable',
                'Other / Custom Reason'
              ].map((reasonOption) => (
                <label key={reasonOption} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', color: '#0A0A0A', cursor: 'pointer', background: rejectReason === reasonOption ? '#fee2e2' : '#F7F5F2', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${rejectReason === reasonOption ? '#ef4444' : '#e5e7eb'}`, transition: 'all 0.2s' }}>
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
                <label style={{ display: 'block', fontSize: '0.62rem', color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Provide Additional Details</label>
                <textarea 
                  placeholder="Explain the specific bottleneck or reason for declining..."
                  value={rejectDetails}
                  onChange={(e) => setRejectDetails(e.target.value)}
                  style={{ width: '100%', height: '80px', padding: '10px', background: '#fff', border: '1px solid #d1d5db', color: '#0A0A0A', fontSize: '0.75rem', outline: 'none', resize: 'none' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => { setShowRejectModal(false); setRejectJobId(null); }}
                style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#4B5563', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}
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
