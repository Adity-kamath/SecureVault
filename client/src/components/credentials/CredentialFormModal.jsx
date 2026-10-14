import React, { useState, useEffect } from 'react';
import { credentialService } from '../../services/credentialService';
import LiveStrengthMeter from '../common/LiveStrengthMeter';
import GeneratorWidget from './GeneratorWidget';
import { Lock, X, Sparkles } from 'lucide-react';

const CredentialFormModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
  if (!isOpen) return null;

  const isEdit = Boolean(initialData && initialData._id);

  const [title, setTitle] = useState(initialData?.title || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [url, setUrl] = useState(initialData?.url || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !username || (!isEdit && !password)) {
      setError('Please provide title, username, and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isEdit) {
        const payload = { title, username, url };
        if (password) payload.password = password;
        await credentialService.updateCredential(initialData._id, payload);
      } else {
        await credentialService.createCredential({ title, username, password, url });
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save credential');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '880px', padding: '32px' }}>
        <div className="modal-header" style={{ marginBottom: '24px' }}>
          <div>
            <h2 className="page-title" style={{ fontSize: '24px', marginBottom: '4px' }}>
              {isEdit ? 'Edit Credential' : 'Add Credential'}
            </h2>
            <p className="page-subtitle">
              Stored encrypted — only you and employees you share it with can open it
            </p>
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={22} />
          </button>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', marginBottom: '18px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
          {/* Main Form */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Credential details</h3>
              <span style={{ fontSize: '11px', background: '#ecfdf5', color: '#047857', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                Private by default
              </span>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Vendor Portal, AWS Console"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Website URL</label>
                <input
                  type="url"
                  placeholder="https://vendor.example.com"
                  className="form-input"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Username / email</label>
                <input
                  type="text"
                  placeholder="aditya_v or name@company.com"
                  className="form-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">
                    {isEdit ? 'New Password (leave blank to keep current)' : 'Password'}
                  </label>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder={isEdit ? '••••••••••••••••' : 'Enter or generate secure password'}
                    className="form-input mono"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!isEdit}
                  />
                </div>
                {password && <LiveStrengthMeter password={password} />}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {loading ? 'Encrypting & Saving...' : 'Save credential'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Encrypted notice & Generator */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="card" style={{ background: '#f0fdf4', borderColor: '#dcfce7', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f766e', marginBottom: '8px' }}>
                <Lock size={18} />
                <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Encrypted on save</h4>
              </div>
              <p style={{ fontSize: '12px', color: '#166534', lineHeight: 1.5 }}>
                The password is encrypted on the server (AES-256-GCM) before it reaches MongoDB.
                The database never stores plaintext.
              </p>
            </div>

            <GeneratorWidget onSelectPassword={(newPass) => setPassword(newPass)} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CredentialFormModal;
