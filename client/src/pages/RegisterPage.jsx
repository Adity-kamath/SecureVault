import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LiveStrengthMeter from '../components/common/LiveStrengthMeter';
import { Shield, ArrowRight } from 'lucide-react';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await register({ name, email, masterPassword, role });
      if (res.user?.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/credentials');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f7f5', padding: '20px' }}>
      <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div className="brand-icon" style={{ margin: '0 auto 16px auto', width: '48px', height: '48px' }}>
            <Shield size={28} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>Create SecureVault Account</h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
            Enroll with your organisation credentials
          </p>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', marginBottom: '18px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Vikram R."
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Work Email</label>
            <input
              type="email"
              placeholder="vikram@company.com"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <select
              className="form-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="employee">Employee</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Master Password</label>
            <input
              type="password"
              placeholder="Minimum 8 characters"
              className="form-input"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              required
            />
            {masterPassword && (
              <LiveStrengthMeter password={masterPassword} userInputs={[name, email]} />
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '12px' }}
          >
            <span>{loading ? 'Creating Account...' : 'Register'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#0f766e', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
