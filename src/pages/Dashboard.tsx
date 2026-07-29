import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar 
} from 'recharts';
import { 
  TrendingUp, Landmark, ShieldCheck, PieChart, Users, Loader2 
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [branchStaffData, setBranchStaffData] = useState<any[]>([]);
  const [staffData, setStaffData] = useState<any[]>([]);
  const [interestTrendData, setInterestTrendData] = useState<any[]>([]);
  const [interestGranularity, setInterestGranularity] = useState<string>('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [interestGranularity]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const toDate = new Date();
      const fromDate = new Date();
      fromDate.setMonth(toDate.getMonth() - 6);
      
      const [summaryRes, trendRes, comparisonRes, branchStaffRes, staffRes, interestRes] = await Promise.all([
        apiClient.get('/dashboard/summary'),
        apiClient.get(`/dashboard/trend?from=${fromDate.toISOString()}&to=${toDate.toISOString()}&granularity=monthly`),
        apiClient.get(`/dashboard/period-comparison?from=${fromDate.toISOString()}&to=${toDate.toISOString()}`),
        apiClient.get('/dashboard/staff-activity/by-branch'),
        apiClient.get('/dashboard/staff-activity'),
        apiClient.get(`/dashboard/interest-payable/trend?from=${fromDate.toISOString()}&to=${toDate.toISOString()}&granularity=${interestGranularity}`)
      ]);
      
      setData(summaryRes.data);
      setTrendData(trendRes.data.length > 0 ? trendRes.data : []);
      setComparisonData(comparisonRes.data);
      setBranchStaffData(branchStaffRes.data);
      setStaffData(staffRes.data);
      setInterestTrendData(interestRes.data.length > 0 ? interestRes.data : []);
    } catch (err: any) {
      setError('Failed to fetch dashboard summaries. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
        <Loader2 className="animate-spin" size={32} style={{ color: '#10b981' }} />
        <span>Loading executive dashboard...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="panel" style={{ color: 'var(--accent-rose)', border: '1px solid rgba(244,63,94,0.2)' }}>
        {error || 'Error loading dashboard data.'}
      </div>
    );
  }

  // Formatting helpers
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const renderGrowthBadge = (growth: number | undefined) => {
    if (growth === undefined) return null;
    const isPositive = growth >= 0;
    const color = isPositive ? '#10b981' : '#f43f5e';
    const arrow = isPositive ? '▲' : '▼';
    return (
      <span style={{ color, fontSize: '0.75rem', fontWeight: 600, marginLeft: '8px', padding: '2px 6px', backgroundColor: `${color}20`, borderRadius: '4px' }}>
        {arrow} {Math.abs(growth).toFixed(1)}% YoY
      </span>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 600 }}>Executive Management Dashboard</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Real-time verified ledger financial metrics</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="stat-grid">
        {/* Total Deposits */}
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/details/deposits')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="stat-card-title">Total Deposits</span>
            <Landmark size={20} style={{ color: '#3b82f6' }} />
          </div>
          <div>
            <h3 className="stat-card-value">
              {formatCurrency(data.totalDeposits?.amount || 0)}
              {renderGrowthBadge(comparisonData?.sameLastYear?.growthVsCurrent?.deposits)}
            </h3>
            <div className="stat-card-sub" style={{ color: '#10b981' }}>
              <TrendingUp size={14} />
              <span>{data.totalDeposits?.accountCount || 0} active savings/FD accounts</span>
            </div>
          </div>
        </div>

        {/* Total Loans */}
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/details/loans')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="stat-card-title">Total Loans</span>
            <ShieldCheck size={20} style={{ color: '#10b981' }} />
          </div>
          <div>
            <h3 className="stat-card-value">
              {formatCurrency(data.totalLoansOutstanding || 0)}
              {renderGrowthBadge(comparisonData?.sameLastYear?.growthVsCurrent?.loanCollection)}
            </h3>
            <div className="stat-card-sub" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px', marginTop: '10px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Secured: <strong style={{ color: '#f3f4f6' }}>{formatCurrency(data.loans?.totalSecuredLoansBalance || 0)}</strong>
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Unsecured: <strong style={{ color: '#f3f4f6' }}>{formatCurrency(data.loans?.totalUnsecuredLoansBalance || 0)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Profitability */}
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/details/profitability')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="stat-card-title">Ledger Profitability</span>
            <TrendingUp size={20} style={{ color: '#10b981' }} />
          </div>
          <div>
            <h3 className="stat-card-value" style={{ color: data.financials?.profitability >= 0 ? '#10b981' : '#f43f5e' }}>
              {formatCurrency(data.financials?.profitability || 0)}
            </h3>
            <div className="stat-card-sub">
              <span>Net of Revenue vs. Operating Expenses</span>
            </div>
          </div>
        </div>

        {/* Working Capital */}
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/details/working-capital')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="stat-card-title">Working Capital</span>
            <PieChart size={20} style={{ color: '#f59e0b' }} />
          </div>
          <div>
            <h3 className="stat-card-value">{formatCurrency(data.financials?.workingCapital || 0)}</h3>
            <div className="stat-card-sub">
              <span>Cash + Loans - Deposits</span>
            </div>
          </div>
        </div>

        {/* Turnover */}
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/details/turnover')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="stat-card-title">Turnover</span>
            <TrendingUp size={20} style={{ color: '#8b5cf6' }} />
          </div>
          <div>
            <h3 className="stat-card-value">{formatCurrency(data.financials?.turnover || 0)}</h3>
            <div className="stat-card-sub">
              <span>Total value of all executed transactions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Loan Portfolio Metrics Grid */}
      <div style={{ marginTop: '24px', marginBottom: '24px' }}>
        <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Loan Portfolio Overview</h4>
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          
          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="stat-card-title">Active Loans</span></div>
            <h3 className="stat-card-value" style={{ fontSize: '1.5rem', color: '#10b981' }}>{data.loans?.running || 0}</h3>
          </div>
          
          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="stat-card-title">Closed Loans</span></div>
            <h3 className="stat-card-value" style={{ fontSize: '1.5rem', color: '#3b82f6' }}>{data.loans?.closed || 0}</h3>
          </div>
          
          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="stat-card-title">Interest Earned</span></div>
            <h3 className="stat-card-value" style={{ fontSize: '1.5rem' }}>{formatCurrency(data.loans?.interestEarned || 0)}</h3>
            <div className="stat-card-sub"><span>Posted to Ledger (3100)</span></div>
          </div>
          
          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="stat-card-title">Total Collections</span></div>
            <h3 className="stat-card-value" style={{ fontSize: '1.5rem' }}>{formatCurrency(data.loans?.totalCollections || 0)}</h3>
          </div>

          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="stat-card-title">Upcoming EMIs (7d)</span></div>
            <h3 className="stat-card-value" style={{ fontSize: '1.5rem', color: '#f59e0b' }}>{data.loans?.upcomingEmis || 0}</h3>
          </div>

          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="stat-card-title">Overdue EMIs</span></div>
            <h3 className="stat-card-value" style={{ fontSize: '1.5rem', color: '#f43f5e' }}>{data.loans?.overdue || 0}</h3>
          </div>
          
          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="stat-card-title">NPA Loans</span></div>
            <h3 className="stat-card-value" style={{ fontSize: '1.5rem', color: '#f43f5e' }}>{data.loans?.npaCount || 0}</h3>
            <div className="stat-card-sub" style={{ color: '#f43f5e' }}><span>{data.loans?.npaPercentage}% of Active</span></div>
          </div>

        </div>
      </div>

      {/* Visual Analytics Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
        {/* Deposit/Withdrawal Trend Chart */}
        <div className="panel" style={{ height: '360px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>
            Deposit & Withdrawal Velocity Trends
          </h4>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorWithdrawals" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="period" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--panel-border)' }} />
                <Legend />
                <Area type="monotone" dataKey="deposits" name="Deposits" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDeposits)" />
                <Area type="monotone" dataKey="withdrawals" name="Withdrawals" stroke="#f43f5e" fillOpacity={1} fill="url(#colorWithdrawals)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Loan Collection Chart */}
        <div className="panel" style={{ height: '360px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>
            Monthly Loan Collections
          </h4>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="period" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--panel-border)' }} />
                <Legend />
                <Bar dataKey="loanCollection" name="Collections" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Member status & activity layout row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginTop: '24px' }}>
        {/* Members Status Panel */}
        <div className="panel">
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} style={{ color: '#10b981' }} />
            <span>Co-operative Members Directory</span>
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Active Members</span>
              <strong style={{ color: '#10b981' }}>{data.members?.active || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Inactive (Sleeping) Members</span>
              <strong style={{ color: '#f59e0b' }}>{data.members?.inactive || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Dormant (Locked) Members</span>
              <strong style={{ color: '#f43f5e' }}>{data.members?.dormant || 0}</strong>
            </div>
          </div>
        </div>

        {/* Staff Attendance Summary */}
        <div className="panel">
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>
            Branch Staff Activity
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', textAlign: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                {data.staffActiveToday || 0}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px' }}>
                Total Employees Online Today
              </div>
            </div>
            
            {branchStaffData.map((branch: any) => (
              <div key={branch.branchId || 'unassigned'} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{branch.branchName}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ color: branch.activeToday > 0 ? '#10b981' : '#f59e0b' }}>
                    {branch.activeToday}/{branch.totalStaff}
                  </strong>
                  <div style={{ width: '60px', height: '6px', background: 'var(--panel-border)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${branch.activePercentage}%`, background: '#10b981' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Staff Login Activity Section */}
      <div className="panel" style={{ marginTop: '24px' }}>
        <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>
          Detailed Staff Login Activity
        </h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--panel-border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 16px' }}>Employee</th>
                <th style={{ padding: '12px 16px' }}>Role</th>
                <th style={{ padding: '12px 16px' }}>Branch ID</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Last Login</th>
              </tr>
            </thead>
            <tbody>
              {staffData.map((staff: any) => (
                <tr key={staff.userId} style={{ borderBottom: '1px solid var(--panel-border)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{staff.fullName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{staff.employeeCode}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{staff.role}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{staff.branchId || 'Unassigned'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {staff.activeToday ? (
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', marginRight: '6px' }} />
                    ) : (
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6b7280', marginRight: '6px' }} />
                    )}
                    <span style={{ color: staff.activeToday ? '#10b981' : 'var(--text-secondary)' }}>
                      {staff.activeToday ? 'Online Today' : 'Offline'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                    {staff.lastLoginAt ? new Date(staff.lastLoginAt).toLocaleString() : 'Never logged in'}
                  </td>
                </tr>
              ))}
              {staffData.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No staff data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interest Payable Analysis Section */}
      <div className="panel" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600 }}>
              Estimated Interest Payable Liability
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Live accrual estimates based on FD & Savings balances</p>
          </div>
          <select 
            className="input-field" 
            style={{ width: 'auto', padding: '6px 12px' }}
            value={interestGranularity}
            onChange={(e) => setInterestGranularity(e.target.value)}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        
        <div style={{ height: '320px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={interestTrendData}>
              <defs>
                <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="period" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} width={80} tickFormatter={(value) => '₹' + (value/1000).toFixed(0) + 'k'} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--panel-border)' }}
                formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Estimated Interest']}
              />
              <Area type="monotone" dataKey="totalAccrued" name="Estimated Liability" stroke="#f59e0b" fillOpacity={1} fill="url(#colorInterest)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

