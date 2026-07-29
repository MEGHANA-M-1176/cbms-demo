const fs = require('fs');
fs.writeFileSync('src/pages/Loans.tsx', `import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { 
  Briefcase, AlertCircle, Clock, Activity, Calendar, FileText, Download, Plus, Upload
} from 'lucide-react';

const LoanDocumentsSection: React.FC<{ loanId: string }> = ({ loanId }) => {
  const [docs, setDocs] = useState<any[]>([]);
  const [hasPermission, setHasPermission] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [uploadReason, setUploadReason] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchDocs = () => {
    setLoading(true);
    apiClient.get(\`/loans/\${loanId}/documents\`)
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
      const res = await apiClient.get(\`/loans/\${loanId}/documents/\${docId}/download\`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch(e) {
      alert("Failed to download document");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFile) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', newFile);
      if (uploadReason) formData.append('reason', uploadReason);
      
      await apiClient.post(\`/loans/\${loanId}/documents\`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Document uploaded successfully');
      setNewFile(null);
      setUploadReason('');
      setShowAddForm(false);
      fetchDocs();
    } catch (err) {
      alert('Failed to upload document');
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
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Select File</label>
            <input type="file" className="form-control" onChange={(e: any) => setNewFile(e.target.files?.[0] || null)} required />
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
              <button onClick={() => handleDownload(doc.id, doc.originalName)} className="btn btn-secondary" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px' }}>
                <Download size={14} /> Download
              </button>
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
  const [_collateralDocs, setCollateralDocs] = useState<FileList | null>(null);
  const [submittingLoan, setSubmittingLoan] = useState(false);

  useEffect(() => {
    fetchLoans();
    fetchPaymentModes();
    fetchLoanTypes();
  }, []);

  const fetchLoanTypes = async () => {
    try {
      const res = await apiClient.get('/config/loan-types');
      setLoanTypes(res.data);
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
          const detailRes = await apiClient.get(\`/loans/\${l.id}\`);
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
      await apiClient.patch(\`/loans/\${loanId}/verify\`);
      alert('Documents verified successfully!');
      setReviewLoanModal(null);
      fetchLoans();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to verify');
    } finally {
      setVerifyDocsLoading(false);
    }
  };

  const handleApproveLoan = async (loanId: string, requestedAmount: number) => {
    try {
      setApproveLoanLoading(true);
      await apiClient.patch(\`/loans/\${loanId}/approve\`, { approvedAmount: requestedAmount });
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
      await apiClient.patch(\`/loans/\${loanId}/reject\`, { rejectionReason: 'Rejected during manual review.' });
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
      await apiClient.post(\`/loans/\${payEmiLoanId}/emi/\${payEmiInstallmentId}/pay\`, {
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
      const res = await apiClient.get(\`/customers/search?q=\${encodeURIComponent(customerSearch)}\`);
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
      await apiClient.post('/loans', {
        customerId: selectedCustomer.id,
        loanTypeId: selectedLoanTypeId,
        requestedAmount: Number(requestedAmount),
        tenureMonths: Number(tenureMonths)
      });
      alert('Loan application submitted successfully! It is now pending verification.');
      setShowNewLoanModal(false);
      
      // Reset form
      setSelectedCustomer(null);
      setCustomerSearch('');
      setSearchResults([]);
      setSelectedLoanTypeId('');
      setRequestedAmount('');
      setTenureMonths('');
      setCollateralDocs(null);
      
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
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', backgroundColor: loan.status === 'RUNNING' ? 'rgba(16,185,129,0.1)' : loan.status === 'OVERDUE' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)', color: loan.status === 'RUNNING' ? '#10b981' : loan.status === 'OVERDUE' ? '#ef4444' : 'var(--text-secondary)' }}>
                        {loan.status === 'RUNNING' ? <Activity size={14}/> : loan.status === 'OVERDUE' ? <AlertCircle size={14}/> : <Clock size={14}/>}
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
          <div className="panel" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
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
          <div className="panel" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
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

              {/* Step 2: Loan Details */}
              <div style={{ marginBottom: '24px', opacity: selectedCustomer ? 1 : 0.5, pointerEvents: selectedCustomer ? 'auto' : 'none' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '12px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '8px' }}>2. Loan Requirements</h4>
                
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
                    <input type="number" className="form-control" value={requestedAmount} onChange={(e) => setRequestedAmount(e.target.value)} required />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Tenure (Months)</label>
                    <input type="number" className="form-control" value={tenureMonths} onChange={(e) => setTenureMonths(e.target.value)} required />
                  </div>
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
`);