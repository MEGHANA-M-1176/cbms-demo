const fs = require('fs');
let content = fs.readFileSync('src/pages/Loans.tsx', 'utf8');

// 1. Add missing imports
content = content.replace(/import \{([^}]+)\} from 'lucide-react';/, "import { $1, FileText, Download } from 'lucide-react';");

// 2. Add LoanDocumentsSection component before Loans
const docSection = `
const LoanDocumentsSection: React.FC<{ loanId: string }> = ({ loanId }) => {
  const [docs, setDocs] = React.useState<any[]>([]);
  const [hasPermission, setHasPermission] = React.useState(true);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    apiClient.get(\`/loans/\${loanId}/documents\`)
      .then(res => {
        setDocs(res.data);
        setHasPermission(true);
      })
      .catch(err => {
        if (err.response?.status === 403) setHasPermission(false);
      })
      .finally(() => setLoading(false));
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

  if (!hasPermission) return null;

  return (
    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--panel-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <FileText size={16} color="var(--text-secondary)" />
        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Attached Documents</h4>
      </div>
      {loading ? (
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Loading documents...</div>
      ) : docs.length === 0 ? (
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No documents uploaded.</div>
      ) : (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {docs.map(doc => (
            <button key={doc.id} onClick={() => handleDownload(doc.id, doc.originalName)} className="btn btn-secondary" style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={14} /> {doc.originalName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
`;

if (!content.includes('LoanDocumentsSection')) {
  content = content.replace('export const Loans: React.FC = () => {', docSection + '\nexport const Loans: React.FC = () => {');
}

// 3. Add states
content = content.replace('const [loans, setLoans] = useState<any[]>([]);', 
  "const [activeTab, setActiveTab] = useState<'MY_PORTFOLIO' | 'PENDING'>('MY_PORTFOLIO');\n  const [loans, setLoans] = useState<any[]>([]);\n  const [pendingLoans, setPendingLoans] = useState<any[]>([]);\n  const [reviewLoanModal, setReviewLoanModal] = useState<any>(null);");

// 4. Update fetchLoans
content = content.replace(/const fetchLoans = async \(\) => \{[\s\S]*?setLoans\(fullLoans\);\n    \} catch \(err\)/, 
`const fetchLoans = async () => {
    try {
      setLoading(true);
      const [assignedRes, pendingRes] = await Promise.all([
        apiClient.get('/loans/assigned'),
        apiClient.get('/loans/pending').catch(() => ({ data: [] }))
      ]);
      const fullLoans = await Promise.all(
        assignedRes.data.map(async (l: any) => {
          const detailRes = await apiClient.get(\`/loans/\${l.id}\`);
          return { ...l, emiSchedule: detailRes.data.emiSchedule };
        })
      );
      setLoans(fullLoans);
      setPendingLoans(pendingRes.data);
    } catch (err)`);

// 5. Update document upload logic in handleSubmitNewLoan
content = content.replace(/await apiClient\.post\('\/loans', \{[\s\S]*?tenureMonths: Number\(tenureMonths\)\n      \}\);/, 
`const loanRes = await apiClient.post('/loans', {
        customerId: selectedCustomer.id,
        loanTypeId: selectedLoanTypeId,
        requestedAmount: Number(requestedAmount),
        tenureMonths: Number(tenureMonths)
      });
      
      const loanId = loanRes.data.id;
      if (_collateralDocs && _collateralDocs.length > 0) {
        for (let i = 0; i < _collateralDocs.length; i++) {
          const file = _collateralDocs[i];
          const formData = new FormData();
          formData.append('file', file);
          try {
            await apiClient.post(\`/loans/\${loanId}/documents\`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
          } catch (uploadErr) {
            console.error('Failed to upload document', uploadErr);
          }
        }
      }`);

// 6. Add Verify, Approve, Reject handlers before 'if (loading)'
const actionHandlers = `
  const handleVerifyLoan = async (loanId: string) => {
    try {
      await apiClient.patch(\`/loans/\${loanId}/verify\`);
      alert('Loan verified successfully.');
      setReviewLoanModal(null);
      fetchLoans();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to verify loan.');
    }
  };

  const handleApproveLoan = async (loanId: string, amount: string) => {
    try {
      await apiClient.patch(\`/loans/\${loanId}/approve\`, { approvedAmount: Number(amount) });
      alert('Loan approved successfully.');
      setReviewLoanModal(null);
      fetchLoans();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve loan.');
    }
  };

  const handleRejectLoan = async (loanId: string, reason: string) => {
    try {
      await apiClient.patch(\`/loans/\${loanId}/reject\`, { rejectionReason: reason });
      alert('Loan rejected.');
      setReviewLoanModal(null);
      fetchLoans();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject loan.');
    }
  };
`;
content = content.replace('  if (loading) {', actionHandlers + '\n  if (loading) {');

// 7. Update JSX Return
const newJsx = `  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 600 }}>Loan Portfolio Dashboard</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Monitor and manage loans</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" onClick={() => setShowNewLoanModal(true)}>
            New Loan Application
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px' }}>
        <button onClick={() => setActiveTab('MY_PORTFOLIO')} style={{ background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer', fontSize: '1rem', fontWeight: activeTab === 'MY_PORTFOLIO' ? 600 : 400, color: activeTab === 'MY_PORTFOLIO' ? 'var(--text-primary)' : 'var(--text-secondary)', borderBottom: activeTab === 'MY_PORTFOLIO' ? '2px solid #10b981' : '2px solid transparent' }}>
          My Portfolio
        </button>
        <button onClick={() => setActiveTab('PENDING')} style={{ background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer', fontSize: '1rem', fontWeight: activeTab === 'PENDING' ? 600 : 400, color: activeTab === 'PENDING' ? 'var(--text-primary)' : 'var(--text-secondary)', borderBottom: activeTab === 'PENDING' ? '2px solid #10b981' : '2px solid transparent' }}>
          Pending Applications {pendingLoans.length > 0 && <span style={{ background: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', marginLeft: '8px' }}>{pendingLoans.length}</span>}
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
`;
content = content.replace(/  return \([\s\S]*?loans\.map\(loan => \{/, newJsx);

// Add LoanDocumentsSection inside the MY_PORTFOLIO map loop
content = content.replace(/\{nextEmi && \(/g, "<LoanDocumentsSection loanId={loan.id} />\n\n                {nextEmi && (");

// Add the PENDING tab logic at the end of MY_PORTFOLIO tab logic
const pendingJsx = `
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

      {/* Review Loan Modal */}
      {reviewLoanModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="panel" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Review Loan Application</h3>
            <div style={{ marginBottom: '16px' }}>
              <strong>Customer:</strong> {reviewLoanModal.customer?.fullName} ({reviewLoanModal.customer?.memberId})<br />
              <strong>Requested Amount:</strong> ₹{Number(reviewLoanModal.requestedAmount).toLocaleString()}<br />
              <strong>Tenure:</strong> {reviewLoanModal.tenureMonths} Months<br />
              <strong>Status:</strong> {reviewLoanModal.status}
            </div>
            <LoanDocumentsSection loanId={reviewLoanModal.id} />
            <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--panel-border)', paddingTop: '16px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setReviewLoanModal(null)}>Close</button>
              <button type="button" className="btn" style={{ backgroundColor: '#ef4444', color: '#fff' }} onClick={() => {
                const reason = prompt("Enter rejection reason:");
                if (reason) handleRejectLoan(reviewLoanModal.id, reason);
              }}>Reject</button>
              {reviewLoanModal.status === 'APPLIED' && (
                <button type="button" className="btn btn-primary" onClick={() => handleVerifyLoan(reviewLoanModal.id)}>Verify Documents</button>
              )}
              {reviewLoanModal.status === 'VERIFIED' && (
                <button type="button" className="btn" style={{ backgroundColor: '#10b981', color: '#fff' }} onClick={() => {
                  const amt = prompt(\`Enter approved amount (Requested: \${reviewLoanModal.requestedAmount}):\`, reviewLoanModal.requestedAmount);
                  if (amt) handleApproveLoan(reviewLoanModal.id, amt);
                }}>Approve Loan</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Loan Application Modal */}`;

content = content.replace('{/* New Loan Application Modal */}', pendingJsx);

fs.writeFileSync('src/pages/Loans.tsx', content);
console.log('Loans.tsx updated successfully');
