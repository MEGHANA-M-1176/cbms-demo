import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { 
  Settings, Percent, ShieldCheck, Loader2, MapPin
} from 'lucide-react';

export const Configuration: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('LOAN_RATES');
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // States for Loan Types
  const [loanTypes, setLoanTypes] = useState<any[]>([]);
  const [selectedLoanType, setSelectedLoanType] = useState<any>(null);
  const [loanRate, setLoanRate] = useState('');

  // States for Deposit Types
  const [depositTypes, setDepositTypes] = useState<any[]>([]);
  const [selectedDepositType, setSelectedDepositType] = useState<any>(null);
  const [depositRate, setDepositRate] = useState('');

  // States for Fraud Rules
  const [dormantDays, setDormantDays] = useState('30');
  const [incomeRatio, setIncomeRatio] = useState('40');

  // States for Cashier Settings
  const [paymentModes, setPaymentModes] = useState<any[]>([]);
  const [newPaymentCode, setNewPaymentCode] = useState('');
  const [newPaymentName, setNewPaymentName] = useState('');

  // States for Generic Config Tables
  const [genericConfigs, setGenericConfigs] = useState<any[]>([]);

  // States for Visit Types
  const [visitTypes, setVisitTypes] = useState<any[]>([]);
  const [visitCode, setVisitCode] = useState('');
  const [visitName, setVisitName] = useState('');
  const [visitDesc, setVisitDesc] = useState('');

  // Removed Customer Onboarding states

  // States for Create Loan Type
  const [newLoan, setNewLoan] = useState<any>({
    code: '', name: '', minAmount: 10000, maxAmount: 5000000, minTenureMonths: 6, maxTenureMonths: 60,
    currentInterestRate: 10.0, interestCalculationType: 'REDUCING_BALANCE', compoundingFrequency: 'MONTHLY',
    processingFeePercent: 1.0, gstPercent: 18.0, penaltyRatePercent: 2.0, penaltyCalculationType: 'MONTHLY',
    gracePeriodDays: 5, minimumLockInPeriodMonths: 6, foreclosureChargesPercent: 2.0, partPaymentAllowed: true,
    minPartPaymentAmount: 5000, minEmi: 0, maxEmi: 0, autoDebitAllowed: true, emiDueDateType: 'D_5TH',
    maxDebtRatioPercent: 50, defaultDisbursementAccountId: ''
  });
  const [ledgerAccounts, setLedgerAccounts] = useState<any[]>([]);

  // States for Bank Accounts
  const [newBankAccountCode, setNewBankAccountCode] = useState('');
  const [newBankAccountName, setNewBankAccountName] = useState('');
  const [newBankAccountDesc, setNewBankAccountDesc] = useState('');

  // States for Staff Roles
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [staffForm, setStaffForm] = useState({
    employeeCode: '', fullName: '', email: '', phone: '', temporaryPassword: '', roleId: '', branchId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // States for System Settings
  const [systemSettings, setSystemSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchConfigs();
  }, [activeCategory]);

  const handleTogglePaymentMode = async (id: string, isActive: boolean) => {
    try {
      await apiClient.put(`/cashier/payment-modes/${id}`, { isActive });
      setPaymentModes(modes => modes.map(m => m.id === id ? { ...m, isActive } : m));
      setSaveSuccess('Payment mode updated successfully.');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (error) {
      alert('Failed to update payment mode');
    }
  };

  const handleAddPaymentMode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post(`/cashier/payment-modes`, { code: newPaymentCode, name: newPaymentName });
      setSaveSuccess('Payment mode created successfully.');
      setNewPaymentCode('');
      setNewPaymentName('');
      setTimeout(() => setSaveSuccess(null), 3000);
      fetchConfigs();
    } catch (error) {
      alert('Failed to create payment mode. Code might already exist.');
    }
  };

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      setSaveSuccess(null);
      if (activeCategory === 'LOAN_RATES') {
        const [res, accRes] = await Promise.all([
          apiClient.get('/config/loan-types'),
          apiClient.get('/ledger/accounts')
        ]);
        setLoanTypes(res.data);
        setLedgerAccounts(accRes.data.filter((a: any) => a.type === 'ASSET'));
      } else if (activeCategory === 'BANK_ACCOUNTS') {
        const accRes = await apiClient.get('/ledger/accounts');
        setLedgerAccounts(accRes.data.filter((a: any) => a.type === 'ASSET'));
      } else if (activeCategory === 'DEPOSIT_RATES') {
        const res = await apiClient.get('/config/deposit-types');
        setDepositTypes(res.data);
      } else if (activeCategory === 'FRAUD_RULES') {
        const res = await apiClient.get('/fraud/rules');
        if (res.data) {
          setDormantDays(String(res.data.dormantDaysThreshold || 30));
          setIncomeRatio(String(res.data.incomeRatioThresholdPercent || 10));
        }
      } else if (activeCategory === 'VISIT_TYPES') {
        const res = await apiClient.get('/field-visits/configs/types');
        setVisitTypes(res.data || []);
      } else if (['VISIT_CATEGORIES', 'VISIT_STATUSES', 'VISIT_PRIORITIES', 'VISIT_RISK_LEVELS', 'VISIT_REASONS', 'RESCHEDULE_REASONS', 'VISIT_OUTCOMES', 'ESCALATION_RULES'].includes(activeCategory)) {
        const endpointMap: Record<string, string> = {
          'VISIT_CATEGORIES': '/field-visits/configs/categories',
          'VISIT_STATUSES': '/field-visits/configs/statuses',
          'VISIT_PRIORITIES': '/field-visits/configs/priorities',
          'VISIT_RISK_LEVELS': '/field-visits/configs/risk-levels',
          'VISIT_REASONS': '/field-visits/configs/reasons',
          'RESCHEDULE_REASONS': '/field-visits/configs/reschedule-reasons',
          'VISIT_OUTCOMES': '/field-visits/configs/feedback',
          'ESCALATION_RULES': '/field-visits/configs/escalation-rules',
        };
        const res = await apiClient.get(endpointMap[activeCategory]);
        setGenericConfigs(res.data || []);
      } else if (activeCategory === 'STAFF_ROLES') {
        const [usersRes, rolesRes, branchesRes] = await Promise.all([
          apiClient.get('/users'),
          apiClient.get('/users/roles'),
          apiClient.get('/users/branches')
        ]);
        setStaffUsers(usersRes.data || []);
        setRoles(rolesRes.data || []);
        setBranches(branchesRes.data || []);
        if (rolesRes.data?.length > 0) setStaffForm(s => ({ ...s, roleId: rolesRes.data[0].id }));
        if (branchesRes.data?.length > 0) setStaffForm(s => ({ ...s, branchId: branchesRes.data[0].id }));
      } else if (activeCategory === 'SYSTEM_SETTINGS') {
        const res = await apiClient.get('/config/system-settings');
        setSystemSettings(res.data || {});
      } else if (activeCategory === 'CASHIER_SETTINGS') {
        const res = await apiClient.get('/cashier/payment-modes');
        setPaymentModes(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLoanRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanType) return;
    try {
      await apiClient.patch(`/config/loan-types/${selectedLoanType.id}/interest-rate`, {
        newRate: Number(loanRate),
      });
      setSaveSuccess('Loan interest rate updated successfully.');
      setSelectedLoanType(null);
      setLoanRate('');
      fetchConfigs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateLoanType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/config/loan-types', {
        ...newLoan,
        minEmi: newLoan.minEmi || undefined,
        maxEmi: newLoan.maxEmi || undefined,
        defaultDisbursementAccountId: newLoan.defaultDisbursementAccountId || undefined
      });
      setSaveSuccess('New Loan Type created successfully.');
      setNewLoan({
        code: '', name: '', minAmount: 10000, maxAmount: 5000000, minTenureMonths: 6, maxTenureMonths: 60,
        currentInterestRate: 10.0, interestCalculationType: 'REDUCING_BALANCE', compoundingFrequency: 'MONTHLY',
        processingFeePercent: 1.0, gstPercent: 18.0, penaltyRatePercent: 2.0, penaltyCalculationType: 'MONTHLY',
        gracePeriodDays: 5, minimumLockInPeriodMonths: 6, foreclosureChargesPercent: 2.0, partPaymentAllowed: true,
        minPartPaymentAmount: 5000, minEmi: 0, maxEmi: 0, autoDebitAllowed: true, emiDueDateType: 'D_5TH',
        maxDebtRatioPercent: 50, defaultDisbursementAccountId: ''
      });
      fetchConfigs();
    } catch (err: any) {
      const dataMsg = err.response?.data?.message;
      const msg = dataMsg?.message || dataMsg;
      alert(Array.isArray(msg) ? msg.join(', ') : (typeof msg === 'string' ? msg : 'Failed to create loan type.'));
    }
  };

  const handleRemoveLoanType = async (id: string) => {
    try {
      await apiClient.patch(`/config/loan-types/${id}`, { isActive: false });
      setSaveSuccess('Loan type removed successfully.');
      setSelectedLoanType(null);
      fetchConfigs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateDepositRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepositType) return;
    try {
      await apiClient.patch(`/config/deposit-types/${selectedDepositType.id}`, {
        currentInterestRate: Number(depositRate),
      });
      setSaveSuccess('Deposit interest rate updated successfully.');
      setSelectedDepositType(null);
      setDepositRate('');
      fetchConfigs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveFraudRules = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/fraud/rules', {
        dormantDaysThreshold: Number(dormantDays),
        incomeRatioThresholdPercent: Number(incomeRatio),
      });
      setSaveSuccess('Fraud rules and threshold settings saved.');
      fetchConfigs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveDepositType = async (id: string) => {
    try {
      await apiClient.patch(`/config/deposit-types/${id}`, { isActive: false });
      setSaveSuccess('Deposit type removed successfully.');
      setSelectedDepositType(null);
      fetchConfigs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateVisitType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/config/visit-types', {
        code: visitCode,
        name: visitName,
        description: visitDesc
      });
      setSaveSuccess('New Field Visit Type added successfully.');
      setVisitCode('');
      setVisitName('');
      setVisitDesc('');
      fetchConfigs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add visit type.');
    }
  };

  const handleToggleVisitType = async (id: string, currentStatus: boolean) => {
    try {
      await apiClient.patch(`/config/visit-types/${id}`, {
        isActive: !currentStatus
      });
      fetchConfigs();
    } catch (err) {
      console.error(err);
    }
  };

  // Removed handleRegisterCustomer

  const handleCreateBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/ledger/accounts', {
        code: newBankAccountCode,
        name: newBankAccountName,
        description: newBankAccountDesc,
        type: 'ASSET'
      });
      setSaveSuccess('New Bank Account added successfully.');
      setNewBankAccountCode('');
      setNewBankAccountName('');
      setNewBankAccountDesc('');
      fetchConfigs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add bank account.');
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setSaveSuccess(null);
      setErrorMsg(null);
      await apiClient.post('/users', staffForm);
      setSaveSuccess('Staff account created successfully!');
      setStaffForm({ ...staffForm, employeeCode: '', fullName: '', email: '', phone: '', temporaryPassword: '' });
      fetchConfigs();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create staff account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSystemSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.put('/config/system-settings', systemSettings);
      setSaveSuccess('System settings updated successfully.');
      fetchConfigs();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 600 }}>System Configuration Portal</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Dynamic configurations for banking modules</p>
        </div>
        
        {/* Category Dropdown */}
        <div style={{ width: '300px' }}>
          <label className="form-label">Select Configuration Module</label>
          <select 
            className="form-control" 
            value={activeCategory} 
            onChange={(e) => setActiveCategory(e.target.value)}
          >
            <option value="LOAN_RATES">1. Loan Products & Interest Rates</option>
            <option value="DEPOSIT_RATES">2. Deposit Schemes & Interest Rates</option>
            <option value="CASHIER_SETTINGS">3. Teller & Cashier Payment Modes</option>
            <option value="VISIT_TYPES">4. Field Visit Types (12 Seeded)</option>
            <option value="VISIT_CATEGORIES">5. Field Visit Categories (10 Seeded)</option>
            <option value="VISIT_STATUSES">6. Field Visit Status Workflow (11 Seeded)</option>
            <option value="VISIT_PRIORITIES">7. Priority Levels & Color Badges</option>
            <option value="VISIT_RISK_LEVELS">8. Account Risk Classifications</option>
            <option value="VISIT_REASONS">9. Visit Trigger Reasons</option>
            <option value="RESCHEDULE_REASONS">10. Reschedule Reasons</option>
            <option value="VISIT_OUTCOMES">11. Feedback Outcomes & Action Rules</option>
            <option value="ESCALATION_RULES">12. SLA Auto-Escalation Rules</option>
            <option value="STAFF_ROLES">13. Staff & Role-Based Access Control</option>
            <option value="FRAUD_RULES">14. Fraud & Risk Threshold Rules</option>
            <option value="BANK_ACCOUNTS">15. General Ledger Bank Accounts</option>
            <option value="SYSTEM_SETTINGS">16. Global System Parameters</option>
          </select>
        </div>
      </div>

      {saveSuccess && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', 
          backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)',
          padding: '12px', borderRadius: '8px', color: 'var(--accent-emerald)', 
          fontSize: '0.85rem', marginBottom: '24px'
        }}>
          <ShieldCheck size={18} style={{ flexShrink: 0 }} />
          <span>{saveSuccess}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', gap: 12 }}>
          <Loader2 className="animate-spin" size={32} style={{ color: '#10b981' }} />
          <span>Loading module settings...</span>
        </div>
      ) : (
        <div style={{ maxWidth: '800px' }}>
          
          {/* LOAN RATES */}
          {activeCategory === 'LOAN_RATES' && (
            <div className="panel">
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Percent size={18} style={{ color: '#f43f5e' }} />
                <span>Loan Interest Indices</span>
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {loanTypes.map((l) => (
                    <div 
                      key={l.id} 
                      onClick={() => {
                        setSelectedLoanType(l);
                        setLoanRate(String(l.currentInterestRate));
                      }}
                      style={{ 
                        padding: '12px', background: 'rgba(255,255,255,0.01)', 
                        border: '1px solid var(--panel-border)', borderRadius: '8px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        cursor: 'pointer',
                        borderColor: selectedLoanType?.id === l.id ? 'var(--accent-rose)' : 'var(--panel-border)'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{l.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Code: {l.code}</div>
                      </div>
                      <strong style={{ color: '#f43f5e' }}>{l.currentInterestRate}%</strong>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Update Rate Form */}
                  {selectedLoanType ? (
                    <form onSubmit={handleUpdateLoanRate} className="panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div className="form-group">
                        <label className="form-label">Update Interest Rate for {selectedLoanType.name} (%)</label>
                        <input type="number" step="0.01" className="form-control" required value={loanRate} onChange={(e) => setLoanRate(e.target.value)} />
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                          Save Changes
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-danger" 
                          style={{ flex: 1 }}
                          onClick={() => handleRemoveLoanType(selectedLoanType.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--panel-border)', borderRadius: '8px' }}>
                      Select a loan type to edit its rate
                    </div>
                  )}

                  {/* Create New Loan Type Form */}
                  <form onSubmit={handleCreateLoanType} className="panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <h5 style={{ marginBottom: '16px' }}>Create New Loan Type</h5>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
                      <div className="form-group"><label className="form-label">Code</label><input type="text" className="form-control" required value={newLoan.code} onChange={(e) => setNewLoan({...newLoan, code: e.target.value.toUpperCase()})} /></div>
                      <div className="form-group"><label className="form-label">Name</label><input type="text" className="form-control" required value={newLoan.name} onChange={(e) => setNewLoan({...newLoan, name: e.target.value})} /></div>
                      
                      <div className="form-group"><label className="form-label">Interest Rate (%)</label><input type="number" step="0.01" className="form-control" required value={newLoan.currentInterestRate} onChange={(e) => setNewLoan({...newLoan, currentInterestRate: Number(e.target.value)})} /></div>
                      <div className="form-group">
                        <label className="form-label">Interest Calculation Type</label>
                        <select className="form-control" value={newLoan.interestCalculationType} onChange={(e) => setNewLoan({...newLoan, interestCalculationType: e.target.value})}>
                          <option value="FLAT">Flat</option>
                          <option value="REDUCING_BALANCE">Reducing Balance</option>
                          <option value="DAILY_BALANCE">Daily Balance</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Compounding Frequency</label>
                        <select className="form-control" value={newLoan.compoundingFrequency} onChange={(e) => setNewLoan({...newLoan, compoundingFrequency: e.target.value})}>
                          <option value="MONTHLY">Monthly</option>
                          <option value="QUARTERLY">Quarterly</option>
                          <option value="HALF_YEARLY">Half-Yearly</option>
                          <option value="YEARLY">Yearly</option>
                        </select>
                      </div>
                      
                      <div className="form-group"><label className="form-label">Processing Fee (%)</label><input type="number" step="0.01" className="form-control" required value={newLoan.processingFeePercent} onChange={(e) => setNewLoan({...newLoan, processingFeePercent: Number(e.target.value)})} /></div>
                      <div className="form-group"><label className="form-label">GST (%)</label><input type="number" step="0.01" className="form-control" required value={newLoan.gstPercent} onChange={(e) => setNewLoan({...newLoan, gstPercent: Number(e.target.value)})} /></div>
                      <div className="form-group"><label className="form-label">Max Debt Ratio (%)</label><input type="number" step="0.01" className="form-control" required value={newLoan.maxDebtRatioPercent} onChange={(e) => setNewLoan({...newLoan, maxDebtRatioPercent: Number(e.target.value)})} /></div>
                      
                      <div className="form-group"><label className="form-label">Penalty Rate (%)</label><input type="number" step="0.01" className="form-control" required value={newLoan.penaltyRatePercent} onChange={(e) => setNewLoan({...newLoan, penaltyRatePercent: Number(e.target.value)})} /></div>
                      <div className="form-group">
                        <label className="form-label">Penalty Calculation Type</label>
                        <select className="form-control" value={newLoan.penaltyCalculationType} onChange={(e) => setNewLoan({...newLoan, penaltyCalculationType: e.target.value})}>
                          <option value="DAILY">Daily</option>
                          <option value="MONTHLY">Monthly</option>
                        </select>
                      </div>
                      <div className="form-group"><label className="form-label">Grace Period (Days)</label><input type="number" className="form-control" required value={newLoan.gracePeriodDays} onChange={(e) => setNewLoan({...newLoan, gracePeriodDays: Number(e.target.value)})} /></div>
                      
                      <div className="form-group"><label className="form-label">Min Lock-in Period (Months)</label><input type="number" className="form-control" required value={newLoan.minimumLockInPeriodMonths} onChange={(e) => setNewLoan({...newLoan, minimumLockInPeriodMonths: Number(e.target.value)})} /></div>
                      <div className="form-group"><label className="form-label">Foreclosure Charges (%)</label><input type="number" step="0.01" className="form-control" required value={newLoan.foreclosureChargesPercent} onChange={(e) => setNewLoan({...newLoan, foreclosureChargesPercent: Number(e.target.value)})} /></div>
                      
                      <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input type="checkbox" checked={newLoan.partPaymentAllowed} onChange={(e) => setNewLoan({...newLoan, partPaymentAllowed: e.target.checked})} />
                        <label className="form-label" style={{ marginBottom: 0 }}>Part Payment Allowed</label>
                      </div>
                      <div className="form-group"><label className="form-label">Min Part Payment Amt</label><input type="number" className="form-control" required value={newLoan.minPartPaymentAmount} onChange={(e) => setNewLoan({...newLoan, minPartPaymentAmount: Number(e.target.value)})} /></div>

                      <div className="form-group">
                        <label className="form-label">EMI Due Date</label>
                        <select className="form-control" value={newLoan.emiDueDateType} onChange={(e) => setNewLoan({...newLoan, emiDueDateType: e.target.value})}>
                          <option value="D_1ST">1st of Month</option>
                          <option value="D_5TH">5th of Month</option>
                          <option value="D_10TH">10th of Month</option>
                          <option value="D_15TH">15th of Month</option>
                          <option value="D_20TH">20th of Month</option>
                          <option value="D_25TH">25th of Month</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input type="checkbox" checked={newLoan.autoDebitAllowed} onChange={(e) => setNewLoan({...newLoan, autoDebitAllowed: e.target.checked})} />
                        <label className="form-label" style={{ marginBottom: 0 }}>Auto Debit Allowed</label>
                      </div>

                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">Default Disbursement Account (Optional)</label>
                        <select className="form-control" value={newLoan.defaultDisbursementAccountId} onChange={(e) => setNewLoan({...newLoan, defaultDisbursementAccountId: e.target.value})}>
                          <option value="">-- Cash in Hand (Default) --</option>
                          {ledgerAccounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>
                      Create Loan Type
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* DEPOSIT RATES */}
          {activeCategory === 'DEPOSIT_RATES' && (
            <div className="panel">
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Percent size={18} style={{ color: '#3b82f6' }} />
                <span>Deposit Product Types & Rates Configuration</span>
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <h5 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Existing Products</h5>
                  {depositTypes.map((d) => (
                    <div 
                      key={d.id} 
                      onClick={() => {
                        setSelectedDepositType(d);
                        setDepositRate(String(d.currentInterestRate));
                      }}
                      style={{ 
                        padding: '12px', background: 'rgba(255,255,255,0.01)', 
                        border: '1px solid var(--panel-border)', borderRadius: '8px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        cursor: 'pointer',
                        borderColor: selectedDepositType?.id === d.id ? 'var(--accent-sapphire)' : 'var(--panel-border)'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{d.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Code: {d.code} | Min: ₹{d.minOpeningAmount || 0}</div>
                      </div>
                      <strong style={{ color: '#3b82f6' }}>{d.currentInterestRate}%</strong>
                    </div>
                  ))}
                  {depositTypes.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No deposit types configured.</p>}
                </div>

                <div>
                  {selectedDepositType ? (
                    <form onSubmit={handleUpdateDepositRate} className="panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <h5 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12 }}>Edit {selectedDepositType.name}</h5>
                      <div className="form-group">
                        <label className="form-label">Interest Rate (%)</label>
                        <input type="number" step="0.01" className="form-control" required value={depositRate} onChange={(e) => setDepositRate(e.target.value)} />
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                          Save Changes
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-danger" 
                          style={{ flex: 1 }}
                          onClick={() => handleRemoveDepositType(selectedDepositType.id)}
                        >
                          Deactivate
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--panel-border)', borderRadius: '8px' }}>
                      Select a deposit product type on the left to edit its interest rate
                    </div>
                  )}
                </div>
              </div>

              {/* Add New Deposit Product Type Form */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px' }}>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 600, marginBottom: '16px' }}>+ Add New Deposit Product Type</h4>
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const code = (form.elements.namedItem('depCode') as HTMLInputElement).value;
                    const name = (form.elements.namedItem('depName') as HTMLInputElement).value;
                    const rate = Number((form.elements.namedItem('depRate') as HTMLInputElement).value);
                    const minAmount = Number((form.elements.namedItem('depMinAmount') as HTMLInputElement).value);
                    const interestBasis = (form.elements.namedItem('depBasis') as HTMLSelectElement).value;

                    try {
                      await apiClient.post('/config/deposit-types', {
                        code,
                        name,
                        currentInterestRate: rate,
                        minOpeningAmount: minAmount,
                        interestBasis,
                        allowsPartialWithdrawal: interestBasis === 'DAILY_BALANCE'
                      });
                      setSaveSuccess('New Deposit Product Type created successfully!');
                      form.reset();
                      fetchConfigs();
                    } catch (err: any) {
                      alert(err.response?.data?.message || 'Failed to create deposit type');
                    }
                  }} 
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}
                >
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Product Code</label>
                    <input name="depCode" type="text" className="form-control" placeholder="e.g. RD" required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Product Name</label>
                    <input name="depName" type="text" className="form-control" placeholder="e.g. Recurring Deposit" required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Interest Rate (%)</label>
                    <input name="depRate" type="number" step="0.01" className="form-control" placeholder="6.5" required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Min Opening (₹)</label>
                    <input name="depMinAmount" type="number" className="form-control" placeholder="500" defaultValue="500" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Interest Basis</label>
                    <select name="depBasis" className="form-control" required>
                      <option value="DAILY_BALANCE">Daily Balance</option>
                      <option value="MONTHLY">Monthly</option>
                      <option value="QUARTERLY">Quarterly</option>
                      <option value="ON_MATURITY">On Maturity</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ height: '42px', padding: '0 20px' }}>
                    Add Product
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* FRAUD RULES */}
          {activeCategory === 'FRAUD_RULES' && (
            <div className="panel">
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Settings size={18} style={{ color: '#10b981' }} />
                <span>Fraud Threshold Rules</span>
              </h4>

              <form onSubmit={handleSaveFraudRules}>
                <div className="form-group">
                  <label className="form-label">Account Dormancy Scan Threshold (Days)</label>
                  <input type="number" className="form-control" required value={dormantDays} onChange={(e) => setDormantDays(e.target.value)} placeholder="e.g. 30" />
                </div>

                <div className="form-group">
                  <label className="form-label">Income Ratio Threshold (%)</label>
                  <input type="number" className="form-control" required value={incomeRatio} onChange={(e) => setIncomeRatio(e.target.value)} placeholder="e.g. 10" />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: 4 }}>
                    Triggers an alert when a single transaction amount exceeds this percentage of a customer's annual income.
                  </p>
                </div>

                <button type="submit" className="btn btn-primary">
                  Save Threshold Rules
                </button>
              </form>
            </div>
          )}

          {/* VISIT TYPES */}
          {activeCategory === 'VISIT_TYPES' && (
            <div className="panel">
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={18} style={{ color: '#8b5cf6' }} />
                <span>Field Visit Types</span>
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div>
                  <h5 style={{ fontSize: '0.9rem', marginBottom: 12, color: 'var(--text-secondary)' }}>Existing Visit Types</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {visitTypes.map(v => (
                      <div key={v.id} style={{ 
                        padding: '12px', background: 'rgba(255,255,255,0.01)', 
                        border: '1px solid var(--panel-border)', borderRadius: '8px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{v.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Code: {v.code}</div>
                        </div>
                        <button 
                          onClick={() => handleToggleVisitType(v.id, v.isActive)}
                          className={`btn ${v.isActive ? 'btn-danger' : 'btn-primary'}`}
                          style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                        >
                          {v.isActive ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    ))}
                    {visitTypes.length === 0 && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No visit types configured yet.</div>}
                  </div>
                </div>

                <form onSubmit={handleCreateVisitType} className="panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <h5 style={{ fontSize: '0.9rem', marginBottom: 12, fontWeight: 600 }}>Add New Visit Type</h5>
                  <div className="form-group">
                    <label className="form-label">Code (Unique)</label>
                    <input type="text" className="form-control" required value={visitCode} onChange={e => setVisitCode(e.target.value)} placeholder="e.g. HOME_VISIT" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input type="text" className="form-control" required value={visitName} onChange={e => setVisitName(e.target.value)} placeholder="e.g. Residence Verification" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description (Optional)</label>
                    <input type="text" className="form-control" value={visitDesc} onChange={e => setVisitDesc(e.target.value)} />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Visit Type</button>
                </form>
              </div>
            </div>
          )}

          {/* BANK ACCOUNTS */}
          {activeCategory === 'BANK_ACCOUNTS' && (
            <div className="panel">
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Settings size={18} style={{ color: '#f59e0b' }} />
                <span>Bank Accounts Configuration</span>
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div>
                  <h5 style={{ fontSize: '0.9rem', marginBottom: 12, color: 'var(--text-secondary)' }}>Existing Asset Accounts</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {ledgerAccounts.map(v => (
                      <div key={v.id} style={{ 
                        padding: '12px', background: 'rgba(255,255,255,0.01)', 
                        border: '1px solid var(--panel-border)', borderRadius: '8px',
                      }}>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{v.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Code: {v.code}</div>
                        {v.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{v.description}</div>}
                      </div>
                    ))}
                    {ledgerAccounts.length === 0 && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No bank accounts found.</div>}
                  </div>
                </div>

                <form onSubmit={handleCreateBankAccount} className="panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <h5 style={{ fontSize: '0.9rem', marginBottom: 12, fontWeight: 600 }}>Add New Bank Account</h5>
                  <div className="form-group">
                    <label className="form-label">Code (Unique)</label>
                    <input type="text" className="form-control" required value={newBankAccountCode} onChange={e => setNewBankAccountCode(e.target.value)} placeholder="e.g. 1001" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input type="text" className="form-control" required value={newBankAccountName} onChange={e => setNewBankAccountName(e.target.value)} placeholder="e.g. HDFC Current Account" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description (Optional)</label>
                    <input type="text" className="form-control" value={newBankAccountDesc} onChange={e => setNewBankAccountDesc(e.target.value)} />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Account</button>
                </form>
              </div>
            </div>
          )}

          {/* CUSTOMER ONBOARDING (Moved to Customer Directory) */}

          {/* STAFF ROLES */}
          {activeCategory === 'STAFF_ROLES' && (
            <div className="panel">
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={20} style={{ color: 'var(--accent-sapphire)' }} />
                <span>Staff & Roles Management</span>
              </h4>

              {errorMsg && (
                <div style={{ backgroundColor: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                  {errorMsg}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Staff List */}
                <div>
                  <h5 style={{ fontSize: '0.95rem', marginBottom: 12, fontWeight: 600 }}>Active Staff Members</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '500px', overflowY: 'auto', paddingRight: '8px' }}>
                    {staffUsers.map(user => {
                      const lastLogin = user.loginHistory?.[0];
                      const isOnline = lastLogin && lastLogin.status === 'SUCCESS' && !lastLogin.logoutTime;
                      return (
                        <div key={user.id} style={{ 
                          padding: '12px', background: 'rgba(255,255,255,0.01)', 
                          border: '1px solid var(--panel-border)', borderRadius: '8px',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user.fullName} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-secondary)' }}>({user.employeeCode})</span></div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--accent-sapphire)', marginTop: '2px' }}>{user.role?.name}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Branch: {user.branch?.name || 'Unassigned'}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ 
                                display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600,
                                backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                                color: isOnline ? 'var(--accent-emerald)' : 'var(--text-secondary)'
                              }}>
                                {isOnline ? 'Online' : 'Offline'}
                              </span>
                            </div>
                          </div>
                          {lastLogin && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--panel-border)' }}>
                              Last Login: {new Date(lastLogin.loginTime).toLocaleString()}
                              {lastLogin.logoutTime && <span> • Logged out: {new Date(lastLogin.logoutTime).toLocaleTimeString()}</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Add New Staff Form */}
                <form onSubmit={handleCreateStaff} style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
                  <h5 style={{ fontSize: '0.95rem', marginBottom: 16, fontWeight: 600 }}>Create New Staff Account</h5>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Employee Code *</label>
                        <input type="text" className="form-control" required value={staffForm.employeeCode} onChange={e => setStaffForm({...staffForm, employeeCode: e.target.value.toUpperCase()})} placeholder="e.g. EMP001" />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Full Name *</label>
                        <input type="text" className="form-control" required value={staffForm.fullName} onChange={e => setStaffForm({...staffForm, fullName: e.target.value})} placeholder="e.g. John Doe" />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Email Address *</label>
                      <input type="email" className="form-control" required value={staffForm.email} onChange={e => setStaffForm({...staffForm, email: e.target.value})} placeholder="john@gurudevabank.com" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Assign Role *</label>
                        <select className="form-control" required value={staffForm.roleId} onChange={e => setStaffForm({...staffForm, roleId: e.target.value})}>
                          {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Assign Branch *</label>
                        <select className="form-control" required value={staffForm.branchId} onChange={e => setStaffForm({...staffForm, branchId: e.target.value})}>
                          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Temporary Password *</label>
                      <input type="password" className="form-control" required minLength={8} value={staffForm.temporaryPassword} onChange={e => setStaffForm({...staffForm, temporaryPassword: e.target.value})} placeholder="Min 8 characters" />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ marginTop: '8px' }}>
                      {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Create Staff Member'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* SYSTEM SETTINGS */}
          {activeCategory === 'SYSTEM_SETTINGS' && (
            <div className="panel">
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Settings size={18} style={{ color: '#10b981' }} />
                <span>Global System Settings</span>
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
                Configure global application variables like validation lengths and limits.
              </p>

              <form onSubmit={handleSaveSystemSettings}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
                  <div>
                    <label className="form-label">Phone Number Validation Length</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={systemSettings['PHONE_NUMBER_LENGTH'] || ''}
                      onChange={(e) => setSystemSettings({ ...systemSettings, PHONE_NUMBER_LENGTH: e.target.value })}
                      required
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                      Standard is 10 digits. Set this to exactly how many digits the UI should require.
                    </small>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', alignSelf: 'flex-start' }}>Save Settings</button>
                </div>
              </form>
            </div>
          )}

          {/* CASHIER SETTINGS */}
          {activeCategory === 'CASHIER_SETTINGS' && (
            <div className="panel">
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                Cashier & Teller Operations
              </h4>
              <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Enable or disable specific payment modes for branch tellers.</p>
              
              <div style={{ display: 'grid', gap: '12px' }}>
                {paymentModes.map(mode => (
                  <div key={mode.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div>
                      <p style={{ fontWeight: '600' }}>{mode.name} ({mode.code})</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status: {mode.isActive ? 'Active' : 'Disabled'}</p>
                    </div>
                    <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                      <input 
                        type="checkbox" 
                        checked={mode.isActive} 
                        onChange={(e) => handleTogglePaymentMode(mode.id, e.target.checked)}
                        style={{ opacity: 0, width: 0, height: 0 }} 
                      />
                      <span className="slider round" style={{ 
                        position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, 
                        backgroundColor: mode.isActive ? '#10b981' : '#4b5563', borderRadius: '24px', transition: '.4s' 
                      }}>
                        <span style={{
                          position: 'absolute', content: '""', height: '18px', width: '18px', left: mode.isActive ? '26px' : '3px', bottom: '3px',
                          backgroundColor: 'white', transition: '.4s', borderRadius: '50%'
                        }} />
                      </span>
                    </label>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '32px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px' }}>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 600, marginBottom: '16px' }}>+ Add New Payment Mode</h4>
                <form onSubmit={handleAddPaymentMode} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Mode Code (e.g., IMPS)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={newPaymentCode}
                      onChange={e => setNewPaymentCode(e.target.value)}
                      placeholder="Code"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Mode Name (e.g., IMPS Transfer)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={newPaymentName}
                      onChange={e => setNewPaymentName(e.target.value)}
                      placeholder="Name"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ height: '42px', padding: '0 24px' }}>
                    Add
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );

};
