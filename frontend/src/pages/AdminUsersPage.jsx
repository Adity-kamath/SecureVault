import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { authService } from '../services/authService';
import { isCompanyEmail, companyEmailError, COMPANY_DOMAIN } from '../utils/companyConfig';
import {
  Users,
  Search,
  UserPlus,
  Shield,
  CheckCircle,
  XCircle,
  X,
  Bell,
  UserCheck
} from 'lucide-react';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Invite/Add Employee modal
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('employee');
  const [invitePassword, setInvitePassword] = useState('MasterPassword123!@#');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getUsers();
      if (res.success) {
        setUsers(res.users);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user) => {
    const nextStatus = !user.isActive;
    const actionWord = nextStatus ? 'Reactivate' : 'Deactivate';

    if (
      !window.confirm(
        `${actionWord} account for ${user.name}? ${
          !nextStatus ? 'Deactivating an employee will immediately revoke all their shared credentials.' : ''
        }`
      )
    ) {
      return;
    }

    try {
      await adminService.updateUserStatus(user.id, nextStatus);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${actionWord.toLowerCase()} user`);
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');

    if (!isCompanyEmail(inviteEmail)) {
      setInviteError(companyEmailError());
      return;
    }

    try {
      const res = await authService.register({
        name: inviteName,
        email: inviteEmail,
        role: inviteRole,
        masterPassword: invitePassword
      });

      if (res.success) {
        setInviteSuccess(`Employee ${inviteName} invited successfully.`);
        setInviteName('');
        setInviteEmail('');
        fetchUsers();
      }
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Failed to create employee account');
    }
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'active') return u.isActive;
    if (statusFilter === 'inactive') return !u.isActive;
    return true;
  });

  const activeCount = users.filter((u) => u.isActive).length;
  const inactiveCount = users.filter((u) => !u.isActive).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">
            Deactivating an employee revokes all their shared access
          </p>
        </div>

        <button
          onClick={() => setIsInviteOpen(true)}
          className="btn btn-primary"
        >
          <UserPlus size={16} />
          <span>+ Invite employee</span>
        </button>
      </div>

      {inactiveCount > 0 && (
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
            <Bell size={18} color="#b45309" />
            <div>
              <span style={{ fontWeight: 600, color: '#92400e', fontSize: '14px' }}>
                {inactiveCount} account{inactiveCount > 1 ? 's are' : ' is'} currently inactive.
              </span>{' '}
              <span style={{ color: '#b45309', fontSize: '13px' }}>
                New registered employees remain deactive until you click "Reactivate" to grant vault access.
              </span>
            </div>
          </div>
          {statusFilter !== 'inactive' && (
            <button
              onClick={() => setStatusFilter('inactive')}
              className="btn btn-sm btn-secondary"
              style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
            >
              Filter Inactive
            </button>
          )}
        </div>
      )}

      {/* Search and Filters */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search employees..."
            className="form-input"
            style={{ paddingLeft: '36px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="form-input"
          style={{ width: '160px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Status: All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* User Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Role</th>
              <th>Credentials</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  Loading employee directory...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No employees matched filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map((emp) => (
                <tr key={emp.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="user-avatar" style={{ width: '34px', height: '34px', fontSize: '13px' }}>
                        {emp.name ? emp.name[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{emp.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '12px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontWeight: 600,
                        background: emp.role === 'admin' ? '#ecfeff' : '#f8fafc',
                        color: emp.role === 'admin' ? '#0891b2' : '#64748b',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      {emp.role === 'admin' ? 'Admin' : 'Employee'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{emp.credentialsCount}</span>
                  </td>
                  <td>
                    {emp.isActive ? (
                      <span className="status-pill active">Active</span>
                    ) : (
                      <span className="status-pill inactive">Inactive</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {emp.isActive ? (
                      <button
                        onClick={() => handleToggleStatus(emp)}
                        className="btn btn-sm btn-danger-outline"
                        style={{ padding: '4px 14px' }}
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleStatus(emp)}
                        className="btn btn-sm btn-secondary"
                        style={{ padding: '4px 14px', color: '#059669', borderColor: '#a7f3d0' }}
                      >
                        Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="table-footer">
          <span>{filtered.length} of {users.length} employees</span>
          <span>{activeCount} active · {inactiveCount} inactive</span>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Invite New Employee</h3>
              <button onClick={() => setIsInviteOpen(false)} className="close-btn">
                <X size={20} />
              </button>
            </div>

            {inviteError && (
              <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                {inviteError}
              </div>
            )}
            {inviteSuccess && (
              <div style={{ background: '#ecfdf5', color: '#047857', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                {inviteSuccess}
              </div>
            )}

            <form onSubmit={handleInviteSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  className="form-input"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Work Email</label>
                <input
                  type="email"
                  placeholder={`john@${COMPANY_DOMAIN}`}
                  className="form-input"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-input"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Temporary Master Password</label>
                <input
                  type="text"
                  className="form-input mono"
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
