import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';

import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Info, Users, AlertCircle } from 'lucide-react';

interface Employee { id: string; userId: string; employeeCode: string; designation: string; user: { id: string; fullName: string; email: string; }; totalVisits: number; pendingVisits: number; completedVisits: number; }
interface Config { id: string; code: string; name: string; color?: string; }

export default function AssignTask() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Config options from DB
  const [visitTypes, setVisitTypes] = useState<Config[]>([]);
  const [categories, setCategories] = useState<Config[]>([]);
  const [priorities, setPriorities] = useState<Config[]>([]);
  const [riskLevels, setRiskLevels] = useState<Config[]>([]);
  const [reasons, setReasons] = useState<Config[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    visitorId: '',
    taskTypeId: '',
    categoryId: '',
    reasonId: '',
    priorityId: '',
    riskLevelId: '',
    dueDate: '',
    gpsRequired: true,
    managerNotes: '',
    internalNotes: '',
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiClient.get('/field-visits/configs/types'),
      apiClient.get('/field-visits/configs/categories'),
      apiClient.get('/field-visits/configs/priorities'),
      apiClient.get('/field-visits/configs/risk-levels'),
      apiClient.get('/field-visits/configs/reasons'),
      apiClient.get('/field-visits/employees'),
    ]).then(([types, cats, prios, risks, reas, emps]) => {
      setVisitTypes(types.data);
      setCategories(cats.data);
      setPriorities(prios.data);
      setRiskLevels(risks.data);
      setReasons(reas.data);
      setEmployees(emps.data);
    }).catch(e => {
      console.error(e);
      setError('Failed to load configuration. Please ensure the backend is running.');
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.visitorId) { alert('Please select an employee'); return; }
    if (!formData.taskTypeId) { alert('Please select a Visit Type'); return; }
    setSaving(true);
    try {
      await apiClient.post('/field-visits/tasks', formData);

      navigate('/field-visits/admin');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Error creating task');
    } finally {
      setSaving(false);
    }
  };

  const set = (key: string, val: any) => setFormData(prev => ({ ...prev, [key]: val }));

  const priorityColor = (p?: Config) => p?.color || 'var(--accent-sapphire)';
  const selectedPriority = priorities.find(p => p.id === formData.priorityId);
  const selectedEmployee = employees.find(e => e.userId === formData.visitorId);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid var(--accent-sapphire)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading configuration from database...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
      <button onClick={() => navigate('/field-visits/admin')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '24px', fontSize: '1.05rem' }}>
        <ArrowLeft size={20} /> Back to Dashboard
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>Assign Field Visit</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>All fields are loaded dynamically from PostgreSQL configuration.</p>
        </div>
        <div title="This form is 100% database-driven. No hardcoded values. Every dropdown loads from the Configuration Center." style={{ cursor: 'help', color: 'var(--accent-sapphire)' }}>
          <Info size={24} />
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: 'rgba(208, 2, 27, 0.1)', border: '1px solid rgba(208, 2, 27, 0.3)', borderRadius: '8px', marginBottom: '24px', color: '#D0021B' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Basic Info */}
            <div className="panel">
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--panel-border)' }}>Visit Information</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Visit Title *</label>
                  <input type="text" className="form-control" value={formData.title} onChange={e => set('title', e.target.value)} required placeholder="e.g. Loan Recovery - Ravi Kumar EMI #3" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Visit Type * ({visitTypes.length} options from DB)</label>
                    <select className="form-control" value={formData.taskTypeId} onChange={e => set('taskTypeId', e.target.value)} required>
                      <option value="">-- Select Type --</option>
                      {visitTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Visit Category ({categories.length} from DB)</label>
                    <select className="form-control" value={formData.categoryId} onChange={e => set('categoryId', e.target.value)}>
                      <option value="">-- Select Category --</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Visit Reason ({reasons.length} from DB)</label>
                    <select className="form-control" value={formData.reasonId} onChange={e => set('reasonId', e.target.value)}>
                      <option value="">-- Select Reason --</option>
                      {reasons.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Due Date *</label>
                    <input type="date" className="form-control" value={formData.dueDate} onChange={e => set('dueDate', e.target.value)} required min={new Date().toISOString().split('T')[0]} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Priority ({priorities.length} from DB)</label>
                    <select className="form-control" style={{ borderLeft: selectedPriority ? `4px solid ${selectedPriority.color}` : undefined }} value={formData.priorityId} onChange={e => set('priorityId', e.target.value)}>
                      <option value="">-- Select Priority --</option>
                      {priorities.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Risk Level ({riskLevels.length} from DB)</label>
                    <select className="form-control" value={formData.riskLevelId} onChange={e => set('riskLevelId', e.target.value)}>
                      <option value="">-- Select Risk Level --</option>
                      {riskLevels.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Visit Instructions</label>
                  <textarea className="form-control" rows={3} value={formData.description} onChange={e => set('description', e.target.value)} placeholder="Detailed instructions for the field agent..."></textarea>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Manager Notes (visible to employee)</label>
                  <textarea className="form-control" rows={2} value={formData.managerNotes} onChange={e => set('managerNotes', e.target.value)} placeholder="e.g. Please be polite, this is a loyal customer..."></textarea>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                  <input type="checkbox" id="gps" checked={formData.gpsRequired} onChange={e => set('gpsRequired', e.target.checked)} style={{ width: '20px', height: '20px' }} />
                  <label htmlFor="gps" style={{ fontWeight: 500, fontSize: '1.05rem', cursor: 'pointer' }}>Require GPS Verification</label>
                  <div title="When enabled, the agent must capture their GPS location before submitting the visit." style={{ cursor: 'help', color: 'var(--accent-sapphire)', marginLeft: 'auto' }}>
                    <Info size={18} />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column - Employee Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="panel" style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Users size={20} color="var(--accent-sapphire)" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>Select Agent</h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{employees.length} agents from DB</span>
              </div>
              
              {selectedEmployee && (
                <div style={{ padding: '12px', backgroundColor: 'rgba(0,112,243,0.1)', border: '1px solid var(--accent-sapphire)', borderRadius: '8px', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 'bold' }}>✓ {selectedEmployee.user?.fullName}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{selectedEmployee.designation} · Pending: {selectedEmployee.pendingVisits}</div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
                {employees.map(emp => (
                  <div
                    key={emp.userId}
                    onClick={() => set('visitorId', emp.userId)}
                    style={{
                      padding: '12px 16px',
                      border: formData.visitorId === emp.userId ? '2px solid var(--accent-sapphire)' : '1px solid var(--panel-border)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: formData.visitorId === emp.userId ? 'rgba(0,112,243,0.08)' : 'rgba(255,255,255,0.02)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '1rem' }}>{emp.user?.fullName}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{emp.employeeCode} · {emp.designation}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.85rem', color: emp.pendingVisits > 3 ? '#F5A623' : '#7ED321' }}>
                          {emp.pendingVisits} pending
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{emp.completedVisits} done</div>
                      </div>
                    </div>
                    <div style={{ marginTop: '8px', height: '4px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${emp.totalVisits > 0 ? Math.round((emp.completedVisits / Math.max(emp.totalVisits, 1)) * 100) : 0}%`, height: '100%', backgroundColor: 'var(--accent-sapphire)', borderRadius: '2px' }}></div>
                    </div>
                  </div>
                ))}
                {employees.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    No field agents found. Run the seed script or add agents through HR module.
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
              style={{ padding: '18px', fontSize: '1.2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', width: '100%' }}
            >
              <Check size={22} />
              {saving ? 'Assigning...' : 'Assign & Dispatch Task'}
            </button>
          </div>
        </div>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
