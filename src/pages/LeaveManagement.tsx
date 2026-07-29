import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { 
  Calendar, Check, X, Search, Clock, Users, ChevronLeft, ChevronRight, CheckCircle2, Shield
} from 'lucide-react';

export const LeaveManagement: React.FC = () => {
  
  const [leaves, setLeaves] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/hrms/leaves');
      setLeaves(res.data);
    } catch (err) {
      console.error('Failed to fetch leaves', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLeave = async (leaveId: string, approve: boolean) => {
    try {
      await apiClient.patch(`/hrms/leaves/${leaveId}/approve`, {
        status: approve ? 'APPROVED' : 'REJECTED'
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredLeaves = leaves.filter(l => 
    l.employee?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.leavePolicy?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingLeaves = leaves.filter(l => l.status === 'PENDING');
  const approvedLeaves = leaves.filter(l => l.status === 'APPROVED');
  
  // Calculate how many people are currently on leave today
  const today = new Date();
  today.setHours(0,0,0,0);
  const onLeaveToday = approvedLeaves.filter(l => {
    const start = new Date(l.startDate);
    const end = new Date(l.endDate);
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);
    return today >= start && today <= end;
  }).length;

  // Calendar Helpers for Company View
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    // Headers
    const headers = weekDays.map(day => (
      <div key={day} style={{ textAlign: 'center', padding: '12px 0', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '1px solid var(--panel-border)' }}>
        {day}
      </div>
    ));

    // Blanks
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`blank-${i}`} style={{ padding: '12px', borderBottom: '1px solid var(--panel-border)', borderRight: '1px solid var(--panel-border)' }}></div>);
    }

    // Days
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = today.getDate() === i && today.getMonth() === month && today.getFullYear() === year;
      const currentDateObj = new Date(year, month, i);
      
      // Find all employees on leave this day
      const employeesOnLeave = approvedLeaves.filter(leave => {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        start.setHours(0,0,0,0);
        end.setHours(0,0,0,0);
        return currentDateObj >= start && currentDateObj <= end;
      });

      days.push(
        <div key={i} style={{ 
          padding: '8px', 
          borderBottom: '1px solid var(--panel-border)',
          borderRight: '1px solid var(--panel-border)',
          backgroundColor: isToday ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
          minHeight: '80px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <span style={{ 
            color: isToday ? 'var(--accent-blue)' : 'var(--text-primary)',
            fontWeight: isToday ? 600 : 400,
            fontSize: '0.85rem',
            marginBottom: '4px'
          }}>
            {i.toString().padStart(2, '0')}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
            {employeesOnLeave.map((l, idx) => (
              <div key={idx} style={{ 
                fontSize: '0.65rem', 
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                padding: '2px 4px',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }} title={l.employee?.fullName}>
                {l.employee?.fullName?.split(' ')[0]}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        border: '1px solid var(--panel-border)',
        borderRadius: '8px',
        overflow: 'hidden',
        marginTop: '16px'
      }}>
        {headers}
        {days}
      </div>
    );
  };

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Clock className="animate-spin" size={32} style={{ color: 'var(--accent-blue)' }} />
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Breadcrumbs */}
      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        <span>Home</span> &gt; <span>HRMS Portal</span> &gt; <span style={{ color: 'var(--text-primary)' }}>Leave Management</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Leave Management</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Approve requests and monitor the company leave calendar.</p>
      </div>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div className="panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '1px' }}>PENDING APPROVALS</span>
            <Clock size={18} style={{ color: '#f59e0b' }} />
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#f59e0b', lineHeight: 1 }}>{pendingLeaves.length}</div>
        </div>

        <div className="panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '1px' }}>ON LEAVE TODAY</span>
            <Users size={18} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#10b981', lineHeight: 1 }}>{onLeaveToday}</div>
        </div>

        <div className="panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '1px' }}>TOTAL APPROVED</span>
            <CheckCircle2 size={18} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{approvedLeaves.length}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '32px' }}>
        {/* Pending Requests Column */}
        <div className="panel" style={{ padding: '24px', maxHeight: '700px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={20} style={{ color: '#f59e0b' }} /> Action Required
          </h3>
          
          {pendingLeaves.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <CheckCircle2 size={32} style={{ color: 'var(--text-muted)' }} />
              <p>You're all caught up! No pending leave requests.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', paddingRight: '8px' }}>
              {pendingLeaves.map(leave => (
                <div key={leave.id} style={{ 
                  backgroundColor: 'rgba(255,255,255,0.02)', 
                  border: '1px solid var(--panel-border)', 
                  borderRadius: '12px', 
                  padding: '16px' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', display: 'block' }}>{leave.employee?.fullName}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{leave.employee?.designation} • {leave.employee?.department}</span>
                    </div>
                    <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>{leave.leavePolicy?.name}</span>
                  </div>
                  
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '12px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
                    <strong>{new Date(leave.startDate).toLocaleDateString()}</strong> to <strong>{new Date(leave.endDate).toLocaleDateString()}</strong>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>"{leave.reason}"</div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={() => handleApproveLeave(leave.id, true)}
                      className="btn" 
                      style={{ flex: 1, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                    >
                      <Check size={16} style={{ marginRight: '6px' }} /> Approve
                    </button>
                    <button 
                      onClick={() => handleApproveLeave(leave.id, false)}
                      className="btn" 
                      style={{ flex: 1, backgroundColor: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)' }}
                    >
                      <X size={16} style={{ marginRight: '6px' }} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Calendar Column */}
        <div className="panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={20} style={{ color: 'var(--accent-blue)' }} /> Company Calendar
            </h3>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={prevMonth} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--panel-border)', borderRadius: '4px', padding: '4px', cursor: 'pointer', color: 'var(--text-secondary)' }}><ChevronLeft size={16} /></button>
                <button onClick={nextMonth} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--panel-border)', borderRadius: '4px', padding: '4px', cursor: 'pointer', color: 'var(--text-secondary)' }}><ChevronRight size={16} /></button>
              </div>
            </div>
          </div>
          {renderCalendar()}
        </div>
      </div>

      {/* Full History Table */}
      <div className="panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>All Leave Requests</h3>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="form-control" 
              style={{ paddingLeft: '36px', width: '300px' }}
              placeholder="Search employee or status..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Date Range</th>
                <th>Reason</th>
                <th>Requested On</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaves.map((leave: any) => (
                <tr key={leave.id}>
                  <td>
                    <strong>{leave.employee?.fullName}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{leave.employee?.employeeCode}</div>
                  </td>
                  <td>{leave.leavePolicy?.name}</td>
                  <td>{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</td>
                  <td>{leave.reason}</td>
                  <td>{new Date(leave.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${
                      leave.status === 'APPROVED' ? 'badge-success' :
                      leave.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'
                    }`}>
                      {leave.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredLeaves.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    No leave requests match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

