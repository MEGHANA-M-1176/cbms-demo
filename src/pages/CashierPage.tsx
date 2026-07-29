import React, { useState } from 'react';
import { Search, CreditCard, ArrowRightCircle, DollarSign, RefreshCw, Send, CheckCircle } from 'lucide-react';
import apiClient from '../api/apiClient';

export const CashierPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState<'DEPOSIT' | 'LOAN_PAYMENT'>('DEPOSIT');
  
  // Deposit state
  const [depositAmount, setDepositAmount] = useState('');
  const [depositAccount, setDepositAccount] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [referenceNumber, setReferenceNumber] = useState('');
  
  // Loan state
  const [loanId, setLoanId] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanSavingsAccount, setLoanSavingsAccount] = useState('');

  // Payment Modes from Database
  const [paymentModes, setPaymentModes] = useState<any[]>([]);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  React.useEffect(() => {
    apiClient.get('/cashier/payment-modes')
      .then(res => {
        setPaymentModes(res.data);
        const cashMode = res.data.find((m: any) => m.code === 'CASH') || res.data[0];
        if (cashMode) {
          setPaymentMode(cashMode.id);
        }
      })
      .catch(console.error);
  }, []);

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm) return;
    setLoading(true);
    setError('');
    setActionError(null);
    try {
      const res = await apiClient.get(`/cashier/search?q=${searchTerm}`);
      setCustomer(res.data);
      if (res.data.accounts?.length > 0) {
        setDepositAccount(res.data.accounts[0].id);
        setLoanSavingsAccount(res.data.accounts[0].id);
      }
      if (res.data.loans?.length > 0) {
        setLoanId(res.data.loans[0].id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Customer not found or error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessBanner(null);
    performSearch(query);
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setSuccessBanner(null);

    if (!depositAccount) {
      setActionError('Please select a target account for the deposit.');
      return;
    }

    try {
      await apiClient.post('/cashier/deposit', {
        accountId: depositAccount,
        amount: Number(depositAmount),
        paymentModeId: paymentMode,
        referenceNumber: paymentModes.find(m => m.id === paymentMode)?.code !== 'CASH' ? referenceNumber : undefined
      });
      setSuccessBanner(`Deposit of ₹${Number(depositAmount).toLocaleString()} successfully posted to ledger!`);
      setDepositAmount('');
      setReferenceNumber('');
      performSearch(query);
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Deposit transaction failed');
    }
  };

  const handleLoanPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setSuccessBanner(null);

    if (!loanSavingsAccount) {
      setActionError('Please select a source savings account.');
      return;
    }
    if (!loanId) {
      setActionError('Please select a target loan.');
      return;
    }

    try {
      await apiClient.post('/cashier/loan-payment', {
        loanId,
        savingsAccountId: loanSavingsAccount,
        amount: Number(loanAmount),
      });
      setSuccessBanner(`Loan EMI Payment of ₹${Number(loanAmount).toLocaleString()} executed successfully!`);
      setLoanAmount('');
      performSearch(query);
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Loan payment execution failed');
    }
  };

  return (
    <div className="fade-in p-6" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CreditCard size={32} color="var(--primary-color)" /> Teller & Cashier Operations
        </h1>
      </div>

      <div className="card glass-panel" style={{ marginBottom: '24px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Search by Member ID, Phone Number, or Aadhaar..."
              style={{ paddingLeft: '48px', width: '100%' }}
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <RefreshCw className="spin" size={20} /> : 'Search Customer'}
          </button>
        </form>
        {error && <p style={{ color: '#ef4444', marginTop: '12px' }}>{error}</p>}
      </div>

      {customer && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          
          <div className="card glass-panel">
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>Customer Overview</h2>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{customer.fullName}</p>
              <p style={{ color: 'var(--text-muted)' }}>Member ID: {customer.memberId}</p>
              <p style={{ color: 'var(--text-muted)' }}>Phone: {customer.phone}</p>
            </div>

            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px' }}>Active Accounts</h3>
            {customer.accounts?.length > 0 ? customer.accounts.map((acc: any) => (
              <div key={acc.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '8px', borderLeft: '3px solid var(--accent-color)' }}>
                <p style={{ fontWeight: '500' }}>{acc.accountNumber}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{acc.depositType?.name}</p>
                <p style={{ fontWeight: 'bold', fontSize: '1.2rem', marginTop: '8px', color: '#10b981' }}>₹{Number(acc.balance).toLocaleString()}</p>
              </div>
            )) : <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No active accounts</p>}

            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-secondary)', marginTop: '20px', marginBottom: '12px' }}>Active Loans</h3>
            {customer.loans?.length > 0 ? customer.loans.map((loan: any) => (
              <div key={loan.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '8px', borderLeft: '3px solid #ef4444' }}>
                <p style={{ fontWeight: '500' }}>{loan.loanNumber}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{loan.loanType?.name}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Outstanding:</span>
                  <span style={{ fontWeight: 'bold', color: '#ef4444' }}>₹{Number(loan.outstandingPrincipal).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>EMI Amount:</span>
                  <span style={{ fontWeight: 'bold' }}>₹{Number(loan.emiAmount).toLocaleString()}</span>
                </div>
              </div>
            )) : <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No active loans</p>}
          </div>

          <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '24px' }}>
              <button 
                onClick={() => { setActiveTab('DEPOSIT'); setSuccessBanner(null); setActionError(null); }}
                style={{ padding: '12px 24px', fontWeight: '600', background: 'none', border: 'none', color: activeTab === 'DEPOSIT' ? 'var(--primary-color)' : 'var(--text-muted)', borderBottom: activeTab === 'DEPOSIT' ? '2px solid var(--primary-color)' : 'none', cursor: 'pointer' }}
              >
                Accept Deposit
              </button>
              <button 
                onClick={() => { setActiveTab('LOAN_PAYMENT'); setSuccessBanner(null); setActionError(null); }}
                style={{ padding: '12px 24px', fontWeight: '600', background: 'none', border: 'none', color: activeTab === 'LOAN_PAYMENT' ? 'var(--primary-color)' : 'var(--text-muted)', borderBottom: activeTab === 'LOAN_PAYMENT' ? '2px solid var(--primary-color)' : 'none', cursor: 'pointer' }}
              >
                Process Loan EMI
              </button>
            </div>

            {successBanner && (
              <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#10b981', fontSize: '0.9rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} /> {successBanner}
              </div>
            )}

            {actionError && (
              <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '0.9rem', marginBottom: '20px' }}>
                {actionError}
              </div>
            )}

            {activeTab === 'DEPOSIT' && (
              <form onSubmit={handleDeposit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                <div>
                  <label className="form-label">Deposit Into Account</label>
                  <select className="input-field" value={depositAccount} onChange={e => setDepositAccount(e.target.value)} required>
                    <option value="">Select Account...</option>
                    {customer.accounts?.map((acc: any) => (
                      <option key={acc.id} value={acc.id}>{acc.accountNumber} - Balance: ₹{Number(acc.balance).toLocaleString()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Payment Mode</label>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {paymentModes.map(mode => (
                      <div 
                        key={mode.id}
                        onClick={() => setPaymentMode(mode.id)}
                        style={{ 
                          padding: '12px 20px', 
                          borderRadius: '8px', 
                          border: paymentMode === mode.id ? '2px solid var(--primary-color)' : '1px solid rgba(255,255,255,0.2)',
                          background: paymentMode === mode.id ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '8px',
                          color: paymentMode === mode.id ? 'white' : 'var(--text-muted)'
                        }}
                      >
                        {mode.code === 'CASH' ? <DollarSign size={16} /> : <Send size={16} />}
                        {mode.code}
                      </div>
                    ))}
                  </div>
                </div>
                {paymentModes.find(m => m.id === paymentMode)?.code !== 'CASH' && (
                  <div className="fade-in">
                    <label className="form-label" style={{ color: '#f59e0b' }}>Transaction Reference Number / UTR (Mandatory)</label>
                    <input type="text" className="input-field" value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} required placeholder="e.g. UTR1234567890" style={{ border: '1px solid #f59e0b' }} />
                  </div>
                )}
                <div>
                  <label className="form-label">Amount (₹)</label>
                  <input type="number" className="input-field" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} required min="1" placeholder="Enter amount to deposit" style={{ fontSize: '1.5rem', fontWeight: 'bold' }} />
                </div>
                <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}>
                    <CheckCircle size={20} style={{ marginRight: '8px' }} />
                    Post Deposit to Ledger
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'LOAN_PAYMENT' && (
              <form onSubmit={handleLoanPayment} style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                <div style={{ padding: '16px', background: 'rgba(0, 240, 255, 0.05)', borderRadius: '8px', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                  <p style={{ color: 'var(--primary-color)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}><ArrowRightCircle size={16}/> <strong>Standard Banking Workflow:</strong> Loan EMIs must be deducted from a linked Savings/Current account. If paying by cash, deposit it into Savings first.</p>
                </div>
                
                <div>
                  <label className="form-label">Deduct From (Savings Account)</label>
                  <select className="input-field" value={loanSavingsAccount} onChange={e => setLoanSavingsAccount(e.target.value)} required>
                    <option value="">Select Source Account...</option>
                    {customer.accounts?.map((acc: any) => (
                      <option key={acc.id} value={acc.id}>{acc.accountNumber} - Avail. Balance: ₹{Number(acc.balance).toLocaleString()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Pay Towards Loan</label>
                  <select className="input-field" value={loanId} onChange={e => setLoanId(e.target.value)} required>
                    <option value="">Select Target Loan...</option>
                    {customer.loans?.map((loan: any) => (
                      <option key={loan.id} value={loan.id}>{loan.loanNumber} - EMI: ₹{Number(loan.emiAmount).toLocaleString()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Payment Amount (₹)</label>
                  <input type="number" className="input-field" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} required min="1" placeholder="Enter amount to pay" style={{ fontSize: '1.5rem', fontWeight: 'bold' }} />
                </div>
                <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', background: '#10b981' }}>
                    <CheckCircle size={20} style={{ marginRight: '8px' }} />
                    Execute Loan Payment
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
