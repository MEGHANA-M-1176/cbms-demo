import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { 
  MessageSquare, Receipt, Target, Package, Loader2, CheckCircle2, UserPlus
} from 'lucide-react';

export const OperationsHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'TICKETS' | 'EXPENSES' | 'TARGETS' | 'INVENTORY' | 'ACCOUNT_OPENING'>('TICKETS');
  const [loading, setLoading] = useState(false);

  // States for each module
  const [tickets, setTickets] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [targets, setTargets] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [depositTypes, setDepositTypes] = useState<any[]>([]);

  // Form states
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseNotes, setExpenseNotes] = useState('');

  const [targetAgent, setTargetAgent] = useState('');
  const [targetType, setTargetType] = useState('');
  const [targetAmount, setTargetAmount] = useState('');

  const [assetName, setAssetName] = useState('');
  const [assetValue, setAssetValue] = useState('');

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedDepositTypeId, setSelectedDepositTypeId] = useState('');
  const [openingAmount, setOpeningAmount] = useState('5000');

  const [users, setUsers] = useState<any[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setSuccessMsg(null);
      if (activeTab === 'TICKETS') {
        const res = await apiClient.get('/tickets');
        setTickets(res.data || []);
      } else if (activeTab === 'EXPENSES') {
        const res = await apiClient.get('/expenses');
        setExpenses(res.data || []);
      } else if (activeTab === 'TARGETS') {
        const [tarRes, usrRes] = await Promise.all([
          apiClient.get('/targets'),
          apiClient.get('/users')
        ]);
        setTargets(tarRes.data || []);
        setUsers(usrRes.data || []);
      } else if (activeTab === 'INVENTORY') {
        const res = await apiClient.get('/inventory');
        setInventory(res.data || []);
      } else if (activeTab === 'ACCOUNT_OPENING') {
        const [custRes, depRes] = await Promise.all([
          apiClient.get('/customers'),
          apiClient.get('/config/deposit-types')
        ]);
        setCustomers(custRes.data || []);
        setDepositTypes(depRes.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/tickets', {
        subject: ticketSubject,
        description: ticketDesc,
        category: 'SUPPORT'
      });
      setSuccessMsg('Ticket created successfully.');
      setTicketSubject('');
      setTicketDesc('');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/accounts', {
        customerId: selectedCustomerId,
        depositTypeId: selectedDepositTypeId,
        openingAmount: Number(openingAmount)
      });
      setSuccessMsg(`Account ${res.data.accountNumber} opened successfully!`);
      setSelectedCustomerId('');
      setSelectedDepositTypeId('');
      fetchData();
    } catch (err) {
      alert('Failed to open account.');
    }
  };

  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/expenses', {
        amount: Number(expenseAmount),
        category: expenseCategory,
        notes: expenseNotes
      });
      setSuccessMsg('Expense logged successfully.');
      setExpenseAmount('');
      setExpenseCategory('');
      setExpenseNotes('');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/targets', {
        agentId: targetAgent,
        targetType: targetType,
        targetAmount: Number(targetAmount)
      });
      setSuccessMsg('Target assigned successfully.');
      setTargetAmount('');
      setTargetType('');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/inventory', {
        assetName: assetName,
        value: Number(assetValue)
      });
      setSuccessMsg('Asset registered successfully.');
      setAssetName('');
      setAssetValue('');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 600 }}>Management & Operations Hub</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Centralized view for Grievances, Expenses, Targets, and Asset Inventory</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid var(--panel-border)', paddingBottom: 12 }}>
        <button 
          className={`btn ${activeTab === 'TICKETS' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('TICKETS')}
          style={{ display: 'flex', gap: 8 }}
        >
          <MessageSquare size={16} /> Grievances
        </button>
        <button 
          className={`btn ${activeTab === 'ACCOUNT_OPENING' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('ACCOUNT_OPENING')}
          style={{ display: 'flex', gap: 8 }}
        >
          <UserPlus size={16} /> Account Opening
        </button>
        <button 
          className={`btn ${activeTab === 'EXPENSES' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('EXPENSES')}
          style={{ display: 'flex', gap: 8 }}
        >
          <Receipt size={16} /> Expenses
        </button>
        <button 
          className={`btn ${activeTab === 'TARGETS' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('TARGETS')}
          style={{ display: 'flex', gap: 8 }}
        >
          <Target size={16} /> Targets
        </button>
        <button 
          className={`btn ${activeTab === 'INVENTORY' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('INVENTORY')}
          style={{ display: 'flex', gap: 8 }}
        >
          <Package size={16} /> Inventory
        </button>
      </div>

      {successMsg && (
        <div style={{ padding: '12px', background: 'rgba(16,185,129,0.1)', color: 'var(--accent-emerald)', borderRadius: '8px', fontSize: '0.8rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', gap: 12 }}>
          <Loader2 className="animate-spin" size={32} style={{ color: '#10b981' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: activeTab === 'ACCOUNT_OPENING' ? '1fr' : '2fr 1fr', gap: 24 }}>
          {/* Main Content */}
          <div className="panel" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
            {activeTab === 'TICKETS' && (
              <>
                <h4 style={{ marginBottom: 16, fontWeight: 600 }}>Active Support Tickets</h4>
                <div className="table-container" style={{ flex: 1, overflowY: 'auto' }}>
                  <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                    <thead><tr><th>Ticket ID</th><th>Subject</th><th>Status</th><th>Created</th></tr></thead>
                    <tbody>
                      {tickets.map(t => (
                        <tr key={t.id}>
                          <td style={{ fontFamily: 'monospace' }}>{t.ticketNumber || t.id.slice(0,8)}</td>
                          <td>{t.title}</td>
                          <td><span className={`badge ${t.status === 'OPEN' ? 'badge-warning' : 'badge-success'}`}>{t.status || 'OPEN'}</span></td>
                          <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === 'EXPENSES' && (
              <>
                <h4 style={{ marginBottom: 16, fontWeight: 600 }}>Recent Branch Expenses</h4>
                <div className="table-container" style={{ flex: 1, overflowY: 'auto' }}>
                  <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                    <thead><tr><th>Date</th><th>Category</th><th>Amount</th><th>Status</th></tr></thead>
                    <tbody>
                      {expenses.map(e => (
                        <tr key={e.id}>
                          <td>{new Date(e.createdAt).toLocaleDateString()}</td>
                          <td>{e.category?.name || 'Uncategorized'}</td>
                          <td style={{ color: '#f43f5e', fontWeight: 600 }}>-{formatCurrency(e.amount)}</td>
                          <td><span className="badge badge-success">{e.status || 'APPROVED'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {expenses.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 12 }}>No expenses logged.</p>}
              </>
            )}

            {activeTab === 'TARGETS' && (
              <>
                <h4 style={{ marginBottom: 16, fontWeight: 600 }}>Staff Performance Targets</h4>
                <div className="table-container" style={{ flex: 1, overflowY: 'auto' }}>
                  <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                    <thead><tr><th>Agent</th><th>Type</th><th>Target Amount</th><th>Achieved</th></tr></thead>
                    <tbody>
                      {targets.map(t => (
                        <tr key={t.id}>
                          <td>{t.user?.fullName || 'Unknown'}</td>
                          <td>{t.targetType}</td>
                          <td>{formatCurrency(t.targetAmount)}</td>
                          <td style={{ color: '#10b981', fontWeight: 600 }}>{formatCurrency(t.achievedAmount || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {targets.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 12 }}>No targets assigned.</p>}
              </>
            )}

            {activeTab === 'INVENTORY' && (
              <>
                <h4 style={{ marginBottom: 16, fontWeight: 600 }}>Branch Asset Inventory</h4>
                <div className="table-container" style={{ flex: 1, overflowY: 'auto' }}>
                  <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                    <thead><tr><th>Asset Name</th><th>Value</th><th>Status</th><th>Registered Date</th></tr></thead>
                    <tbody>
                      {inventory.map(i => (
                        <tr key={i.id}>
                          <td>{i.assetName}</td>
                          <td>{formatCurrency(i.value)}</td>
                          <td><span className="badge badge-success">{i.status || 'ACTIVE'}</span></td>
                          <td>{new Date(i.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {inventory.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 12 }}>No assets in inventory.</p>}
              </>
            )}

            {activeTab === 'ACCOUNT_OPENING' && (
              <>
                <h4 style={{ marginBottom: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UserPlus size={20} style={{ color: 'var(--primary-color)' }} /> Open New Customer Account
                </h4>
                <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
                  <div className="form-group">
                    <label className="form-label">Select Customer</label>
                    <select className="form-control" value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} required>
                      <option value="">-- Choose Customer --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.fullName} ({c.memberId})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Deposit Product Type</label>
                    <select className="form-control" value={selectedDepositTypeId} onChange={e => setSelectedDepositTypeId(e.target.value)} required>
                      <option value="">-- Choose Deposit Type --</option>
                      {depositTypes.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.productCode})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Initial Opening Amount (₹)</label>
                    <input type="number" className="form-control" value={openingAmount} onChange={e => setOpeningAmount(e.target.value)} min="0" required />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
                    Open Account
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Form Side Panel */}
          <div className="panel" style={{ alignSelf: 'start' }}>
            {activeTab === 'TICKETS' && (
              <form onSubmit={handleCreateTicket}>
                <h4 style={{ marginBottom: 16, fontWeight: 600 }}>Log New Ticket</h4>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input type="text" className="form-control" required value={ticketSubject} onChange={e => setTicketSubject(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={4} required value={ticketDesc} onChange={e => setTicketDesc(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Submit Ticket</button>
              </form>
            )}

            {activeTab === 'EXPENSES' && (
              <form onSubmit={handleLogExpense}>
                <h4 style={{ marginBottom: 16, fontWeight: 600 }}>Log Branch Expense</h4>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-control" required value={expenseCategory} onChange={e => setExpenseCategory(e.target.value)}>
                    <option value="">-- Select --</option>
                    <option value="UTILITIES">Utilities</option>
                    <option value="STATIONERY">Stationery</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="MISC">Miscellaneous</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (INR)</label>
                  <input type="number" className="form-control" required value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input type="text" className="form-control" value={expenseNotes} onChange={e => setExpenseNotes(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Record Expense</button>
              </form>
            )}

            {activeTab === 'TARGETS' && (
              <form onSubmit={handleAssignTarget}>
                <h4 style={{ marginBottom: 16, fontWeight: 600 }}>Assign Target</h4>
                <div className="form-group">
                  <label className="form-label">Staff Member</label>
                  <select className="form-control" required value={targetAgent} onChange={e => setTargetAgent(e.target.value)}>
                    <option value="">-- Select Staff --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.fullName}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Target Type</label>
                  <select className="form-control" required value={targetType} onChange={e => setTargetType(e.target.value)}>
                    <option value="">-- Select --</option>
                    <option value="LOAN_DISBURSEMENT">Loan Disbursement</option>
                    <option value="DEPOSIT_COLLECTION">Deposit Collection</option>
                    <option value="NPA_RECOVERY">NPA Recovery</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Target Amount (INR)</label>
                  <input type="number" className="form-control" required value={targetAmount} onChange={e => setTargetAmount(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Set Target</button>
              </form>
            )}

            {activeTab === 'INVENTORY' && (
              <form onSubmit={handleAddAsset}>
                <h4 style={{ marginBottom: 16, fontWeight: 600 }}>Register New Asset</h4>
                <div className="form-group">
                  <label className="form-label">Asset Name / Type</label>
                  <input type="text" className="form-control" required value={assetName} onChange={e => setAssetName(e.target.value)} placeholder="e.g. Dell Latitude Laptop" />
                </div>
                <div className="form-group">
                  <label className="form-label">Estimated Value (INR)</label>
                  <input type="number" className="form-control" required value={assetValue} onChange={e => setAssetValue(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Register Asset</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

