"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, Coins, Users, Wallet, CreditCard, 
  Plus, Trash2, X, Download, Calendar, ArrowUpRight, ArrowDownRight, Layers
} from 'lucide-react';
import { api } from '../../api';

function AdminAccounting() {
  const [activeTab, setActiveTab] = useState('summary'); // summary, employees, expenses
  const [summary, setSummary] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [expenses, setExpenses] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Date Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Modals & Forms
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    name: '', email: '', phone: '', role: '', salary: '', join_date: '',
    bank_name: '', account_no: '', ifsc_code: ''
  });
  
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    item_name: '', expense_type: 'material_procurement', amount: '', quantity: '1', supplier: '', invoice_ref: '', expense_date: ''
  });

  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [payrollForm, setPayrollForm] = useState({ month: '' });

  // Fetch Financial Summary
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

  // Fetch Employees & Payroll
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

  // Fetch Expenses
  const fetchExpensesData = useCallback(async () => {
    try {
      const data = await api.request('/admin/accounting/expenses');
      setExpenses(data.expenses || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchSummary(), fetchEmployeesData(), fetchExpensesData()]);
    setLoading(false);
  }, [fetchSummary, fetchEmployeesData, fetchExpensesData]);

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

  // Delete Employee
  const handleDeleteEmployee = async (id) => {
    if (!window.confirm("Are you sure you want to remove this employee?")) return;
    try {
      await api.request(`/admin/accounting/employees/${id}`, { method: 'DELETE' });
      fetchEmployeesData();
      fetchSummary();
    } catch (err) {
      alert("Failed to remove employee: " + err.message);
    }
  };

  // Create Expense
  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      await api.request('/admin/accounting/expenses', {
        method: 'POST',
        body: JSON.stringify({
          ...expenseForm,
          amount: parseFloat(expenseForm.amount),
          quantity: parseFloat(expenseForm.quantity)
        })
      });
      setShowExpenseModal(false);
      setExpenseForm({
        item_name: '', expense_type: 'material_procurement', amount: '', quantity: '1', supplier: '', invoice_ref: '', expense_date: ''
      });
      fetchExpensesData();
      fetchSummary();
    } catch (err) {
      alert("Failed to log expense: " + err.message);
    }
  };

  // Disburse Payroll
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

  // Download Statement
  const handleDownloadStatement = () => {
    // Generate simple print sheet / PDF
    window.print();
  };

  if (loading) return <div className="admin-loading">Loading financial ledgers…</div>;

  return (
    <div className="admin-page" data-testid="admin-accounting-page" style={{ padding: '24px', background: '#F7F5F2', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', color: '#1c1917', margin: 0 }}>Accounting & Finance</h1>
          <p style={{ fontSize: '0.85rem', color: '#78716c', margin: '4px 0 0 0' }}>Monitor gross revenue, GST splits, factory expenses, procurement logs, and payroll</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={handleDownloadStatement}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #e7e5e4', padding: '8px 16px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, color: '#44403c', cursor: 'pointer' }}
          >
            <Download size={14} /> Export / Print Financials
          </button>
        </div>
      </div>

      {/* Date Pickers */}
      <div style={{ background: '#fff', border: '1px solid #e7e5e4', padding: '16px', borderRadius: '12px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={14} style={{ color: '#78716c' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#44403c' }}>Custom Range:</span>
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
            Clear Filters
          </button>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div style={{ background: '#fff', border: '1px solid #e7e5e4', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Gross Sales</span>
              <div style={{ background: '#f0fdf4', color: '#16a34a', borderRadius: '50%', padding: '6px' }}><TrendingUp size={16} /></div>
            </div>
            <strong style={{ fontSize: '1.5rem', color: '#1c1917' }}>INR {summary.sales.total_sales.toLocaleString('en-IN')}</strong>
            <div style={{ fontSize: '0.68rem', color: '#a8a29e', marginTop: '6px' }}>Dynamic Orders aggregate</div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e7e5e4', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>GST Collected</span>
              <div style={{ background: '#fffbeb', color: '#ca8a04', borderRadius: '50%', padding: '6px' }}><Coins size={16} /></div>
            </div>
            <strong style={{ fontSize: '1.5rem', color: '#ca8a04' }}>INR {summary.sales.total_gst.toLocaleString('en-IN')}</strong>
            <div style={{ fontSize: '0.68rem', color: '#78716c', marginTop: '6px' }}>CGST: {summary.sales.cgst.toLocaleString()} | SGST: {summary.sales.sgst.toLocaleString()}</div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e7e5e4', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Artisan Payouts Paid</span>
              <div style={{ background: '#fff1f2', color: '#e11d48', borderRadius: '50%', padding: '6px' }}><Wallet size={16} /></div>
            </div>
            <strong style={{ fontSize: '1.5rem', color: '#e11d48' }}>INR {summary.vendor_payouts.total_paid.toLocaleString('en-IN')}</strong>
            <div style={{ fontSize: '0.68rem', color: '#78716c', marginTop: '6px' }}>Outstanding: INR {summary.vendor_payouts.outstanding.toLocaleString()}</div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e7e5e4', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Procurement & HR Expenses</span>
              <div style={{ background: '#f5f5f4', color: '#44403c', borderRadius: '50%', padding: '6px' }}><CreditCard size={16} /></div>
            </div>
            <strong style={{ fontSize: '1.5rem', color: '#44403c' }}>INR {summary.expenses.total_expenses.toLocaleString('en-IN')}</strong>
            <div style={{ fontSize: '0.68rem', color: '#78716c', marginTop: '6px' }}>Materials: INR {summary.expenses.material_procurement.toLocaleString()} | HR: INR {summary.expenses.payroll.toLocaleString()}</div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e7e5e4', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimated Net Profit</span>
              <div style={{ background: '#f0fdf4', color: '#16a34a', borderRadius: '50%', padding: '6px' }}><TrendingUp size={16} /></div>
            </div>
            <strong style={{ fontSize: '1.5rem', color: summary.net_profit >= 0 ? '#16a34a' : '#dc2626' }}>
              INR {summary.net_profit.toLocaleString('en-IN')}
            </strong>
            <div style={{ fontSize: '0.68rem', color: '#a8a29e', marginTop: '6px' }}>Sales minus all payouts & expenses</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e7e5e4', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('summary')}
          style={{ padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: activeTab === 'summary' ? '3px solid #9d2706' : 'none', color: activeTab === 'summary' ? '#9d2706' : '#78716c', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}
        >
          📊 Cash Flow Ledger
        </button>
        <button 
          onClick={() => setActiveTab('employees')}
          style={{ padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: activeTab === 'employees' ? '3px solid #9d2706' : 'none', color: activeTab === 'employees' ? '#9d2706' : '#78716c', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}
        >
          👥 HR Directory & Payroll
        </button>
        <button 
          onClick={() => setActiveTab('expenses')}
          style={{ padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: activeTab === 'expenses' ? '3px solid #9d2706' : 'none', color: activeTab === 'expenses' ? '#9d2706' : '#78716c', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}
        >
          🧾 Factory Expenses Tracker
        </button>
      </div>

      {/* TAB CONTENTS */}
      {activeTab === 'summary' && (
        <div>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', marginBottom: '16px', color: '#1c1917' }}>Detailed Financial Breakdown</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Sales & Revenue */}
            <div style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: '12px', padding: '20px' }}>
              <h4 style={{ margin: '0 0 16px 0', borderBottom: '1px solid #e7e5e4', paddingBottom: '8px', color: '#1c1917', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue Channels</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f4', paddingBottom: '6px' }}>
                  <span style={{ color: '#78716c' }}>Total Gross Sales (Inc. Tax)</span>
                  <strong style={{ color: '#1c1917' }}>INR {summary?.sales.total_sales.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f4', paddingBottom: '6px' }}>
                  <span style={{ color: '#78716c' }}>Less: CGST (9%) Collected</span>
                  <span style={{ color: '#ca8a04' }}>- INR {summary?.sales.cgst.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f4', paddingBottom: '6px' }}>
                  <span style={{ color: '#78716c' }}>Less: SGST (9%) Collected</span>
                  <span style={{ color: '#ca8a04' }}>- INR {summary?.sales.sgst.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, paddingTop: '4px' }}>
                  <span style={{ color: '#1c1917' }}>Net Base Revenue</span>
                  <span style={{ color: '#16a34a' }}>INR {(summary?.sales.total_sales - summary?.sales.total_gst).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Outgoing Payouts & Expenses */}
            <div style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: '12px', padding: '20px' }}>
              <h4 style={{ margin: '0 0 16px 0', borderBottom: '1px solid #e7e5e4', paddingBottom: '8px', color: '#1c1917', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expense Channels</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f4', paddingBottom: '6px' }}>
                  <span style={{ color: '#78716c' }}>Artisan Workshop Payments</span>
                  <strong style={{ color: '#e11d48' }}>INR {summary?.vendor_payouts.total_paid.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f4', paddingBottom: '6px' }}>
                  <span style={{ color: '#78716c' }}>Raw Materials Procurement</span>
                  <strong style={{ color: '#e11d48' }}>INR {summary?.expenses.material_procurement.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f4', paddingBottom: '6px' }}>
                  <span style={{ color: '#78716c' }}>Product & Accessory Purchase</span>
                  <strong style={{ color: '#e11d48' }}>INR {(summary?.expenses.product_purchase + summary?.expenses.accessories_purchase).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f4', paddingBottom: '6px' }}>
                  <span style={{ color: '#78716c' }}>Artisan & Staff Payroll</span>
                  <strong style={{ color: '#e11d48' }}>INR {summary?.expenses.payroll.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, paddingTop: '4px' }}>
                  <span style={{ color: '#1c1917' }}>Total Outgoing Expenses</span>
                  <span style={{ color: '#ca8a04' }}>INR {summary?.expenses.total_expenses.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'employees' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#1c1917', margin: 0 }}>HR Registry & Salary Sheets</h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setShowPayrollModal(true)}
                style={{ background: '#fff', border: '1px solid #9d2706', color: '#9d2706', padding: '6px 14px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
              >
                💸 Disburse Monthly Salaries
              </button>
              <button 
                onClick={() => setShowEmployeeModal(true)}
                style={{ background: '#9d2706', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
              >
                <Plus size={14} /> Add New Employee
              </button>
            </div>
          </div>

          {/* Employees Table */}
          <div className="admin-table-wrapper" style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: '12px', padding: '8px', marginBottom: '32px' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e7e5e4' }}>
                  <th style={{ padding: '12px' }}>Employee Name</th>
                  <th style={{ padding: '12px' }}>Role / Status</th>
                  <th style={{ padding: '12px' }}>Monthly Salary</th>
                  <th style={{ padding: '12px' }}>Bank Details</th>
                  <th style={{ padding: '12px' }}>Join Date</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#a8a29e', fontSize: '0.78rem' }}>No employee records logged yet.</td>
                  </tr>
                ) : (
                  employees.map(emp => (
                    <tr key={emp.id} style={{ borderBottom: '1px solid #f5f5f4' }}>
                      <td style={{ padding: '12px' }}>
                        <strong style={{ fontSize: '0.82rem', color: '#1c1917' }}>{emp.name}</strong>
                        <div style={{ fontSize: '0.7rem', color: '#78716c', marginTop: '2px' }}>{emp.phone} • {emp.email}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontSize: '0.72rem', background: '#f5f5f4', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, color: '#44403c' }}>{emp.role}</span>
                        <div style={{ fontSize: '0.65rem', color: emp.status === 'active' ? '#16a34a' : '#dc2626', marginTop: '4px', fontWeight: 700 }}>
                          ● {emp.status}
                        </div>
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.82rem', fontWeight: 700, color: '#1c1917' }}>
                        INR {parseFloat(emp.salary).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.7rem', color: '#44403c' }}>
                        <div>{emp.bank_name || 'N/A'}</div>
                        <div style={{ fontFamily: 'monospace', color: '#78716c', marginTop: '2px' }}>{emp.account_no || 'N/A'} (IFSC: {emp.ifsc_code || 'N/A'})</div>
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.75rem', color: '#78716c' }}>
                        {emp.join_date}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button 
                          onClick={() => handleDeleteEmployee(emp.id)}
                          style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                          title="Remove Employee"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Payroll Disbursement History */}
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#1c1917', marginBottom: '16px' }}>Payroll Clearance History</h3>
          <div className="admin-table-wrapper" style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: '12px', padding: '8px' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e7e5e4' }}>
                  <th style={{ padding: '12px' }}>Employee</th>
                  <th style={{ padding: '12px' }}>Month</th>
                  <th style={{ padding: '12px' }}>Amount Paid</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px' }}>Transaction ID</th>
                  <th style={{ padding: '12px' }}>Cleared At</th>
                </tr>
              </thead>
              <tbody>
                {payrollHistory.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#a8a29e', fontSize: '0.78rem' }}>No payroll payments recorded.</td>
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
                      <td style={{ padding: '12px', fontSize: '0.72rem', color: '#78716c' }}>
                        {new Date(pay.paid_at).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#1c1917', margin: 0 }}>Factory Materials & Procurement Expenses</h3>
            <button 
              onClick={() => setShowExpenseModal(true)}
              style={{ background: '#9d2706', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
            >
              <Plus size={14} /> Log Procurement Expense
            </button>
          </div>

          <div className="admin-table-wrapper" style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: '12px', padding: '8px' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e7e5e4' }}>
                  <th style={{ padding: '12px' }}>Item Details</th>
                  <th style={{ padding: '12px' }}>Category</th>
                  <th style={{ padding: '12px' }}>Supplier</th>
                  <th style={{ padding: '12px' }}>Quantity</th>
                  <th style={{ padding: '12px' }}>Total Outflow</th>
                  <th style={{ padding: '12px' }}>Invoice Ref</th>
                  <th style={{ padding: '12px' }}>Expense Date</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#a8a29e', fontSize: '0.78rem' }}>No logged procurement expenses.</td>
                  </tr>
                ) : (
                  expenses.map(exp => (
                    <tr key={exp.id} style={{ borderBottom: '1px solid #f5f5f4' }}>
                      <td style={{ padding: '12px', fontSize: '0.8rem', fontWeight: 600, color: '#1c1917' }}>{exp.item_name}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontSize: '0.65rem', background: '#fafaf9', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, border: '1px solid #e7e5e4', color: '#78716c' }}>
                          {exp.expense_type}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.75rem', color: '#44403c' }}>{exp.supplier || '—'}</td>
                      <td style={{ padding: '12px', fontSize: '0.75rem', color: '#44403c' }}>{exp.quantity}</td>
                      <td style={{ padding: '12px', fontSize: '0.8rem', fontWeight: 700, color: '#dc2626' }}>INR {exp.amount.toLocaleString()}</td>
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

      {/* --- ADD EMPLOYEE MODAL --- */}
      {showEmployeeModal && (
        <div className="admin-modal-overlay" onClick={() => setShowEmployeeModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <button className="admin-modal-close" onClick={() => setShowEmployeeModal(false)}><X size={18} /></button>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', marginBottom: '16px' }}>Add New Employee</h3>
            <form onSubmit={handleCreateEmployee} className="admin-form">
              <div className="af-row">
                <div className="af-field">
                  <label>Full Name *</label>
                  <input type="text" value={employeeForm.name} onChange={e => setEmployeeForm({...employeeForm, name: e.target.value})} required />
                </div>
                <div className="af-field">
                  <label>Job Designation / Role *</label>
                  <input type="text" placeholder="e.g. Master Artisan, QA Lead" value={employeeForm.role} onChange={e => setEmployeeForm({...employeeForm, role: e.target.value})} required />
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
                  <label>Monthly Salary (INR) *</label>
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
                  <input type="text" placeholder="HDFC, ICICI, etc." value={employeeForm.bank_name} onChange={e => setEmployeeForm({...employeeForm, bank_name: e.target.value})} />
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

      {/* --- LOG EXPENSE MODAL --- */}
      {showExpenseModal && (
        <div className="admin-modal-overlay" onClick={() => setShowExpenseModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowExpenseModal(false)}><X size={18} /></button>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', marginBottom: '16px' }}>Log Procurement Expense</h3>
            <form onSubmit={handleCreateExpense} className="admin-form">
              <div className="af-field">
                <label>Item Name / Service *</label>
                <input type="text" placeholder="e.g. Calfskin Leather Hide 400sqft" value={expenseForm.item_name} onChange={e => setExpenseForm({...expenseForm, item_name: e.target.value})} required />
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
                <div className="af-field">
                  <label>Quantity *</label>
                  <input type="number" value={expenseForm.quantity} onChange={e => setExpenseForm({...expenseForm, quantity: e.target.value})} required />
                </div>
              </div>
              <div className="af-row">
                <div className="af-field">
                  <label>Total Amount (INR) *</label>
                  <input type="number" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} required />
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

              <button type="submit" className="admin-btn-primary" style={{ marginTop: '16px', width: '100%' }}>Log Financial Expense</button>
            </form>
          </div>
        </div>
      )}

      {/* --- RUN PAYROLL MODAL --- */}
      {showPayrollModal && (
        <div className="admin-modal-overlay" onClick={() => setShowPayrollModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowPayrollModal(false)}><X size={18} /></button>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', marginBottom: '16px' }}>Run Monthly Payroll</h3>
            <form onSubmit={handleDisbursePayroll} className="admin-form">
              <div className="af-field">
                <label>Month & Year *</label>
                <input type="text" placeholder="e.g. August 2026" value={payrollForm.month} onChange={e => setPayrollForm({month: e.target.value})} required />
              </div>
              <p style={{ fontSize: '0.75rem', color: '#78716c', lineHeight: '1.5', background: '#fafaf9', borderLeft: '3px solid #ca8a04', padding: '8px 12px', borderRadius: '4px', margin: '12px 0 20px 0' }}>
                ⚠️ Clicking Disburse will run the salary calculations for all active employees, initiate simulated bank transfer receipts, and create corresponding transactional outflows in the cash flow summary.
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
