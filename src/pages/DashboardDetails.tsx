import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import apiClient from '../api/apiClient';

export const DashboardDetails: React.FC = () => {
  const { metric } = useParams<{ metric: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/dashboard/details/${metric}`);
        setData(res.data);
      } catch (err) {
        setError('Failed to fetch details for this metric.');
      } finally {
        setLoading(false);
      }
    };

    if (metric) fetchDetails();
  }, [metric]);

  const getMetricTitle = () => {
    switch (metric) {
      case 'deposits': return 'Total Deposits Details';
      case 'loans': return 'Total Loans Details';
      case 'profitability': return 'Ledger Profitability Details';
      case 'working-capital': return 'Working Capital Details';
      case 'turnover': return 'Turnover Details';
      default: return 'Details';
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
  };

  const renderContent = () => {
    if (!data) return null;

    if (metric === 'deposits') {
      const accounts = data as any[];
      return (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Account #</th>
                <th>Customer Name</th>
                <th>Type</th>
                <th>Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(acc => (
                <tr key={acc.id}>
                  <td>{acc.accountNumber}</td>
                  <td>{acc.customer?.fullName || 'N/A'}</td>
                  <td>{acc.depositType?.name || 'N/A'}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(Number(acc.balance))}</td>
                  <td><span className="badge badge-success">{acc.status}</span></td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center' }}>No active deposit accounts found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }

    if (metric === 'loans') {
      const loans = data as any[];
      return (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Loan #</th>
                <th>Customer Name</th>
                <th>Loan Type</th>
                <th>Outstanding Principal</th>
                <th>Disbursed Date</th>
              </tr>
            </thead>
            <tbody>
              {loans.map(loan => (
                <tr key={loan.id}>
                  <td>{loan.loanNumber}</td>
                  <td>{loan.customer?.fullName || 'N/A'}</td>
                  <td>{loan.loanType?.name || 'N/A'}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(Number(loan.outstandingPrincipal))}</td>
                  <td>{new Date(loan.disbursedAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {loans.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center' }}>No running loans found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }

    if (metric === 'profitability' || metric === 'working-capital') {
      const { accounts, recentPostings } = data as { accounts: any[], recentPostings: any[] };
      return (
        <div>
          <h4 style={{ marginBottom: 16 }}>Ledger Account Balances</h4>
          <div className="stat-grid" style={{ marginBottom: 32 }}>
            {accounts.map(acc => (
              <div key={acc.id} className="stat-card">
                <div className="stat-card-title">{acc.name} ({acc.code})</div>
                <div className="stat-card-value">{formatCurrency(Number(acc.balance))}</div>
                <div className="stat-card-sub">{acc.type}</div>
              </div>
            ))}
          </div>

          <h4 style={{ marginBottom: 16 }}>Recent Postings</h4>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Entry Ref</th>
                  <th>Account</th>
                  <th>Type</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentPostings.map(post => (
                  <tr key={post.id}>
                    <td>{new Date(post.journalEntry?.entryDate).toLocaleDateString()}</td>
                    <td>{post.journalEntry?.referenceNumber}</td>
                    <td>{post.ledgerAccount?.name} ({post.ledgerAccount?.code})</td>
                    <td>
                      <span className={`badge ${post.type === 'CREDIT' ? 'badge-success' : 'badge-warning'}`}>
                        {post.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(Number(post.amount))}</td>
                  </tr>
                ))}
                {recentPostings.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center' }}>No recent postings found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (metric === 'turnover') {
      const postings = data as any[];
      return (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Entry Ref</th>
                <th>Description</th>
                <th>Account</th>
                <th>Debit Amount</th>
              </tr>
            </thead>
            <tbody>
              {postings.map(post => (
                <tr key={post.id}>
                  <td>{new Date(post.journalEntry?.entryDate).toLocaleDateString()}</td>
                  <td>{post.journalEntry?.referenceNumber}</td>
                  <td>{post.journalEntry?.description}</td>
                  <td>{post.ledgerAccount?.name} ({post.ledgerAccount?.code})</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(Number(post.amount))}</td>
                </tr>
              ))}
              {postings.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center' }}>No turnover postings found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }

    return <div>Unknown metric details view.</div>;
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: '24px' }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ padding: '8px', borderRadius: '50%' }}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 600 }}>
            {getMetricTitle()}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Real-time underlying records from the database
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
          <Loader2 className="animate-spin" size={32} style={{ color: '#10b981' }} />
          <span>Loading database records...</span>
        </div>
      ) : error ? (
        <div className="panel" style={{ color: 'var(--accent-rose)', border: '1px solid rgba(244,63,94,0.2)' }}>
          {error}
        </div>
      ) : (
        renderContent()
      )}
    </div>
  );
};

