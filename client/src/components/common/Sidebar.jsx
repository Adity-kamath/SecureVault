import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  LayoutDashboard,
  HeartPulse,
  Users,
  FileText,
  KeyRound,
  Share2,
  ShieldCheck,
  Lock
} from 'lucide-react';

const Sidebar = () => {
  const { user, isAdmin } = useAuth();

  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Shield size={20} />
          </div>
          <div className="brand-info">
            <h2>SecureVault</h2>
            <span>Acme Technologies</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {isAdmin && (
            <>
              <NavLink
                to="/admin/dashboard"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                to="/admin/health"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <HeartPulse size={18} />
                <span>Org Health</span>
              </NavLink>

              <NavLink
                to="/admin/users"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Users size={18} />
                <span>Users</span>
              </NavLink>

              <NavLink
                to="/admin/audit"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <FileText size={18} />
                <span>Audit Log</span>
              </NavLink>
            </>
          )}

          <div className="nav-section-title">My Account</div>

          <NavLink
            to="/credentials"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <KeyRound size={18} />
            <span>My Credentials</span>
          </NavLink>

          <NavLink
            to="/credentials/shared"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Share2 size={18} />
            <span>Shared with Me</span>
          </NavLink>

          <NavLink
            to="/health"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <ShieldCheck size={18} />
            <span>My Health</span>
          </NavLink>
        </nav>
      </div>

      <div className="sidebar-bottom">
        <div className="vault-security-pill">
          <Lock className="icon" size={18} />
          <div>
            <div className="text">Vault protected</div>
            <div className="sub">AES-256-GCM encryption</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
