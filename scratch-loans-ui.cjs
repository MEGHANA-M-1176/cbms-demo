const fs = require('fs');

let content = fs.readFileSync('src/pages/Loans.tsx', 'utf8');

// 1. Add Plus icon import
content = content.replace(
  /FileText, Download/,
  "FileText, Download, Plus, Upload"
);

// 2. Update LoanDocumentsSection
const newDocSection = `
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
            <input type="file" className="form-control" onChange={(e) => setNewFile(e.target.files?.[0] || null)} required />
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
`;

content = content.replace(/const LoanDocumentsSection: React\.FC<\{ loanId: string \}> = \(\{ loanId \}\) => \{[\s\S]*?^export const Loans: React\.FC = \(\) => \{/m, newDocSection + '\nexport const Loans: React.FC = () => {');

// 3. Update activeTab state and add approvedLoans
content = content.replace(
  /const \[activeTab, setActiveTab\] = useState\<'MY_PORTFOLIO' \| 'PENDING'\>\('MY_PORTFOLIO'\);/,
  "const [activeTab, setActiveTab] = useState<'MY_PORTFOLIO' | 'PENDING' | 'APPROVED'>('MY_PORTFOLIO');"
);
content = content.replace(
  /const \[pendingLoans, setPendingLoans\] = useState\<any\[\]\>\(\[\]\);/,
  "const [pendingLoans, setPendingLoans] = useState<any[]>([]);\n  const [approvedLoans, setApprovedLoans] = useState<any[]>([]);"
);

// 4. Update fetchLoans
content = content.replace(
  /const \[assignedRes, pendingRes\] = await Promise\.all\(\[\n        apiClient\.get\('\/loans\/assigned'\),\n        apiClient\.get\('\/loans\/pending'\)\.catch\(\(\) => \(\{ data: \[\] \}\)\)\n      \]\);/,
  `const [assignedRes, pendingRes, approvedRes] = await Promise.all([
        apiClient.get('/loans/assigned'),
        apiClient.get('/loans/pending').catch(() => ({ data: [] })),
        apiClient.get('/loans/approved').catch(() => ({ data: [] }))
      ]);`
);
content = content.replace(
  /setPendingLoans\(pendingRes\.data\);/,
  `setPendingLoans(pendingRes.data);
      setApprovedLoans(approvedRes.data);`
);

// 5. Add EmiSchedulePreview component
const emiPreview = `
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
`;

content = content.replace(/export const Loans: React\.FC = \(\) => \{/, emiPreview + '\nexport const Loans: React.FC = () => {');

// 6. Update Tabs UI
content = content.replace(
  /<button onClick=\{\(\) => setActiveTab\('PENDING'\)\}[\s\S]*?<\/button>/,
  `<button onClick={() => setActiveTab('PENDING')} style={{ background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer', fontSize: '1rem', fontWeight: activeTab === 'PENDING' ? 600 : 400, color: activeTab === 'PENDING' ? 'var(--text-primary)' : 'var(--text-secondary)', borderBottom: activeTab === 'PENDING' ? '2px solid #10b981' : '2px solid transparent' }}>
          Pending Applications {pendingLoans.length > 0 && <span style={{ background: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', marginLeft: '8px' }}>{pendingLoans.length}</span>}
        </button>
        <button onClick={() => setActiveTab('APPROVED')} style={{ background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer', fontSize: '1rem', fontWeight: activeTab === 'APPROVED' ? 600 : 400, color: activeTab === 'APPROVED' ? 'var(--text-primary)' : 'var(--text-secondary)', borderBottom: activeTab === 'APPROVED' ? '2px solid #10b981' : '2px solid transparent' }}>
          Approved Applications {approvedLoans.length > 0 && <span style={{ background: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', marginLeft: '8px' }}>{approvedLoans.length}</span>}
        </button>`
);

// 7. Add APPROVED Tab Content
const approvedTabJsx = `
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
`;

content = content.replace(/\{activeTab === 'PENDING' && \([\s\S]*?\}\)[\s]+\}\)[\s]+<\/div>[\s]+\)}/, match => match + '\n' + approvedTabJsx);

// 8. Update Review Modal
const reviewModalUpdates = `
      {/* Review Loan Modal */}
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
`;

content = content.replace(/\{\/\* Review Loan Modal \*\/\}[\s\S]*?<LoanDocumentsSection loanId=\{reviewLoanModal\.id\} \/>/, reviewModalUpdates);

fs.writeFileSync('src/pages/Loans.tsx', content);
