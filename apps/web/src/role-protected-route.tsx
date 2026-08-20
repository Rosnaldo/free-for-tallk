import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuthentication } from './hooks/auth/useAuthentication.ts';
import { useLogout } from './hooks/auth/useLogout.ts';
import { useCurrentUserStore } from './states/stores.ts';
import { UnauthorizedView } from './components/error-view/UnauthorizedView.tsx';
import { UserRole } from '@repo/shared-types';
import { RoleMismatchView } from './components/error-view/RoleMismatchView.tsx';

interface RoleProtectedRouteProps {
  allowedRoles: Array<keyof typeof UserRole>;
}

export function RoleProtectedRoute({ allowedRoles }: RoleProtectedRouteProps) {
  const { isAuthenticated } = useAuthentication();

  const logout = useLogout();
  const currentUser = useCurrentUserStore((s) => s.currentUser);
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!currentUser) {
    return <UnauthorizedView />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return <RoleMismatchView onLogout={logout} navigate={navigate} />;
  }

  return <Outlet />;
}
