import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import {
  HeartPulse,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Layers,
  AlertTriangle,
  RefreshCw,
  Clock
} from 'lucide-react';

const AdminHealthPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setLoading(true);
        const res = await adminService.getOrgHealth();
        if (res.success) {
          setMetrics(res.metrics);
        }
      } catch (err) {
        console.error('Failed to load org health:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
        Evaluating organisation-wide password hygiene...
      </div>
    );
  }

  const {
    totalEmployees,
    totalCredentials,
    overallHealthScore,
    needAttentionCount,
    weakCount,
    reusedCount,
    oldCount,
    distribution = {}
  } = metrics || {};

  const total = totalCredentials || 1;

  const distributionList = [
    { label: 'Very Strong (Score 4)', count: distribution.veryStrong || 0, color: '#10b981' },
    { label: 'Strong (Score 3)', count: distribution.strong || 0, color: '#34d399' },
    { label: 'Fair (Score 2)', count: distribution.fair || 0, color: '#f59e0b' },
    { label: 'Weak (Score 1)', count: distribution.weak || 0, color: '#f97316' },
    { label: 'Very Weak (Score 0)', count: distribution.veryWeak || 0, color: '#ef4444' }
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Organisation Password Health</h1>
        <p className="page-subtitle">
          Aggregated security metrics across all {totalEmployees} active employees. Zero-knowledge guarantee: admins cannot view passwords.
        </p>
      </div>

      {/* Top 4 Metrics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green">
            <HeartPulse size={22} />
          </div>
          <div>
            <div className="stat-value" style={{ color: overallHealthScore >= 70 ? '#10b981' : '#f59e0b' }}>
              {overallHealthScore}
              <span style={{ fontSize: '18px', color: '#94a3b8' }}>/100</span>
            </div>
            <div className="stat-label">Organisation Health Score</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon rose">
            <AlertTriangle size={22} />
          </div>
          <div>
            <div className="stat-value" style={{ color: weakCount > 0 ? '#e11d48' : '#0f172a' }}>
              {weakCount}
            </div>
            <div className="stat-label">Weak Credentials</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">
            <RefreshCw size={22} />
          </div>
          <div>
            <div className="stat-value" style={{ color: reusedCount > 0 ? '#b45309' : '#0f172a' }}>
              {reusedCount}
            </div>
            <div className="stat-label">Reused Credentials</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <Clock size={22} />
          </div>
          <div>
            <div className="stat-value">{oldCount}</div>
            <div className="stat-label">Old Credentials (90d+)</div>
          </div>
        </div>
      </div>

      {/* Distribution Card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        <div className="card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>
            Password Strength Distribution
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
            Entropy and crack-resistance assessment based on zxcvbn model
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {distributionList.map((item, idx) => {
              const pct = Math.round((item.count / total) * 100);
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{item.label}</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.max(item.count > 0 ? 4 : 0, pct)}%`,
                        background: item.color,
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security & Zero Knowledge Explainer */}
        <div className="card" style={{ padding: '28px', background: '#fcfdfd' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0f766e', marginBottom: '14px' }}>
            <Lock size={22} />
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Zero-Knowledge Protection</h3>
          </div>

          <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, marginBottom: '16px' }}>
            SecureVault is engineered with zero-knowledge separation: administrators can audit health scores, identify risk categories, and manage accounts, but
            <strong> cannot access or decrypt stored password values</strong>.
          </p>

          <div style={{ background: '#ecfdf5', border: '1px solid #d1fae5', padding: '14px', borderRadius: '10px' }}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: '#065f46', marginBottom: '4px' }}>
              Cryptographic Enforcements:
            </div>
            <ul style={{ fontSize: '12px', color: '#047857', paddingLeft: '18px', lineHeight: 1.6 }}>
              <li>Master passwords are hashed using bcrypt with salt (never stored in plaintext).</li>
              <li>Stored credentials are encrypted with AES-256-GCM (fresh random IV per record).</li>
              <li>Tamper-evident HMAC authentication tags prevent unauthorized tampering.</li>
              <li>Every reveal and decryption action writes an immutable audit trail entry.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHealthPage;
