import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';

import { useNavigate } from 'react-router-dom';
import { Settings, Plus, Users, Map, CheckCircle, Clock, AlertTriangle, TrendingUp, Info } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    totalVisits: 0,
    pendingVisits: 0,
    completedVisits: 0,
    rescheduledVisits: 0,
  });

  useEffect(() => {
    fetchTasks();
    fetchMetrics();
  }, []);

  const fetchTasks = () => {
    apiClient.get('/field-visits/tasks').then(res => setTasks(res.data)).catch(console.error);

  };

  const fetchMetrics = () => {
    apiClient.get('/field-visits/dashboard/metrics').then(res => setMetrics(res.data)).catch(console.error);

  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Map size={32} color="var(--accent-sapphire)" />
            Field Visitor Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '8px' }}>
            Enterprise overview of all field operations, agent performance, and task statuses.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/field-visits/config')} style={{ fontSize: '1.1rem', padding: '12px 24px' }}>
            <Settings size={20} /> Configuration
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/field-visits/assign')} style={{ fontSize: '1.1rem', padding: '12px 24px' }}>
            <Plus size={20} /> Assign Task
          </button>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>Total Visits</span>
            <TrendingUp size={24} />
          </div>
          <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{metrics.totalVisits}</span>
        </div>
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>Pending</span>
            <Clock size={24} color="#F5A623" />
          </div>
          <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#F5A623' }}>{metrics.pendingVisits}</span>
        </div>
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>Completed</span>
            <CheckCircle size={24} color="#7ED321" />
          </div>
          <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#7ED321' }}>{metrics.completedVisits}</span>
        </div>
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>Rescheduled</span>
            <AlertTriangle size={24} color="#D0021B" />
          </div>
          <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#D0021B' }}>{metrics.rescheduledVisits}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
        {/* Recent Tasks */}
        <div className="panel table-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: 0 }}>Recent Field Visits</h2>
            <div title="Shows a real-time list of all tasks assigned across all branches." style={{ cursor: 'help', color: 'var(--accent-sapphire)' }}>
              <Info size={20} />
            </div>
          </div>
          
          <table className="custom-table" style={{ fontSize: '1.05rem' }}>
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Title</th>
                <th>Assigned To</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{task.taskNumber}</td>
                  <td style={{ fontWeight: 500 }}>{task.title}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {task.visitor?.fullName || 'Unassigned'}
                  </td>
                  <td>
                    <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                      {task.status?.name || 'Unknown'}
                    </span>
                  </td>
                  <td>
                    <button style={{ color: 'var(--accent-sapphire)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '1rem' }}>Manage</button>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>No tasks found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Employee Performance Chart Mock */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: 0 }}>Top Performers</h2>
            <div title="Employee performance based on completed visits vs scheduled visits." style={{ cursor: 'help', color: 'var(--accent-sapphire)' }}>
              <Info size={20} />
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {[
              { name: 'Ravi Kumar', percent: 92 },
              { name: 'Priya Sharma', percent: 85 },
              { name: 'Amit Singh', percent: 78 },
              { name: 'Sneha Patel', percent: 65 },
            ].map(emp => (
              <div key={emp.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 500 }}>{emp.name}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{emp.percent}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${emp.percent}%`, height: '100%', backgroundColor: emp.percent > 80 ? '#7ED321' : emp.percent > 70 ? '#F5A623' : '#D0021B', borderRadius: '4px' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
