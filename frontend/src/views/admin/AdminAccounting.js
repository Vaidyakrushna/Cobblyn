"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, Coins, Users, Wallet, CreditCard, 
  Plus, Trash2, X, Download, Calendar, ArrowUpRight, ArrowDownRight, Layers, LogOut, CheckCircle
} from 'lucide-react';
import { api } from '../../api';

function AdminAccounting() {
  const [activeTab, setActiveTab] = useState('summary'); // summary, directory, payroll, expenses, exits
  
  // Data States
  const [summary, setSummary] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Date Range Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Modals & Form States
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    name: '', email: '', phone: '', role: '', salary: '', join_date: '',
    bank_name: '', account_no: '', ifsc_code: ''
  });
  
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    item_name: '', expense_type: 'material_procurement', amount: '', gst_rate: '18', quantity: '1', supplier: '', invoice_ref: '', expense_date: '', material_id: ''
  });

  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [payrollForm, setPayrollForm] = useState({ month: '' });

  const [showExitModal, setShowExitModal] = useState(false);
  const [selectedExitEmployee, setSelectedExitEmployee] = useState(null);
  const [exitForm, setExitForm] = useState({
    exit_date: '', fnf_amount: '0', notes: ''
  });

  // Fetch data functions
  const fetchSummary = useCallback(async () => {
    try {
      let queryParams = '';
      if (startDate && endDate) {
        queryParams = `?start_date=${startDate}&end_date=${endDate}`;
      } else if (startDate) {
        queryParams = `?start_date=${startDate}`;
      } else if (endDate) {
        queryParams = `?end_date=${endDate}`;
      }
      const data = await api.request(`/admin/accounting/summary${queryParams}`);
      setSummary(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load financial summary');
    }
  }, [startDate, endDate]);

  const fetchEmployeesData = useCallback(async () => {
    try {
      const empData = await api.request('/admin/accounting/employees');
      setEmployees(empData.employees || []);
      const payData = await api.request('/admin/accounting/payroll');
      setPayrollHistory(payData.payroll_history || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchExpensesData = useCallback(async () => {
    try {
      const data = await api.request('/admin/accounting/expenses');
      setExpenses(data.expenses || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchRawMaterials = useCallback(async () => {
    try {
      const data = await api.request('/admin/raw-materials');
      setRawMaterials(data.materials || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchSummary(), 
      fetchEmployeesData(), 
      fetchExpensesData(),
      fetchRawMaterials()
    ]);
    setLoading(false);
  }, [fetchSummary, fetchEmployeesData, fetchExpensesData, fetchRawMaterials]);

  useEffect(() => {
    loadAllData();
  }, [startDate, endDate]);

  // Create Employee
  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    try {
      await api.request('/admin/accounting/employees', {
        method: 'POST',
        body: JSON.stringify({
          ...employeeForm,
          salary: parseFloat(employeeForm.salary)
        })
      });
      setShowEmployeeModal(false);
      setEmployeeForm({
        name: '', email: '', phone: '', role: '', salary: '', join_date: '',
        bank_name: '', account_no: '', ifsc_code: ''
      });
      fetchEmployeesData();
      fetchSummary();
    } catch (err) {
      alert("Failed to add employee: " + err.message);
    }
  };

  // Delete/Remove Employee Record
  const handleDeleteEmployee = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee record permanently from the database?")) return;
    try {
      await api.request(`/admin/accounting/employees/${id}`, { method: 'DELETE' });
      fetchEmployeesData();
      fetchSummary();
    } catch (err) {
      alert("Failed to remove employee record: " + err.message);
    }
  };

  // Settle Exit & FNF
  const handleOpenExitModal = (employee) => {
    setSelectedExitEmployee(employee);
    setExitForm({ exit_date: new Date().toISOString().split('T')[0], fnf_amount: '0', notes: '' });
    setShowExitModal(true);
  };

  const handleSettleExit = async (e) => {
    e.preventDefault();
    if (!selectedExitEmployee) return;
    try {
      const res = await api.request(`/admin/accounting/employees/${selectedExitEmployee.id}/exit`, {
        method: 'POST',
        body: JSON.stringify({
          exit_date: exitForm.exit_date,
          fnf_amount: parseFloat(exitForm.fnf_amount || '0'),
          notes: exitForm.notes
        })
      });
      alert(res.message);
      setShowExitModal(false);
      setSelectedExitEmployee(null);
      fetchEmployeesData();
      fetchExpensesData();
      fetchSummary();
    } catch (err) {
      alert("Failed to finalize exit settlement: " + err.message);
    }
  };

  // Create Expense & Procurement with stock increment sync
  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      await api.request('/admin/accounting/expenses', {
        method: 'POST',
        body: JSON.stringify({
          ...expenseForm,
          amount: parseFloat(expenseForm.amount),
          gst_rate: parseFloat(expenseForm.gst_rate || '18'),
          quantity: parseFloat(expenseForm.quantity || '1'),
          material_id: expenseForm.material_id || null
        })
      });
      setShowExpenseModal(false);
      setExpenseForm({
        item_name: '', expense_type: 'material_procurement', amount: '', gst_rate: '18', quantity: '1', supplier: '', invoice_ref: '', expense_date: '', material_id: ''
      });
      fetchExpensesData();
      fetchSummary();
    } catch (err) {
      alert("Failed to log expense: " + err.message);
    }
  };

  // Disburse Payroll for active staff only
  const handleDisbursePayroll = async (e) => {
    e.preventDefault();
    try {
      const res = await api.request('/admin/accounting/payroll/disburse', {
        method: 'POST',
        body: JSON.stringify(payrollForm)
      });
      alert(res.message);
      setShowPayrollModal(false);
      setPayrollForm({ month: '' });
      fetchEmployeesData();
      fetchSummary();
    } catch (err) {
      alert("Failed to disburse payroll: " + err.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="admin-loading">Loading financial systems…</div>;

  return (
    <div className="admin-page" data-testid="admin-accounting-page" style={{ padding: '24px', background: '#F7F5F2', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', color: '#1c1917', margin: 0 }}>Accounting, Tax & Payroll</h1>
          <p style={{ fontSize: '0.85rem', color: '#78716c', margin: '4px 0 0 0' }}>Manage internal staff directory, disburse active salaries, track vendor payouts, procurement tax and net profits</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={handlePrint}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #e7e5e4', padding: '8px 16px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, color: '#44403c', cursor: 'pointer' }}
          >
            <Download size={14} /> Export / Print Financial Statement
          </button>
        </div>
      </div>

      {/* Range Filters */}
      <div style={{ background: '#fff', border: '1px solid #e7e5e4', padding: '16px', borderRadius: '12px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={14} style={{ color: '#78716c' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#44403c' }}>Filter Statements:</span>
        </div>
        <input 
          type="date" 
          value={startDate} 
          onChange={e => setStartDate(e.target.value)} 
          style={{ padding: '6px 12px', border: '1px solid #e7e5e4', borderRadius: '6px', fontSize: '0.78rem' }} 
        />
        <span style={{ fontSize: '0.78rem', color: '#a8a29e' }}>to</span>
        <input 
          type="date" 
          value={endDate} 
          onChange={e => setEndDate(e.target.value)} 
          style={{ padding: '6px 12px', border: '1px solid #e7e5e4', borderRadius: '6px', fontSize: '0.78rem' }} 
        />
        {(startDate || endDate) && (
          <button 
            onClick={() => { setStartDate(''); setEndDate(''); }}
            style={{ background: 'transparent', border: 'none', color: '#9d2706', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Main Tab Links */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e7e5e4', marginBottom: '24px', flexWrap: 'wrap', gap: '8px' }}>
        <button 
          onClick={() => setActiveTab('summary')}
          style={{ padding: '12px 18px', background: 'transparent', border: 'none', borderBottom: activeTab === 'summary' ? '3px solid #9d2706' : 'none', color: activeTab === 'summary' ? '#9d2706' : '#78716c', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
        >
          📊 Financial Summary & Cost Centers
        </button>
        <button 
          onClick={() => setActiveTab('directory')}
          style={{ padding: '12px 18px', background: 'transparent', border: 'none', borderBottom: activeTab === 'directory' ? '3px solid #9d2706' : 'none', color: activeTab === 'directory' ? '#9d2706' : '#78716c', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
        >
          👥 Staff Directory (HR)
        </button>
        <button 
          onClick={() => setActiveTab('payroll')}
          style={{ padding: '12px 18px', background: 'transparent', border: 'none', borderBottom: activeTab === 'payroll' ? '3px solid #9d2706' : 'none', color: activeTab === 'payroll' ? '#9d2706' : '#78716c', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
        >
          💸 Monthly Payroll
        </button>
        <button 
          onClick={() => setActiveTab('expenses')}
          style={{ padding: '12px 18px', background: 'transparent', border: 'none', borderBottom: activeTab === 'expenses' ? '3px solid #9d2706' : 'none', color: activeTab === 'expenses' ? '#9d2706' : '#78716c', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
        >
          📦 Procurement & Expenses
        </button>
        <button 
          onClick={() => setActiveTab('exits')}
          style={{ padding: '12px 18px', background: 'transparent', border: 'none', borderBottom: activeTab === 'exits' ? '3px solid #9d2706' : 'none', color: activeTab === 'exits' ? '#9d2706' : '#78716c', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
        >
          💼 Exited & FnF Settlements
        </button>
      </div>

      {/* --- SUMMARY TAB --- */}
      {activeTab === 'summary' && summary && (
        <div>
          {/* Main summary cards deck */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: '#fff', border: '1px solid #e7e5e4', padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: '#78716c', fontWeight: 600, textTransform: 'uppercase' }}>Gross Sales Revenue</span>
                <span style={{ color: '#16a34a', background: '#f0fdf4', padding: '4px', borderRadius: '50%' }}><TrendingUp size={16} /></span>
              </div>
              <strong style={{ fontSize: '1.4rem', color: '#1c1917' }}>INR {summary.sales.total_sales.toLocaleString('en-IN')}</strong>
              <div style={{ fontSize: '0.65rem', color: '#a8a29e', marginTop: '4px' }}>Sales base + dynamic taxes</div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e7e5e4', padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: '#78716c', fontWeight: 600, textTransform: 'uppercase' }}>Net Tax Liability</span>
                <span style={{ color: '#ca8a04', background: '#fffbeb', padding: '4px', borderRadius: '50%' }}><Coins size={16} /></span>
              </div>
              <strong style={{ fontSize: '1.4rem', color: summary.gst_ledger.net_gst_payable >= 0 ? '#ca8a04' : '#16a34a' }}>
                INR {summary.gst_ledger.net_gst_payable.toLocaleString('en-IN')}
              </strong>
              <div style={{ fontSize: '0.65rem', color: '#78716c', marginTop: '4px' }}>
                {summary.gst_ledger.has_credit ? "✓ Excess Input Tax Credit" : "Tax payable to government"}
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e7e5e4', padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: '#78716c', fontWeight: 600, textTransform: 'uppercase' }}>External Vendor Payouts</span>
                <span style={{ color: '#ef4444', background: '#fef2f2', padding: '4px', borderRadius: '50%' }}><Wallet size={16} /></span>
              </div>
              <strong style={{ fontSize: '1.4rem', color: '#dc2626' }}>INR {summary.vendor_payouts.total_paid.toLocaleString('en-IN')}</strong>
              <div style={{ fontSize: '0.65rem', color: '#78716c', marginTop: '4px' }}>Outstanding Due: INR {summary.vendor_payouts.outstanding.toLocaleString()}</div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e7e5e4', padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: '#78716c', fontWeight: 600, textTransform: 'uppercase' }}>Operating Net Profit</span>
                <span style={{ color: '#16a34a', background: '#f0fdf4', padding: '4px', borderRadius: '50%' }}><TrendingUp size={16} /></span>
              </div>
              <strong style={{ fontSize: '1.4rem', color: summary.net_profit >= 0 ? '#16a34a' : '#dc2626' }}>
                INR {summary.net_profit.toLocaleString('en-IN')}
              </strong>
              <div style={{ fontSize: '0.65rem', color: '#a8a29e', marginTop: '4px' }}>Sales minus all outflows</div>
            </div>
          </div>

          {/* Cost center and GST split details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {/* GST ITC Split Card */}
            <div style={{ background: '#fff', border: '1px solid #e7e5e4', padding: '20px', borderRadius: '12px' }}>
              <h4 style={{ margin: '0 0 16px 0', borderBottom: '1px solid #e7e5e4', paddingBottom: '8px', fontSize: '0.8rem', color: '#1c1917', textTransform: 'uppercase', letterSpacing: '0.05em' }}>GST Tax Ledger (Input Credit)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f4', paddingBottom: '6px' }}>
                  <span style={{ color: '#78716c' }}>Output GST Collected (Customer Sales)</span>
                  <strong style={{ color: '#1c1917' }}>+ INR {summary.gst_ledger.output_gst.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f4', paddingBottom: '6px' }}>
                  <span style={{ color: '#78716c' }}>Input GST Paid (Material Purchases)</span>
                  <span style={{ color: '#dc2626' }}>- INR {summary.gst_ledger.input_gst_procurement.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f4', paddingBottom: '6px' }}>
                  <span style={{ color: '#78716c' }}>Input GST Paid (Vendor Workshop Jobs)</span>
                  <span style={{ color: '#dc2626' }}>- INR {summary.gst_ledger.input_gst_vendors.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f4', paddingBottom: '6px', fontWeight: 600 }}>
                  <span style={{ color: '#78716c' }}>Total Input Tax Credit (ITC)</span>
                  <span style={{ color: '#16a34a' }}>INR {summary.gst_ledger.total_input_gst.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, paddingTop: '4px' }}>
                  <span style={{ color: '#1c1917' }}>Net Tax Liability / (ITC Balance)</span>
                  <span style={{ color: summary.gst_ledger.net_gst_payable >= 0 ? '#ca8a04' : '#16a34a' }}>
                    INR {summary.gst_ledger.net_gst_payable.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* In-house vs Outsourced Cost Centers */}
            <div style={{ background: '#fff', border: '1px solid #e7e5e4', padding: '20px', borderRadius: '12px' }}>
              <h4 style={{ margin: '0 0 16px 0', borderBottom: '1px solid #e7e5e4', paddingBottom: '8px', fontSize: '0.8rem', color: '#1c1917', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Production Cost Centers</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f4', paddingBottom: '6px' }}>
                  <span style={{ color: '#78716c' }}>In-house Factory Costs (Staff salaries + Leather/Procurement)</span>
                  <strong style={{ color: '#1c1917' }}>INR {summary.cost_centers.internal_factory.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f4', paddingBottom: '6px' }}>
                  <span style={{ color: '#78716c' }}>Outsourced Artisan Workshop Costs (Vendor bills paid)</span>
                  <strong style={{ color: '#1c1917' }}>INR {summary.cost_centers.external_vendors.toLocaleString()}</strong>
                </div>
                
                <div style={{ padding: '10px', background: '#fafaf9', borderLeft: '3px solid #9d2706', borderRadius: '0 8px 8px 0', fontSize: '0.7rem', color: '#78716c', lineHeight: '1.4', marginTop: '10px' }}>
                  💡 **Cost Allocation Note:** Split metrics help you identify where to deploy capital. If your in-house factory cost center increases, evaluate bulk raw materials purchases to claim higher Input Tax Credit offset benefits.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- STAFF DIRECTORY TAB --- */}
      {activeTab === 'directory' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#1c1917', margin: 0 }}>Registered Employees</h3>
            <button 
              onClick={() => setShowEmployeeModal(true)}
              style={{ background: '#9d2706', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} /> Add New Employee
            </button>
          </div>

          <div className="admin-table-wrapper" style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: '12px', padding: '8px' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e7e5e4' }}>
                  <th style={{ padding: '12px' }}>Employee ID & Name</th>
                  <th style={{ padding: '12px' }}>Designation / Role</th>
                  <th style={{ padding: '12px' }}>Monthly Salary</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px' }}>Bank Account Details</th>
                  <th style={{ padding: '12px' }}>Joining Date</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.filter(e => e.status === 'active').length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#a8a29e', fontSize: '0.78rem' }}>No active employees found in the directory.</td>
                  </tr>
                ) : (
                  employees.filter(e => e.status === 'active').map(emp => (
                    <tr key={emp.id} style={{ borderBottom: '1px solid #f5f5f4' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#9d2706', fontWeight: 700 }}>{emp.employee_id || 'PENDING'}</div>
                        <strong style={{ fontSize: '0.82rem', color: '#1c1917' }}>{emp.name}</strong>
                        <div style={{ fontSize: '0.7rem', color: '#78716c', marginTop: '2px' }}>{emp.phone} • {emp.email}</div>
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.78rem', color: '#44403c', fontWeight: 500 }}>{emp.role}</td>
                      <td style={{ padding: '12px', fontSize: '0.82rem', fontWeight: 700, color: '#1c1917' }}>
                        INR {parseFloat(emp.salary).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontSize: '0.62rem', background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
                          {emp.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.7rem', color: '#44403c' }}>
                        <div>{emp.bank_name || 'N/A'}</div>
                        <div style={{ fontFamily: 'monospace', color: '#78716c', marginTop: '2px' }}>{emp.account_no || 'N/A'} (IFSC: {emp.ifsc_code || 'N/A'})</div>
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.75rem', color: '#78716c' }}>{emp.join_date}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            onClick={() => handleOpenExitModal(emp)}
                            style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', padding: '3px 6px', borderRadius: '4px', fontSize: '0.65rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 700 }}
                            title="Exited / FNF Settlement"
                          >
                            <LogOut size={10} /> Exit Company
                          </button>
                          <button 
                            onClick={() => handleDeleteEmployee(emp.id)}
                            style={{ background: 'transparent', border: 'none', color: '#a8a29e', cursor: 'pointer' }}
                            title="Delete Permanently"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MONTHLY PAYROLL TAB --- */}
      {activeTab === 'payroll' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#1c1917', margin: 0 }}>Monthly Salary Sheets</h3>
            <button 
              onClick={() => setShowPayrollModal(true)}
              style={{ background: '#9d2706', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              💸 Disburse Monthly Salaries
            </button>
          </div>

          <div className="admin-table-wrapper" style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: '12px', padding: '8px', marginBottom: '24px' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e7e5e4' }}>
                  <th style={{ padding: '12px' }}>Employee</th>
                  <th style={{ padding: '12px' }}>Salary Month</th>
                  <th style={{ padding: '12px' }}>Total Amount Paid</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px' }}>Transaction ID</th>
                  <th style={{ padding: '12px' }}>Cleared Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {payrollHistory.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#a8a29e', fontSize: '0.78rem' }}>No salary disbursements cleared yet.</td>
                  </tr>
                ) : (
                  payrollHistory.map(pay => (
                    <tr key={pay.id} style={{ borderBottom: '1px solid #f5f5f4' }}>
                      <td style={{ padding: '12px', fontSize: '0.8rem', fontWeight: 600, color: '#1c1917' }}>{pay.employee_name}</td>
                      <td style={{ padding: '12px', fontSize: '0.78rem', color: '#44403c' }}>{pay.month}</td>
                      <td style={{ padding: '12px', fontSize: '0.8rem', fontWeight: 700, color: '#16a34a' }}>INR {pay.amount.toLocaleString()}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontSize: '0.62rem', background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase' }}>
                          {pay.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.7rem', color: '#78716c', fontFamily: 'monospace' }}>{pay.txn_ref}</td>
                      <td style={{ padding: '12px', fontSize: '0.72rem', color: '#78716c' }}>{new Date(pay.paid_at).toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- PROCUREMENT & EXPENSES TAB --- */}
      {activeTab === 'expenses' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#1c1917', margin: 0 }}>Materials Procurement & Corporate Outflows</h3>
            <button 
              onClick={() => setShowExpenseModal(true)}
              style={{ background: '#9d2706', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} /> Log Material Procurement Expense
            </button>
          </div>

          <div className="admin-table-wrapper" style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: '12px', padding: '8px' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e7e5e4' }}>
                  <th style={{ padding: '12px' }}>Item Name</th>
                  <th style={{ padding: '12px' }}>Category</th>
                  <th style={{ padding: '12px' }}>Supplier Details</th>
                  <th style={{ padding: '12px' }}>Quantity</th>
                  <th style={{ padding: '12px' }}>Total Amount Paid (Base + GST)</th>
                  <th style={{ padding: '12px' }}>Invoice Ref</th>
                  <th style={{ padding: '12px' }}>Procurement Date</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#a8a29e', fontSize: '0.78rem' }}>No procurement expenses logged.</td>
                  </tr>
                ) : (
                  expenses.map(exp => (
                    <tr key={exp.id} style={{ borderBottom: '1px solid #f5f5f4' }}>
                      <td style={{ padding: '12px' }}>
                        <strong style={{ fontSize: '0.8rem', color: '#1c1917' }}>{exp.item_name}</strong>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontSize: '0.62rem', background: '#f5f5f4', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, color: '#44403c', border: '1px solid #e7e5e4' }}>
                          {exp.expense_type}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.75rem', color: '#44403c' }}>{exp.supplier || '—'}</td>
                      <td style={{ padding: '12px', fontSize: '0.75rem', color: '#44403c' }}>{exp.quantity}</td>
                      <td style={{ padding: '12px' }}>
                        <strong style={{ fontSize: '0.8rem', color: '#dc2626' }}>INR {exp.amount.toLocaleString()}</strong>
                        <div style={{ fontSize: '0.62rem', color: '#78716c', marginTop: '2px' }}>
                          Base: INR {exp.base_amount?.toLocaleString() || 'N/A'} • Tax: INR {exp.gst_amount?.toLocaleString() || 'N/A'} ({exp.gst_rate || 18}%)
                        </div>
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.7rem', color: '#78716c', fontFamily: 'monospace' }}>{exp.invoice_ref || '—'}</td>
                      <td style={{ padding: '12px', fontSize: '0.72rem', color: '#78716c' }}>
                        {new Date(exp.expense_date).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- EXITS & FNF TAB --- */}
      {activeTab === 'exits' && (
        <div>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#1c1917', marginBottom: '16px' }}>Exited Staff & Settlement Archives</h3>
          <div className="admin-table-wrapper" style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: '12px', padding: '8px' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e7e5e4' }}>
                  <th style={{ padding: '12px' }}>Employee ID & Name</th>
                  <th style={{ padding: '12px' }}>Role</th>
                  <th style={{ padding: '12px' }}>Exit Date</th>
                  <th style={{ padding: '12px' }}>Settlement (FnF) Amount</th>
                  <th style={{ padding: '12px' }}>Status / Settlement Notes</th>
                </tr>
              </thead>
              <tbody>
                {employees.filter(e => e.status === 'exited').length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#a8a29e', fontSize: '0.78rem' }}>No exited employees recorded.</td>
                  </tr>
                ) : (
                  employees.filter(e => e.status === 'exited').map(emp => (
                    <tr key={emp.id} style={{ borderBottom: '1px solid #f5f5f4' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#78716c' }}>{emp.employee_id}</div>
                        <strong style={{ fontSize: '0.82rem', color: '#1c1917' }}>{emp.name}</strong>
                        <div style={{ fontSize: '0.7rem', color: '#a8a29e' }}>{emp.phone}</div>
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.78rem', color: '#78716c' }}>{emp.role}</td>
                      <td style={{ padding: '12px', fontSize: '0.78rem', color: '#78716c' }}>{emp.exit_date || 'N/A'}</td>
                      <td style={{ padding: '12px', fontSize: '0.8rem', fontWeight: 700, color: '#1c1917' }}>
                        INR {emp.fnf_amount ? emp.fnf_amount.toLocaleString() : '0.00'}
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.72rem', color: '#44403c' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontWeight: 700 }}>
                          <CheckCircle size={12} /> Full & Final Settled
                        </div>
                        {emp.exit_notes && (
                          <div style={{ color: '#78716c', marginTop: '4px', fontStyle: 'italic' }}>"{emp.exit_notes}"</div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- ADD EMPLOYEE MODAL --- */}
      {showEmployeeModal && (
        <div className="admin-modal-overlay" onClick={() => setShowEmployeeModal(false)} style={{ zIndex: 1200 }}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <button className="admin-modal-close" onClick={() => setShowEmployeeModal(false)}><X size={18} /></button>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', marginBottom: '16px' }}>Register New Employee</h3>
            <form onSubmit={handleCreateEmployee} className="admin-form">
              <div className="af-row">
                <div className="af-field">
                  <label>Full Name *</label>
                  <input type="text" value={employeeForm.name} onChange={e => setEmployeeForm({...employeeForm, name: e.target.value})} required />
                </div>
                <div className="af-field">
                  <label>Job Designation / Role *</label>
                  <input type="text" placeholder="e.g. Master Shoemaker, Designer" value={employeeForm.role} onChange={e => setEmployeeForm({...employeeForm, role: e.target.value})} required />
                </div>
              </div>
              <div className="af-row">
                <div className="af-field">
                  <label>Phone Number *</label>
                  <input type="text" value={employeeForm.phone} onChange={e => setEmployeeForm({...employeeForm, phone: e.target.value})} required />
                </div>
                <div className="af-field">
                  <label>Email Address *</label>
                  <input type="email" value={employeeForm.email} onChange={e => setEmployeeForm({...employeeForm, email: e.target.value})} required />
                </div>
              </div>
              <div className="af-row">
                <div className="af-field">
                  <label>Monthly Base Salary (INR) *</label>
                  <input type="number" value={employeeForm.salary} onChange={e => setEmployeeForm({...employeeForm, salary: e.target.value})} required />
                </div>
                <div className="af-field">
                  <label>Joining Date</label>
                  <input type="date" value={employeeForm.join_date} onChange={e => setEmployeeForm({...employeeForm, join_date: e.target.value})} />
                </div>
              </div>

              <h4 style={{ marginTop: '16px', fontSize: '0.8rem', color: '#1c1917', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e7e5e4', paddingBottom: '6px' }}>Bank Transfer Details</h4>
              <div className="af-row">
                <div className="af-field">
                  <label>Bank Name</label>
                  <input type="text" placeholder="SBI, HDFC, etc." value={employeeForm.bank_name} onChange={e => setEmployeeForm({...employeeForm, bank_name: e.target.value})} />
                </div>
                <div className="af-field">
                  <label>Account Number</label>
                  <input type="text" value={employeeForm.account_no} onChange={e => setEmployeeForm({...employeeForm, account_no: e.target.value})} />
                </div>
                <div className="af-field">
                  <label>IFSC Code</label>
                  <input type="text" value={employeeForm.ifsc_code} onChange={e => setEmployeeForm({...employeeForm, ifsc_code: e.target.value})} />
                </div>
              </div>
              
              <button type="submit" className="admin-btn-primary" style={{ marginTop: '16px', width: '100%' }}>Create Employee Profile</button>
            </form>
          </div>
        </div>
      )}

      {/* --- EXIT SETTLEMENT MODAL --- */}
      {showExitModal && selectedExitEmployee && (
        <div className="admin-modal-overlay" onClick={() => { setShowExitModal(false); setSelectedExitEmployee(null); }} style={{ zIndex: 1200 }}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => { setShowExitModal(false); setSelectedExitEmployee(null); }}><X size={18} /></button>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', marginBottom: '4px' }}>Full & Final Exit Settlement</h3>
            <p style={{ fontSize: '0.75rem', color: '#78716c', marginBottom: '16px' }}>Finalize exit files for **{selectedExitEmployee.name}** ({selectedExitEmployee.employee_id})</p>
            
            <form onSubmit={handleSettleExit} className="admin-form">
              <div className="af-row">
                <div className="af-field">
                  <label>Exit Date *</label>
                  <input type="date" value={exitForm.exit_date} onChange={e => setExitForm({...exitForm, exit_date: e.target.value})} required />
                </div>
                <div className="af-field">
                  <label>FnF Settlement Amount Paid (INR) *</label>
                  <input type="number" value={exitForm.fnf_amount} onChange={e => setExitForm({...exitForm, fnf_amount: e.target.value})} required />
                </div>
              </div>
              <div className="af-field">
                <label>Exit Settlement Notes / Handover Details</label>
                <textarea rows="3" placeholder="Log reasons for resignation, asset collection details, etc." value={exitForm.notes} onChange={e => setExitForm({...exitForm, notes: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #e7e5e4', borderRadius: '8px', fontSize: '0.78rem' }} />
              </div>
              
              <p style={{ fontSize: '0.7rem', color: '#78716c', background: '#fef2f2', borderLeft: '3px solid #dc2626', padding: '8px 12px', borderRadius: '4px', margin: '12px 0 20px 0' }}>
                ⚠️ **Exclusion Gate:** Finalizing this exit stops all future salary run payments. The settlement amount will be logged under factory operating expenses.
              </p>
              <button type="submit" className="admin-btn-primary" style={{ width: '100%', background: '#dc2626', color: '#fff', border: 'none' }}>Finalize Exit & Stop Salary Payments</button>
            </form>
          </div>
        </div>
      )}

      {/* --- LOG EXPENSE MODAL WITH INVENTORY SYNC --- */}
      {showExpenseModal && (
        <div className="admin-modal-overlay" onClick={() => setShowExpenseModal(false)} style={{ zIndex: 1200 }}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <button className="admin-modal-close" onClick={() => setShowExpenseModal(false)}><X size={18} /></button>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', marginBottom: '16px' }}>Log Procurement Expense</h3>
            <form onSubmit={handleCreateExpense} className="admin-form">
              <div className="af-field">
                <label>Item Name / Service *</label>
                <input type="text" placeholder="e.g. Goodyear Welt Leather Hide" value={expenseForm.item_name} onChange={e => setExpenseForm({...expenseForm, item_name: e.target.value})} required />
              </div>
              
              <div className="af-row">
                <div className="af-field">
                  <label>Expense Category *</label>
                  <select value={expenseForm.expense_type} onChange={e => setExpenseForm({...expenseForm, expense_type: e.target.value})} required>
                    <option value="material_procurement">Material Procurement</option>
                    <option value="product_purchase">Direct Product Purchase</option>
                    <option value="accessories_purchase">Accessories Purchase</option>
                    <option value="other">Other Operating Expenses</option>
                  </select>
                </div>
                
                {expenseForm.expense_type === 'material_procurement' && (
                  <div className="af-field">
                    <label>Associate Raw Material (Auto Stock Sync) *</label>
                    <select 
                      value={expenseForm.material_id} 
                      onChange={e => setExpenseForm({...expenseForm, material_id: e.target.value})}
                      required={expenseForm.expense_type === 'material_procurement'}
                    >
                      <option value="">-- Select Material to update Inventory --</option>
                      {rawMaterials.map(rm => (
                        <option key={rm.id} value={rm.material_id}>{rm.name} ({rm.category})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="af-row">
                <div className="af-field">
                  <label>Quantity *</label>
                  <input type="number" min="1" step="any" value={expenseForm.quantity} onChange={e => setExpenseForm({...expenseForm, quantity: e.target.value})} required />
                </div>
                <div className="af-field">
                  <label>Tax Rate (GST %) *</label>
                  <select value={expenseForm.gst_rate} onChange={e => setExpenseForm({...expenseForm, gst_rate: e.target.value})} required>
                    <option value="0">0% Excluded</option>
                    <option value="5">5% GST</option>
                    <option value="12">12% GST</option>
                    <option value="18">18% GST</option>
                  </select>
                </div>
              </div>

              <div className="af-row">
                <div className="af-field">
                  <label>Total Amount (Inc. GST in INR) *</label>
                  <input type="number" step="any" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} required />
                </div>
                <div className="af-field">
                  <label>Expense Date</label>
                  <input type="date" value={expenseForm.expense_date} onChange={e => setExpenseForm({...expenseForm, expense_date: e.target.value})} />
                </div>
              </div>

              <div className="af-row">
                <div className="af-field">
                  <label>Supplier / Vendor Name</label>
                  <input type="text" value={expenseForm.supplier} onChange={e => setExpenseForm({...expenseForm, supplier: e.target.value})} />
                </div>
                <div className="af-field">
                  <label>Invoice Reference No.</label>
                  <input type="text" value={expenseForm.invoice_ref} onChange={e => setExpenseForm({...expenseForm, invoice_ref: e.target.value})} />
                </div>
              </div>

              {expenseForm.expense_type === 'material_procurement' && expenseForm.material_id && (
                <p style={{ fontSize: '0.7rem', color: '#ca8a04', background: '#fffbeb', borderLeft: '3px solid #ca8a04', padding: '8px 12px', borderRadius: '4px', margin: '4px 0 12px 0' }}>
                  ✓ **Inventory Sync active:** Submitting this will automatically increment the stock levels in your Raw Materials Inventory list.
                </p>
              )}

              <button type="submit" className="admin-btn-primary" style={{ marginTop: '16px', width: '100%' }}>Log Financial Outflow & Sync Stock</button>
            </form>
          </div>
        </div>
      )}

      {/* --- RUN PAYROLL MODAL --- */}
      {showPayrollModal && (
        <div className="admin-modal-overlay" onClick={() => setShowPayrollModal(false)} style={{ zIndex: 1200 }}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowPayrollModal(false)}><X size={18} /></button>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', marginBottom: '16px' }}>Disburse Monthly Payroll</h3>
            <form onSubmit={handleDisbursePayroll} className="admin-form">
              <div className="af-field">
                <label>Month & Year *</label>
                <input type="text" placeholder="e.g. September 2026" value={payrollForm.month} onChange={e => setPayrollForm({month: e.target.value})} required />
              </div>
              <p style={{ fontSize: '0.75rem', color: '#78716c', lineHeight: '1.5', background: '#fafaf9', borderLeft: '3px solid #ca8a04', padding: '8px 12px', borderRadius: '4px', margin: '12px 0 20px 0' }}>
                💡 Salary calculations run **strictly** for active staff in the directory. Exited or FnF settled staff are excluded.
              </p>
              <button type="submit" className="admin-btn-primary" style={{ width: '100%' }}>Disburse Salaries Now</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminAccounting;
