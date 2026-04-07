import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // If user has pending_approval role, redirect to access-pending page
  if (user?.Role === 'pending_approval') {
    return <Navigate to="/access-pending" replace />;
  }

  // If a specific role is required and user doesn't have it, redirect to projects
  if (requiredRole && user?.Role) {
    const userRoleLower = user.Role.toString().trim().toLowerCase();
    
    let isAllowed = false;
    if (Array.isArray(requiredRole)) {
      isAllowed = requiredRole.some(r => r.trim().toLowerCase() === userRoleLower);
    } else {
      isAllowed = requiredRole.trim().toLowerCase() === userRoleLower;
    }

    if (!isAllowed) {
      return <Navigate to="/projects" replace />;
    }
  }

  return <>{children}</>;
};