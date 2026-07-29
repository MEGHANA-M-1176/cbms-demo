import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { 
  DollarSign, ArrowUpCircle, ArrowDownCircle, AlertTriangle, Key, Loader2, Search, CheckCircle2 
} from 'lucide-react';

export const CashOperations: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerStatus, setDrawerStatus] = useState<any>(null);
  const [openingBalance, setOpeningBalance] = useState('10000');
  const [closingBalance, setClosingBalance] = useState('');
  const [loading, setLoading] = useState(true);

  // Transaction form state
  const [accountNumber, setAccountNumber] = useState('');
  const [accountDetails, setAccountDetails] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [txType, setTxType] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [paymentModes, setPaymentModes] = useState<any[]>([]);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('');
  const [txLoading, setTxLoading] = useState(false);
  const [txSuccess, setTxSuccess] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  // AML structuring alerts
  const [amlAlerts, setAmlAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // Fetch payment modes for dropdown
      const modeRes = await apiClient.get('/config/payment-modes');
      setPaymentModes(modeRes.data);
      if (modeRes.data.length > 0) setSelectedPaymentMode(modeRes.data[0].id);

      // Fetch drawer status (current active ledger day)
      // Usually, it checks if today's day is active or closed. We can check by hitting a summary.
      // Let's assume it starts closed for test simplicity or fetch AML alerts
      const alertRes = await apiClient.get('/cash-operations/alerts');
      setAmlAlerts(alertRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchAccount = async () => {
    if (!accountNumber) return;
    try {
      setSearching(true);
      setTxError(null);
      // Query account details by accountNumber
      const res = await apiClient.get(`/accounts?accountNumber=${accountNumber}`);
      const acc = res.data[0] || res.data;
      if (!acc || acc.length === 0) {
        setTxError('Account not found');
        setAccountDetails(null);
      } else {
        setAccountDetails(Array.isArray(acc) ? acc[0] : acc);
      }
    } catch (err) {
      setTxError('Error searching for account');
    } finally {
      setSearching(false);
    }
  };

  const handleOpenDrawer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await apiClient.post('/cash-operations/ledger/open', {
        openingBalance: Number(openingBalance),
      });
      setDrawerStatus(res.data);
      setDrawerOpen(true);
      setTxSuccess('Cash drawer opened successfully!');
    } catch (err: any) {
      const data = err.response?.data;
      let msg = 'Failed to open cash drawer';
      if (data && data.message) {
        if (typeof data.message === 'string') msg = data.message;
        else if (typeof data.message === 'object') msg = data.message.message || JSON.stringify(data.message);
      }
      setTxError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDrawer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await apiClient.post('/cash-operations/ledger/close', {
        closingBalance: Number(closingBalance),
      });
      setDrawerStatus(res.data);
      setDrawerOpen(false);
      setClosingBalance('');
      setTxSuccess(`Cash drawer closed successfully! Balance matches system.`);
    } catch (err: any) {
      const data = err.response?.data;
      let msg = 'Failed to close cash drawer';
      if (data && data.message) {
        if (typeof data.message === 'string') msg = data.message;
        else if (typeof data.message === 'object') msg = data.message.message || JSON.stringify(data.message);
      }
      setTxError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountDetails) return;
    try {
      setTxLoading(true);
      setTxError(null);
      setTxSuccess(null);

      const path = txType === 'DEPOSIT' 
        ? `/accounts/${accountDetails.id}/transactions/deposit`
        : `/accounts/${accountDetails.id}/transactions/withdraw`;

      await apiClient.post(path, {
        amount: Number(amount),
        paymentModeId: selectedPaymentMode,
        remarks,
      });

      setTxSuccess(`${txType} transaction of ₹${amount} posted successfully!`);
      setAmount('');
      setRemarks('');
      
      // Refresh account details & AML alerts
      handleSearchAccount();
      const alertRes = await apiClient.get('/cash-operations/alerts');
      setAmlAlerts(alertRes.data);
    } catch (err: any) {
      const data = err.response?.data;
      let msg = 'Transaction failed. Check balance or dormancy.';
      if (data && data.message) {
        if (typeof data.message === 'string') msg = data.message;
        else if (typeof data.message === 'object') msg = data.message.message || JSON.stringify(data.message);
      }
      setTxError(msg);
    } finally {
      setTxLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
        <Loader2 className="animate-spin" size={32} style={{ color: '#10b981' }} />
        <span>Syncing Drawer status...</span>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 600 }}>Counter & Cash Desk Operations</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Teller counter ledgers & deposit/withdrawal posting</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 24 }}>
        {/* Left: Cash Drawer Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="panel">
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Key size={18} style={{ color: '#f59e0b' }} />
              <span>Cash Drawer Control</span>
            </h4>

            {!drawerOpen ? (
              <form onSubmit={handleOpenDrawer}>
                <div className="form-group">
                  <label className="form-label">Opening Balance (INR)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Open Cash Drawer
                </button>
              </form>
            ) : (
              <form onSubmit={handleCloseDrawer}>
                <div style={{ padding: '12px', backgroundColor: 'var(--accent-emerald-glow)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)', marginBottom: '16px', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>Counter is OPEN</span>
                  <div style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>
                    Ledger ID: {drawerStatus?.id || 'Active Day'}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Closing Declared Cash (INR)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    required
                    value={closingBalance}
                    onChange={(e) => setClosingBalance(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-danger" style={{ width: '100%' }}>
                  Close Cash Drawer
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Middle: Transactions Console */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>
            Teller Transaction Console
          </h4>

          {/* Search Account */}
          <div style={{ display: 'flex', gap: 12, marginBottom: '24px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-control" 
                style={{ paddingLeft: 44 }}
                placeholder="Search Account Number (e.g. SAV000001)"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
            <button onClick={handleSearchAccount} className="btn btn-secondary" disabled={searching}>
              {searching ? 'Finding...' : 'Find'}
            </button>
          </div>

          {txError && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', 
              backgroundColor: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)',
              padding: '12px', borderRadius: '8px', color: 'var(--accent-rose)', 
              fontSize: '0.85rem', marginBottom: '20px'
            }}>
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <span>{txError}</span>
            </div>
          )}

          {txSuccess && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', 
              backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)',
              padding: '12px', borderRadius: '8px', color: 'var(--accent-emerald)', 
              fontSize: '0.85rem', marginBottom: '20px'
            }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>{txSuccess}</span>
            </div>
          )}

          {accountDetails ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Account details card */}
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--panel-border)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <strong style={{ fontSize: '1rem' }}>{accountDetails.customer?.fullName}</strong>
                  <span className="badge badge-success">{accountDetails.status}</span>
                </div>
                <div style={{ display: 'flex', gap: 24, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div>Acc No: <span style={{ color: '#fff' }}>{accountDetails.accountNumber}</span></div>
                  <div>Balance: <span style={{ color: '#10b981', fontWeight: 600 }}>₹{accountDetails.balance}</span></div>
                  <div>Type: <span style={{ color: '#fff' }}>{accountDetails.depositType?.name}</span></div>
                </div>
              </div>

              {/* Transaction form */}
              <form onSubmit={handleExecuteTransaction}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                  <button 
                    type="button" 
                    onClick={() => setTxType('DEPOSIT')}
                    className="btn" 
                    style={{
                      flex: 1, gap: 8,
                      backgroundColor: txType === 'DEPOSIT' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.02)',
                      color: txType === 'DEPOSIT' ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                      border: txType === 'DEPOSIT' ? '1px solid rgba(16,185,129,0.2)' : '1px solid var(--panel-border)'
                    }}
                  >
                    <ArrowUpCircle size={18} />
                    <span>Deposit Cash</span>
                  </button>

                  <button 
                    type="button" 
                    onClick={() => setTxType('WITHDRAWAL')}
                    className="btn"
                    style={{
                      flex: 1, gap: 8,
                      backgroundColor: txType === 'WITHDRAWAL' ? 'rgba(244,63,94,0.15)' : 'rgba(255,255,255,0.02)',
                      color: txType === 'WITHDRAWAL' ? 'var(--accent-rose)' : 'var(--text-secondary)',
                      border: txType === 'WITHDRAWAL' ? '1px solid rgba(244,63,94,0.2)' : '1px solid var(--panel-border)'
                    }}
                  >
                    <ArrowDownCircle size={18} />
                    <span>Withdraw Cash</span>
                  </button>
                </div>

                <div className="form-group">
                  <label className="form-label">Transaction Amount (INR)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    required 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Mode</label>
                  <select 
                    className="form-control" 
                    value={selectedPaymentMode}
                    onChange={(e) => setSelectedPaymentMode(e.target.value)}
                  >
                    {paymentModes.map((mode) => (
                      <option key={mode.id} value={mode.id}>{mode.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Remarks / Description</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Customer deposit/withdraw description"
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', gap: 8 }}
                  disabled={txLoading}
                >
                  {txLoading ? <Loader2 className="animate-spin" size={16} /> : <DollarSign size={16} />}
                  <span>Execute {txType === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'}</span>
                </button>
              </form>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', border: '1px dashed var(--panel-border)', borderRadius: '8px' }}>
              Enter and verify an Account Number above to start cash postings
            </div>
          )}
        </div>

        {/* Right: AML Cash Structuring alerts */}
        <div className="panel">
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} style={{ color: '#f43f5e' }} />
            <span>Structuring Breaches</span>
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {amlAlerts.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '24px 0' }}>
                No active AML breaches today
              </div>
            ) : (
              amlAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  style={{ 
                    padding: '12px', backgroundColor: 'rgba(244,63,94,0.05)', 
                    border: '1px solid rgba(244,63,94,0.15)', borderRadius: '8px',
                    fontSize: '0.825rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ color: '#fff' }}>{alert.customer?.fullName}</strong>
                    <span style={{ color: '#f43f5e', fontWeight: 600 }}>₹{alert.metadata?.totalCashAmount}</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.775rem' }}>
                    Limit: ₹{alert.metadata?.thresholdLimit} reached dynamically.
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

