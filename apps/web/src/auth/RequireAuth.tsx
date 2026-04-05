import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './use-auth';

const CHANGE_PASSWORD_PATH = '/account/change-password';

export function RequireAuth() {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="auth-boot">
        <div className="auth-boot-inner">
          <div className="auth-boot-mark">SkyOps</div>
          <p className="muted">Verifying your session…</p>
        </div>
      </div>
    );
  }

  if (status === 'anonymous') {
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }

  if (user?.mustChangePassword && location.pathname !== CHANGE_PASSWORD_PATH) {
    return (
      <Navigate replace state={{ from: location }} to={CHANGE_PASSWORD_PATH} />
    );
  }

  return <Outlet />;
}
