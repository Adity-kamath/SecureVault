import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

const ProtectedRoute = ({ adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#0f766e', fontWeight: 600 }}>Loading SecureVault...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/credentials" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-wrapper">
        <TopNavbar />
        <main className="content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ProtectedRoute;
