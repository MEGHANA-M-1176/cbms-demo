import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { 
  Scale, MapPin, Loader2, ShieldCheck, AlertCircle 
} from 'lucide-react';

export const Recovery: React.FC = () => {
  const [npaLoans, setNpaLoans] = useState<any[]>([]);
  const [legalNotices, setLegalNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // The Field Visit history and logging states have been removed since there is a dedicated Field Visits page.

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

      // Load legal cases
      const casesRes = await apiClient.get('/recovery/legal-cases');
      setLegalNotices(casesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
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
                    <tr key={l.id}>
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

        {/* Right: Legal Notices Summons */}
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

        </div>
      </div>
    </div>
  );
};

