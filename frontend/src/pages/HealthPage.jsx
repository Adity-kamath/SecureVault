import React, { useState, useEffect } from 'react';
import { healthService } from '../services/healthService';
import CredentialFormModal from '../components/credentials/CredentialFormModal';
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Clock,
  CheckCircle2,
  Lock,
  ArrowRight
} from 'lucide-react';

const HealthPage = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editCred, setEditCred] = useState(null);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await healthService.getMyHealth();
      if (res.success) {
        setHealthData(res);
      }
    } catch (err) {
      console.error('Failed to load password health:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
        Evaluating vault password health...
      </div>
    );
  }

  const { summary, items } = healthData || { summary: {}, items: [] };

  const getHealthScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Password Health</h1>
        <p className="page-subtitle">
          Personal security audit: analysis of strength, password reuse, and age across your vault.
        </p>
      </div>

      {/* Top Health Overview Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div
              className="stat-value"
              style={{ color: getHealthScoreColor(summary.overallScore || 0) }}
            >
              {summary.overallScore || 0}
              <span style={{ fontSize: '18px', color: '#94a3b8' }}>/100</span>
            </div>
            <div className="stat-label">Overall Vault Health</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon rose">
            <AlertTriangle size={22} />
          </div>
          <div>
            <div className="stat-value" style={{ color: summary.weakCount > 0 ? '#e11d48' : '#0f172a' }}>
              {summary.weakCount || 0}
            </div>
            <div className="stat-label">Weak Passwords</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">
            <RefreshCw size={22} />
          </div>
          <div>
            <div className="stat-value" style={{ color: summary.reusedCount > 0 ? '#b45309' : '#0f172a' }}>
              {summary.reusedCount || 0}
            </div>
            <div className="stat-label">Reused Passwords</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <Clock size={22} />
          </div>
          <div>
            <div className="stat-value">
              {summary.oldCount || 0}
            </div>
            <div className="stat-label">Old Passwords (90d+)</div>
          </div>
        </div>
      </div>

      {/* Detailed Items Table */}
      <div className="table-container">
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Credential Vulnerability Breakdown</h3>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Credential</th>
              <th>Username</th>
              <th>Strength Score</th>
              <th>Risk Factors</th>
              <th>Age</th>
              <th style={{ textAlign: 'right' }}>Remediation</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No credentials in vault yet.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.title}</strong>
                    {item.url && <div style={{ fontSize: '12px', color: '#64748b' }}>{item.url}</div>}
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{item.username}</span>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        background: item.strengthScore >= 3 ? '#ecfdf5' : item.strengthScore === 2 ? '#fef3c7' : '#fee2e2',
                        color: item.strengthScore >= 3 ? '#047857' : item.strengthScore === 2 ? '#b45309' : '#b91c1c'
                      }}
                    >
                      {item.strengthScore}/4 {item.strengthScore >= 3 ? 'Strong' : item.strengthScore === 2 ? 'Fair' : 'Weak'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {item.isWeak && <span className="tag-badge weak">Weak</span>}
                      {item.isReused && (
                        <span className="tag-badge reused">
                          Reused ({item.reuseOccurrences}x)
                        </span>
                      )}
                      {item.isOld && <span className="tag-badge old">Old ({item.ageDays}d)</span>}
                      {!item.isWeak && !item.isReused && !item.isOld && (
                        <span style={{ fontSize: '12px', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={13} />
                          Healthy
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ fontSize: '13px', color: '#64748b' }}>
                    {item.ageDays} days ago
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => setEditCred(item)}
                      className="btn btn-secondary btn-sm"
                    >
                      <span>Update</span>
                      <ArrowRight size={13} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editCred && (
        <CredentialFormModal
          isOpen={!!editCred}
          initialData={editCred}
          onClose={() => setEditCred(null)}
          onSuccess={fetchHealth}
        />
      )}
    </div>
  );
};

export default HealthPage;
