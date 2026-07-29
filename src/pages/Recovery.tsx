import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { 
  Scale, MapPin, Loader2, ShieldCheck, AlertCircle 
} from 'lucide-react';

export const Recovery: React.FC = () => {
  const [npaLoans, setNpaLoans] = useState<any[]>([]);
  const [legalNotices, setLegalNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Field agent visit form state
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().substring(0, 10));
  const [notes, setNotes] = useState('');
  const [latitude, setLatitude] = useState('12.9716');
  const [longitude, setLongitude] = useState('77.5946');
  const [photoUrl, setPhotoUrl] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Dynamic visit history display
  const [visitHistory, setVisitHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchRecoveryData();
  }, []);

  const fetchRecoveryData = async () => {
    try {
      setLoading(true);
      // Fetch loans currently flagged or overdue (we'll query active running/npa loans)
      const loanRes = await apiClient.get('/loans');
      const allLoans = loanRes.data;
      
      // Filter loans that are OVERDUE or running to record visits against
      setNpaLoans(allLoans.filter((l: any) => l.status === 'ACTIVE' || l.status === 'OVERDUE' || l.outstandingPrincipal > 0));
      if (allLoans.length > 0) setSelectedLoanId(allLoans[0].id);

      // Load legal cases
      const casesRes = await apiClient.get('/recovery/legal-cases');
      setLegalNotices(casesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanId) return;
    try {
      setActionLoading(true);
      setActionError(null);
      setActionSuccess(null);

      await apiClient.post(`/recovery/loans/${selectedLoanId}/visits`, {
        visitDate: new Date(visitDate).toISOString(),
        notes,
        latitude: Number(latitude),
        longitude: Number(longitude),
        photoUrl: photoUrl || undefined,
      });

      setActionSuccess('Field agent visit logs captured and archived successfully.');
      setNotes('');
      setPhotoUrl('');
      
      // Refresh visit logs history
      handleLoadVisitHistory(selectedLoanId);
    } catch (err: any) {
      const data = err.response?.data;
      let msg = 'Failed to record visit log.';
      if (data && data.message) {
        if (typeof data.message === 'string') msg = data.message;
        else if (typeof data.message === 'object') msg = data.message.message || JSON.stringify(data.message);
      }
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLoadVisitHistory = async (loanId: string) => {
    if (!loanId) return;
    try {
      const res = await apiClient.get(`/recovery/loans/${loanId}/visits`);
      setVisitHistory(res.data);
    } catch (err) {
      console.error('Failed to load visit history', err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
        <Loader2 className="animate-spin" size={32} style={{ color: '#10b981' }} />
        <span>Syncing NPA follow-up metrics...</span>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 600 }}>Legal & NPA Recovery Management</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Asset recovery tracker, summonses, and field agent logs</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 24 }}>
        {/* Left: NPA Overdue Follow-up Queue */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Scale size={18} style={{ color: '#f43f5e' }} />
            <span>NPA Overdue Follow-up Queue</span>
          </h4>

          <div className="table-container" style={{ flex: 1, maxHeight: '380px' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Borrower</th>
                  <th>Loan Ref</th>
                  <th>Outstanding</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {npaLoans.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No running loans require recovery follow-up.
                    </td>
                  </tr>
                ) : (
                  npaLoans.map((l) => (
                    <tr key={l.id} style={{ cursor: 'pointer' }} onClick={() => {
                      setSelectedLoanId(l.id);
                      handleLoadVisitHistory(l.id);
                    }}>
                      <td>
                        <strong>{l.customer?.fullName}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{l.customer?.phone}</div>
                      </td>
                      <td>{l.loanNumber}</td>
                      <td>₹{l.outstandingPrincipal}</td>
                      <td>
                        <span className={`badge ${l.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Middle: Field Visit Logging */}
        <div className="panel">
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={18} style={{ color: '#10b981' }} />
            <span>Record Field Visit</span>
          </h4>

          {actionError && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', 
              backgroundColor: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)',
              padding: '12px', borderRadius: '8px', color: 'var(--accent-rose)', 
              fontSize: '0.85rem', marginBottom: '20px'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{actionError}</span>
            </div>
          )}

          {actionSuccess && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', 
              backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)',
              padding: '12px', borderRadius: '8px', color: 'var(--accent-emerald)', 
              fontSize: '0.85rem', marginBottom: '20px'
            }}>
              <ShieldCheck size={18} style={{ flexShrink: 0 }} />
              <span>{actionSuccess}</span>
            </div>
          )}

          <form onSubmit={handleRecordVisit}>
            <div className="form-group">
              <label className="form-label">Loan Reference</label>
              <select 
                className="form-control" 
                value={selectedLoanId} 
                onChange={(e) => {
                  setSelectedLoanId(e.target.value);
                  handleLoadVisitHistory(e.target.value);
                }}
              >
                {npaLoans.map((l) => (
                  <option key={l.id} value={l.id}>{l.loanNumber} ({l.customer?.fullName})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Visit Date</label>
              <input type="date" className="form-control" required value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Latitude</label>
                <input type="text" className="form-control" required value={latitude} onChange={(e) => setLatitude(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Longitude</label>
                <input type="text" className="form-control" required value={longitude} onChange={(e) => setLongitude(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Photo Attachment Link</label>
              <input type="url" className="form-control" placeholder="https://cloud.society.com/visits/img.jpg" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Field Notes / Status Summary</label>
              <textarea 
                className="form-control" 
                required 
                rows={3} 
                placeholder="Visited residence, customer promised payment..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ resize: 'none', backgroundColor: 'rgba(255,255,255,0.03)' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={actionLoading}>
              {actionLoading ? 'Capturing logs...' : 'Save Agent Visit Log'}
            </button>
          </form>
        </div>

        {/* Right: Legal Notices Summons & Visit Logs History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Legal Notice Summons */}
          <div className="panel" style={{ flex: 1 }}>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>
              Legal Summonses & Notices
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {legalNotices.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '24px 0', border: '1px dashed var(--panel-border)', borderRadius: '8px' }}>
                  No active legal compliance processes today.
                </div>
              ) : (
                legalNotices.map((n) => (
                  <div key={n.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--panel-border)', borderRadius: '8px', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <strong>{n.caseNumber || 'Summons'} ({n.caseType})</strong>
                      <span className={`badge ${n.status === 'OPEN' ? 'badge-danger' : 'badge-success'}`}>{n.status}</span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>Borrower: {n.loan?.customer?.fullName || 'N/A'} - {n.notes || 'Immediate litigation required.'}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Visit History Log */}
          <div className="panel" style={{ flex: 1 }}>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>
              Field Visit History
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '200px', overflowY: 'auto' }}>
              {visitHistory.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '24px 0' }}>
                  Select borrower to check visit history.
                </div>
              ) : (
                visitHistory.map((h) => (
                  <div key={h.id} style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: 'var(--text-secondary)' }}>
                      <span>Agent: {h.agent?.fullName || 'Field Staff'}</span>
                      <span>{new Date(h.visitDate).toLocaleDateString()}</span>
                    </div>
                    <div>{h.notes}</div>
                    {h.photoUrl && (
                      <a href={h.photoUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#10b981', display: 'block', marginTop: 4 }}>
                        View Photo Attachment
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

