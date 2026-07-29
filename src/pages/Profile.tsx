import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, ArrowLeft, Mail, Phone, Briefcase, MapPin, Shield, Activity, Settings, Key, AlertCircle } from 'lucide-react';
import apiClient from '../api/apiClient';

export const Profile: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profileError, setProfileError] = useState<string | null>(null);

  if (!user) return null;

  // Initialize profile form
  React.useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordForm(false);
        setPasswordSuccess(false);
      }, 3000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setLoading(true);

    try {
      await updateProfile({ email, phone });
      setProfileSuccess(true);
      setTimeout(() => {
        setShowProfileForm(false);
        setProfileSuccess(false);
      }, 3000);
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => navigate(-1)} 
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>User Profile</h1>
        </div>
        
        <button 
          onClick={logout} 
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: 'var(--accent-rose)', borderColor: 'var(--accent-rose)' }}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '24px' }}>
        {/* Left Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Profile Card */}
          <div className="panel" style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '2px solid #10b981',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981'
            }}>
              <User size={40} />
            </div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 4px 0' }}>{user.fullName}</h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.85rem' }}>
              {user.role?.name || 'User'}
            </p>
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
              <span style={{ 
                padding: '4px 12px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 600,
                backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' 
              }}>
                Active Account
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div className="panel" style={{ padding: '12px' }}>
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                background: activeTab === 'overview' ? 'rgba(255,255,255,0.05)' : 'none',
                border: 'none', borderRadius: '8px', color: activeTab === 'overview' ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer', textAlign: 'left', fontWeight: activeTab === 'overview' ? 600 : 400
              }}
            >
              <User size={18} /> Overview
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                background: activeTab === 'activity' ? 'rgba(255,255,255,0.05)' : 'none',
                border: 'none', borderRadius: '8px', color: activeTab === 'activity' ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer', textAlign: 'left', fontWeight: activeTab === 'activity' ? 600 : 400, marginTop: '4px'
              }}
            >
              <Activity size={18} /> Activity Log
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                background: activeTab === 'settings' ? 'rgba(255,255,255,0.05)' : 'none',
                border: 'none', borderRadius: '8px', color: activeTab === 'settings' ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer', textAlign: 'left', fontWeight: activeTab === 'settings' ? 600 : 400, marginTop: '4px'
              }}
            >
              <Settings size={18} /> Settings
            </button>
          </div>
        </div>

        {/* Right Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {activeTab === 'overview' && (
            <div className="panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 20px 0', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px' }}>
                Personal Information
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Full Name</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                    <User size={16} color="var(--text-muted)" />
                    {user.fullName}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Email Address</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                    <Mail size={16} color="var(--text-muted)" />
                    {user.email}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Phone Number</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                    <Phone size={16} color="var(--text-muted)" />
                    {user.phone || 'Not provided'}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Employee Code</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                    <Briefcase size={16} color="var(--text-muted)" />
                    {user.employeeCode || 'N/A'}
                  </div>
                </div>
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '32px 0 20px 0', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px' }}>
                Organizational Details
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Role</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                    <Shield size={16} color="var(--text-muted)" />
                    {user.role?.name || 'N/A'}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Branch</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                    <MapPin size={16} color="var(--text-muted)" />
                    {user.branch?.name || 'Main Office'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 20px 0', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px' }}>
                Recent Activity
              </h3>
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                <Activity size={32} style={{ opacity: 0.5, marginBottom: '16px', margin: '0 auto' }} />
                <p style={{ margin: '0 0 8px 0', fontWeight: 500 }}>Activity Log is currently empty</p>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>This space will be used to display access logs to customer data and administrative actions.</p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 20px 0', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px' }}>
                Account Settings
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0 16px 0', borderBottom: '1px solid var(--panel-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <Mail size={20} color="var(--text-secondary)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 500 }}>Update Contact Info</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Change your email address and phone number</div>
                  </div>
                </div>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowProfileForm(!showProfileForm)}
                >
                  {showProfileForm ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {showProfileForm && (
                <div style={{ padding: '20px 0', borderBottom: '1px solid var(--panel-border)' }}>
                  <form onSubmit={handleProfileUpdate} style={{ maxWidth: '400px' }}>
                    {profileError && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px', 
                        backgroundColor: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)',
                        padding: '12px', borderRadius: '8px', color: 'var(--accent-rose)', 
                        fontSize: '0.85rem', marginBottom: '16px'
                      }}>
                        <AlertCircle size={18} style={{ flexShrink: 0 }} />
                        <span>{profileError}</span>
                      </div>
                    )}
                    
                    {profileSuccess && (
                      <div style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)',
                        padding: '12px', borderRadius: '8px', color: '#10b981', marginBottom: '16px', fontSize: '0.85rem'
                      }}>
                        Profile updated successfully!
                      </div>
                    )}

                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label className="form-label">Email Address</label>
                      <input 
                        type="email" 
                        required
                        className="form-control" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                      <label className="form-label">Phone Number</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--panel-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <Key size={20} color="var(--text-secondary)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 500 }}>Change Password</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Update your password regularly to keep your account secure</div>
                  </div>
                </div>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                >
                  {showPasswordForm ? 'Cancel' : 'Update'}
                </button>
              </div>

              {showPasswordForm && (
                <div style={{ padding: '20px 0', borderBottom: '1px solid var(--panel-border)' }}>
                  <form onSubmit={handlePasswordChange} style={{ maxWidth: '400px' }}>
                    {passwordError && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px', 
                        backgroundColor: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)',
                        padding: '12px', borderRadius: '8px', color: 'var(--accent-rose)', 
                        fontSize: '0.85rem', marginBottom: '16px'
                      }}>
                        <AlertCircle size={18} style={{ flexShrink: 0 }} />
                        <span>{passwordError}</span>
                      </div>
                    )}
                    
                    {passwordSuccess && (
                      <div style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)',
                        padding: '12px', borderRadius: '8px', color: '#10b981', marginBottom: '16px', fontSize: '0.85rem'
                      }}>
                        Password updated successfully!
                      </div>
                    )}

                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label className="form-label">Current Password</label>
                      <input 
                        type="password" 
                        required
                        className="form-control" 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label className="form-label">New Password</label>
                      <input 
                        type="password" 
                        required
                        minLength={8}
                        className="form-control" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                      <label className="form-label">Confirm New Password</label>
                      <input 
                        type="password" 
                        required
                        minLength={8}
                        className="form-control" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Updating...' : 'Save Password'}
                    </button>
                  </form>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <Shield size={20} color="var(--text-secondary)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 500 }}>Two-Factor Authentication</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Add an extra layer of security to your account</div>
                  </div>
                </div>
                <button className="btn btn-secondary">Configure</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
