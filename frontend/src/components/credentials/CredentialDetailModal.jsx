import React, { useState } from 'react';
import { credentialService } from '../../services/credentialService';
import ShareModal from './ShareModal';
import {
  X,
  Copy,
  Check,
  Eye,
  EyeOff,
  Edit2,
  Share2,
  Trash2,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

const CredentialDetailModal = ({
  credential,
  onClose,
  onEdit,
  onDelete,
  onRefresh
}) => {
  if (!credential) return null;

  const [revealedPassword, setRevealedPassword] = useState(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [copiedUser, setCopiedUser] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [error, setError] = useState('');

  const handleReveal = async () => {
    if (revealedPassword) {
      setRevealedPassword(null);
      return;
    }

    setIsRevealing(true);
    setError('');

    try {
      const res = await credentialService.revealPassword(credential._id);
      if (res.success) {
        setRevealedPassword(res.password);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reveal password');
    } finally {
      setIsRevealing(false);
    }
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'user') {
        setCopiedUser(true);
        setTimeout(() => setCopiedUser(false), 2000);
      } else {
        setCopiedPass(true);
        setTimeout(() => setCopiedPass(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  const handleCopyPassword = async () => {
    if (revealedPassword) {
      copyToClipboard(revealedPassword, 'pass');
      return;
    }

    try {
      const res = await credentialService.revealPassword(credential._id);
      if (res.success) {
        copyToClipboard(res.password, 'pass');
      }
    } catch (err) {
      setError('Failed to fetch password for copy');
    }
  };

  const isOwner = credential.accessLevel === 'owner' || credential.isOwner;
  const canEdit = isOwner || credential.accessLevel === 'edit';

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '860px', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            My Credentials / <strong style={{ color: '#0f172a' }}>{credential.title}</strong>
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>

        {/* Title Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700 }}>{credential.title}</h2>
              {credential.isReused && <span className="tag-badge reused">Reused</span>}
              {credential.strengthScore < 3 && <span className="tag-badge weak">Weak</span>}
            </div>
            {credential.url && (
              <a
                href={credential.url.startsWith('http') ? credential.url : `https://${credential.url}`}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '13px', color: '#0f766e', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', marginTop: '4px' }}
              >
                <span>{credential.url.replace(/^https?:\/\//, '')}</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {canEdit && (
              <button
                onClick={() => onEdit(credential)}
                className="btn btn-secondary btn-sm"
              >
                <Edit2 size={14} />
                <span>Edit</span>
              </button>
            )}

            {isOwner && (
              <button
                onClick={() => setShowShareModal(true)}
                className="btn btn-primary btn-sm"
              >
                <Share2 size={14} />
                <span>Share</span>
              </button>
            )}

            {isOwner && (
              <button
                onClick={() => onDelete(credential._id)}
                className="btn btn-danger-outline btn-sm"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', marginBottom: '18px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
          {/* Left Details Card */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Username Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Username / Account</span>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>
                  {credential.username}
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(credential.username, 'user')}
                className="btn btn-secondary btn-sm"
              >
                {copiedUser ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                <span>{copiedUser ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Password Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Password</span>
                <div style={{ fontSize: '15px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>
                  {revealedPassword ? revealedPassword : '••••••••••••••••'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleReveal}
                  disabled={isRevealing}
                  className="btn btn-secondary btn-sm"
                >
                  {revealedPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>{revealedPassword ? 'Hide' : 'Reveal'}</span>
                </button>
                <button
                  onClick={handleCopyPassword}
                  className="btn btn-secondary btn-sm"
                >
                  {copiedPass ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                  <span>{copiedPass ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Website Row */}
            <div style={{ paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Website</span>
              <div style={{ fontSize: '14px', color: '#0f172a', marginTop: '2px' }}>
                {credential.url || 'None specified'}
              </div>
            </div>

            {/* Last Updated */}
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Last updated {new Date(credential.lastUpdated || credential.updatedAt).toLocaleDateString()}
              {credential.sharedBy && ` · Shared by ${credential.sharedBy.name}`}
            </div>
          </div>

          {/* Right Column: Sharing & Risk Alerts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Shared With Card */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Shared with</h4>
                {isOwner && (
                  <button
                    onClick={() => setShowShareModal(true)}
                    style={{ background: 'none', border: 'none', color: '#0f766e', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Manage
                  </button>
                )}
              </div>

              {!credential.sharedWith || credential.sharedWith.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#64748b' }}>Not shared with anyone</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {credential.sharedWith.map((sw, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="user-avatar" style={{ width: '26px', height: '26px', fontSize: '11px' }}>
                          {sw.name ? sw.name[0].toUpperCase() : 'U'}
                        </div>
                        <span style={{ fontWeight: 600 }}>{sw.name}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                        Can {sw.permission}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Risk Category Alert Banner (matching Screenshot 4) */}
            {credential.isReused && (
              <div className="card" style={{ background: '#fffbeb', borderColor: '#fef3c7', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', marginBottom: '6px' }}>
                  <AlertTriangle size={16} />
                  <strong style={{ fontSize: '13px' }}>Password reused</strong>
                </div>
                <p style={{ fontSize: '12px', color: '#92400e', lineHeight: 1.4 }}>
                  This password also appears in other entries in your vault. Update it to improve your health score.
                </p>
              </div>
            )}
          </div>
        </div>

        {showShareModal && (
          <ShareModal
            credential={credential}
            onClose={() => setShowShareModal(false)}
            onUpdated={() => {
              if (onRefresh) onRefresh();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CredentialDetailModal;
