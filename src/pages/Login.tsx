import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import apiClient from '../api/apiClient';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (resetToken) {
      try {
        await apiClient.post('/auth/reset-password', { token: resetToken, newPassword });
        setForgotSuccess(true);
        setResetToken(null);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to reset password.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (isForgotPassword) {
      try {
        const response = await apiClient.post('/auth/forgot-password', { email });
        if (response.data?.devOnlyToken) {
          setResetToken(response.data.devOnlyToken);
        } else {
          setForgotSuccess(true);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to send password reset email.');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      const data = err.response?.data;
      let msg = 'Login failed. Please verify credentials.';
      if (data && data.message) {
        if (typeof data.message === 'string') {
          msg = data.message;
        } else if (typeof data.message === 'object') {
          msg = data.message.message || JSON.stringify(data.message);
        }
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', 
      justifyContent: 'center', backgroundColor: '#080b11',
      backgroundImage: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.05) 0%, transparent 70%)'
    }}>
      <div className="panel" style={{ width: '100%', maxWidth: '420px', padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '8px', 
            backgroundColor: '#10b981', display: 'inline-flex', alignItems: 'center', 
            justifyContent: 'center', fontWeight: 'bold', color: '#080b11', 
            fontSize: '1.5rem', marginBottom: '16px'
          }}>SG</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 600 }}>
            {resetToken ? 'Set New Password' : isForgotPassword ? 'Reset Password' : 'Welcome Back'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            {resetToken ? 'Enter your new password below' : isForgotPassword ? 'Enter your email to receive a reset link' : 'Gurudeva Co-operative Banking Terminal'}
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', 
            backgroundColor: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)',
            padding: '12px', borderRadius: '8px', color: 'var(--accent-rose)', 
            fontSize: '0.85rem', marginBottom: '20px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {forgotSuccess ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)',
              padding: '16px', borderRadius: '8px', color: '#10b981', marginBottom: '24px'
            }}>
              {isForgotPassword && !resetToken 
                ? 'Password reset link sent to your email successfully.'
                : 'Password has been reset successfully!'}
            </div>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ width: '100%', padding: '12px' }}
              onClick={() => { setIsForgotPassword(false); setForgotSuccess(false); setResetToken(null); setError(null); setNewPassword(''); }}
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {resetToken ? (
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{
                    position: 'absolute', left: '14px', top: '14px', 
                    color: 'var(--text-muted)'
                  }} />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required
                    className="form-control" 
                    style={{ paddingLeft: '44px', paddingRight: '44px' }}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: '14px', top: '14px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="form-group" style={{ marginBottom: isForgotPassword ? '24px' : '16px' }}>
                  <label className="form-label">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{
                      position: 'absolute', left: '14px', top: '14px', 
                      color: 'var(--text-muted)'
                    }} />
                    <input 
                      type="email" 
                      required
                      className="form-control" 
                      style={{ paddingLeft: '44px' }}
                      placeholder="staff@society.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {!isForgotPassword && (
                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label className="form-label" style={{ margin: 0 }}>Password</label>
                      <a href="#" onClick={(e) => { e.preventDefault(); setIsForgotPassword(true); setError(null); }} style={{ fontSize: '0.8rem', color: '#10b981', textDecoration: 'none' }}>
                        Forgot?
                      </a>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <Lock size={18} style={{
                        position: 'absolute', left: '14px', top: '14px', 
                        color: 'var(--text-muted)'
                      }} />
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        required
                        className="form-control" 
                        style={{ paddingLeft: '44px', paddingRight: '44px' }}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute', right: '14px', top: '14px',
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--text-muted)'
                        }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '12px', marginBottom: isForgotPassword ? '16px' : '0' }}
              disabled={loading}
            >
              {loading 
                ? (resetToken ? 'Resetting...' : isForgotPassword ? 'Sending...' : 'Authenticating...') 
                : (resetToken ? 'Reset Password' : isForgotPassword ? 'Send Reset Link' : 'Sign In')}
            </button>

            {(isForgotPassword || resetToken) && (
              <div style={{ textAlign: 'center' }}>
                <a href="#" onClick={(e) => { e.preventDefault(); setIsForgotPassword(false); setResetToken(null); setError(null); setNewPassword(''); }} style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  Back to Sign In
                </a>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

