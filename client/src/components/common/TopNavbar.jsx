import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, ChevronDown } from 'lucide-react';

const TopNavbar = () => {
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <header className="topbar">
      <div className="topbar-org">Acme Technologies</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div className="topbar-user">
          <div className="user-avatar">{getInitials(user?.name)}</div>
          <div className="user-details">
            <span className="user-name">{user?.name}</span>
            <span className={`role-badge-pill ${user?.role === 'admin' ? 'admin' : 'employee'}`}>
              {user?.role?.toUpperCase()}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign out of SecureVault"
          className="btn btn-secondary btn-sm"
          style={{ padding: '6px 10px', color: '#64748b' }}
        >
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default TopNavbar;
