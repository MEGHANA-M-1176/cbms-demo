import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { 
  Plus, Calendar as CalendarIcon, CheckCircle, Clock, XCircle,
  ChevronLeft, ChevronRight, X, Loader2, Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const MyLeaves: React.FC = () => {
  const {} = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [_policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [earnedTaken, setEarnedTaken] = useState(0);
  const [earnedTotal, setEarnedTotal] = useState(0);
  const [sickTaken, setSickTaken] = useState(0);
  const [sickTotal, setSickTotal] = useState(0);
  const [declinedCount, setDeclinedCount] = useState(0);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leavesRes, policiesRes] = await Promise.all([
        apiClient.get('/hrms/leaves/me'),
        apiClient.get('/hrms/leaves/policies')
      ]);

      const fetchedLeaves = leavesRes.data;
      const fetchedPolicies = policiesRes.data;

      setLeaves(fetchedLeaves);
      setPolicies(fetchedPolicies);

      if (fetchedPolicies.length > 0) {
        setSelectedPolicy(fetchedPolicies[0].id);
      }

      // Calculate Stats
      let eTaken = 0, sTaken = 0, dCount = 0;
      
      const earnedPolicy = fetchedPolicies.find((p: any) => p.name === 'ANNUAL' || p.name === 'EARNED');
      const sickPolicy = fetchedPolicies.find((p: any) => p.name === 'SICK');
      
      setEarnedTotal(earnedPolicy ? earnedPolicy.totalDays : 12);
      setSickTotal(sickPolicy ? sickPolicy.totalDays : 6);

      fetchedLeaves.forEach((leave: any) => {
        if (leave.status === 'REJECTED') {
          dCount++;
        } else if (leave.status === 'APPROVED') {
          const days = Math.floor((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
          if (leave.leavePolicy?.name === 'ANNUAL' || leave.leavePolicy?.name === 'EARNED') {
            eTaken += days;
          } else if (leave.leavePolicy?.name === 'SICK') {
            sTaken += days;
          }
        }
      });

      setEarnedTaken(eTaken);
      setSickTaken(sTaken);
      setDeclinedCount(dCount);

    } catch (err) {
      console.error('Failed to fetch leave data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await apiClient.post('/hrms/leaves/apply', {
        leavePolicyId: selectedPolicy,
        startDate,
        endDate,
        reason
      });
      setIsModalOpen(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to apply leave');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDayClick = (day: number) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const offset = d.getTimezoneOffset();
    d.setMinutes(d.getMinutes() - offset);
    const formattedDate = d.toISOString().split('T')[0];
    
    setStartDate(formattedDate);
    setEndDate(formattedDate);
    setIsModalOpen(true);
  };

  // Calendar Helpers
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
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = today.getDate() === i && today.getMonth() === month && today.getFullYear() === year;
      
      // Check if this day is a leave day
      const currentDateObj = new Date(year, month, i);
      let isLeaveDay = false;
      let isPending = false;

      leaves.forEach(leave => {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        start.setHours(0,0,0,0);
        end.setHours(0,0,0,0);
        
        if (currentDateObj >= start && currentDateObj <= end) {
          if (leave.status === 'APPROVED') isLeaveDay = true;
          if (leave.status === 'PENDING') isPending = true;
        }
      });

      const dateKey = `${year}-${month}-${i}`;

      days.push(
        <div key={i} 
          onMouseEnter={() => setHoveredDate(dateKey)}
          onMouseLeave={() => setHoveredDate(null)}
          onClick={() => handleDayClick(i)}
          style={{ 
          padding: '12px', 
          borderBottom: '1px solid var(--panel-border)',
          borderRight: '1px solid var(--panel-border)',
          backgroundColor: isToday ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
          position: 'relative',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80px'
        }}>
          <span style={{ 
            color: isToday ? 'var(--accent-blue)' : 'var(--text-primary)',
            fontWeight: isToday ? 600 : 400,
            position: 'absolute',
            top: '12px',
            left: '12px'
          }}>
            {i.toString().padStart(2, '0')}
          </span>
          
          {hoveredDate === dateKey && (
            <Plus size={24} style={{ color: '#3b82f6', opacity: 0.8 }} />
          )}

          {(isLeaveDay || isPending) && (
            <div style={{ 
              width: '6px', height: '6px', borderRadius: '50%', 
              backgroundColor: isLeaveDay ? 'var(--accent-emerald)' : 'var(--accent-orange)',
              position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)'
            }}></div>
          )}
        </div>
      );
    }

    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        border: '1px solid var(--panel-border)',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {headers}
        {days}
      </div>
    );
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent-blue)' }} />
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Breadcrumbs */}
      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        <span style={{ cursor: 'pointer' }}>Home</span> &gt; <span style={{ cursor: 'pointer' }}>Employee</span> &gt; <span style={{ color: 'var(--text-primary)' }}>Leave</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>My Leaves</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Request time off and track your leave balances.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary" 
          style={{ 
            backgroundColor: '#3b82f6', 
            display: 'flex', alignItems: 'center', gap: '8px', 
            padding: '10px 20px', borderRadius: '8px', fontWeight: 500, fontSize: '0.95rem'
          }}
        >
          <Plus size={18} /> Request Leave
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div className="panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '1px' }}>EARNED LEAVE</span>
            <CheckCircle size={18} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1 }}>{earnedTaken.toString().padStart(2, '0')}</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--accent-blue)', fontWeight: 600 }}>/ {earnedTotal} DAYS</span>
          </div>
        </div>

        <div className="panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '1px' }}>SICK LEAVE</span>
            <Clock size={18} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1 }}>{sickTaken.toString().padStart(2, '0')}</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--accent-blue)', fontWeight: 600 }}>/ {sickTotal} DAYS</span>
          </div>
        </div>

        <div className="panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '1px' }}>DECLINED</span>
            <XCircle size={18} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1 }}>{declinedCount.toString().padStart(2, '0')}</span>
            <span style={{ fontSize: '0.9rem', color: '#ef4444', fontWeight: 600 }}>REC</span>
          </div>
        </div>
      </div>

      {/* Calendar & Policy Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div className="panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
              {currentDate.toLocaleString('default', { month: 'long' })} <span style={{ color: 'var(--text-secondary)' }}>{currentDate.getFullYear()}</span>
            </h3>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><ChevronLeft size={20} /></button>
              <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><ChevronRight size={20} /></button>
            </div>
          </div>
          
          {renderCalendar()}

          <div style={{ display: 'flex', gap: '24px', marginTop: '24px', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-emerald)' }}></div>
              <span style={{ color: 'var(--text-secondary)' }}>On Leave (Approved)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-orange)' }}></div>
              <span style={{ color: 'var(--text-secondary)' }}>Pending Request</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
              <span style={{ color: 'var(--text-secondary)' }}>Rejected</span>
            </div>
          </div>
        </div>

        <div className="panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)', marginBottom: '24px' }}>
            <Shield size={20} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px' }}>LEAVE POLICY</span>
          </div>
          
          <p style={{ fontStyle: 'italic', fontSize: '1.2rem', lineHeight: 1.6, marginBottom: '32px' }}>
            "All leave requests must be submitted 48 hours in advance."
          </p>

          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.875rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-blue)' }}></div>
              SICK LEAVE LIMIT: {sickTotal} DAYS
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-blue)' }}></div>
              EARNED LEAVE = {earnedTotal} DAYS
            </li>
          </ul>

          <button className="btn" style={{ marginTop: '32px', backgroundColor: 'rgba(255,255,255,0.05)', width: '100%' }}>
            View Government Holidays
          </button>
        </div>
      </div>

      {/* Leave History */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Leave History</h3>
        
        {leaves.length === 0 ? (
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
            <CalendarIcon size={32} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>No leave requests found.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date Requested</th>
                  <th>Duration</th>
                  <th>Leave Type</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave: any) => (
                  <tr key={leave.id}>
                    <td>{new Date(leave.createdAt).toLocaleDateString()}</td>
                    <td>{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</td>
                    <td>{leave.leavePolicy?.name}</td>
                    <td>{leave.reason}</td>
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
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Leave Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="panel" style={{ width: '550px', padding: '32px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={16} />
            </button>
            
            <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '32px' }}>Request Leave</h3>

            {errorMsg && (
              <div style={{ backgroundColor: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.875rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleRequestLeave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Start Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    required 
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    style={{ padding: '12px', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>End Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    required 
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    style={{ padding: '12px', borderRadius: '8px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Reason</label>
                <textarea 
                  className="form-control" 
                  rows={4} 
                  required 
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Please provide a reason for your leave request..."
                  style={{ padding: '16px', borderRadius: '8px', resize: 'none' }}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn" style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ backgroundColor: '#3b82f6', padding: '12px 24px', borderRadius: '8px', fontWeight: 500 }}>
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

