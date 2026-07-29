import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { 
  ShieldAlert, Scan, CheckSquare, Loader2 
} from 'lucide-react';

export const Fraud: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [investigators, setInvestigators] = useState<any[]>([]);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Risk Assessment state
  const [riskAssessment, setRiskAssessment] = useState<any>(null);
  const [riskLoading, setRiskLoading] = useState(false);

  // Scan operations state
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  // Resolve Alert state
  const [selectedAlertId, setSelectedAlertId] = useState('');
  const [resNotes, setResNotes] = useState('');
  const [resolveSuccess, setResolveSuccess] = useState<string | null>(null);

  // Run audit checklist state
  const [auditDate, setAuditDate] = useState(new Date().toISOString().substring(0, 10));
  const [auditLoading, setAuditLoading] = useState(false);

  const handleSelectAlert = async (alertId: string) => {
    setSelectedAlertId(alertId);
    setRiskAssessment(null);
    if (!alertId) return;
    try {
      setRiskLoading(true);
      const res = await apiClient.get(`/fraud/alerts/${alertId}/risk-assess`);
      setRiskAssessment(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setRiskLoading(false);
    }
  };

  useEffect(() => {
    fetchFraudData();
  }, []);

  const fetchFraudData = async () => {
    try {
      setLoading(true);
      const [alertRes, userRes] = await Promise.all([
        apiClient.get('/fraud/alerts'),
        apiClient.get('/users') // Staff list for assignment
      ]);
      setAlerts(alertRes.data);
      setInvestigators(userRes.data.filter((u: any) => u.role?.name === 'MANAGER' || u.role?.name === 'SUPER_ADMIN'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScanDormancy = async () => {
    try {
      setScanning(true);
      setScanResult(null);
      const res = await apiClient.post('/accounts/scan-dormancy');
      setScanResult(`Scan complete. Flagged ${res.data.flaggedCount || 0} dormant accounts.`);
      fetchFraudData();
    } catch (err) {
      setScanResult('Error running dormancy scans.');
    } finally {
      setScanning(false);
    }
  };

  const handleAssignAlert = async (alertId: string, userId: string) => {
    try {
      await apiClient.patch(`/fraud/alerts/${alertId}/assign`, {
        assignedToId: userId,
      });
      fetchFraudData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlertId) return;
    try {
      setResolveSuccess(null);
      await apiClient.patch(`/fraud/alerts/${selectedAlertId}/resolve`, {
        status: 'RESOLVED',
        resolutionNotes: resNotes,
      });
      setResolveSuccess('Alert investigation updated and closed successfully.');
      setResNotes('');
      fetchFraudData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunAuditChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAuditLoading(true);
      const res = await apiClient.post('/fraud/compliance-check', {
        checkDate: new Date(auditDate).toISOString(),
      });
      setChecklist(res.data.checklist || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setAuditLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
        <Loader2 className="animate-spin" size={32} style={{ color: '#10b981' }} />
        <span>Syncing Fraud monitoring registers...</span>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 600 }}>Security, Compliance & Fraud Audits</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Suspicious transaction alerts, dormancy scans, and daily audit registers</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 24 }}>
        {/* Left: Fraud Investigation Alerts Queue */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={18} style={{ color: '#f43f5e' }} />
            <span>Fraud Alerts Investigation Queue</span>
          </h4>

          <div className="table-container" style={{ flex: 1, maxHeight: '380px' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Alert Code</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Assignee</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {alerts.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No open suspicious activity triggers found.
                    </td>
                  </tr>
                ) : (
                  alerts.map((alt) => (
                    <tr key={alt.id} style={{ cursor: 'pointer' }} onClick={() => handleSelectAlert(alt.id)}>
                      <td>
                        <strong>{alt.id.substring(0, 8).toUpperCase()}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{alt.description}</div>
                      </td>
                      <td>{alt.alertType}</td>
                      <td>
                        <span className={`badge ${
                          alt.severity === 'HIGH' ? 'badge-danger' : 
                          alt.severity === 'MEDIUM' ? 'badge-warning' : 'badge-success'
                        }`}>
                          {alt.severity}
                        </span>
                      </td>
                      <td>{alt.assignedTo?.fullName || 'Unassigned'}</td>
                      <td>
                        {alt.status === 'PENDING' ? (
                          <select 
                            className="form-control" 
                            style={{ padding: '4px 8px', fontSize: '0.75rem', width: 'auto' }}
                            onChange={(e) => handleAssignAlert(alt.id, e.target.value)}
                            defaultValue=""
                          >
                            <option value="" disabled>Assign...</option>
                            {investigators.map((i) => (
                              <option key={i.id} value={i.id}>{i.fullName}</option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{alt.status}</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Middle: Scan Actions & Resolve Dialog */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Scan Panel */}
          <div className="panel">
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Scan size={18} style={{ color: '#3b82f6' }} />
              <span>Dormancy Scanner</span>
            </h4>

            <button onClick={handleScanDormancy} className="btn btn-secondary" style={{ width: '100%', gap: 8 }} disabled={scanning}>
              {scanning ? 'Running scanner...' : 'Execute Dormancy Audit'}
            </button>

            {scanResult && (
              <div style={{ marginTop: 12, padding: '12px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: '8px', fontSize: '0.8rem' }}>
                {scanResult}
              </div>
            )}
          </div>

          {/* Resolve Panel */}
          <div className="panel">
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>
              Resolve Flagged Trigger
            </h4>

            {resolveSuccess && (
              <div style={{ padding: '12px', background: 'rgba(16,185,129,0.1)', color: 'var(--accent-emerald)', borderRadius: '8px', fontSize: '0.8rem', marginBottom: 16 }}>
                {resolveSuccess}
              </div>
            )}

            <form onSubmit={handleResolveAlert}>
              <div className="form-group">
                <label className="form-label">Active Alert Reference</label>
                <input type="text" className="form-control" readOnly value={selectedAlertId || 'Click an alert on the left'} />
              </div>

              {riskLoading && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                  Analyzing transaction patterns...
                </div>
              )}

              {riskAssessment && (
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: 'rgba(255,255,255,0.02)', 
                  border: '1px solid var(--panel-border)', 
                  borderRadius: '8px', 
                  marginBottom: 16,
                  fontSize: '0.8rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <strong>Risk Assessment</strong>
                    <span className={`badge ${
                      riskAssessment.riskLevel === 'HIGH' ? 'badge-danger' :
                      riskAssessment.riskLevel === 'MEDIUM' ? 'badge-warning' : 'badge-success'
                    }`}>
                      {riskAssessment.riskLevel} ({riskAssessment.riskScore}%)
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {riskAssessment.assessmentNotes}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Resolution Comments</label>
                <textarea 
                  className="form-control" 
                  required 
                  rows={3} 
                  value={resNotes} 
                  onChange={(e) => setResNotes(e.target.value)} 
                  placeholder="Explain why this transaction pattern was cleared..."
                  style={{ resize: 'none' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={!selectedAlertId}>
                Clear Security Flag
              </button>
            </form>
          </div>
        </div>

        {/* Right: Daily Compliance Checklist */}
        <div className="panel">
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckSquare size={18} style={{ color: '#10b981' }} />
            <span>Compliance Checklist</span>
          </h4>

          <form onSubmit={handleRunAuditChecklist} style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <input type="date" className="form-control" value={auditDate} onChange={(e) => setAuditDate(e.target.value)} />
            <button type="submit" className="btn btn-primary" disabled={auditLoading}>
              Verify
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {checklist.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '24px 0', border: '1px dashed var(--panel-border)', borderRadius: '8px' }}>
                Run check for compliance status mapping
              </div>
            ) : (
              checklist.map((item) => (
                <div key={item.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--panel-border)', borderRadius: '8px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <strong>{item.checkType}</strong>
                    <span className={`badge ${item.status === 'PASSED' ? 'badge-success' : 'badge-danger'}`}>{item.status}</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>{item.notes}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

