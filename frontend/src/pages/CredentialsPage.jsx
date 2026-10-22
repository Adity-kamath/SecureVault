import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { credentialService } from '../services/credentialService';
import CredentialFormModal from '../components/credentials/CredentialFormModal';
import CredentialDetailModal from '../components/credentials/CredentialDetailModal';
import ShareModal from '../components/credentials/ShareModal';
import {
  Plus,
  Search,
  KeyRound,
  Eye,
  Share2,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Users
} from 'lucide-react';

const CredentialsPage = () => {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, owned, shared

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedCred, setSelectedCred] = useState(null);
  const [editCred, setEditCred] = useState(null);
  const [shareCred, setShareCred] = useState(null);

  const location = useLocation();

  useEffect(() => {
    if (location.pathname.includes('/shared')) {
      setFilterType('shared');
    }
  }, [location]);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const res = await credentialService.getCredentials();
      if (res.success) {
        setCredentials(res.credentials);
      }
    } catch (err) {
      console.error('Failed to load credentials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this credential? This action cannot be undone.')) {
      return;
    }

    try {
      await credentialService.deleteCredential(id);
      setSelectedCred(null);
      fetchCredentials();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete credential');
    }
  };

  const filtered = credentials.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.url && c.url.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === 'owned') return c.isOwner;
    if (filterType === 'shared') return !c.isOwner;
    return true;
  });

  const getStrengthBadge = (score) => {
    if (score >= 3) {
      return <span className="status-pill active" style={{ fontSize: '11px' }}>Strong ({score}/4)</span>;
    }
    if (score === 2) {
      return <span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600 }}>Fair ({score}/4)</span>;
    }
    return <span className="tag-badge weak">Weak ({score}/4)</span>;
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 className="page-title">My Credentials</h1>
          <p className="page-subtitle">
            All stored passwords are encrypted using AES-256-GCM.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="btn btn-primary"
        >
          <Plus size={16} />
          <span>Add Credential</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setFilterType('all')}
            className={`btn btn-sm ${filterType === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          >
            All Vault ({credentials.length})
          </button>
          <button
            onClick={() => setFilterType('owned')}
            className={`btn btn-sm ${filterType === 'owned' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Owned by Me ({credentials.filter((c) => c.isOwner).length})
          </button>
          <button
            onClick={() => setFilterType('shared')}
            className={`btn btn-sm ${filterType === 'shared' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Shared with Me ({credentials.filter((c) => !c.isOwner).length})
          </button>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search credentials..."
            className="form-input"
            style={{ paddingLeft: '36px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Credential</th>
              <th>Username</th>
              <th>Strength</th>
              <th>Access</th>
              <th>Last Updated</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  Loading encrypted credentials...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
                  <KeyRound size={32} style={{ margin: '0 auto 12px auto', color: '#cbd5e1' }} />
                  <p style={{ fontWeight: 600 }}>No credentials found</p>
                  <p style={{ fontSize: '13px' }}>Click "Add Credential" to store your first password securely.</p>
                </td>
              </tr>
            ) : (
              filtered.map((cred) => (
                <tr
                  key={cred._id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedCred(cred)}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="stat-icon green" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
                        <KeyRound size={16} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{cred.title}</div>
                        {cred.url && (
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {cred.url.replace(/^https?:\/\//, '')}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                      {cred.username}
                    </span>
                  </td>
                  <td>{getStrengthBadge(cred.strengthScore)}</td>
                  <td>
                    {cred.isOwner ? (
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f766e', background: '#ecfdf5', padding: '3px 8px', borderRadius: '4px' }}>
                        Owner {cred.sharedWith?.length > 0 && `(shared ${cred.sharedWith.length})`}
                      </span>
                    ) : (
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#0284c7', background: '#e0f2fe', padding: '3px 8px', borderRadius: '4px' }}>
                        Can {cred.accessLevel} (from {cred.sharedBy?.name})
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: '13px', color: '#64748b' }}>
                    {new Date(cred.lastUpdated || cred.updatedAt || cred.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setSelectedCred(cred)}
                        className="btn btn-secondary btn-sm"
                        title="View & Decrypt"
                      >
                        <Eye size={13} />
                        <span>View</span>
                      </button>

                      {cred.isOwner && (
                        <button
                          onClick={() => setShareCred(cred)}
                          className="btn btn-secondary btn-sm"
                          title="Share with Colleagues"
                        >
                          <Share2 size={13} />
                        </button>
                      )}

                      {cred.isOwner && (
                        <button
                          onClick={() => handleDelete(cred._id)}
                          className="btn btn-danger-outline btn-sm"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="table-footer">
          <span>Showing {filtered.length} of {credentials.length} credentials</span>
          <span>AES-256-GCM zero-plaintext storage</span>
        </div>
      </div>

      {/* Modals */}
      {isAddOpen && (
        <CredentialFormModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onSuccess={fetchCredentials}
        />
      )}

      {editCred && (
        <CredentialFormModal
          isOpen={!!editCred}
          initialData={editCred}
          onClose={() => setEditCred(null)}
          onSuccess={fetchCredentials}
        />
      )}

      {selectedCred && (
        <CredentialDetailModal
          credential={selectedCred}
          onClose={() => setSelectedCred(null)}
          onEdit={(cred) => {
            setSelectedCred(null);
            setEditCred(cred);
          }}
          onDelete={handleDelete}
          onRefresh={fetchCredentials}
        />
      )}

      {shareCred && (
        <ShareModal
          credential={shareCred}
          onClose={() => setShareCred(null)}
          onUpdated={fetchCredentials}
        />
      )}
    </div>
  );
};

export default CredentialsPage;
