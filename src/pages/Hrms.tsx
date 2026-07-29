import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { 
  Users, Calendar, CreditCard, Clock, Play, Square, Loader2 
} from 'lucide-react';

export const Hrms: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Workforce Analytics and Assistant state
  const [workforceData, setWorkforceData] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([
    { sender: 'assistant', text: "Hello! I am your HR Query Assistant. Ask me about employee headcount, leaves, or payroll details." }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Punch session state
  const [checkedIn, setCheckedIn] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);

  const [employees, setEmployees] = useState<any[]>([]);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [leavePolicies, setLeavePolicies] = useState<any[]>([]);

  // Leave Form state
  const [selectedPolicy, setSelectedPolicy] = useState('');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  // Onboarding Form state
  const [onboardUserId, setOnboardUserId] = useState('');
  const [dept, setDept] = useState('');
  const [desig, setDesig] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [salaryBase, setSalaryBase] = useState('');
  const [pfNum, setPfNum] = useState('');
  const [esiNum, setEsiNum] = useState('');
  const [panNum, setPanNum] = useState('');
  const [onboardSuccess, setOnboardSuccess] = useState<string | null>(null);

  // Payroll Processing state
  const [payrollMonth, setPayrollMonth] = useState('7');
  const [payrollYear, setPayrollYear] = useState('2026');
  const [payrollSuccess, setPayrollSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchHrmsData();
  }, []);

  const fetchHrmsData = async () => {
    try {
      setLoading(true);
      const [empRes, policyRes, leaveRes, slipRes, attendRes, workRes] = await Promise.all([
        apiClient.get('/users'), // List of employees/users
        apiClient.get('/hrms/leaves/policies'),
        apiClient.get('/hrms/leaves'),
        apiClient.get('/hrms/payslips'),
        apiClient.get('/hrms/attendance/today'),
        apiClient.get('/hrms/analytics/workforce')
      ]);
      setEmployees(empRes.data);
      setLeavePolicies(policyRes.data);
      setLeaves(leaveRes.data);
      setPayslips(slipRes.data);

      if (empRes.data.length > 0) setOnboardUserId(empRes.data[0].id);

      if (policyRes.data.length > 0) setSelectedPolicy(policyRes.data[0].id);

      setWorkforceData(workRes.data);

      // Check current punch status
      const todayLogs = attendRes.data || [];
      const active = todayLogs.find((l: any) => l.userId === user?.id && !l.checkOut);
      if (active) {
        setCheckedIn(true);
        setActiveSession(active);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePunchInOut = async () => {
    try {
      setSessionLoading(true);
      if (!checkedIn) {
        // Check in
        const res = await apiClient.post('/hrms/attendance/checkin', {
          latitude: 12.9716,
          longitude: 77.5946,
          deviceInfo: 'Web Terminal Chrome'
        });
        setCheckedIn(true);
        setActiveSession(res.data);
      } else {
        // Check out
        await apiClient.post('/hrms/attendance/checkout', {
          latitude: 12.9716,
          longitude: 77.5946
        });
        setCheckedIn(false);
        setActiveSession(null);
      }
      fetchHrmsData();
    } catch (err) {
      console.error('Failed to log attendance punch session', err);
    } finally {
      setSessionLoading(false);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPolicy || !leaveStart || !leaveEnd) return;
    try {
      await apiClient.post('/hrms/leaves/apply', { policyId: selectedPolicy, startDate: leaveStart, endDate: leaveEnd, reason: leaveReason });
    } catch (err) {
      console.error('Failed to apply leave', err);
    }
  };

  const handleSendQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userText = chatInput;
    setChatInput('');
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setChatLoading(true);

    try {
      const res = await apiClient.post('/hrms/assistant/query', { message: userText });
      setChatMessages((prev) => [...prev, { sender: 'assistant', text: res.data.reply }]);
    } catch (err) {
      setChatMessages((prev) => [...prev, { sender: 'assistant', text: 'Error executing query.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleOnboardEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setOnboardSuccess(null);
      await apiClient.post(`/hrms/employees/${onboardUserId}/onboard`, {
        department: dept,
        designation: desig,
        dateOfJoining: joinDate,
        salaryBase: Number(salaryBase),
        pfNumber: pfNum || undefined,
        esiNumber: esiNum || undefined,
        panNumber: panNum || undefined
      });
      setOnboardSuccess('Employee onboarding profile saved successfully.');
      setDept('');
      setDesig('');
      setJoinDate('');
      setSalaryBase('');
      setPfNum('');
      setEsiNum('');
      setPanNum('');
      fetchHrmsData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to onboard employee.');
    }
  };

  const handleProcessPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setPayrollSuccess(null);
      await apiClient.post('/hrms/payroll/run', {
        periodMonth: Number(payrollMonth),
        periodYear: Number(payrollYear)
      });
      setPayrollSuccess('Payroll calculations processed and general ledger entries created.');
      fetchHrmsData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to process payroll.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
        <Loader2 className="animate-spin" size={32} style={{ color: '#10b981' }} />
        <span>Syncing HRMS database...</span>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div>
      {/* Attendance session punch card */}
      <div className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Clock size={20} style={{ color: '#3b82f6' }} />
          <div>
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Counter Session attendance</span>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {checkedIn ? `Punch session active since ${new Date(activeSession?.checkIn).toLocaleTimeString()}` : 'Not checked-in today'}
            </div>
          </div>
        </div>

        <button 
          onClick={handlePunchInOut} 
          className="btn" 
          disabled={sessionLoading}
          style={{
            backgroundColor: checkedIn ? 'rgba(244,63,94,0.15)' : 'rgba(16,185,129,0.15)',
            color: checkedIn ? 'var(--accent-rose)' : 'var(--accent-emerald)',
            border: checkedIn ? '1px solid rgba(244,63,94,0.2)' : '1px solid rgba(16,185,129,0.2)',
            gap: 8
          }}
        >
          {checkedIn ? <Square size={16} /> : <Play size={16} />}
          <span>{checkedIn ? 'Check-Out Session' : 'Check-In Session'}</span>
        </button>
      </div>

      {/* Workforce Analytics & Query Assistant Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Workforce Analytics */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '360px' }}>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Workforce Analytics</span>
            <span className="badge badge-success">Health Index: {workforceData?.workforceHealthIndex || 100}%</span>
          </h4>
          <div className="table-container" style={{ flex: 1, overflowY: 'auto' }}>
            <table className="custom-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Retention Risk</th>
                </tr>
              </thead>
              <tbody>
                {workforceData?.employeeRiskGrid?.map((risk: any) => (
                  <tr key={risk.employeeId}>
                    <td>
                      <strong>{risk.fullName}</strong>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{risk.employeeCode}</div>
                    </td>
                    <td>{risk.department}</td>
                    <td>{risk.designation}</td>
                    <td>
                      <span className={`badge ${
                        risk.attritionRisk === 'HIGH' ? 'badge-danger' :
                        risk.attritionRisk === 'MEDIUM' ? 'badge-warning' : 'badge-success'
                      }`}>
                        {risk.attritionRisk}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* HR Query Assistant */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '360px' }}>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>
            HR Query Assistant
          </h4>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: 12 }}>
            {chatMessages.map((msg, idx) => (
              <div key={idx} style={{ 
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                padding: '10px 14px',
                borderRadius: '12px',
                fontSize: '0.85rem',
                backgroundColor: msg.sender === 'user' ? 'var(--accent-emerald-glow)' : 'rgba(255,255,255,0.05)',
                color: msg.sender === 'user' ? 'var(--accent-emerald)' : 'var(--text-primary)',
                border: msg.sender === 'user' ? '1px solid rgba(16,185,129,0.2)' : '1px solid var(--panel-border)'
              }}>
                {msg.text}
              </div>
            ))}
            {chatLoading && (
              <div style={{ alignSelf: 'flex-start', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Querying database...
              </div>
            )}
          </div>
          <form onSubmit={handleSendQuery} style={{ display: 'flex', gap: 8 }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Ask about leave counts or payroll..." 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">Send</button>
          </form>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 24 }}>
        {/* Left: Leave Management Shortcut */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
            <Calendar size={32} style={{ color: '#f59e0b' }} />
          </div>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 600, marginBottom: '12px' }}>
            Leave Management
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Leave management has moved to a dedicated admin dashboard for better oversight and company calendar tracking.
          </p>
          <button 
            onClick={() => window.location.href = '/leave-management'}
            className="btn btn-primary"
            style={{ padding: '10px 24px', backgroundColor: '#f59e0b', color: '#fff', border: 'none' }}
          >
            Open Leave Dashboard ({leaves.length} records)
          </button>

          <form onSubmit={handleApplyLeave} style={{ display: 'none' }}>
            <select value={selectedPolicy} onChange={e => setSelectedPolicy(e.target.value)}>
              {leavePolicies.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input type="date" value={leaveStart} onChange={e => setLeaveStart(e.target.value)} />
            <input type="date" value={leaveEnd} onChange={e => setLeaveEnd(e.target.value)} />
            <input type="text" value={leaveReason} onChange={e => setLeaveReason(e.target.value)} />
            <button type="submit">Apply</button>
          </form>
        </div>

        {/* Middle: Payroll & Payslips */}
        <div className="panel">
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CreditCard size={18} style={{ color: '#10b981' }} />
            <span>Payroll & Payout runs</span>
          </h4>

          {payrollSuccess && (
            <div style={{ padding: '12px', background: 'rgba(16,185,129,0.1)', color: 'var(--accent-emerald)', borderRadius: '8px', fontSize: '0.8rem', marginBottom: 16 }}>
              {payrollSuccess}
            </div>
          )}

          {/* Payroll Run Form */}
          <form onSubmit={handleProcessPayroll} style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'flex-end' }}>
            <div className="form-group" style={{ margin: 0, flex: 1 }}>
              <label className="form-label">Month</label>
              <select className="form-control" value={payrollMonth} onChange={(e) => setPayrollMonth(e.target.value)}>
                <option value="1">Jan</option>
                <option value="2">Feb</option>
                <option value="3">Mar</option>
                <option value="4">Apr</option>
                <option value="5">May</option>
                <option value="6">Jun</option>
                <option value="7">Jul</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0, flex: 1 }}>
              <label className="form-label">Year</label>
              <select className="form-control" value={payrollYear} onChange={(e) => setPayrollYear(e.target.value)}>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">Process Salary Payout</button>
          </form>

          {/* Payslips history */}
          <div className="table-container" style={{ maxHeight: '250px' }}>
            <table className="custom-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>PF/ESI Ded.</th>
                  <th>Tax</th>
                  <th>Net Paid</th>
                </tr>
              </thead>
              <tbody>
                {payslips.map((slip) => (
                  <tr key={slip.id}>
                    <td>
                      <strong>{slip.employee?.fullName}</strong>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Code: {slip.employee?.employeeCode}</div>
                    </td>
                    <td>{formatCurrency(Number(slip.pfDeduction) + Number(slip.esiDeduction))}</td>
                    <td>{formatCurrency(Number(slip.taxDeduction))}</td>
                    <td style={{ color: '#10b981', fontWeight: 600 }}>{formatCurrency(Number(slip.netSalary))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Onboard Employee profile */}
        <div className="panel">
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} style={{ color: '#3b82f6' }} />
            <span>Onboard Employee</span>
          </h4>

          {onboardSuccess && (
            <div style={{ padding: '12px', background: 'rgba(16,185,129,0.1)', color: 'var(--accent-emerald)', borderRadius: '8px', fontSize: '0.8rem', marginBottom: 16 }}>
              {onboardSuccess}
            </div>
          )}

          <form onSubmit={handleOnboardEmployee} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Select Staff user</label>
              <select className="form-control" value={onboardUserId} onChange={(e) => setOnboardUserId(e.target.value)}>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.fullName} ({e.email})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Department</label>
                <input type="text" className="form-control" required value={dept} onChange={(e) => setDept(e.target.value)} placeholder="Operations" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Designation</label>
                <input type="text" className="form-control" required value={desig} onChange={(e) => setDesig(e.target.value)} placeholder="Cashier" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Base Salary (INR)</label>
                <input type="number" className="form-control" required value={salaryBase} onChange={(e) => setSalaryBase(e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Date of Joining</label>
                <input type="date" className="form-control" required value={joinDate} onChange={(e) => setJoinDate(e.target.value)} />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Provident Fund (PF) Code</label>
              <input type="text" className="form-control" value={pfNum} onChange={(e) => setPfNum(e.target.value)} placeholder="PF-PFN-12345" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">ESI Code</label>
                <input type="text" className="form-control" value={esiNum} onChange={(e) => setEsiNum(e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">PAN Number</label>
                <input type="text" className="form-control" value={panNum} onChange={(e) => setPanNum(e.target.value)} />
              </div>
            </div>

            <button type="submit" className="btn btn-secondary">Save Employee Profile</button>
          </form>
        </div>
      </div>
    </div>
  );
};

