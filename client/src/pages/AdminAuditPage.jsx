import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import {
  Download,
  Filter,
  ShieldCheck,
  Calendar,
  User,
  Activity
} from 'lucide-react';

const AdminAuditPage = () => {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('7d');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await adminService.getUsers();
        if (res.success) {
          setUsers(res.users);
        }
      } catch (err) {
        console.error('Failed to load users for filter:', err);
      }
    };

    fetchUsers();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAuditLogs({
        user: selectedUser,
        action: selectedAction,
        dateRange: selectedDateRange
      });
      if (res.success) {
        setLogs(res.logs);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedUser, selectedAction, selectedDateRange]);

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      await adminService.downloadAuditCSV({
        user: selectedUser,
        action: selectedAction,
        dateRange: selectedDateRange
      });
    } catch (err) {
      alert('Failed to export audit logs to CSV');
    } finally {
      setExporting(false);
    }
  };

  const getActionBadge = (action) => {
    const normalized = (action || '').toLowerCase();
    return (
      <span className={`badge-action ${normalized}`}>
        {action}
      </span>
    );
  };

  const formatDisplayTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `Today ${timeStr}`;

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${timeStr}`;
    }

    return `${date.toLocaleDateString()} ${timeStr}`;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Audit Log</h1>
        <p className="page-subtitle">
          Immutable organisation activity across credential access and account events
        </p>
      </div>

      {/* Filter Row matching Screenshot 1 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* User Filter */}
          <div style={{ position: 'relative' }}>
            <select
              className="form-input"
              style={{ width: 'auto', paddingRight: '32px' }}
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="all">User: All</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div style={{ position: 'relative' }}>
            <select
              className="form-input"
              style={{ width: 'auto', paddingRight: '32px' }}
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
            >
              <option value="all">Action: All</option>
              <option value="share">SHARE</option>
              <option value="view">VIEW</option>
              <option value="edit">EDIT</option>
              <option value="create">CREATE</option>
              <option value="delete">DELETE</option>
              <option value="login">LOGIN</option>
              <option value="status_change">STATUS_CHANGE</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div style={{ position: 'relative' }}>
            <select
              className="form-input"
              style={{ width: 'auto', paddingRight: '32px' }}
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="btn btn-secondary"
        >
          <Download size={15} />
          <span>{exporting ? 'Exporting...' : 'Export'}</span>
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '18%' }}>Time</th>
              <th style={{ width: '25%' }}>User</th>
              <th style={{ width: '15%' }}>Action</th>
              <th style={{ width: '22%' }}>Credential</th>
              <th style={{ width: '20%' }}>Details / IP</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  Loading immutable audit events...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No activity events matching the current filter criteria.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ color: '#475569', fontSize: '13px' }}>
                    {formatDisplayTime(log.timestamp)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        className="user-avatar"
                        style={{
                          width: '28px',
                          height: '28px',
                          fontSize: '11px',
                          background: log.user.role === 'admin' ? '#cffafe' : '#ccfbf1'
                        }}
                      >
                        {log.user.name ? log.user.name[0].toUpperCase() : 'U'}
                      </div>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>
                        {log.user.name}
                      </span>
                    </div>
                  </td>
                  <td>{getActionBadge(log.action)}</td>
                  <td style={{ color: '#1e293b', fontWeight: 500 }}>
                    {log.credentialTitle || '—'}
                  </td>
                  <td style={{ fontSize: '12px', color: '#64748b' }}>
                    <div>{log.details || '—'}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      {log.ipAddress}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="table-footer">
          <span>Showing {logs.length} activity events</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f766e', fontWeight: 600 }}>
            <ShieldCheck size={16} />
            <span>Tamper-evident log</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdminAuditPage;
