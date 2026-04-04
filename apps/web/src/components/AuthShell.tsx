interface AuthShellProps {
  children: React.ReactNode;
  subtitle: string;
  title: string;
  footer?: React.ReactNode;
}

export function AuthShell({
  children,
  subtitle,
  title,
  footer,
}: AuthShellProps) {
  return (
    <div className="auth-shell">
      <div className="auth-shell-brand" aria-hidden="false">
        <div className="auth-shell-brand-inner">
          <div className="badge auth-shell-badge">SkyOps Mission Control</div>
          <h2 className="auth-shell-headline">
            Fleet operations, without the spreadsheet chaos.
          </h2>
          <p className="auth-shell-lede">
            Mission scheduling, maintenance compliance, and fleet health in one
            secure console — built for operations managers and field teams.
          </p>
          <ul className="auth-shell-points">
            <li>Role-ready foundation for future permissions</li>
            <li>Audit-friendly activity across drones and missions</li>
            <li>JWT-secured API aligned with production patterns</li>
          </ul>
        </div>
      </div>

      <div className="auth-shell-panel">
        <div className="auth-shell-card">
          <header className="auth-shell-card-header">
            <h1 className="auth-shell-title">{title}</h1>
            <p className="auth-shell-subtitle">{subtitle}</p>
          </header>
          {children}
          {footer ? (
            <footer className="auth-shell-footer">{footer}</footer>
          ) : null}
        </div>
        <p className="auth-shell-legal muted">
          Internal operations software. Authorized personnel only.
        </p>
      </div>
    </div>
  );
}
