import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { 
  Briefcase, AlertCircle, Clock, Activity, Calendar, FileText, Download, Plus, Upload, Trash2, Info
} from 'lucide-react';

const InfoTooltip: React.FC<{ text: string }> = ({ text }) => {
  const [show, setShow] = useState(false);
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', position: 'relative', marginLeft: '6px', verticalAlign: 'middle' }}
         onMouseEnter={() => setShow(true)}
         onMouseLeave={() => setShow(false)}>
      <Info size={16} color="#3b82f6" style={{ cursor: 'pointer' }} />
      {show && (
        <div style={{
          position: 'absolute', bottom: '120%', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: '#1e293b', color: '#f8fafc', padding: '8px 12px', borderRadius: '6px',
          fontSize: '0.75rem', width: 'max-content', maxWidth: '280px', zIndex: 50,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', 
          fontWeight: 400, lineHeight: 1.4, whiteSpace: 'normal', textAlign: 'center'
        }}>
          {text}
        </div>
      )}
    </div>
  );
};

const LoanDocumentsSection: React.FC<{ loanId: string }> = ({ loanId }) => {
  const [docs, setDocs] = useState<any[]>([]);
  const [hasPermission, setHasPermission] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [uploadReason, setUploadReason] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchDocs = () => {
    setLoading(true);
    apiClient.get(`/loans/${loanId}/documents`)
      .then(res => {
        setDocs(res.data);
        setHasPermission(true);
      })
      .catch(err => {
        if (err.response?.status === 403) setHasPermission(false);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDocs();
  }, [loanId]);

  const handleDownload = async (docId: string, fileName: string) => {
    try {
      const res = await apiClient.get(`/loans/${loanId}/documents/${docId}/download`, { responseType: 'blob' });
      const contentType = (res.headers['content-type'] as string) || 'application/octet-stream';
      const blob = new Blob([res.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `document-${docId}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch(e) {
      alert("Failed to download document");
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await apiClient.delete(`/loans/${loanId}/documents/${docId}`);
      fetchDocs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete document');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFiles.length) return;
    try {
      setUploading(true);
      
      // Upload files sequentially
      for (const file of newFiles) {
        const formData = new FormData();
        formData.append('file', file);
        if (uploadReason) formData.append('reason', uploadReason);
        
        await apiClient.post(`/loans/${loanId}/documents`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      alert('Documents uploaded successfully');
      setNewFiles([]);
      setUploadReason('');
      setShowAddForm(false);
      fetchDocs();
    } catch (err) {
      alert('Failed to upload some documents');
    } finally {
      setUploading(false);
    }
  };

  if (!hasPermission) return null;

  return (
    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--panel-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={16} color="var(--text-secondary)" />
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Attached Documents</h4>
        </div>
        <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={14} /> Add Document
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleUpload} style={{ backgroundColor: 'var(--bg-card)', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Select Files</label>
            <input type="file" multiple className="form-control" onChange={(e: any) => setNewFiles(Array.from(e.target.files || []))} required />
            {newFiles.length > 0 && <div style={{ fontSize: '0.75rem', marginTop: '4px', color: 'var(--text-muted)' }}>{newFiles.length} file(s) selected</div>}
          </div>
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Reason / Remarks (Optional)</label>
            <input type="text" className="form-control" value={uploadReason} onChange={e => setUploadReason(e.target.value)} placeholder="e.g. Updated KYC, Missing signature..." />
          </div>
          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px' }} disabled={uploading}>
            <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload Now'}
          </button>
        </form>
      )}

      {loading ? (
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Loading documents...</div>
      ) : docs.length === 0 ? (
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No documents uploaded.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {docs.map(doc => (
            <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: 'var(--bg-card)', borderRadius: '6px' }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{doc.originalName}</div>
                {doc.reason && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reason: {doc.reason}</div>}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleDownload(doc.id, doc.originalName)} className="btn btn-secondary" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px' }}>
                  <Download size={14} /> Download
                </button>
                <button onClick={() => handleDeleteDoc(doc.id)} className="btn btn-danger" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', backgroundColor: '#ef4444', color: 'white', border: 'none' }}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const EmiSchedulePreview: React.FC<{ loan: any }> = ({ loan }) => {
  if (!loan.requestedAmount || !loan.tenureMonths || !loan.loanType?.currentInterestRate) return null;
  
  const principal = Number(loan.requestedAmount);
  const tenure = Number(loan.tenureMonths);
  const annualRate = Number(loan.loanType.currentInterestRate);
  
  const r = annualRate / 12 / 100;
  let emi = 0;
  if (r === 0) {
    emi = principal / tenure;
  } else {
    emi = (principal * r * Math.pow(1 + r, tenure)) / (Math.pow(1 + r, tenure) - 1);
  }
  
  const totalPayment = emi * tenure;
  const totalInterest = totalPayment - principal;

  return (
    <div style={{ marginTop: '16px', backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '16px', borderRadius: '8px' }}>
      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#10b981', textTransform: 'uppercase', marginBottom: '12px' }}>
        {loan.status === 'APPLIED' || loan.status === 'VERIFIED' ? 'Estimated EMI Schedule' : 'EMI Details'}
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Monthly Payment (EMI)</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>₹{Math.round(emi).toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Interest</div>
          <div style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-primary)' }}>₹{Math.round(totalInterest).toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Repayment</div>
          <div style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-primary)' }}>₹{Math.round(totalPayment).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};

export const Loans: React.FC = () => {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Added logic
  const [activeTab, setActiveTab] = useState<'MY_PORTFOLIO' | 'PENDING' | 'APPROVED'>('MY_PORTFOLIO');
  const [pendingLoans, setPendingLoans] = useState<any[]>([]);
  const [approvedLoans, setApprovedLoans] = useState<any[]>([]);
  const [reviewLoanModal, setReviewLoanModal] = useState<any>(null);
  const [verifyDocsLoading, setVerifyDocsLoading] = useState(false);
  const [approveLoanLoading, setApproveLoanLoading] = useState(false);
  const [rejectLoanLoading, setRejectLoanLoading] = useState(false);

  // EMI Payment State
  const [payEmiLoanId, setPayEmiLoanId] = useState<string | null>(null);
  const [payEmiInstallmentId, setPayEmiInstallmentId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<string>('');
  const [paymentModes, setPaymentModes] = useState<any[]>([]);
  const [processingEmi, setProcessingEmi] = useState(false);

  // New Loan Origination State
  const [showNewLoanModal, setShowNewLoanModal] = useState(false);
  const [loanTypes, setLoanTypes] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  
  // Loan Form State
  const [selectedLoanTypeId, setSelectedLoanTypeId] = useState('');
  const [requestedAmount, setRequestedAmount] = useState('');
  const [tenureMonths, setTenureMonths] = useState('');
  const [disbursementAccountId, setDisbursementAccountId] = useState('');
  const [loanPurpose, setLoanPurpose] = useState('PERSONAL');
  const [guarantors, setGuarantors] = useState<any[]>([]);
  const [collaterals, setCollaterals] = useState<any[]>([]);
  
  const [ledgerAccounts, setLedgerAccounts] = useState<any[]>([]);
  const [_collateralDocs, setCollateralDocs] = useState<FileList | null>(null);
  const [submittingLoan, setSubmittingLoan] = useState(false);
  
  const [systemSettings, setSystemSettings] = useState<Record<string, string>>({});

  // Live Calculator State
  const [calcResult, setCalcResult] = useState<any>(null);
  const [eligibilityResult, setEligibilityResult] = useState<any>(null);
  const [monthlyIncome, setMonthlyIncome] = useState('50000');
  const [existingEmi, setExistingEmi] = useState('0');

  useEffect(() => {
    if (selectedLoanTypeId && requestedAmount && tenureMonths) {
      const timeout = setTimeout(() => {
        apiClient.post('/loans/calculate', {
          loanTypeId: selectedLoanTypeId,
          amount: Number(requestedAmount),
          tenureMonths: Number(tenureMonths)
        }).then(res => setCalcResult(res.data)).catch(() => setCalcResult(null));
      }, 500);
      return () => clearTimeout(timeout);
    } else {
      setCalcResult(null);
    }
  }, [selectedLoanTypeId, requestedAmount, tenureMonths]);

  const handleCheckEligibility = async () => {
    if (!selectedLoanTypeId) { alert('Select loan product first'); return; }
    try {
      const res = await apiClient.post('/loans/eligibility', {
        loanTypeId: selectedLoanTypeId,
        monthlyIncome: Number(monthlyIncome),
        existingEmi: Number(existingEmi)
      });
      setEligibilityResult(res.data);
    } catch (e) {
      alert('Failed to check eligibility');
    }
  };

  useEffect(() => {
    fetchLoans();
    fetchPaymentModes();
    fetchLoanTypes();
    fetchSystemSettings();
  }, []);

  const fetchSystemSettings = async () => {
    try {
      const res = await apiClient.get('/config/system-settings');
      setSystemSettings(res.data || {});
    } catch (e) {}
  };

  const fetchLoanTypes = async () => {
    try {
      const res = await apiClient.get('/config/loan-types');
      setLoanTypes(res.data);
      const accRes = await apiClient.get('/ledger/accounts');
      setLedgerAccounts(accRes.data.filter((a: any) => a.type === 'ASSET'));
    } catch (e) {}
  };

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const [assignedRes, pendingRes, approvedRes] = await Promise.all([
        apiClient.get('/loans/assigned'),
        apiClient.get('/loans/pending').catch(() => ({ data: [] })),
        apiClient.get('/loans/approved').catch(() => ({ data: [] }))
      ]);
      
      const fullLoans = await Promise.all(
        assignedRes.data.map(async (l: any) => {
          const detailRes = await apiClient.get(`/loans/${l.id}`);
          return { ...l, emiSchedule: detailRes.data.emiSchedule };
        })
      );
      setLoans(fullLoans);
      setPendingLoans(pendingRes.data);
      setApprovedLoans(approvedRes.data);
    } catch (err) {
      console.error('Failed to load loans', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentModes = async () => {
    try {
      const res = await apiClient.get('/config/payment-modes');
      setPaymentModes(res.data);
      if (res.data.length > 0) {
        setPaymentMode(res.data[0].id);
      }
    } catch (e) {}
  };

  const handleVerifyLoan = async (loanId: string) => {
    try {
      setVerifyDocsLoading(true);
      await apiClient.patch(`/loans/${loanId}/verify`);
      alert('Documents verified successfully!');
      setReviewLoanModal(null);
      fetchLoans();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to verify');
    } finally {
      setVerifyDocsLoading(false);
    }
  };

  const handleApproveLoan = async (loanId: string, requestedAmount: number | string) => {
    try {
      setApproveLoanLoading(true);
      await apiClient.patch(`/loans/${loanId}/approve`, { approvedAmount: Number(requestedAmount) });
      alert('Loan approved successfully!');
      setReviewLoanModal(null);
      fetchLoans();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to approve');
    } finally {
      setApproveLoanLoading(false);
    }
  };

  const handleRejectLoan = async (loanId: string) => {
    try {
      setRejectLoanLoading(true);
      await apiClient.patch(`/loans/${loanId}/reject`, { rejectionReason: 'Rejected during manual review.' });
      alert('Loan rejected successfully!');
      setReviewLoanModal(null);
      fetchLoans();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to reject');
    } finally {
      setRejectLoanLoading(false);
    }
  };

  const handlePayEmi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payEmiLoanId || !payEmiInstallmentId) return;
    
    try {
      setProcessingEmi(true);
      await apiClient.post(`/loans/${payEmiLoanId}/emi/${payEmiInstallmentId}/pay`, {
        amount: Number(payAmount),
        paymentModeId: paymentMode
      });
      alert('EMI Payment Recorded Successfully!');
      setPayEmiLoanId(null);
      setPayEmiInstallmentId(null);
      setPayAmount('');
      fetchLoans();
    } catch (err: any) {
      const dataMsg = err.response?.data?.message;
      const msg = dataMsg?.message || dataMsg;
      alert(Array.isArray(msg) ? msg.join(', ') : (typeof msg === 'string' ? msg : 'Failed to record EMI payment'));
    } finally {
      setProcessingEmi(false);
    }
  };

  const handleSearchCustomer = async () => {
    if (!customerSearch.trim()) return;
    try {
      const res = await apiClient.get(`/customers/search?q=${encodeURIComponent(customerSearch)}`);
      setSearchResults(res.data);
    } catch (e) {
      alert('Failed to search customers.');
    }
  };

  const handleSubmitNewLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !selectedLoanTypeId || !requestedAmount || !tenureMonths) {
      alert('Please fill out all required fields.');
      return;
    }
    
    try {
      setSubmittingLoan(true);
      const loanRes = await apiClient.post('/loans', {
        customerId: selectedCustomer.id,
        loanTypeId: selectedLoanTypeId,
        requestedAmount: Number(requestedAmount),
        tenureMonths: Number(tenureMonths),
        loanPurpose,
        disbursementAccountId: disbursementAccountId || undefined,
        guarantors: guarantors.length > 0 ? guarantors : undefined,
        collaterals: collaterals.length > 0 ? collaterals : undefined
      });
      
      const newLoanId = loanRes.data.id;
      
      // Upload Initial Documents if selected
      if (_collateralDocs && _collateralDocs.length > 0) {
        for (let i = 0; i < _collateralDocs.length; i++) {
          const file = _collateralDocs[i];
          const formData = new FormData();
          formData.append('file', file);
          formData.append('reason', 'Initial Application Document');
          
          await apiClient.post(`/loans/${newLoanId}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      }
      
      alert('Loan application and documents submitted successfully! It is now pending verification.');
      setShowNewLoanModal(false);
      
      // Reset form
      setSelectedCustomer(null);
      setCustomerSearch('');
      setSearchResults([]);
      setSelectedLoanTypeId('');
      setRequestedAmount('');
      setTenureMonths('');
      setLoanPurpose('PERSONAL');
      setDisbursementAccountId('');
      setGuarantors([]);
      setCollaterals([]);
      setCollateralDocs(null);
      setCalcResult(null);
      setEligibilityResult(null);
      
      fetchLoans();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit loan application.');
    } finally {
      setSubmittingLoan(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading your assigned loan portfolio...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 600 }}>Loan Portfolio Dashboard</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Monitor and manage loans assigned to your profile</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewLoanModal(true)}>
          New Loan Application
        </button>
      </div>

      <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px' }}>
        <button onClick={() => setActiveTab('MY_PORTFOLIO')} style={{ background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer', fontSize: '1rem', fontWeight: activeTab === 'MY_PORTFOLIO' ? 600 : 400, color: activeTab === 'MY_PORTFOLIO' ? 'var(--text-primary)' : 'var(--text-secondary)', borderBottom: activeTab === 'MY_PORTFOLIO' ? '2px solid #10b981' : '2px solid transparent' }}>
          My Portfolio
        </button>
        <button onClick={() => setActiveTab('PENDING')} style={{ background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer', fontSize: '1rem', fontWeight: activeTab === 'PENDING' ? 600 : 400, color: activeTab === 'PENDING' ? 'var(--text-primary)' : 'var(--text-secondary)', borderBottom: activeTab === 'PENDING' ? '2px solid #10b981' : '2px solid transparent' }}>
          Pending Applications {pendingLoans.length > 0 && <span style={{ background: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', marginLeft: '8px' }}>{pendingLoans.length}</span>}
        </button>
        <button onClick={() => setActiveTab('APPROVED')} style={{ background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer', fontSize: '1rem', fontWeight: activeTab === 'APPROVED' ? 600 : 400, color: activeTab === 'APPROVED' ? 'var(--text-primary)' : 'var(--text-secondary)', borderBottom: activeTab === 'APPROVED' ? '2px solid #10b981' : '2px solid transparent' }}>
          Approved Applications {approvedLoans.length > 0 && <span style={{ background: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', marginLeft: '8px' }}>{approvedLoans.length}</span>}
        </button>
      </div>

      {activeTab === 'MY_PORTFOLIO' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {loans.length === 0 ? (
            <div className="panel" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
              <Briefcase size={48} style={{ margin: '0 auto', opacity: 0.2, marginBottom: '16px' }} />
              <h3>No Assigned Loans</h3>
              <p>There are currently no active or overdue loans assigned to your user account.</p>
            </div>
          ) : (
            loans.map(loan => {
              // Calculations
              const schedule = loan.emiSchedule || [];
              const totalPaid = schedule.reduce((sum: number, emi: any) => sum + Number(emi.paidAmount || 0), 0) || 0;
              const pendingAmount = Number(loan.outstandingPrincipal || 0);
              const nextEmi = schedule.find((emi: any) => emi.status !== 'PAID');
              const missedEmis = schedule.filter((emi: any) => emi.status === 'OVERDUE');
              
              return (
                <div key={loan.id} className="panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--panel-border)', paddingBottom: '16px', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>{loan.customer?.fullName}</h3>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Loan ID: {loan.loanNumber} • Member: {loan.customer?.memberId} • {loan.customer?.phone}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', backgroundColor: loan.status === 'ACTIVE' ? 'rgba(16,185,129,0.1)' : loan.status === 'OVERDUE' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)', color: loan.status === 'ACTIVE' ? '#10b981' : loan.status === 'OVERDUE' ? '#ef4444' : 'var(--text-secondary)' }}>
                        {loan.status === 'ACTIVE' ? <Activity size={14}/> : loan.status === 'OVERDUE' ? <AlertCircle size={14}/> : <Clock size={14}/>}
                        {loan.status}
                      </div>
                      <div style={{ marginTop: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {loan.loanType?.name} • {loan.interestRateAtDisbursement}%
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Principal Disbursed</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>₹{Number(loan.approvedAmount || loan.requestedAmount).toLocaleString()}</div>
                    </div>
                    <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount Paid</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#10b981', marginTop: '4px' }}>₹{totalPaid.toLocaleString()}</div>
                    </div>
                    <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Remaining Balance</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f59e0b', marginTop: '4px' }}>₹{pendingAmount.toLocaleString()}</div>
                    </div>
                    <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', borderLeft: missedEmis.length > 0 ? '3px solid #ef4444' : 'none' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Missed Payments</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 600, color: missedEmis.length > 0 ? '#ef4444' : 'var(--text-primary)', marginTop: '4px' }}>{missedEmis.length} months</div>
                    </div>
                  </div>

                  {nextEmi && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: '8px', marginBottom: '24px' }}>
                      <div>
                        <div style={{ fontSize: '0.875rem', color: '#3b82f6', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Calendar size={16} /> Next EMI Due: {new Date(nextEmi.dueDate).toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                          ₹{Number(nextEmi.emiAmount).toLocaleString()}
                        </div>
                      </div>
                      {payEmiInstallmentId === nextEmi.id ? (
                        <form onSubmit={handlePayEmi} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <select className="form-control" style={{ width: '150px' }} value={paymentMode} onChange={e=>setPaymentMode(e.target.value)} required>
                            {paymentModes.map(pm => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
                          </select>
                          <input type="number" className="form-control" style={{ width: '120px' }} value={payAmount} onChange={e=>setPayAmount(e.target.value)} placeholder="Amount" required />
                          <button type="submit" className="btn btn-primary" disabled={processingEmi}>{processingEmi ? '...' : 'Confirm Pay'}</button>
                          <button type="button" className="btn btn-secondary" onClick={() => setPayEmiInstallmentId(null)}>Cancel</button>
                        </form>
                      ) : (
                        <button className="btn btn-primary" onClick={() => {
                          setPayEmiLoanId(loan.id);
                          setPayEmiInstallmentId(nextEmi.id);
                          setPayAmount(String(nextEmi.emiAmount));
                        }}>
                          Record Payment
                        </button>
                      )}
                    </div>
                  )}

                  {/* Timeline */}
                  <div>
                    <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Repayment Timeline</h4>
                    <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '8px' }}>
                      {schedule.length > 0 ? schedule.map((emi: any) => (
                        <div 
                          key={emi.id}
                          style={{
                            minWidth: '40px', height: '40px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                            backgroundColor: emi.status === 'PAID' ? 'rgba(16,185,129,0.2)' : emi.status === 'OVERDUE' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
                            color: emi.status === 'PAID' ? '#10b981' : emi.status === 'OVERDUE' ? '#ef4444' : 'var(--text-secondary)',
                            border: payEmiInstallmentId === emi.id ? '2px solid #3b82f6' : '1px solid transparent'
                          }}
                          onClick={() => {
                            if (emi.status !== 'PAID') {
                              setPayEmiLoanId(loan.id);
                              setPayEmiInstallmentId(emi.id);
                              setPayAmount(String(emi.emiAmount));
                            }
                          }}
                        >
                          {emi.installmentNumber}
                        </div>
                      )) : (
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>No EMI schedule available.</div>
                      )}
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'PENDING' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {pendingLoans.length === 0 ? (
            <div className="panel" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
              <Activity size={48} style={{ margin: '0 auto', opacity: 0.2, marginBottom: '16px' }} />
              <h3>No Pending Applications</h3>
              <p>There are currently no loans waiting for verification or approval.</p>
            </div>
          ) : (
            pendingLoans.map(loan => (
              <div key={loan.id} className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>{loan.customer?.fullName}</h3>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Loan ID: {loan.loanNumber} • Member: {loan.customer?.memberId} • Requested: ₹{Number(loan.requestedAmount).toLocaleString()}
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: loan.status === 'VERIFIED' ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)', color: loan.status === 'VERIFIED' ? '#3b82f6' : '#f59e0b' }}>
                      {loan.status}
                    </span>
                  </div>
                </div>
                <button className="btn btn-secondary" onClick={() => setReviewLoanModal(loan)}>Review</button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'APPROVED' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {approvedLoans.length === 0 ? (
            <div className="panel" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
              <Briefcase size={48} style={{ margin: '0 auto', opacity: 0.2, marginBottom: '16px' }} />
              <h3>No Approved Applications</h3>
              <p>There are currently no approved loans waiting for disbursement.</p>
            </div>
          ) : (
            approvedLoans.map(loan => (
              <div key={loan.id} className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>{loan.customer?.fullName}</h3>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Loan ID: {loan.loanNumber} • Member: {loan.customer?.memberId} • Approved: ₹{Number(loan.approvedAmount).toLocaleString()}
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                      {loan.status}
                    </span>
                  </div>
                </div>
                <button className="btn btn-secondary" onClick={() => setReviewLoanModal(loan)}>View Details</button>
              </div>
            ))
          )}
        </div>
      )}

      {reviewLoanModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="panel" style={{ width: '90%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Loan Application Details</h3>
            <div style={{ marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Customer</strong>
                <div>{reviewLoanModal.customer?.fullName} ({reviewLoanModal.customer?.memberId})</div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Loan Type</strong>
                <div>{reviewLoanModal.loanType?.name || 'N/A'}</div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Requested Amount</strong>
                <div>₹{Number(reviewLoanModal.requestedAmount).toLocaleString()}</div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Tenure</strong>
                <div>{reviewLoanModal.tenureMonths} Months</div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Est. Start Date</strong>
                <div>{new Date(reviewLoanModal.createdAt).toLocaleDateString()}</div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Est. End Date</strong>
                <div>{new Date(new Date(reviewLoanModal.createdAt).setMonth(new Date(reviewLoanModal.createdAt).getMonth() + reviewLoanModal.tenureMonths)).toLocaleDateString()}</div>
              </div>
            </div>

            <EmiSchedulePreview loan={reviewLoanModal} />
            <LoanDocumentsSection loanId={reviewLoanModal.id} />

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setReviewLoanModal(null)}>Close</button>
              {reviewLoanModal.status === 'APPLIED' && (
                <>
                  <button className="btn btn-secondary" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', borderColor: 'transparent' }} onClick={() => handleRejectLoan(reviewLoanModal.id)} disabled={rejectLoanLoading}>
                    {rejectLoanLoading ? '...' : 'Reject'}
                  </button>
                  <button className="btn btn-primary" style={{ backgroundColor: '#3b82f6' }} onClick={() => handleVerifyLoan(reviewLoanModal.id)} disabled={verifyDocsLoading}>
                    {verifyDocsLoading ? '...' : 'Verify Documents'}
                  </button>
                </>
              )}
              {reviewLoanModal.status === 'VERIFIED' && (
                <>
                  <button className="btn btn-secondary" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', borderColor: 'transparent' }} onClick={() => handleRejectLoan(reviewLoanModal.id)} disabled={rejectLoanLoading}>
                    {rejectLoanLoading ? '...' : 'Reject'}
                  </button>
                  <button className="btn btn-primary" onClick={() => handleApproveLoan(reviewLoanModal.id, reviewLoanModal.requestedAmount)} disabled={approveLoanLoading}>
                    {approveLoanLoading ? '...' : 'Approve Loan'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

{/* New Loan Application Modal */}
      {showNewLoanModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="panel" style={{ width: '90%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Originate New Loan</h3>
            
            <form onSubmit={handleSubmitNewLoan}>
              {/* Step 1: Customer Search */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '12px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '8px' }}>1. Customer Selection</h4>
                {selectedCustomer ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#10b981' }}>{selectedCustomer.fullName}</div>
                      <div style={{ fontSize: '0.75rem' }}>Member ID: {selectedCustomer.memberId} | {selectedCustomer.phone}</div>
                    </div>
                    <button type="button" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={() => setSelectedCustomer(null)}>Change</button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Search by name, member ID, phone..." 
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                      />
                      <button type="button" className="btn btn-secondary" onClick={handleSearchCustomer}>Search</button>
                    </div>
                    {searchResults.length > 0 && (
                      <div style={{ border: '1px solid var(--panel-border)', borderRadius: '8px', overflow: 'hidden' }}>
                        {searchResults.map((c: any) => (
                          <div 
                            key={c.id} 
                            style={{ padding: '12px', borderBottom: '1px solid var(--panel-border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            onClick={() => setSelectedCustomer(c)}
                          >
                            <div>
                              <div style={{ fontWeight: 500 }}>{c.fullName}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {c.memberId}</div>
                            </div>
                            <button type="button" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>Select</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: Loan Requirements & Live Calculator */}
              <div style={{ marginBottom: '24px', opacity: selectedCustomer ? 1 : 0.5, pointerEvents: selectedCustomer ? 'auto' : 'none' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '12px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '8px', display: 'flex', alignItems: 'center' }}>
                  2. Loan Requirements 
                  <InfoTooltip text="Select the loan product and specify the requested amount and tenure. The maximum limits depend on the product configured in the admin panel. For testing, try 50,000 for 12 months." />
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ marginBottom: '16px' }}>
                      <label className="form-label">Loan Product</label>
                      <select className="form-control" value={selectedLoanTypeId} onChange={(e) => setSelectedLoanTypeId(e.target.value)} required>
                        <option value="">-- Select Product --</option>
                        {loanTypes.map((lt: any) => (
                          <option key={lt.id} value={lt.id}>{lt.name} (Max: ₹{Number(lt.maxAmount).toLocaleString()})</option>
                        ))}
                      </select>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">Requested Amount (₹)</label>
                        <input type="text" className="form-control" value={requestedAmount ? Number(requestedAmount).toLocaleString('en-IN') : ''} onChange={(e) => setRequestedAmount(e.target.value.replace(/,/g, '').replace(/\D/g, ''))} required />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">Tenure (Months)</label>
                        <input type="number" className="form-control" value={tenureMonths} onChange={(e) => setTenureMonths(e.target.value)} required />
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label className="form-label">Loan Purpose</label>
                      <select className="form-control" value={loanPurpose} onChange={(e) => setLoanPurpose(e.target.value)} required>
                        <option value="PERSONAL">Personal</option>
                        <option value="EDUCATION">Education</option>
                        <option value="BUSINESS">Business</option>
                        <option value="AGRICULTURE">Agriculture</option>
                        <option value="VEHICLE">Vehicle</option>
                        <option value="HOUSE">Housing</option>
                        <option value="MEDICAL">Medical</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    
                    {/* Eligibility Check */}
                    <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--panel-border)', borderRadius: '8px', marginBottom: '16px' }}>
                      <h5 style={{ fontSize: '0.85rem', marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                        Check Eligibility
                        <InfoTooltip text="Enter the customer's monthly income and existing EMI. The system checks their debt-to-income ratio to ensure they can afford this loan based on Configuration rules." />
                      </h5>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Monthly Income (₹)</label>
                          <input type="text" className="form-control" placeholder="0" style={{ padding: '8px 12px', fontSize: '1rem' }} value={monthlyIncome ? Number(monthlyIncome).toLocaleString('en-IN') : ''} onChange={e=>setMonthlyIncome(e.target.value.replace(/,/g, '').replace(/\D/g, ''))} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Existing EMI (₹)</label>
                          <input type="text" className="form-control" placeholder="0" style={{ padding: '8px 12px', fontSize: '1rem' }} value={existingEmi ? Number(existingEmi).toLocaleString('en-IN') : ''} onChange={e=>setExistingEmi(e.target.value.replace(/,/g, '').replace(/\D/g, ''))} />
                        </div>
                        <button type="button" className="btn btn-secondary" onClick={handleCheckEligibility} style={{ height: '40px' }}>Check</button>
                      </div>
                      {eligibilityResult && (
                        <div style={{ fontSize: '0.8rem', color: eligibilityResult.eligible ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                          {eligibilityResult.eligible ? 
                            `Eligible! Max Loan: ₹${eligibilityResult.maxEligibleLoan.toLocaleString()} | Max EMI: ₹${eligibilityResult.maxEmi.toLocaleString()}` : 
                            `Not Eligible. ${eligibilityResult.reason}`
                          }
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Live Calculator Widget */}
                  <div>
                    <div style={{ padding: '16px', backgroundColor: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', height: '100%' }}>
                      <h5 style={{ fontSize: '0.9rem', color: 'var(--accent-emerald)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}><Activity size={16}/> Live Calculation</h5>
                      {calcResult ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>EMI:</span> <strong>₹{calcResult.emi.toLocaleString()}</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Interest:</span> <strong>₹{calcResult.totalInterest.toLocaleString()}</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Payable:</span> <strong>₹{calcResult.totalPayable.toLocaleString()}</strong></div>
                          <hr style={{ borderColor: 'rgba(16,185,129,0.2)' }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Processing Fee:</span> <strong>₹{calcResult.processingFee.toLocaleString()}</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>GST:</span> <strong>₹{calcResult.gst.toLocaleString()}</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-emerald)', fontSize: '0.95rem', marginTop: '4px' }}><span>Net Disbursement:</span> <strong>₹{calcResult.netDisbursement.toLocaleString()}</strong></div>
                        </div>
                      ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', marginTop: '40px' }}>Enter loan product, amount, and tenure to see live calculations.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Guarantors & Collaterals */}
                <h4 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '12px', marginTop: '24px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '8px', display: 'flex', alignItems: 'center' }}>
                  3. Additional Security
                  <InfoTooltip text="Add Guarantors and physical Collaterals to secure this loan. Guarantor phone numbers are validated automatically based on System Settings." />
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ padding: '12px', border: '1px dashed var(--panel-border)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '0.85rem' }}>Guarantors ({guarantors.length})</strong>
                      <button type="button" className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.7rem' }} onClick={() => setGuarantors([...guarantors, { name: '', phone: '', relationship: 'FRIEND' }])}>+ Add</button>
                    </div>
                    {guarantors.map((g, i) => (
                      <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <input className="form-control" placeholder="Name" style={{ fontSize: '0.75rem' }} value={g.name} onChange={e => { const newG = [...guarantors]; newG[i].name = e.target.value; setGuarantors(newG); }} required />
                        <input 
                          className="form-control" 
                          placeholder="Phone" 
                          style={{ fontSize: '0.75rem' }} 
                          value={g.phone} 
                          onChange={e => { 
                            const val = e.target.value.replace(/\D/g, '');
                            const maxLen = parseInt(systemSettings['PHONE_NUMBER_LENGTH'] || '10', 10);
                            if (val.length <= maxLen) {
                              const newG = [...guarantors]; 
                              newG[i].phone = val; 
                              setGuarantors(newG); 
                            }
                          }} 
                          required 
                        />
                        <button type="button" className="btn btn-danger" style={{ padding: '4px' }} onClick={() => { const newG = [...guarantors]; newG.splice(i, 1); setGuarantors(newG); }}><Trash2 size={12}/></button>
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: '12px', border: '1px dashed var(--panel-border)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '0.85rem' }}>Collaterals ({collaterals.length})</strong>
                      <button type="button" className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.7rem' }} onClick={() => setCollaterals([...collaterals, { collateralType: 'GOLD', marketValue: 0 }])}>+ Add</button>
                    </div>
                    {collaterals.map((c, i) => (
                      <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <select className="form-control" style={{ fontSize: '0.75rem' }} value={c.collateralType} onChange={e => { const newC = [...collaterals]; newC[i].collateralType = e.target.value; setCollaterals(newC); }}>
                          <option value="GOLD">Gold</option><option value="PROPERTY">Property</option><option value="VEHICLE">Vehicle</option><option value="FIXED_DEPOSIT">Deposit</option>
                        </select>
                        <input type="number" className="form-control" placeholder="Value ₹" style={{ fontSize: '0.75rem' }} value={c.marketValue || ''} onChange={e => { const newC = [...collaterals]; newC[i].marketValue = Number(e.target.value); setCollaterals(newC); }} required />
                        <button type="button" className="btn btn-danger" style={{ padding: '4px' }} onClick={() => { const newC = [...collaterals]; newC.splice(i, 1); setCollaterals(newC); }}><Trash2 size={12}/></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '16px', marginTop: '16px' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center' }}>
                    Disbursement Bank Account (Optional)
                    <InfoTooltip text="By default, money is disbursed from the account configured for this loan type. Select an override account here to pay from a different reserve." />
                  </label>
                  <select className="form-control" value={disbursementAccountId} onChange={(e) => setDisbursementAccountId(e.target.value)}>
                    <option value="">-- Use Default Configuration --</option>
                    {ledgerAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label">Initial Documents (Optional)</label>
                  <input type="file" multiple className="form-control" onChange={(e) => setCollateralDocs(e.target.files)} />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Upload KYC, Income Proof, or Collateral documents.</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewLoanModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submittingLoan || !selectedCustomer}>
                  {submittingLoan ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

