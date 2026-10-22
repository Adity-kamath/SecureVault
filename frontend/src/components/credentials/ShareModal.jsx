import React, { useState, useEffect } from 'react';
import { credentialService } from '../../services/credentialService';
import { X, UserPlus, Trash2, Shield, User } from 'lucide-react';

const ShareModal = ({ credential, onClose, onUpdated }) => {
  const [colleagues, setColleagues] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [permission, setPermission] = useState('view');
  const [shares, setShares] = useState(credential?.sharedWith || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchColleagues = async () => {
      try {
        const res = await credentialService.getActiveColleagues();
        if (res.success) {
          setColleagues(res.colleagues);
        }
      } catch (err) {
        console.error('Failed to load colleagues:', err);
      }
    };

    fetchColleagues();
  }, []);

  const handleShare = async (e) => {
    e.preventDefault();
    if (!selectedUser) {
      setError('Please select an employee to share with.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await credentialService.shareCredential(credential._id, {
        sharedWith: selectedUser,
        permission
      });

      if (res.success) {
        setSuccess(res.message);
        setShares(res.currentShares);
        setSelectedUser('');
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to share credential');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (userId, userName) => {
    if (!window.confirm(`Revoke shared access for ${userName}?`)) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await credentialService.revokeShare(credential._id, userId);
      if (res.success) {
        setSuccess(res.message);
        setShares(shares.filter((s) => s.userId !== userId));
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to revoke shared access');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Share Credential</h3>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Grant encrypted access to colleagues for "{credential?.title}"
            </p>
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ background: '#ecfdf5', color: '#047857', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleShare} style={{ marginBottom: '24px' }}>
          <div className="form-group">
            <label className="form-label">Select Employee</label>
            <select
              className="form-input"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">-- Choose Colleague --</option>
              {colleagues.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Permission Level</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="permission"
                  value="view"
                  checked={permission === 'view'}
                  onChange={() => setPermission('view')}
                />
                <span>Can View (Decrypt & Copy)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="permission"
                  value="edit"
                  checked={permission === 'edit'}
                  onChange={() => setPermission('edit')}
                />
                <span>Can Edit (Update & Re-encrypt)</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            <UserPlus size={16} />
            <span>{loading ? 'Granting Access...' : 'Grant Access'}</span>
          </button>
        </form>

        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '12px' }}>
            Employees with Access ({shares.length})
          </h4>

          {shares.length === 0 ? (
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              This credential is currently private and not shared with any colleagues.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {shares.map((share) => (
                <div
                  key={share.userId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    background: '#ffffff'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="user-avatar" style={{ width: '30px', height: '30px', fontSize: '12px' }}>
                      {share.name ? share.name[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{share.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{share.email}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: share.permission === 'edit' ? '#fef3c7' : '#e0f2fe',
                        color: share.permission === 'edit' ? '#92400e' : '#0369a1'
                      }}
                    >
                      Can {share.permission}
                    </span>

                    <button
                      onClick={() => handleRevoke(share.userId, share.name)}
                      className="btn btn-sm btn-danger-outline"
                      title="Revoke Access"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
