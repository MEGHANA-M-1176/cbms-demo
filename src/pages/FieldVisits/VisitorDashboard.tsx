import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';

import { useNavigate } from 'react-router-dom';
import { Map, Calendar, Clock, CheckCircle, Navigation, Info, ShieldCheck } from 'lucide-react';

export default function VisitorDashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const isAdmin = hasPermission('FIELD_VISIT_CREATE');

  useEffect(() => {
    apiClient.get('/field-visits/tasks')
      .then(res => setTasks(res.data))
      .catch(console.error);

  }, []);

  const todayTasks = tasks.filter(t => t.status?.code === 'PENDING' || t.status?.code === 'RESCHEDULED');
  const completedTasks = tasks.filter(t => t.status?.code === 'COMPLETED');

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Map size={32} color="var(--accent-sapphire)" />
            My Field Visits
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '8px' }}>
            Manage your daily schedule and execute field visits.
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-secondary" onClick={() => navigate('/field-visits/admin')} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', padding: '10px 20px' }}>
            <ShieldCheck size={18} /> Switch to Admin Dashboard
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>Today's Tasks</span>
            <Calendar size={24} color="#F5A623" />
          </div>
          <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#F5A623' }}>{todayTasks.length}</span>
        </div>
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>Completed</span>
            <CheckCircle size={24} color="#7ED321" />
          </div>
          <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#7ED321' }}>{completedTasks.length}</span>
        </div>
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>Pending</span>
            <Clock size={24} color="#D0021B" />
          </div>
          <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#D0021B' }}>{tasks.filter(t => t.status?.code === 'PENDING').length}</span>
        </div>
      </div>

      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: 0 }}>Task Queue</h2>
          <div title="Click Execute to open the task details, capture GPS and photos, and complete the visit." style={{ cursor: 'help', color: 'var(--accent-sapphire)' }}>
            <Info size={20} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
          {tasks.map(task => (
            <div key={task.id} style={{ border: '1px solid var(--panel-border)', borderRadius: '12px', padding: '20px', backgroundColor: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0, marginBottom: '4px' }}>{task.title}</h3>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{task.taskNumber}</div>
                </div>
                <span className="badge" style={{ backgroundColor: task.status?.code === 'COMPLETED' ? 'rgba(126, 211, 33, 0.2)' : 'rgba(245, 166, 35, 0.2)', color: task.status?.code === 'COMPLETED' ? '#7ED321' : '#F5A623' }}>
                  {task.status?.name || 'PENDING'}
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', flexGrow: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Customer:</span>
                  <span style={{ fontWeight: 500 }}>{task.customer?.fullName || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Type:</span>
                  <span>{task.taskType?.name || 'Unknown'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Due Date:</span>
                  <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Due Date'}</span>
                </div>
              </div>

              <button 
                className="btn btn-primary" 
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                onClick={() => navigate(`/field-visits/execute/${task.id}`)}
                disabled={task.status?.isTerminal}
              >
                {task.status?.isTerminal ? (
                  <><CheckCircle size={18} /> Completed</>
                ) : (
                  <><Navigation size={18} /> Execute Visit</>
                )}
              </button>
            </div>
          ))}
          {tasks.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
              No tasks assigned yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
