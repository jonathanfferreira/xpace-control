import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading, getRedirectPath } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && role) {
      // If user is logged in but doesn't have access to this route, redirect to their role's home
      if (allowedRoles && !allowedRoles.includes(role)) {
        navigate(getRedirectPath(role), { replace: true });
      }
    }
  }, [user, role, loading, allowedRoles, getRedirectPath, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/entrar" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return null; // Prevents flash before redirect
  }

  return <>{children}</>;
}
