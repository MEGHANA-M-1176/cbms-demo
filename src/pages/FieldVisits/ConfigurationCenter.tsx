import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';

import { Settings, Plus, Trash2, Edit2, Check, X, Info, ChevronRight } from 'lucide-react';

interface ConfigItem {
  id: string;
  code: string;
  name?: string;
  label?: string;
  description?: string;
  color?: string;
  isActive?: boolean;
  isTerminal?: boolean;
  actionType?: string;
  sortOrder?: number;
  triggerAfterHours?: number;
  escalateTo?: string;
}

const CONFIG_TABS = [
  { key: 'types', label: 'Visit Types', info: 'Define the different types of field visits (Loan Recovery, KYC Verification, etc.)' },
  { key: 'categories', label: 'Categories', info: 'Broad categories that group multiple visit types (Loan, KYC, Inspection, etc.)' },
  { key: 'statuses', label: 'Status Flow', info: 'Define the lifecycle stages a field visit task goes through (Pending → In Progress → Completed)' },
  { key: 'priorities', label: 'Priorities', info: 'Priority levels for tasks (Critical, High, Medium, Low). Each has a color code.' },
  { key: 'risk-levels', label: 'Risk Levels', info: 'Risk classification for customer accounts. Used to prioritize visits.' },
  { key: 'reasons', label: 'Visit Reasons', info: 'Specific reasons why a visit is being conducted (EMI Overdue, Address Changed, etc.)' },
  { key: 'reschedule-reasons', label: 'Reschedule Reasons', info: 'Standard reasons for rescheduling (Customer Not Home, Address Incorrect, etc.)' },
  { key: 'feedback', label: 'Feedback / Outcome', info: 'Outcomes that agents select after a visit. Each maps to an action (Complete, Reschedule, Escalate).' },
  { key: 'escalation-rules', label: 'Escalation Rules', info: 'Rules that auto-escalate overdue tasks to senior management.' },
];

export default function ConfigurationCenter() {
  const [activeTab, setActiveTab] = useState('types');
  const [items, setItems] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<ConfigItem | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [showInfo, setShowInfo] = useState(false);

  const currentTab = CONFIG_TABS.find(t => t.key === activeTab)!;

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/field-visits/configs/${activeTab}`);

      setItems(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item?: ConfigItem) => {
    setEditItem(item || null);
    setFormData(item || {});
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editItem?.id) {
        await apiClient.put(`/field-visits/configs/${activeTab}/${editItem.id}`, formData);
      } else {
        await apiClient.post(`/field-visits/configs/${activeTab}`, formData);
      }
      setShowModal(false);
      setFormData({});
      setEditItem(null);
      fetchItems();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Error saving. Check if the code is unique.');
    }
  };

  const handleDisable = async (id: string) => {
    if (!confirm('Disable this item? It will hide it from all dropdowns but keep the historical data.')) return;
    try {
      await apiClient.put(`/field-visits/configs/${activeTab}/${id}`, { isActive: false });

      fetchItems();
    } catch (e) {
      alert('Error disabling item');
    }
  };

  const set = (key: string, val: any) => setFormData((prev: any) => ({ ...prev, [key]: val }));

  const renderForm = () => {
    const common = (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Code * <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(Unique identifier, no spaces)</span></label>
            <input className="form-control" value={formData.code || ''} onChange={e => set('code', e.target.value.toUpperCase().replace(/\s/g, '_'))} required disabled={!!editItem?.id} placeholder="e.g. LOAN_RECOVERY" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Display Name *</label>
            <input className="form-control" value={formData.name || formData.label || ''} onChange={e => set(activeTab === 'feedback' ? 'label' : 'name', e.target.value)} required placeholder="e.g. Loan Recovery" />
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Description</label>
          <textarea className="form-control" rows={2} value={formData.description || ''} onChange={e => set('description', e.target.value)} placeholder="Brief explanation..." />
        </div>
      </>
    );

    if (activeTab === 'statuses') return (
      <>
        {common}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: '1px solid var(--panel-border)', borderRadius: '8px' }}>
          <input type="checkbox" id="isTerminal" checked={formData.isTerminal || false} onChange={e => set('isTerminal', e.target.checked)} style={{ width: '18px', height: '18px' }} />
          <label htmlFor="isTerminal" style={{ cursor: 'pointer' }}>Is Terminal Status (visit ends here, no further actions required)</label>
        </div>
      </>
    );

    if (['priorities', 'risk-levels'].includes(activeTab)) return (
      <>
        {common}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Color</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input type="color" value={formData.color || '#4A90E2'} onChange={e => set('color', e.target.value)} style={{ width: '60px', height: '48px', border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
            <span style={{ color: 'var(--text-secondary)' }}>{formData.color || '#4A90E2'}</span>
          </div>
        </div>
      </>
    );

    if (activeTab === 'feedback') return (
      <>
        {common}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Action Type * <Info size={14} style={{ marginLeft: '4px', verticalAlign: 'middle', color: 'var(--accent-sapphire)' }} /></label>
          <select className="form-control" value={formData.actionType || ''} onChange={e => set('actionType', e.target.value)} required>
            <option value="">-- Select Action --</option>
            <option value="COMPLETE">COMPLETE — Mark visit as done</option>
            <option value="RESCHEDULE">RESCHEDULE — Force agent to pick new date</option>
            <option value="NOTES_ONLY">NOTES_ONLY — Agent can only add notes</option>
            <option value="ESCALATE">ESCALATE — Alert to senior management</option>
          </select>
        </div>
      </>
    );

    if (activeTab === 'escalation-rules') return (
      <>
        {common}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Trigger After (Hours) *</label>
            <input type="number" className="form-control" value={formData.triggerAfterHours || 24} onChange={e => set('triggerAfterHours', parseInt(e.target.value))} min={1} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Escalate To (Role/Person) *</label>
            <input className="form-control" value={formData.escalateTo || ''} onChange={e => set('escalateTo', e.target.value)} placeholder="e.g. Branch Manager" />
          </div>
        </div>
      </>
    );

    return common;
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Settings size={32} color="var(--accent-sapphire)" />
            Configuration Center
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginTop: '8px' }}>
            All dropdowns across the system are controlled from here. Changes are instant — no code changes needed.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>
          <Plus size={20} /> Add New
        </button>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Sidebar Navigation */}
        <div className="panel" style={{ width: '280px', flexShrink: 0, alignSelf: 'flex-start', padding: '8px' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {CONFIG_TABS.map(tab => (
              <li key={tab.key}>
                <button
                  style={{
                    width: '100%', textAlign: 'left', padding: '12px 16px', borderRadius: '8px', cursor: 'pointer',
                    fontSize: '1rem', fontWeight: 500, border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: activeTab === tab.key ? 'var(--accent-sapphire)' : 'transparent',
                    color: activeTab === tab.key ? '#fff' : 'var(--text-primary)',
                    transition: 'all 0.2s', marginBottom: '4px'
                  }}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <span>{tab.label}</span>
                  <ChevronRight size={16} style={{ opacity: activeTab === tab.key ? 1 : 0.4 }} />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Tab Header */}
          <div className="panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: 0 }}>{currentTab.label}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: '4px 0 0 0' }}>{items.length} records in PostgreSQL</p>
            </div>
            <button
              onClick={() => setShowInfo(!showInfo)}
              style={{ background: 'none', border: '1px solid var(--accent-sapphire)', color: 'var(--accent-sapphire)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Info size={16} /> What is this?
            </button>
          </div>

          {showInfo && (
            <div style={{ padding: '16px', backgroundColor: 'rgba(0,112,243,0.1)', border: '1px solid rgba(0,112,243,0.3)', borderRadius: '8px' }}>
              <strong style={{ color: 'var(--accent-sapphire)' }}>ℹ {currentTab.label}:</strong>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>{currentTab.info}</p>
            </div>
          )}

          {/* Table */}
          <div className="panel table-container">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading from PostgreSQL...</div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Display Name</th>
                    {['priorities', 'risk-levels'].includes(activeTab) && <th>Color</th>}
                    {activeTab === 'statuses' && <th>Terminal</th>}
                    {activeTab === 'feedback' && <th>Action Type</th>}
                    {activeTab === 'escalation-rules' && <th>Trigger Hours</th>}
                    {activeTab === 'escalation-rules' && <th>Escalates To</th>}
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td><code style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.9rem' }}>{item.code}</code></td>
                      <td style={{ fontWeight: 500 }}>{item.name || item.label}</td>
                      {['priorities', 'risk-levels'].includes(activeTab) && (
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '16px', height: '16px', backgroundColor: item.color, borderRadius: '50%' }}></div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{item.color}</span>
                          </div>
                        </td>
                      )}
                      {activeTab === 'statuses' && (
                        <td>
                          <span style={{ color: item.isTerminal ? '#7ED321' : '#F5A623', fontWeight: 500 }}>
                            {item.isTerminal ? '✓ Terminal' : '○ Ongoing'}
                          </span>
                        </td>
                      )}
                      {activeTab === 'feedback' && (
                        <td>
                          <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', backgroundColor: item.actionType === 'COMPLETE' ? 'rgba(126,211,33,0.2)' : item.actionType === 'RESCHEDULE' ? 'rgba(245,166,35,0.2)' : item.actionType === 'ESCALATE' ? 'rgba(208,2,27,0.2)' : 'rgba(255,255,255,0.1)', color: item.actionType === 'COMPLETE' ? '#7ED321' : item.actionType === 'RESCHEDULE' ? '#F5A623' : item.actionType === 'ESCALATE' ? '#D0021B' : 'var(--text-primary)' }}>
                            {item.actionType}
                          </span>
                        </td>
                      )}
                      {activeTab === 'escalation-rules' && <td>{item.triggerAfterHours}h</td>}
                      {activeTab === 'escalation-rules' && <td>{item.escalateTo}</td>}
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => openModal(item)} style={{ background: 'none', border: '1px solid var(--panel-border)', color: 'var(--accent-sapphire)', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer' }}>
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDisable(item.id)} style={{ background: 'none', border: '1px solid rgba(208,2,27,0.3)', color: '#D0021B', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        No records found. Click "+ Add New" to create the first one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '24px' }}>
          <div className="panel" style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: 0 }}>
                {editItem ? 'Edit' : 'Add New'} — {currentTab.label}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {renderForm()}
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  <X size={16} /> Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  <Check size={16} /> {editItem ? 'Save Changes' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
