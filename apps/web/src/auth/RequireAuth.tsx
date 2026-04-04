import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './use-auth';

export function RequireAuth() {
  const { status } = useAuth();
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

  return <Outlet />;
}
