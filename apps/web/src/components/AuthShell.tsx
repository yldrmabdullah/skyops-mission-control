import { AuthBrandStory } from './AuthBrandStory';

interface AuthShellProps {
  children: React.ReactNode;
  subtitle: string;
  title: string;
  footer?: React.ReactNode;
  brandContent?: React.ReactNode;
}

export function AuthShell({
  children,
  subtitle,
  title,
  footer,
  brandContent,
}: AuthShellProps) {
  return (
    <div className="auth-shell">
      <div className="auth-shell-brand" aria-hidden="false">
        {brandContent ? (
          <div className="auth-shell-brand-custom">{brandContent}</div>
        ) : (
          <AuthBrandStory />
        )}
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
