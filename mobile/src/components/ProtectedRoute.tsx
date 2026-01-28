import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../utils/useAuth';
import { RolePermissions } from '../utils/roles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: keyof RolePermissions;
}


export function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { isAuthenticated, loading, hasPermission: checkPermission } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#fff' }}>
        ⏳ Ładowanie…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !checkPermission(requiredPermission)) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          color: '#ffb3b3',
          textAlign: 'center',
          padding: '20px',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔒</div>
        <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>Brak dostępu</div>
        <div style={{ fontSize: '14px', color: '#ccc' }}>Nie masz uprawnień do tej sekcji</div>
      </div>
    );
  }

  return <>{children}</>;
}

