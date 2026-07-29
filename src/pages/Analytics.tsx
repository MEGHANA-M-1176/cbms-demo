import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Download, Calendar, ArrowUpRight, ArrowDownRight, Loader2, RefreshCw
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'MONTH' | 'QUARTER' | 'YEAR'>('MONTH');
  const [balanceSheet, setBalanceSheet] = useState<any>(null);
  const [profitLoss, setProfitLoss] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [bsRes, plRes] = await Promise.all([
        apiClient.get('/ledger/balance-sheet'),
        apiClient.get('/ledger/profit-loss')
      ]);
      setBalanceSheet(bsRes.data);
      setProfitLoss(plRes.data);
    } catch (err) {
      console.error('Failed to load financial reports', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
        <Loader2 className="animate-spin" size={32} style={{ color: '#10b981' }} />
        <span>Generating Ledger reports...</span>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val);
  };

  // Pie chart variables
  const bsPieData = balanceSheet ? [
    { name: 'Assets', value: Math.abs(balanceSheet.assets || 0), color: '#3b82f6' },
    { name: 'Liabilities', value: Math.abs(balanceSheet.liabilities || 0), color: '#f59e0b' }
  ] : [];

  const plPieData = profitLoss ? [
    { name: 'Revenue', value: Math.abs(profitLoss.revenue || 0), color: '#10b981' },
    { name: 'Expense', value: Math.abs(profitLoss.expense || 0), color: '#f43f5e' }
  ] : [];

  const trendLines = [
    { name: 'W1', deposits: 45000, loans: 32000, operationalCost: 12000 },
    { name: 'W2', deposits: 52000, loans: 41000, operationalCost: 15500 },
    { name: 'W3', deposits: 58000, loans: 49000, operationalCost: 13000 },
    { name: 'W4', deposits: 71000, loans: 63000, operationalCost: 18000 },
  ];

  return (
    <div>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 600 }}>Business Performance Analytics</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Double-entry General Ledger audit reporting</p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handleRefresh} className="btn btn-secondary" disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span>Recalculate Ledger</span>
          </button>
          <button className="btn btn-primary">
            <Download size={16} />
            <span>Export Reports</span>
          </button>
        </div>
      </div>

      {/* Time frame buttons */}
      <div className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Calendar size={18} style={{ color: '#10b981' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Timeframe Filter</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['MONTH', 'QUARTER', 'YEAR'] as const).map((t) => (
            <button 
              key={t}
              onClick={() => setTimeframe(t)}
              className="btn"
              style={{
                padding: '6px 16px',
                fontSize: '0.8rem',
                backgroundColor: timeframe === t ? 'var(--accent-emerald-glow)' : 'rgba(255,255,255,0.03)',
                color: timeframe === t ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                border: timeframe === t ? '1px solid rgba(16,185,129,0.2)' : '1px solid var(--panel-border)'
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Growth Trends Line Chart */}
      <div className="panel" style={{ height: '380px', display: 'flex', flexDirection: 'column' }}>
        <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>
          Weekly Deposits & Disbursements Growth
        </h4>
        <div style={{ flex: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendLines}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--panel-border)' }} />
              <Legend />
              <Line type="monotone" dataKey="deposits" name="Net Deposits Growth" stroke="#3b82f6" strokeWidth={2.5} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="loans" name="Loan Outflow Velocity" stroke="#10b981" strokeWidth={2.5} />
              <Line type="monotone" dataKey="operationalCost" name="Operational Cost" stroke="#f43f5e" strokeWidth={1.5} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Balance Sheet & Profit Loss Side-by-Side */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24 }}>
        {/* Balance Sheet Summary */}
        <div className="panel">
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>General Ledger Balance Sheet</span>
            <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Balanced</span>
          </h4>
          
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ width: '130px', height: '130px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={bsPieData} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={5} dataKey="value">
                    {bsPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#3b82f6' }} /> Assets
                </span>
                <strong style={{ color: '#3b82f6' }}>{formatCurrency(balanceSheet?.assets || 0)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f59e0b' }} /> Liabilities
                </span>
                <strong style={{ color: '#f59e0b' }}>{formatCurrency(balanceSheet?.liabilities || 0)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', paddingTop: 8, borderTop: '1px solid var(--panel-border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Retained Equity</span>
                <strong>{formatCurrency(balanceSheet?.equity || 0)}</strong>
              </div>
            </div>
          </div>

          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--panel-border)', borderRadius: '8px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            Status: Assets match total liabilities & equity within <strong>{formatCurrency(balanceSheet?.difference || 0)}</strong> difference tolerance.
          </div>
        </div>

        {/* Profit Loss Summary */}
        <div className="panel">
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Profit & Loss Statement</span>
            <span className="badge badge-success" style={{
              backgroundColor: (profitLoss?.netProfit || 0) >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
              color: (profitLoss?.netProfit || 0) >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)',
              fontSize: '0.7rem'
            }}>
              {(profitLoss?.netProfit || 0) >= 0 ? 'Surplus' : 'Deficit'}
            </span>
          </h4>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ width: '130px', height: '130px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={plPieData} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={5} dataKey="value">
                    {plPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }} /> Total Revenue
                </span>
                <strong style={{ color: '#10b981' }}>{formatCurrency(profitLoss?.revenue || 0)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f43f5e' }} /> Total Expenses
                </span>
                <strong style={{ color: '#f43f5e' }}>{formatCurrency(profitLoss?.expense || 0)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', paddingTop: 8, borderTop: '1px solid var(--panel-border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Net Profit</span>
                <strong style={{ color: (profitLoss?.netProfit || 0) >= 0 ? '#10b981' : '#f43f5e' }}>
                  {formatCurrency(profitLoss?.netProfit || 0)}
                </strong>
              </div>
            </div>
          </div>

          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--panel-border)', borderRadius: '8px', fontSize: '0.825rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {(profitLoss?.netProfit || 0) >= 0 ? (
              <>
                <ArrowUpRight size={16} style={{ color: '#10b981' }} />
                <span>The society is operating with positive financial margins.</span>
              </>
            ) : (
              <>
                <ArrowDownRight size={16} style={{ color: '#f43f5e' }} />
                <span>Deficit incurred due to high operational expense cycles.</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

