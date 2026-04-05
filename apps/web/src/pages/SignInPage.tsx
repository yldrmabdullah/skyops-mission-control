import { type FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/use-auth';
import { AuthBrandStory } from '../components/AuthBrandStory';
import { AuthShell } from '../components/AuthShell';
import { FormNotice } from '../components/FormNotice';
import { RoleAccessGuide } from '../components/RoleAccessGuide';
import { getErrorMessage } from '../lib/api';
import {
  demoManagerEmail,
  demoManagerPassword,
  demoWorkspaceHintEnabled,
} from '../lib/demo-workspace';

export function SignInPage() {
  const { signIn, status, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const rawFrom =
    (location.state as { from?: { pathname?: string } })?.from?.pathname ??
    '/';
  const from =
    rawFrom &&
    rawFrom !== '/sign-in' &&
    rawFrom !== '/sign-up' &&
    rawFrom !== '/workspace/bootstrap' &&
    rawFrom !== '/account/change-password'
      ? rawFrom
      : '/';
  const sessionExpired = Boolean(
    (location.state as { sessionExpired?: boolean })?.sessionExpired,
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated' || !user) {
      return;
    }
    if (user.mustChangePassword) {
      navigate('/account/change-password', {
        replace: true,
        state: { from: { pathname: from } },
      });
    } else {
      navigate(from, { replace: true });
    }
  }, [status, user, from, navigate]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const signedIn = await signIn(email.trim(), password);
      if (signedIn.mustChangePassword) {
        navigate('/account/change-password', {
          replace: true,
          state: { from: { pathname: from } },
        });
      } else {
        navigate(from, { replace: true });
      }
    } catch (error) {
      const detail = getErrorMessage(error);
      setFormError(
        detail ||
          'Invalid email or password. Check your credentials and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="auth-boot">
        <div className="auth-boot-inner">
          <div className="auth-boot-mark">SkyOps</div>
          <p className="muted">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <AuthShell
      brandContent={
        <div className="auth-shell-brand-stack">
          <AuthBrandStory />
          <RoleAccessGuide lead="Managers run the workspace and invite Pilots and Technicians from Settings. Pilots and Technicians sign in with the email and one-time password their Manager shared." />
        </div>
      }
      footer={
        <p className="muted auth-switch">
          Don't have an account?{' '}
          <Link className="auth-inline-link" to="/sign-up">
            Sign up
          </Link>
        </p>
      }
      subtitle="Securely manage your drone fleet operations and compliance trail."
      title="Welcome back"
    >
      {sessionExpired ? (
        <FormNotice
          message="Your session expired. Please sign in again to continue."
          tone="warning"
        />
      ) : null}

      {formError ? <FormNotice message={formError} tone="error" /> : null}

      {demoWorkspaceHintEnabled ? (
        <details className="signup-local-reset demo-workspace-hint">
          <summary className="signup-local-reset-summary">
            Try the seeded demo workspace
          </summary>
          <div className="signup-local-reset-body">
            <p>
              After <code>pnpm --filter @skyops/api seed</code>, sign in as the
              demo <strong>Manager</strong> (full fleet, team, notifications,
              audit):
            </p>
            <p className="demo-workspace-credentials muted">
              <strong>{demoManagerEmail}</strong>
              <span aria-hidden="true"> · </span>
              <strong>{demoManagerPassword}</strong>
            </p>
            <button
              className="button secondary demo-workspace-fill"
              type="button"
              onClick={() => {
                setEmail(demoManagerEmail);
                setPassword(demoManagerPassword);
              }}
            >
              Fill Manager credentials
            </button>
            <p className="muted demo-workspace-more">
              See README for <strong>pilot@skyops.demo</strong> and{' '}
              <strong>tech@skyops.demo</strong> (same password; Pilot must set a
              new password on first sign-in).
            </p>
          </div>
        </details>
      ) : null}

      <form className="auth-form" onSubmit={onSubmit}>
        <label className="field">
          <span className="field-label">Work email</span>
          <input
            required
            autoComplete="email"
            className="input"
            data-testid="signin-email-input"
            inputMode="email"
            placeholder="you@skyops.io"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="field">
          <span className="field-label">Password</span>
          <div className="password-field">
            <input
              required
              autoComplete="current-password"
              className="input password-field-input"
              data-testid="signin-password-input"
              placeholder="••••••••"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="button ghost password-toggle"
              type="button"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>

        <p className="field-hint">
          Forgot your password? Ask your workspace Manager — automated password
          reset is not enabled in this environment.
        </p>

        <div className="form-actions auth-form-actions">
          <button
            className="button auth-submit"
            data-testid="signin-submit"
            disabled={submitting}
            type="submit"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
