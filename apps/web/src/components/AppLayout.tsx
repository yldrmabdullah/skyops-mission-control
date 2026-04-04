import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/use-auth';

const navigationItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/drones', label: 'Drone Registry' },
  { to: '/missions', label: 'Mission Control' },
];

export function AppLayout() {
  const { user, signOut } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="badge">SkyOps Mission Control</div>
          <h1>Operations console for fleet, missions, and maintenance.</h1>
          <p>
            Built for fast operational visibility, proactive maintenance alerts,
            and clean drill-downs during live demos.
          </p>
        </div>

        <nav className="nav-list" aria-label="Main">
          <p className="nav-section-label">Workspace</p>
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) =>
                isActive ? 'nav-link active' : 'nav-link'
              }
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-account">
          <div className="sidebar-account-meta">
            <span className="muted sidebar-account-label">Signed in</span>
            <strong className="sidebar-account-name">{user?.fullName}</strong>
            <span className="muted sidebar-account-email">{user?.email}</span>
          </div>
          <button
            className="button secondary sidebar-signout"
            type="button"
            onClick={() => signOut()}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
