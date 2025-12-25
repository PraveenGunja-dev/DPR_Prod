import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, user } = useAuth();
  
  console.log("ProtectedRoute check:", { isAuthenticated, user, requiredRole });

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/" replace />;
  }

  // If a specific role is required and user doesn't have it, redirect to projects
  if (requiredRole && user?.Role) {
    // Case-insensitive comparison and trim whitespace
    const userRole = user.Role.toString().trim().toLowerCase();
    const requiredRoleNormalized = requiredRole.trim().toLowerCase();
    
    if (userRole !== requiredRoleNormalized) {
      console.log("Role mismatch, redirecting to projects", { 
        userRole, 
        requiredRoleNormalized,
        originalUserRole: user?.Role,
        originalRequiredRole: requiredRole
      });
      return <Navigate to="/projects" replace />;
    }
  }

  console.log("Access granted to protected route");
  return <>{children}</>;
};