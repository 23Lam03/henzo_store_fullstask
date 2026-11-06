import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';
import { ROUTES } from '../constants/routes';
import { RouteLoader } from '../components/common/RouteLoader/RouteLoader';

interface PermissionRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const PermissionRoute = ({ children, allowedRoles }: PermissionRouteProps) => {
  const { userRole, isLoading } = useAuth();

  if (isLoading) {
    return <RouteLoader />;
  }

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to={ROUTES.FORBIDDEN} replace />;
  }

  return <>{children}</>;
};
