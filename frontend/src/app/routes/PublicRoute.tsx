import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth';

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    // If user attempted to visit a protected page before logging in, take them there
    const destination = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
};
