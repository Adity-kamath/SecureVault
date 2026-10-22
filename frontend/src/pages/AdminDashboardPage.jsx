import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/adminService';
import {
  Users,
  KeyRound,
  HeartPulse,
  AlertTriangle,
  Share2,
  Edit2,
  Plus,
  Trash2,
  Shield,
  Eye,
  LogIn,
  UserX
} from 'lucide-react';

const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await adminService.getDashboard();
        if (res.success) {
          setData(res.dashboard);
        }
      } catch (err) {
        console.error('Failed to load admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
        Loading organisation security overview...
      </div>
    );
  }

  const { stats, issues, recentActivity } = data || {
    stats: {},
    issues: {},
    recentActivity: []
  };

  const getPastTense = (action) => {
    const pastTenseMap = {
      create: 'created',
      delete: 'deleted',
      edit: 'edited',
      share: 'shared',
      view: 'viewed',
      login: 'logged in',
      register: 'registered',
      revoke: 'revoked',
      status_change: 'changed status of'
    };
    return pastTenseMap[action] || `${action}ed`;
  };

  const getActivityIcon = (action) => {
    switch (action) {
      case 'share':
        return <Share2 size={14} color="#b45309" />;
      case 'edit':
        return <Edit2 size={14} color="#0f766e" />;
      case 'create':
        return <Plus size={14} color="#16a34a" />;
      case 'delete':
        return <Trash2 size={14} color="#dc2626" />;
      case 'view':
        return <Eye size={14} color="#0284c7" />;
      default:
        return <LogIn size={14} color="#64748b" />;
    }
  };

  const formatRelativeTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
      return `Today ${timeStr}`;
    }

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${timeStr}`;
    }

    return date.toLocaleDateString();
  };

  const totalCredentials = stats.credentials || 1;
  const weakPercent = Math.min(100, Math.round(((issues.weak || 0) / totalCredentials) * 100));
  const reusedPercent = Math.min(100, Math.round(((issues.reused || 0) / totalCredentials) * 100));
  const oldPercent = Math.min(100, Math.round(((issues.old || 0) / totalCredentials) * 100));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Organisation Overview</h1>
        <p className="page-subtitle">
          Acme Technologies · live across all employees
        </p>
      </div>

      {stats.inactiveEmployees > 0 && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '8px',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserX size={18} color="#b45309" />
            <div>
              <span style={{ fontWeight: 600, color: '#92400e', fontSize: '14px' }}>
                {stats.inactiveEmployees} employee account{stats.inactiveEmployees > 1 ? 's are' : ' is'} awaiting approval.
              </span>{' '}
              <span style={{ color: '#b45309', fontSize: '13px' }}>
                New accounts are created inactive by default and cannot sign in until reactivated.
              </span>
            </div>
          </div>
          <Link
            to="/admin/users"
            className="btn btn-sm btn-secondary"
            style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
          >
            Review in Users
          </Link>
        </div>
      )}

      {/* Top 4 Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green">
            <Users size={20} />
          </div>
          <div>
            <div className="stat-value">{stats.employees}</div>
            <div className="stat-label">Employees</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <KeyRound size={20} />
          </div>
          <div>
            <div className="stat-value">{stats.credentials}</div>
            <div className="stat-label">Credentials</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">
            <HeartPulse size={20} />
          </div>
          <div>
            <div className="stat-value">
              {stats.orgHealthScore}
              <span style={{ fontSize: '18px', color: '#94a3b8' }}>/100</span>
            </div>
            <div className="stat-label">Org health /100</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon rose">
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="stat-value" style={{ color: stats.needAttention > 0 ? '#e11d48' : '#0f172a' }}>
              {stats.needAttention}
            </div>
            <div className="stat-label">Need attention</div>
          </div>
        </div>
      </div>

      {/* Grid: Issues Across Organisation & Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '24px' }}>
        {/* Issues Across Organisation */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
            Issues across organisation
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
            Current risk categories
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Weak Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>Weak</span>
                <span style={{ fontWeight: 700, color: '#e11d48' }}>{issues.weak || 0}</span>
              </div>
              <div style={{ height: '8px', background: '#fee2e2', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.max(5, weakPercent)}%`, background: '#e11d48', borderRadius: '4px' }} />
              </div>
            </div>

            {/* Reused Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>Reused</span>
                <span style={{ fontWeight: 700, color: '#b45309' }}>{issues.reused || 0}</span>
              </div>
              <div style={{ height: '8px', background: '#fef3c7', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.max(5, reusedPercent)}%`, background: '#b45309', borderRadius: '4px' }} />
              </div>
            </div>

            {/* Old Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>Old (90d+)</span>
                <span style={{ fontWeight: 700, color: '#475569' }}>{issues.old || 0}</span>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.max(5, oldPercent)}%`, background: '#64748b', borderRadius: '4px' }} />
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: '28px',
              padding: '12px 14px',
              borderRadius: '8px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: '#64748b'
            }}
          >
            <Shield size={15} color="#0f766e" />
            <span>Admins see risk counts, never password values.</span>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Recent activity</h3>
            <span style={{ background: '#ecfdf5', color: '#047857', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px' }}>
              Live
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {recentActivity.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '13px' }}>No recent activity logged</p>
            ) : (
              recentActivity.map((act) => (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid #f8fafc'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {getActivityIcon(act.action)}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#0f172a' }}>
                        <strong>{act.user.name}</strong> {getPastTense(act.action)} <strong>{act.credentialTitle}</strong>
                      </div>
                    </div>
                  </div>

                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {formatRelativeTime(act.timestamp)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
