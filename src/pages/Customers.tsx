import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { 
  Users, Phone, Mail, Loader2, Search, X, MapPin, Briefcase, 
  Calendar, CreditCard, ShieldCheck, Clock, UserPlus, Filter, 
  Eye, CheckCircle2, AlertCircle, Building, DollarSign, FileText, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Customers: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING' | 'BORROWERS'>('ALL');
  
  // Profile Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Register Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [pan, setPan] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('MALE');
  const [fatherOrSpouseName, setFatherOrSpouseName] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [stateName, setStateName] = useState('Karnataka');
  const [pincode, setPincode] = useState('');
  const [occupation, setOccupation] = useState('');
  const [annualIncome, setAnnualIncome] = useState('');
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeRelation, setNomineeRelation] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async (query?: string) => {
    try {
      setLoading(true);
      const endpoint = query ? `/customers/search?q=${query}` : '/customers';
      const res = await apiClient.get(endpoint);
      setCustomers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(searchQuery);
  };

  const handleCustomerClick = async (id: string) => {
    try {
      setSelectedCustomer({ id, loading: true });
      const res = await apiClient.get(`/customers/${id}`);
      setSelectedCustomer(res.data);
    } catch (err) {
      console.error('Failed to fetch profile', err);
      setSelectedCustomer(null);
    }
  };

  const handleRegisterCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setSaveSuccess(null);
      setErrorMsg(null);
      
      const payload: any = { fullName, phone };
      if (email) payload.email = email;
      if (aadhaar) payload.aadhaarNumber = aadhaar;
      if (pan) payload.panNumber = pan;
      if (dateOfBirth) payload.dateOfBirth = new Date(dateOfBirth).toISOString();
      if (gender) payload.gender = gender;
      if (fatherOrSpouseName) payload.fatherOrSpouseName = fatherOrSpouseName;
      if (alternatePhone) payload.alternatePhone = alternatePhone;
      if (addressLine1) payload.addressLine1 = addressLine1;
      if (city) payload.city = city;
      if (district) payload.district = district;
      if (stateName) payload.state = stateName;
      if (pincode) payload.pincode = pincode;
      if (occupation) payload.occupation = occupation;
      if (annualIncome) payload.annualIncome = Number(annualIncome);
      if (nomineeName) payload.nomineeName = nomineeName;
      if (nomineeRelation) payload.nomineeRelation = nomineeRelation;

      await apiClient.post('/customers', payload);
      setSaveSuccess('Member onboarded successfully!');
      
      // Reset form
      setFullName(''); setPhone(''); setEmail(''); setAadhaar(''); setPan('');
      setDateOfBirth(''); setOccupation(''); setAnnualIncome(''); setAddressLine1(''); setCity('');
      
      setTimeout(() => {
        setIsRegisterModalOpen(false);
        setSaveSuccess(null);
        fetchCustomers();
      }, 1200);

    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to onboard member. Check duplicate Aadhaar or Phone.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered List Computation
  const filteredCustomers = customers.filter(c => {
    if (statusFilter === 'VERIFIED') return c.kycStatus === 'VERIFIED';
    if (statusFilter === 'PENDING') return c.kycStatus === 'PENDING';
    if (statusFilter === 'BORROWERS') return (c.loans && c.loans.length > 0);
    return true;
  });

  const totalMembers = customers.length;
  const verifiedCount = customers.filter(c => c.kycStatus === 'VERIFIED').length;
  const pendingCount = customers.filter(c => c.kycStatus === 'PENDING').length;
  const borrowersCount = customers.filter(c => c.loans && c.loans.length > 0).length;

  return (
    <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '12px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Users size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 700, margin: 0, fontFamily: 'var(--font-heading)' }}>
              Bank Customer & Member Directory
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
              Search, onboard, and manage account holder profiles & KYC verification
            </p>
          </div>
        </div>

        <button 
          onClick={() => setIsRegisterModalOpen(true)}
          className="btn btn-primary"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '12px 20px', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem'
          }}
        >
          <UserPlus size={18} />
          <span>Register New Member</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <div className="panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '10px',
            backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Registered Members</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>{totalMembers}</div>
          </div>
        </div>

        <div className="panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '10px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>KYC Verified</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#10b981' }}>{verifiedCount}</div>
          </div>
        </div>

        <div className="panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '10px',
            backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>KYC Pending Review</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f59e0b' }}>{pendingCount}</div>
          </div>
        </div>

        <div className="panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '10px',
            backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <CreditCard size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Active Borrowers</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#8b5cf6' }}>{borrowersCount}</div>
          </div>
        </div>
      </div>

      {/* Main Directory Container */}
      <div className="panel" style={{ padding: '24px' }}>
        
        {/* Search & Filter Controls Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: '300px', maxWidth: '500px', position: 'relative', display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text"
                className="form-control"
                style={{ paddingLeft: '40px', paddingRight: '12px', height: '42px' }}
                placeholder="Search member by Name, Member ID, Phone, PAN, or Aadhaar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-secondary" style={{ padding: '0 18px', height: '42px' }}>
              Search
            </button>
          </form>

          {/* Category Filter Tabs */}
          <div style={{ display: 'flex', gap: '6px', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '4px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`btn ${statusFilter === 'ALL' ? 'btn-primary' : ''}`}
              style={{ padding: '6px 14px', fontSize: '0.83rem', borderRadius: '6px' }}
            >
              All Members ({totalMembers})
            </button>
            <button
              onClick={() => setStatusFilter('VERIFIED')}
              className={`btn ${statusFilter === 'VERIFIED' ? 'btn-primary' : ''}`}
              style={{ padding: '6px 14px', fontSize: '0.83rem', borderRadius: '6px' }}
            >
              Verified ({verifiedCount})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`btn ${statusFilter === 'PENDING' ? 'btn-primary' : ''}`}
              style={{ padding: '6px 14px', fontSize: '0.83rem', borderRadius: '6px' }}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('BORROWERS')}
              className={`btn ${statusFilter === 'BORROWERS' ? 'btn-primary' : ''}`}
              style={{ padding: '6px 14px', fontSize: '0.83rem', borderRadius: '6px' }}
            >
              Borrowers ({borrowersCount})
            </button>
          </div>
        </div>

        {/* Directory Members Table */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '240px', gap: '12px' }}>
            <Loader2 className="animate-spin" size={28} style={{ color: '#10b981' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Querying Member Database...</span>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Users size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 6px 0' }}>No bank members found</h3>
            <p style={{ fontSize: '0.85rem', margin: 0 }}>Try adjusting your search term or filter tab.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--panel-border)', textAlign: 'left' }}>
                  <th style={{ padding: '14px 16px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Member Info</th>
                  <th style={{ padding: '14px 16px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Contact Details</th>
                  <th style={{ padding: '14px 16px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Identity Documents</th>
                  <th style={{ padding: '14px 16px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Occupation & City</th>
                  <th style={{ padding: '14px 16px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>KYC Status</th>
                  <th style={{ padding: '14px 16px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(customer => (
                  <tr 
                    key={customer.id} 
                    style={{ borderBottom: '1px solid var(--panel-border)', transition: 'background-color 0.15s ease' }}
                  >
                    {/* Member Info */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '38px', height: '38px', borderRadius: '50%',
                          backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600
                        }}>
                          {customer.fullName ? customer.fullName.charAt(0).toUpperCase() : 'M'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                            {customer.fullName}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 500 }}>
                            {customer.memberId}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Details */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={14} style={{ color: 'var(--text-muted)' }} /> {customer.phone}
                      </div>
                      {customer.email && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <Mail size={12} style={{ color: 'var(--text-muted)' }} /> {customer.email}
                        </div>
                      )}
                    </td>

                    {/* Identifiers */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <div><strong style={{ color: 'var(--text-primary)' }}>PAN:</strong> {customer.panNumber || 'N/A'}</div>
                        <div><strong style={{ color: 'var(--text-primary)' }}>Aadhaar:</strong> {customer.aadhaarNumber ? `•••• ${customer.aadhaarNumber.slice(-4)}` : 'N/A'}</div>
                      </div>
                    </td>

                    {/* Occupation & Location */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 500 }}>{customer.occupation || 'Self-Employed'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{customer.city || 'Karnataka'}, {customer.state || 'IN'}</div>
                    </td>

                    {/* KYC Badge */}
                    <td style={{ padding: '14px 16px' }}>
                      {customer.kycStatus === 'VERIFIED' ? (
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldCheck size={12} /> VERIFIED
                        </span>
                      ) : customer.kycStatus === 'PENDING' ? (
                        <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> PENDING
                        </span>
                      ) : (
                        <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <AlertCircle size={12} /> REJECTED
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleCustomerClick(customer.id)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 14px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Eye size={14} />
                        <span>Inspect Profile</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Member Details Inspection Modal */}
      {selectedCustomer && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div className="panel" style={{ maxWidth: '750px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px', position: 'relative' }}>
            <button 
              onClick={() => setSelectedCustomer(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={22} />
            </button>

            {selectedCustomer.loading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <Loader2 className="animate-spin" size={32} style={{ color: '#10b981', marginBottom: '12px' }} />
                <div>Fetching complete member credentials...</div>
              </div>
            ) : (
              <div>
                {/* Modal Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '20px' }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 700
                  }}>
                    {selectedCustomer.fullName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>{selectedCustomer.fullName}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                      <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.85rem' }}>{selectedCustomer.memberId}</span>
                      <span className="badge badge-success">{selectedCustomer.kycStatus}</span>
                    </div>
                  </div>
                </div>

                {/* Grid Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Personal & Contact</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
                      <div><strong>Phone:</strong> {selectedCustomer.phone}</div>
                      <div><strong>Email:</strong> {selectedCustomer.email || 'N/A'}</div>
                      <div><strong>Occupation:</strong> {selectedCustomer.occupation || 'N/A'}</div>
                      <div><strong>Annual Income:</strong> ₹{selectedCustomer.annualIncome ? Number(selectedCustomer.annualIncome).toLocaleString() : 'N/A'}</div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Government Identity</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
                      <div><strong>Aadhaar Card:</strong> {selectedCustomer.aadhaarNumber || 'N/A'}</div>
                      <div><strong>PAN Card:</strong> {selectedCustomer.panNumber || 'N/A'}</div>
                      <div><strong>City / District:</strong> {selectedCustomer.city || 'Bengaluru'}, {selectedCustomer.state || 'Karnataka'}</div>
                      <div><strong>Address:</strong> {selectedCustomer.addressLine1 || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Linked Accounts & Loans */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px' }}>Linked Accounts & Active Loans</h4>
                  {selectedCustomer.loans && selectedCustomer.loans.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedCustomer.loans.map((loan: any) => (
                        <div key={loan.id} style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 600, color: '#10b981' }}>{loan.loanNumber} ({loan.loanType?.name || 'Loan'})</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Requested: ₹{Number(loan.requestedAmount).toLocaleString()}</div>
                          </div>
                          <span className="badge badge-info">{loan.status}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No active loan applications recorded for this member.</div>
                  )}
                </div>

                <div style={{ textAlign: 'right', marginTop: '24px' }}>
                  <button onClick={() => setSelectedCustomer(null)} className="btn btn-secondary">Close Inspector</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Register New Member Modal */}
      {isRegisterModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div className="panel" style={{ maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px', position: 'relative' }}>
            <button 
              onClick={() => setIsRegisterModalOpen(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={22} />
            </button>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-heading)' }}>
              Register New Bank Member
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Onboard a new customer profile into the PostgreSQL database with KYC details
            </p>

            {errorMsg && (
              <div style={{ padding: '10px 14px', borderRadius: '6px', backgroundColor: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', color: 'var(--accent-rose)', fontSize: '0.85rem', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            {saveSuccess && (
              <div style={{ padding: '10px 14px', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981', fontSize: '0.85rem', marginBottom: '16px' }}>
                {saveSuccess}
              </div>
            )}

            <form onSubmit={handleRegisterCustomer}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input type="text" required className="form-control" placeholder="e.g. Rajesh Kumar" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input type="text" required className="form-control" placeholder="10-digit mobile" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-control" placeholder="rajesh@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-control" value={gender} onChange={(e) => setGender(e.target.value)}>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Aadhaar Card Number</label>
                  <input type="text" className="form-control" placeholder="12-digit Aadhaar" value={aadhaar} onChange={(e) => setAadhaar(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">PAN Card Number</label>
                  <input type="text" className="form-control" placeholder="ABCDE1234F" value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} />
                </div>

                <div className="form-group">
                  <label className="form-label">Occupation</label>
                  <input type="text" className="form-control" placeholder="e.g. Software Engineer, Farmer" value={occupation} onChange={(e) => setOccupation(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Annual Income (₹)</label>
                  <input type="number" className="form-control" placeholder="e.g. 850000" value={annualIncome} onChange={(e) => setAnnualIncome(e.target.value)} />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Residential Address</label>
                  <input type="text" className="form-control" placeholder="House #, Street, Area" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">City</label>
                  <input type="text" className="form-control" placeholder="Bengaluru" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Pincode</label>
                  <input type="text" className="form-control" placeholder="560001" value={pincode} onChange={(e) => setPincode(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => setIsRegisterModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ padding: '10px 20px' }}>
                  {isSubmitting ? 'Registering...' : 'Save Member Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Customers;
