import { NavLink, Outlet } from 'react-router-dom';

const navigationItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/drones', label: 'Drone Registry' },
  { to: '/missions', label: 'Mission Control' },
];

export function AppLayout() {
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

        <nav className="nav-list">
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
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
