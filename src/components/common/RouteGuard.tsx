import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from './LoadingSpinner';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth: boolean;
  redirectTo: string;
}

/**
 * RouteGuard - Unified component for protected and public routes
 * @param requireAuth - true for protected routes, false for public routes
 * @param redirectTo - where to redirect if condition not met
 */
export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requireAuth,
  redirectTo,
}) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  // For protected routes: redirect if NOT authenticated
  // For public routes: redirect if IS authenticated
  const shouldRedirect = requireAuth ? !currentUser : !!currentUser;

  if (shouldRedirect) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

/**
 * ProtectedRoute - Requires authentication, redirects to login if not authenticated
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  return (
    <RouteGuard requireAuth={true} redirectTo="/login">
      {children}
    </RouteGuard>
  );
};

/**
 * PublicRoute - For login/register pages, redirects to dashboard if already authenticated
 */
interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  return (
    <RouteGuard requireAuth={false} redirectTo="/dashboard">
      {children}
    </RouteGuard>
  );
};

