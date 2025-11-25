
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'admin' | 'student' | 'teacher' | 'guardian'>;
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is not logged in, redirect to auth page
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If the route requires specific roles, check if the user has one
  if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role)) {
    // Redirect them to a default page or show an unauthorized message
    // For now, redirecting to the auth page is a safe default.
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If everything is fine, render the requested component
  return <>{children}</>;
}
