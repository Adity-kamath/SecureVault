import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, masterPassword);
      if (res.user?.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/credentials');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail, role) => {
    setEmail(demoEmail);
    setMasterPassword('MasterPassword123!@#');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f7f5', padding: '20px' }}>
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div className="brand-icon" style={{ margin: '0 auto 16px auto', width: '48px', height: '48px' }}>
            <Shield size={28} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>Sign in to SecureVault</h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
            Zero-knowledge encrypted credential management
          </p>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', marginBottom: '18px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Work Email</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                placeholder="name@company.com"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Master Password</label>
            <input
              type="password"
              placeholder="••••••••••••••••"
              className="form-input"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Demo Fast Login Helpers */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: '10px' }}>
            Instant Demo Logins
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleDemoFill('meera@company.com', 'admin')}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, fontSize: '12px' }}
            >
              <UserCheck size={13} color="#0f766e" />
              <span>Admin (Meera)</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('aditya@company.com', 'employee')}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, fontSize: '12px' }}
            >
              <UserCheck size={13} color="#059669" />
              <span>Employee (Aditya)</span>
            </button>
          </div>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#0f766e', fontWeight: 600, textDecoration: 'none' }}>
            Register employee
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
